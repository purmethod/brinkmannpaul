import { appOrigin } from '@/lib/origin';

// served at /.well-known/* via rewrite (next.config.mjs)
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const origin = appOrigin(req);
  const [first] = (await params).path;
  if (first === 'oauth-protected-resource') {
    return Response.json({ resource: `${origin}/api/mcp`, authorization_servers: [origin], bearer_methods_supported: ['header'], resource_name: 'atelier' });
  }
  if (first === 'oauth-authorization-server' || first === 'openid-configuration') {
    return Response.json({
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/api/oauth/token`,
      registration_endpoint: `${origin}/api/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      scopes_supported: ['atelier'],
    });
  }
  return Response.json({ error: 'not found' }, { status: 404 });
}
