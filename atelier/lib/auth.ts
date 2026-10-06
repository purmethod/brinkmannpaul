import { cookies } from 'next/headers';
import { listKits, loadKit } from './brand';
import { hashPassword, safeEqual, sha256, verifyPassword } from './crypto';
import { id, one, q } from './db';
import type { BrandRow, User } from './types';

export { SESSION_COOKIE, readSession, sessionCookie, sessionValue } from './session';
import { SESSION_COOKIE, readSession } from './session';

export function checkPassword(password: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret) && typeof password === 'string' && safeEqual(sha256(password.trim()), sha256(secret!.trim()));
}

const OWNER_EMAIL = () => (process.env.ADMIN_EMAIL || 'owner@atelier').toLowerCase();

/** The first user: runs the repo's brand kits (brinkbuild, foyo …). */
export function isOwner(user: Pick<User, 'email'>) {
  return user.email.toLowerCase() === OWNER_EMAIL();
}

export const NAME_RULE = /^[a-z0-9._]{3,30}$/;

/** Brute-force brake: at most `max` failed tries per key in 15 minutes. */
export async function tooManyAttempts(keys: string[], max = 8): Promise<boolean> {
  await q("delete from auth_attempts where at < now() - interval '1 day'").catch(() => undefined);
  const r = await one<{ n: number }>("select count(*)::int as n from auth_attempts where key = any($1::text[]) and at > now() - interval '15 minutes'", [keys]);
  return (r?.n ?? 0) >= max;
}
export async function recordAttempt(keys: string[]) {
  for (const k of keys) await q('insert into auth_attempts (key) values ($1)', [k]);
}
export function clientKey(req: Request) {
  return `ip:${(req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'}`;
}

/** Change the password of an account (the owner may also confirm with the setup password). */
export async function changePassword(user: User, current: string, next: string) {
  if (next.length < 8) throw new HttpError(400, 'new password: at least 8 characters');
  const row = await one<{ password_hash: string | null }>('select password_hash from users where id = $1', [user.id]);
  const ok = verifyPassword(current, row?.password_hash) || (isOwner(user) && checkPassword(current));
  if (!ok) throw new HttpError(401, 'current password is wrong');
  await q('update users set password_hash = $2 where id = $1', [user.id, hashPassword(next)]);
}

/** Name + password → user. The owner may also use the setup password, and claims a name with it once. */
export async function signIn(name: string, password: string): Promise<User | null> {
  const n = name.trim().toLowerCase().replace(/^@/, '');
  if (n) {
    const user = await one<User & { password_hash: string | null }>('select * from users where lower(name) = $1', [n]);
    if (user?.password_hash && verifyPassword(password, user.password_hash)) return user;
    if (user && !isOwner(user)) return null;
  }
  if (!checkPassword(password)) return null;
  const owner = await ensureOwner();
  if (n && NAME_RULE.test(n) && !owner.name) {
    const taken = await one('select id from users where lower(name) = $1 and id <> $2', [n, owner.id]);
    if (!taken) await q('update users set name = $2, password_hash = $3 where id = $1', [owner.id, n, hashPassword(password.trim())]);
  }
  return owner;
}

/** A new account: its own user, its own first channel. */
export async function signUp(name: string, password: string): Promise<User> {
  const n = name.trim().toLowerCase().replace(/^@/, '');
  if (!NAME_RULE.test(n)) throw new HttpError(400, 'name: 3–30 characters, letters, numbers, . and _');
  if (password.length < 8) throw new HttpError(400, 'password: at least 8 characters');
  if (await one('select id from users where lower(name) = $1', [n])) throw new HttpError(409, 'this name is taken');
  const user = (await one<User>(
    'insert into users (id, email, name, password_hash) values ($1, $2, $3, $4) returning id, email, timezone, name',
    [id('usr'), `${n}@users.cutcake`, n, hashPassword(password)],
  ))!;
  await q("insert into brands (id, user_id, kit, name, settings) values ($1, $2, 'brinkbuild', $3, $4)", [
    id('brd'),
    user.id,
    n,
    JSON.stringify({ channel: { name: n, handle: `@${n}` } }),
  ]);
  return user;
}

/** Phase 1: one owner account, created on first login, with one brand per repo kit. */
export async function ensureOwner(): Promise<User> {
  const email = OWNER_EMAIL();
  let user = await one<User>('select id, email, timezone, name from users where email = $1', [email]);
  if (!user) {
    user = (await one<User>('insert into users (id, email) values ($1, $2) on conflict (email) do update set email = excluded.email returning id, email, timezone', [id('usr'), email]))!;
  }
  await ensureBrands(user.id);
  return user;
}

export const BRAND_COOKIE = 'atelier_brand';

/** One brand per kit folder (brinkbuild, foyo, …); the configured kit comes first. */
export async function ensureBrands(userId: string) {
  const have = new Set((await q<{ kit: string }>('select kit from brands where user_id = $1', [userId])).map((b) => b.kit));
  const first = process.env.BRAND_KIT || 'brinkbuild';
  const kits = [first, ...listKits().filter((k) => k !== first)];
  for (const kit of kits) {
    if (have.has(kit)) continue;
    try {
      await q('insert into brands (id, user_id, kit, name) values ($1, $2, $3, $4)', [id('brd'), userId, kit, loadKit(kit).name]);
    } catch (e) {
      console.error(`brand kit ${kit}`, e);
    }
  }
}

export interface Ctx {
  user: User;
  brand: BrandRow;
}

async function userFromBearer(header: string | null): Promise<string | null> {
  const token = (header || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const hash = sha256(token);
  const key = await one<{ user_id: string }>('select user_id from api_keys where hash = $1', [hash]);
  if (key) return key.user_id;
  const oauth = await one<{ user_id: string }>("select user_id from oauth_tokens where token_hash = $1 and kind = 'access' and expires_at > now()", [hash]);
  return oauth?.user_id ?? null;
}

async function ctxFor(userId: string | null, brandId?: string | null): Promise<Ctx | null> {
  if (!userId) return null;
  const user = await one<User>('select id, email, timezone, name from users where id = $1', [userId]);
  if (!user) return null;
  // the active account (switcher) or the first one
  const brand =
    (brandId ? await one<BrandRow>('select id, user_id, kit, name, settings from brands where id = $1 and user_id = $2', [brandId, userId]) : null) ??
    (await one<BrandRow>('select id, user_id, kit, name, settings from brands where user_id = $1 order by created_at limit 1', [userId]));
  return brand ? { user, brand } : null;
}

/** Session cookie (app), personal key (ios shortcut) or oauth token (claude connector). */
export async function getCtx(req?: Request): Promise<Ctx | null> {
  const bearer = req?.headers.get('authorization') ?? null;
  if (bearer) return ctxFor(await userFromBearer(bearer), req?.headers.get('x-atelier-brand'));
  const jar = await cookies();
  return ctxFor(readSession(jar.get(SESSION_COOKIE)?.value), jar.get(BRAND_COOKIE)?.value);
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireCtx(req?: Request): Promise<Ctx> {
  const ctx = await getCtx(req);
  if (!ctx) throw new HttpError(401, 'unauthorized');
  return ctx;
}

/** Wraps a route handler: json errors, 401 for missing auth. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      return Response.json({ error: (e as Error).message }, { status });
    }
  };
}
