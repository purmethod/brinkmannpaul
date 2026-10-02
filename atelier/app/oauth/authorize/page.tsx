import { one } from '@/lib/db';

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | undefined>>;

// consent screen for the claude connector (login is enforced by the proxy)
export default async function Authorize({ searchParams }: { searchParams: SP }) {
  const p = await searchParams;
  const client = p.client_id ? await one<{ name: string | null; redirect_uris: string[] }>('select name, redirect_uris from oauth_clients where client_id = $1', [p.client_id]) : null;
  const valid = client && p.redirect_uri && client.redirect_uris.includes(p.redirect_uri) && p.code_challenge && (p.code_challenge_method ?? 'S256') === 'S256';
  if (!valid) return <p className="error">invalid authorization request.</p>;
  return (
    <form method="post" action="/api/oauth/authorize" style={{ marginTop: '14vh' }}>
      <h1>connect</h1>
      <p>
        <strong>{client.name || 'claude'}</strong> wants to plan, cut and schedule posts in your cutcake.
      </p>
      {(['client_id', 'redirect_uri', 'state', 'code_challenge'] as const).map((k) => (
        <input key={k} type="hidden" name={k} value={p[k] ?? ''} />
      ))}
      <div className="stack" style={{ marginTop: 24 }}>
        <button className="primary wide" name="decision" value="allow">allow</button>
        <button className="wide ghost" name="decision" value="deny">deny</button>
      </div>
    </form>
  );
}
