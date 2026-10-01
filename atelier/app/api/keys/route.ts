import { requireCtx, route } from '@/lib/auth';
import { sha256, token } from '@/lib/crypto';
import { id, q } from '@/lib/db';

/** Personal key for the ios shortcut / api. Shown once, stored hashed. */
export const POST = route(async () => {
  const { user } = await requireCtx();
  const key = `atl_${token(24)}`;
  await q('insert into api_keys (id, user_id, hash, label) values ($1,$2,$3,$4)', [id('key'), user.id, sha256(key), 'shortcut']);
  return Response.json({ key });
});

export const DELETE = route(async () => {
  const { user } = await requireCtx();
  await q('delete from api_keys where user_id = $1', [user.id]);
  return Response.json({ ok: true });
});
