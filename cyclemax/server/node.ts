// Node (req, res) adapter around the web-standard handler – used by the local dev server and the Vercel Function.
import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "./app";

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : (c as Buffer));
  if (chunks.length) return Buffer.concat(chunks);
  // Vercel's Node helpers may have buffered the body already.
  const pre = (req as IncomingMessage & { body?: unknown }).body;
  if (pre === undefined || pre === null) return undefined;
  if (Buffer.isBuffer(pre)) return pre;
  return Buffer.from(typeof pre === "string" ? pre : JSON.stringify(pre));
}

export async function nodeHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await readBody(req) : undefined;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  const proto = String(req.headers["x-forwarded-proto"] ?? "http").split(",")[0];
  const request = new Request(`${proto}://${req.headers.host ?? "localhost"}${req.url ?? "/"}`, { method: req.method, headers, body: body ? new Uint8Array(body) : undefined });
  const response = await handle(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export default nodeHandler;
