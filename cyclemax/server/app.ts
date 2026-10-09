// HTTP layer: one Web-standard handler (Request → Response) for Vercel and the local dev server.
import { createHash, timingSafeEqual } from "node:crypto";
import * as z from "zod/v4";
import { KNOWLEDGE_DOCS } from "../shared/knowledge.generated";
import { NEUTRAL_BODY, NEUTRAL_TITLE } from "../shared/texts";
import { topicOf } from "../shared/topics";
import { answerChat } from "./chat";
import { analyzeProfile, ProfileSchema } from "./profile";
import { getDatabase } from "./db";
import { readConfig, type Config } from "./env";
import { runKnowledgeJob } from "./knowledge-job";
import { createClaude, type Llm } from "./llm";
import { createWebPushSender, sendDuePushes, vapidKeys, type PushSender } from "./push";
import { createStore, GLOBAL_CLAUDE_KEY, type Store } from "./store";

export interface AppContext {
  config: Config;
  store: Store;
  llm: Llm | null;
  push: PushSender;
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-max-age": "86400",
};

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS },
  });

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const DeviceId = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);
const Phase = z.enum(["yellow", "pink", "green", "red"]);
const ChatBody = z.object({
  deviceId: DeviceId,
  mode: z.enum(["relationship", "single"]),
  phase: Phase.nullable(),
  cycleDay: z.number().int().min(1).max(400).nullable(),
  notes: z.array(z.string().max(300)).max(5).default([]),
  profile: z.string().max(2000).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000) }))
    .min(1)
    .max(16)
    .refine((m) => m.every((x) => x.role === "assistant" || x.content.length <= 2000), "user message too long")
    .refine((m) => m.length > 0 && m[m.length - 1].role === "user", "last message must be from the user"),
});
const ProfileBody = z.object({
  deviceId: DeviceId,
  mode: z.enum(["relationship", "single"]),
  text: z.string().min(1).max(12000),
  previous: ProfileSchema.nullable().default(null),
});
const FeedbackBody = z.object({
  deviceId: DeviceId,
  kind: z.enum(["line", "answer"]),
  id: z.string().min(1).max(80),
  vote: z.union([z.literal(1), z.literal(-1)]),
  topic: z.string().max(40).optional(),
});
const ReportBody = z.object({
  deviceId: DeviceId,
  answerId: z.string().min(1).max(80),
  text: z.string().min(1).max(4000),
  topic: z.string().max(40).default("Sonstiges"),
});
const ScheduleBody = z.object({
  deviceId: DeviceId,
  neutral: z.boolean(),
  subscription: z.object({
    endpoint: z.url().max(1000),
    keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
  }),
  items: z
    .array(z.object({ at: z.iso.datetime({ offset: true }), kind: z.enum(["phase", "daily"]), key: z.string().max(80) }))
    .max(64),
});
const DeviceBody = z.object({ deviceId: DeviceId });
const LinePatch = z.object({
  text: z.string().min(1).max(200).optional(),
  status: z.enum(["live", "review", "disabled"]).optional(),
  category: z.enum(["any", "yellow", "pink", "green", "red", "single"]).optional(),
});
const LineCreate = z.object({
  text: z.string().min(1).max(200),
  category: z.enum(["any", "yellow", "pink", "green", "red", "single"]),
});
const PrinciplePatch = z.object({ text: z.string().min(1).max(400).optional(), status: z.enum(["live", "review", "disabled"]).optional() });
const ReportPatch = z.object({ status: z.enum(["open", "ok", "removed"]) });

