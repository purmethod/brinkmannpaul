import { describe, expect, it, vi } from "vitest";
import { SEED_LINES } from "../shared/knowledge.generated";
import { PHASE_PUSH_TEXT } from "../shared/texts";
import { buildContext, buildSystemPrompt } from "./chat";
import { routeOf } from "./app";
import type { Llm } from "./llm";
import { DEVICE, testContext } from "./test-utils";

const chatBody = (content: string, extra: Record<string, unknown> = {}) => ({
  deviceId: DEVICE,
  mode: "relationship",
  phase: "red",
  cycleDay: 24,
  notes: [],
  messages: [{ role: "user", content }],
  ...extra,
});

function fakeLlm(text = "Sie ist gereizt, nicht gegen dich. Sag: „Ich bin da, wenn du mich brauchst.“"): Llm & { chat: ReturnType<typeof vi.fn> } {
  return {
    chat: vi.fn(async () => ({ text, refused: false })),
    json: vi.fn(async () => null),
  } as never;
}

describe("api", () => {
  it("health and catalog", async () => {
    const { call } = await testContext();
    expect((await call("GET", "/api/health")).data).toMatchObject({ ok: true, db: "sqlite", claude: false });
    const lines = (await call("GET", "/api/lines")).data.lines;
    expect(lines).toHaveLength(SEED_LINES.length);
    expect(lines[0]).toHaveProperty("weight");
  });

  it("routes the Vercel rewrite form", () => {
    expect(routeOf(new URL("http://x/api/index?route=chat"))).toBe("/api/chat");
    expect(routeOf(new URL("http://x/api/admin/lines/abc/"))).toBe("/api/admin/lines/abc");
  });

  it("chat without key answers from the knowledge base and stores only the topic", async () => {
    const { call, store } = await testContext();
    const res = await call("POST", "/api/chat", chatBody("Wir hatten Streit, sie ist laut geworden. Was soll ich tun?"));
    expect(res.status).toBe(200);
    expect(res.data.source).toBe("fallback");
    expect(res.data.topic).toBe("Streit");
    const pool = SEED_LINES.filter((l) => l.category === "red" || l.category === "any").map((l) => l.text);
    expect(pool).toContain(res.data.text);
    expect(await store.topTopics()).toEqual([{ topic: "Streit", count: 1 }]);
  });

  it("chat with Claude sends knowledge as system prompt and context separately", async () => {
    const llm = fakeLlm();
    const { call } = await testContext({ llm });
    const res = await call("POST", "/api/chat", chatBody("Wie soll ich antworten?", { notes: ["Sie war heute müde."] }));
    expect(res.data).toMatchObject({ source: "claude", text: expect.stringContaining("Sag:") });
    const params = llm.chat.mock.calls[0][0];
    expect(params.system).toContain("Du bist der Cyclemax-Mentor");
    expect(params.system).toContain("PURE");
    expect(params.context).toContain("Standfest");
    expect(params.context).toContain("Zyklustag 24");
    expect(params.context).toContain("Sie war heute müde.");
  });

  it("falls back when Claude refuses or fails", async () => {
    const llm = { chat: vi.fn(async () => ({ text: "", refused: true })), json: vi.fn() } as never;
    const { call } = await testContext({ llm });
    expect((await call("POST", "/api/chat", chatBody("Hallo"))).data.source).toBe("fallback");
    const broken = { chat: vi.fn(async () => Promise.reject(new Error("529"))), json: vi.fn() } as never;
    const t2 = await testContext({ llm: broken });
    expect((await t2.call("POST", "/api/chat", chatBody("Hallo"))).data.source).toBe("fallback");
  });

  it("always attaches help resources on violence or self-harm", async () => {
    const { call } = await testContext({ llm: fakeLlm("Atme erst.") });
    const res = await call("POST", "/api/chat", chatBody("Sie hat mich geschlagen und ich will nicht mehr leben"));
    expect(res.data.text).toContain("112");
    expect(res.data.text).toContain("0800 111 0 111");
    expect(res.data.text).toContain("0800 123 99 00");
  });

  it("validates input", async () => {
    const { call } = await testContext();
    expect((await call("POST", "/api/chat", { ...chatBody("x"), deviceId: "bad id" })).status).toBe(400);
    expect((await call("POST", "/api/chat", { ...chatBody("x"), messages: [] })).status).toBe(400);
    expect((await call("POST", "/api/chat", chatBody("x".repeat(2001)))).status).toBe(400);
    expect((await call("GET", "/api/nope")).status).toBe(404);
  });

  it("rate-limits chat per device (then knowledge-base answers)", async () => {
    const llm = fakeLlm();
    const { call, store } = await testContext({ llm });
    for (let i = 0; i < 40; i++) await store.takeChatQuota(DEVICE);
    const res = await call("POST", "/api/chat", chatBody("Hallo"));
    expect(res.data.source).toBe("fallback");
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it("feedback and anonymous report", async () => {
    const { call, store } = await testContext();
    expect((await call("POST", "/api/feedback", { deviceId: DEVICE, kind: "line", id: SEED_LINES[0].id, vote: 1 })).status).toBe(200);
    expect((await store.lineById(SEED_LINES[0].id))!.up).toBe(1);
    expect((await call("POST", "/api/feedback", { deviceId: DEVICE, kind: "answer", id: "a1", vote: -1, topic: "Streit" })).status).toBe(200);
    expect((await call("POST", "/api/feedback", { deviceId: DEVICE, kind: "line", id: "x", vote: 2 })).status).toBe(400);
    await call("POST", "/api/report", { deviceId: DEVICE, answerId: "a1", text: "Schlechte Antwort", topic: "Streit" });
    const reports = await store.reports();
    expect(reports).toHaveLength(1);
    expect(JSON.stringify(reports)).not.toContain(DEVICE);
  });

  it("admin requires the password and can review content", async () => {
    const { call } = await testContext();
    expect((await call("GET", "/api/admin/overview")).status).toBe(401);
    expect((await call("GET", "/api/admin/overview", undefined, "wrong")).status).toBe(401);
    const ov = await call("GET", "/api/admin/overview", undefined, "secret");
    expect(ov.status).toBe(200);
    expect(ov.data.docs.length).toBeGreaterThan(3);
    const id = ov.data.lines[0].id;
    await call("PATCH", `/api/admin/lines/${id}`, { status: "review", text: "Neu." }, "secret");
    const after = (await call("GET", "/api/admin/overview", undefined, "secret")).data.lines.find((l: { id: string }) => l.id === id);
    expect(after).toMatchObject({ status: "review", text: "Neu." });
    await call("DELETE", `/api/admin/lines/${id}`, undefined, "secret");
    expect((await call("GET", "/api/lines")).data.lines.find((l: { id: string }) => l.id === id)).toBeUndefined();
    const created = await call("POST", "/api/admin/lines", { text: "Neue Zeile.", category: "any" }, "secret");
    expect(created.data.id).toMatch(/^g-/);
    await call("POST", "/api/report", { deviceId: DEVICE, answerId: "a1", text: "x" });
    const rid = (await call("GET", "/api/admin/overview", undefined, "secret")).data.reports[0].id;
    expect((await call("PATCH", `/api/admin/reports/${rid}`, { status: "ok" }, "secret")).status).toBe(200);
  });

  it("admin is closed when ADMIN_PASSWORD is not set", async () => {
    const { call } = await testContext({ env: { ADMIN_PASSWORD: "" } });
    expect((await call("GET", "/api/admin/overview", undefined, "")).status).toBe(503);
  });

  it("web push: schedule → hourly cron sends the right text once", async () => {
    const { call, push } = await testContext();
    const soon = new Date(Date.now() + 10 * 60_000).toISOString();
    const later = new Date(Date.now() + 26 * 3600_000).toISOString();
    const sub = { endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } };
    const r = await call("POST", "/api/push/schedule", {
      deviceId: DEVICE,
      neutral: false,
      subscription: sub,
      items: [
        { at: soon, kind: "phase", key: "red7" },
        { at: later, kind: "daily", key: SEED_LINES[0].id },
      ],
    });
    expect(r.data.scheduled).toBe(2);
    expect((await call("GET", "/api/cron/push")).status).toBe(401);
    const run = await call("GET", "/api/cron/push", undefined, "cron");
    expect(run.data).toMatchObject({ due: 1, delivered: 1 });
    expect(push.sent[0].payload).toMatchObject({ title: "Cyclemax", body: PHASE_PUSH_TEXT.red7 });
    expect((await call("GET", "/api/cron/push", undefined, "cron")).data.delivered).toBe(0);
  });

  it("web push: neutral shows only the app name; dead subscriptions are removed", async () => {
    const { call, push, store } = await testContext();
    const soon = new Date(Date.now() + 60_000).toISOString();
    const sub = { endpoint: "https://push.example/2", keys: { p256dh: "p", auth: "a" } };
    await call("POST", "/api/push/schedule", { deviceId: DEVICE, neutral: true, subscription: sub, items: [{ at: soon, kind: "daily", key: SEED_LINES[3].id }] });
    await call("GET", "/api/cron/push", undefined, "cron");
    expect(push.sent[0].payload).toMatchObject({ title: "Cyclemax", body: "" });
    await call("POST", "/api/push/schedule", { deviceId: DEVICE, neutral: false, subscription: sub, items: [{ at: soon, kind: "daily", key: SEED_LINES[3].id }] });
    push.failFor.set(sub.endpoint, 410);
    const run = await call("GET", "/api/cron/push", undefined, "cron");
    expect(run.data.removedSubscriptions).toBe(1);
    expect(await store.subscriptions()).toHaveLength(0);
  });

  it("DELETE /api/device wipes the device server-side", async () => {
    const { call, store } = await testContext();
    await call("POST", "/api/feedback", { deviceId: DEVICE, kind: "line", id: SEED_LINES[0].id, vote: 1 });
    await call("POST", "/api/push/schedule", {
      deviceId: DEVICE, neutral: false, subscription: { endpoint: "https://push.example/3", keys: { p256dh: "p", auth: "a" } },
      items: [{ at: new Date(Date.now() + 3600_000).toISOString(), kind: "daily", key: "x" }],
    });
    expect((await call("DELETE", "/api/device", { deviceId: DEVICE })).status).toBe(200);
    expect(await store.deviceFootprint(DEVICE)).toEqual({ devices: 0, subscriptions: 0, schedule: 0, votes: 0, chatUsage: 0 });
  });

  it("CORS preflight for the native app origin", async () => {
    const { handle } = await testContext();
    const res = await handle(new Request("http://test/api/chat", { method: "OPTIONS", headers: { origin: "capacitor://localhost" } }));
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("prompt", () => {
  it("system prompt contains the base prompt, rules and knowledge; context the device data", () => {
    const sys = buildSystemPrompt(["Leitsatz A"]);
    expect(sys).toContain("ruhiger heißt nicht kleiner");
    expect(sys).toContain("- Leitsatz A");
    expect(sys).toContain("Marc Aurel");
    expect(buildContext({ mode: "single", phase: null, cycleDay: null, notes: [] })).toContain("Single/Dating");
  });
});

describe("profile", () => {
  const text =
    "Sie ist oft gestresst von der Arbeit, wir streiten über den Haushalt, im Bett läuft seit Monaten wenig und sie wünscht sich ein Kind.";

  it("Claude turns his story into a structured profile (nothing stored)", async () => {
    const profile = {
      summary: "Sie ist gestresst, ihr streitet über Alltag.",
      traits: ["gestresst"],
      topics: [{ label: "Haushalt", note: "Übernimm was." }],
      balance: 140,
      balanceNote: "Du ziehst dich zurück.",
      focus: "Entlasten.",
      steps: ["a", "b", "c", "d"],
    };
    const llm = { chat: vi.fn(), json: vi.fn(async () => profile) } as never;
    const { call, store } = await testContext({ llm });
    const res = await call("POST", "/api/profile", { deviceId: DEVICE, mode: "relationship", text, previous: null });
    expect(res.status).toBe(200);
    expect(res.data.source).toBe("claude");
    expect(res.data.profile.balance).toBe(100);
    expect(res.data.profile.steps).toHaveLength(3);
    const [, system, prompt] = (llm as { json: ReturnType<typeof vi.fn> }).json.mock.calls[0];
    expect(system).toContain("Nähe und Abstand");
    expect(prompt).toContain("Haushalt");
    expect(await store.reports()).toHaveLength(0);
  });

  it("falls back to a keyword profile without Claude", async () => {
    const { call } = await testContext();
    const res = await call("POST", "/api/profile", { deviceId: DEVICE, mode: "relationship", text, previous: null });
    expect(res.data.source).toBe("fallback");
    const labels = res.data.profile.topics.map((t: { label: string }) => t.label);
    expect(labels).toEqual(expect.arrayContaining(["Haushalt", "Nähe & Intimität", "Kinderwunsch", "Stress & Arbeit", "Streit"]));
  });

  it("chat sends the device profile as context", async () => {
    const llm = { chat: vi.fn(async (p: { context: string }) => ({ text: p.context ? "Ok." : "", refused: false })), json: vi.fn() };
    const { call } = await testContext({ llm: llm as never });
    await call("POST", "/api/chat", chatBody("Was tun?", { profile: "Sie ist gestresst. Fokus: Entlasten." }));
    expect(llm.chat.mock.calls[0][0].context).toContain("Sie ist gestresst");
  });
});
