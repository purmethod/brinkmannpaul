// Test helpers: in-memory SQLite context with fake Claude and fake push sender.
import { createHandler, type AppContext } from "./app";
import { createDatabase } from "./db";
import { readConfig } from "./env";
import type { Llm } from "./llm";
import type { PushSender } from "./push";
import { createStore } from "./store";

export interface FakePush extends PushSender {
  sent: { endpoint: string; payload: Record<string, string> }[];
  failFor: Map<string, number>;
}

export function fakePush(): FakePush {
  const push: FakePush = {
    sent: [],
    failFor: new Map(),
    async send(sub, payload) {
      const status = push.failFor.get(sub.endpoint);
      if (status) throw Object.assign(new Error(`push failed ${status}`), { statusCode: status });
      push.sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
      return { statusCode: 201 };
    },
  };
  return push;
}

export async function testContext(opts: { llm?: Llm | null; env?: Record<string, string> } = {}) {
  const store = createStore(await createDatabase(":memory:"));
  await store.seed();
  const push = fakePush();
  const ctx: AppContext = {
    config: readConfig({ ADMIN_PASSWORD: "secret", CRON_SECRET: "cron", VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", ...opts.env }),
    store,
    llm: opts.llm ?? null,
    push,
  };
  const handle = createHandler(async () => ctx);
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await handle(
      new Request(`http://test${path}`, {
        method,
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return { status: res.status, data: await res.json().catch(() => null) };
  };
  return { ctx, store, push, handle, call };
}

export const DEVICE = "11111111-2222-3333-4444-555555555555";