async function body<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return parsed.data;
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function bearer(req: Request): string {
  return (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
}

function requireAdmin(req: Request, config: Config) {
  if (!config.adminPassword) throw new HttpError(503, "ADMIN_PASSWORD ist nicht gesetzt");
  if (!safeEqual(bearer(req), config.adminPassword)) throw new HttpError(401, "unauthorized");
}

function requireCron(req: Request, config: Config) {
  if (!config.cronSecret) {
    if (process.env.NODE_ENV === "production") throw new HttpError(503, "CRON_SECRET ist nicht gesetzt");
    return;
  }
  if (!safeEqual(bearer(req), config.cronSecret)) throw new HttpError(401, "unauthorized");
}

/** Path of the request. Supports the Vercel rewrite `/api/index?route=...`. */
export function routeOf(url: URL): string {
  const route = url.searchParams.get("route");
  if (route !== null && /^\/api\/index\/?$/.test(url.pathname)) return `/api/${route.replace(/^\/+/, "")}`;
  return url.pathname.replace(/\/+$/, "") || "/";
}

export function createHandler(getContext: () => Promise<AppContext>) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const path = routeOf(url);
    const m = req.method;
    try {
      const ctx = await getContext();
      const { store, config } = ctx;

      if (m === "GET" && path === "/api/health") {
        const warnings = [
          ...(config.persistentDb ? [] : ["DATABASE_URL fehlt – SQLite ist auf Vercel nicht dauerhaft"]),
          ...(vapidKeys(config) ? [] : ["VAPID-Keys fehlen – kein Web Push"]),
          ...(ctx.llm ? [] : ["ANTHROPIC_API_KEY fehlt – Antworten aus der Wissensbasis"]),
          ...(config.adminPassword ? [] : ["ADMIN_PASSWORD fehlt – /admin gesperrt"]),
          ...(config.cronSecret ? [] : ["CRON_SECRET fehlt"]),
        ];
        return json({ ok: true, db: store.kind, claude: !!ctx.llm, model: config.claudeModel, push: !!vapidKeys(config), warnings });
      }
      if (m === "GET" && path === "/api/lines") return json({ lines: await store.catalog() });

      if (m === "POST" && path === "/api/chat") {
        const req2 = await body(req, ChatBody);
        await store.touchDevice(req2.deviceId);
        const allowed = (await store.takeChatQuota(req2.deviceId)) && (await store.takeQuota(GLOBAL_CLAUDE_KEY, config.claudeDailyLimit));
        const lastUser = req2.messages.filter((x) => x.role === "user").at(-1)!.content;
        await store.addTopic(topicOf(lastUser));
        const [lines, principles] = await Promise.all([store.catalog(), store.livePrinciples()]);
        const res = await answerChat(req2, { llm: allowed ? ctx.llm : null, lines, principles });
        return json(res);
      }

      if (m === "POST" && path === "/api/profile") {
        const b = await body(req, ProfileBody);
        await store.touchDevice(b.deviceId);
        const allowed = (await store.takeChatQuota(b.deviceId)) && (await store.takeQuota(GLOBAL_CLAUDE_KEY, config.claudeDailyLimit));
        return json(await analyzeProfile(b, allowed ? ctx.llm : null));
      }

      if (m === "POST" && path === "/api/feedback") {
        const b = await body(req, FeedbackBody);
        await store.vote(b.deviceId, b.kind, b.id, b.vote, b.topic ?? null);
        return json({ ok: true });
      }

      if (m === "POST" && path === "/api/report") {
        const b = await body(req, ReportBody);
        // Anonymous: the device id is NOT stored with the report.
        await store.addReport(b.answerId, b.text, b.topic);
        return json({ ok: true });
      }

      if (m === "GET" && path === "/api/push/key") {
        const keys = vapidKeys(config);
        if (!keys) throw new HttpError(503, "VAPID-Keys fehlen");
        return json({ publicKey: keys.publicKey });
      }

      if (m === "POST" && path === "/api/push/schedule") {
        const b = await body(req, ScheduleBody);
        const scheduled = await store.saveSchedule(
          b.deviceId,
          { endpoint: b.subscription.endpoint, p256dh: b.subscription.keys.p256dh, auth: b.subscription.keys.auth },
          b.neutral,
          b.items,
        );
        return json({ ok: true, scheduled });
      }
      if (m === "DELETE" && path === "/api/push/schedule") {
        const b = await body(req, DeviceBody);
        await store.removePush(b.deviceId);
        return json({ ok: true });
      }

      if (m === "DELETE" && path === "/api/device") {
        const b = await body(req, DeviceBody);
        await store.deleteDevice(b.deviceId);
        return json({ ok: true });
      }

      if ((m === "GET" || m === "POST") && path === "/api/cron/push") {
        requireCron(req, config);
        return json({ ok: true, ...(await sendDuePushes(store, ctx.push, config)) });
      }
      if ((m === "GET" || m === "POST") && path === "/api/cron/knowledge") {
        requireCron(req, config);
        return json({ ok: true, ...(await runKnowledgeJob(store, ctx.llm)) });
      }

      if (path.startsWith("/api/admin/")) {
        requireAdmin(req, config);
        const [, , , resource, id] = path.split("/");
        if (m === "GET" && resource === "overview") {
          const [lines, principles, reports, topics, answers, jobs] = await Promise.all([
            store.allLines(),
            store.allPrinciples(),
            store.reports(),
            store.topTopics(7),
            store.answerStats(),
            store.jobRuns(),
          ]);
          return json({ docs: KNOWLEDGE_DOCS, lines, principles, reports, topics, answers, jobs, claude: !!ctx.llm });
        }
        if (resource === "lines" && m === "POST" && !id) {
          const b = await body(req, LineCreate);
          return json({ ok: true, id: await store.insertLine({ ...b, status: "live", source: "admin", factual: 0 }) });
        }
        if (resource === "lines" && id && m === "PATCH") {
          await store.updateLine(id, await body(req, LinePatch));
          return json({ ok: true });
        }
        if (resource === "lines" && id && m === "DELETE") {
          await store.deleteLine(id);
          return json({ ok: true });
        }
        if (resource === "principles" && id && m === "PATCH") {
          await store.updatePrinciple(id, await body(req, PrinciplePatch));
          return json({ ok: true });
        }
        if (resource === "principles" && id && m === "DELETE") {
          await store.deletePrinciple(id);
          return json({ ok: true });
        }
        if (resource === "reports" && id && m === "PATCH") {
          await store.setReportStatus(id, (await body(req, ReportPatch)).status);
          return json({ ok: true });
        }
        if (resource === "job" && m === "POST") return json({ ok: true, ...(await runKnowledgeJob(store, ctx.llm)) });
        if (resource === "test-push" && m === "POST") {
          const subs = await store.subscriptions();
          let delivered = 0;
          const errors: string[] = [];
          for (const s of subs) {
            try {
              const body = s.neutral ? NEUTRAL_BODY : "Test-Push. Du bist der Fels.";
              await ctx.push.send(s, JSON.stringify({ title: NEUTRAL_TITLE, body, tag: "cyclemax-test", url: "/heute/" }));
              delivered++;
            } catch (e) {
              errors.push(e instanceof Error ? e.message : String(e));
            }
          }
          return json({ ok: true, subscriptions: subs.length, delivered, errors });
        }
      }

      return json({ error: "not found" }, 404);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error("unhandled", e);
      return json({ error: "internal error" }, 500);
    }
  };
}

let defaultContext: Promise<AppContext> | null = null;

/** Production context: env config, Neon/SQLite, Claude (if key), web-push. Seeds on cold start. */
export function getDefaultContext(): Promise<AppContext> {
  if (!defaultContext) {
    defaultContext = (async () => {
      const config = readConfig();
      const store = createStore(await getDatabase());
      await store.seed();
      return { config, store, llm: createClaude(config), push: createWebPushSender(config) };
    })().catch((e) => {
      defaultContext = null;
      throw e;
    });
  }
  return defaultContext;
}

export const handle = createHandler(getDefaultContext);
