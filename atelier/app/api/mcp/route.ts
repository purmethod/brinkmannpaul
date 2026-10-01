import { getCtx } from '@/lib/auth';
import { callTool, tools } from '@/lib/mcp';
import { appOrigin } from '@/lib/origin';

export const maxDuration = 300;

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> };

// remote mcp server (streamable http, json responses) for the claude connector
export async function POST(req: Request) {
  const ctx = await getCtx(req);
  if (!ctx || !req.headers.get('authorization')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: {
        'content-type': 'application/json',
        'www-authenticate': `Bearer resource_metadata="${appOrigin(req)}/.well-known/oauth-protected-resource"`,
      },
    });
  }
  const body = (await req.json()) as Rpc | Rpc[];
  const batch = Array.isArray(body) ? body : [body];
  const out = [];
  for (const m of batch) {
    const reply = (result: unknown) => ({ jsonrpc: '2.0', id: m.id ?? null, result });
    const fail = (code: number, message: string) => ({ jsonrpc: '2.0', id: m.id ?? null, error: { code, message } });
    if (m.id === undefined) continue; // notifications
    try {
      if (m.method === 'initialize') {
        out.push(
          reply({
            protocolVersion: (m.params?.protocolVersion as string) || '2025-06-18',
            capabilities: { tools: {} },
            serverInfo: { name: 'atelier', version: '0.1.0' },
            instructions: 'atelier plans, cuts and posts instagram content. media are referenced by number (#1). times are local to the user.',
          }),
        );
      } else if (m.method === 'ping') out.push(reply({}));
      else if (m.method === 'tools/list') out.push(reply({ tools }));
      else if (m.method === 'tools/call') {
        const name = String(m.params?.name);
        try {
          const text = await callTool(ctx, name, (m.params?.arguments as Record<string, unknown>) ?? {});
          out.push(reply({ content: [{ type: 'text', text }] }));
        } catch (e) {
          out.push(reply({ content: [{ type: 'text', text: (e as Error).message }], isError: true }));
        }
      } else out.push(fail(-32601, `method not found: ${m.method}`));
    } catch (e) {
      out.push(fail(-32603, (e as Error).message));
    }
  }
  if (!out.length) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(body) ? out : out[0]);
}

export async function GET() {
  return new Response('method not allowed', { status: 405, headers: { allow: 'POST' } });
}
