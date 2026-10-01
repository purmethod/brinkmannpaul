import { createHash } from 'node:crypto';
import { sha256, token } from '@/lib/crypto';
import { one, q } from '@/lib/db';

const ACCESS_TTL = 3600;
const REFRESH_DAYS = 90;
const err = (error: string, status = 400) => Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } });

async function issue(clientId: string, userId: string) {
  const access = token(32);
  const refresh = token(32);
  await q(
    `insert into oauth_tokens (token_hash, kind, client_id, user_id, expires_at) values
     ($1,'access',$3,$4, now() + make_interval(secs => $5)), ($2,'refresh',$3,$4, now() + make_interval(days => $6))`,
    [sha256(access), sha256(refresh), clientId, userId, ACCESS_TTL, REFRESH_DAYS],
  );
  return Response.json(
    { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL, refresh_token: refresh, scope: 'atelier' },
    { headers: { 'cache-control': 'no-store' } },
  );
}

export async function POST(req: Request) {
  const type = req.headers.get('content-type') || '';
  const f = type.includes('json') ? new Map(Object.entries((await req.json()) as Record<string, string>)) : await req.formData();
  const get = (k: string) => String(f.get(k) ?? '');
  const clientId = get('client_id');

  if (get('grant_type') === 'authorization_code') {
    const row = await one<{ client_id: string; user_id: string; redirect_uri: string; challenge: string }>(
      'delete from oauth_codes where code_hash = $1 and expires_at > now() returning client_id, user_id, redirect_uri, challenge',
      [sha256(get('code'))],
    );
    if (!row || (clientId && row.client_id !== clientId) || row.redirect_uri !== get('redirect_uri')) return err('invalid_grant');
    const verifier = createHash('sha256').update(get('code_verifier')).digest('base64url');
    if (verifier !== row.challenge) return err('invalid_grant');
    return issue(row.client_id, row.user_id);
  }

  if (get('grant_type') === 'refresh_token') {
    const row = await one<{ client_id: string; user_id: string }>(
      "delete from oauth_tokens where token_hash = $1 and kind = 'refresh' and expires_at > now() returning client_id, user_id",
      [sha256(get('refresh_token'))],
    );
    if (!row) return err('invalid_grant');
    return issue(row.client_id, row.user_id);
  }
  return err('unsupported_grant_type');
}
