import { NextResponse } from 'next/server';
import { getCtx } from '@/lib/auth';
import { sha256, token } from '@/lib/crypto';
import { one, q } from '@/lib/db';

// consent form on /oauth/authorize posts here → redirect back to claude with a code
export async function POST(req: Request) {
  const ctx = await getCtx();
  if (!ctx) return Response.json({ error: 'login first' }, { status: 401 });
  const f = await req.formData();
  const clientId = String(f.get('client_id') || '');
  const redirectUri = String(f.get('redirect_uri') || '');
  const challenge = String(f.get('code_challenge') || '');
  const state = String(f.get('state') || '');
  const client = await one<{ redirect_uris: string[] }>('select redirect_uris from oauth_clients where client_id = $1', [clientId]);
  if (!client || !client.redirect_uris.includes(redirectUri)) return Response.json({ error: 'invalid client or redirect_uri' }, { status: 400 });
  if (!challenge) return Response.json({ error: 'pkce required' }, { status: 400 });
  const target = new URL(redirectUri);
  if (f.get('decision') !== 'allow') {
    target.searchParams.set('error', 'access_denied');
  } else {
    const code = token(24);
    await q("insert into oauth_codes (code_hash, client_id, user_id, redirect_uri, challenge, expires_at) values ($1,$2,$3,$4,$5, now() + interval '5 minutes')", [
      sha256(code), clientId, ctx.user.id, redirectUri, challenge,
    ]);
    target.searchParams.set('code', code);
  }
  if (state) target.searchParams.set('state', state);
  return NextResponse.redirect(target.toString(), 303);
}
