import { token } from '@/lib/crypto';
import { q } from '@/lib/db';

// dynamic client registration (RFC 7591) — public clients with PKCE
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { redirect_uris?: string[]; client_name?: string };
  const uris = (b.redirect_uris ?? []).filter((u) => /^https:\/\//.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)/.test(u));
  if (!uris.length) return Response.json({ error: 'invalid_redirect_uri' }, { status: 400 });
  const clientId = `cl_${token(16)}`;
  await q('insert into oauth_clients (client_id, name, redirect_uris) values ($1,$2,$3)', [clientId, b.client_name ?? null, uris]);
  return Response.json(
    {
      client_id: clientId,
      client_name: b.client_name,
      redirect_uris: uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    { status: 201 },
  );
}
