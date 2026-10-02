import { cookies } from 'next/headers';
import { listKits, loadKit } from './brand';
import { safeEqual, sha256 } from './crypto';
import { id, one, q } from './db';
import type { BrandRow, User } from './types';

export { SESSION_COOKIE, readSession, sessionCookie, sessionValue } from './session';
import { SESSION_COOKIE, readSession } from './session';

export function checkPassword(password: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret) && typeof password === 'string' && safeEqual(sha256(password.trim()), sha256(secret!.trim()));
}

/** Phase 1: one owner account, created on first login, with one brand from the repo kit. */
export async function ensureOwner(): Promise<User> {
  const email = (process.env.ADMIN_EMAIL || 'owner@atelier').toLowerCase();
  let user = await one<User>('select id, email, timezone from users where email = $1', [email]);
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
  const user = await one<User>('select id, email, timezone from users where id = $1', [userId]);
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
