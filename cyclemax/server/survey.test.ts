import { describe, expect, it, vi } from "vitest";
import { QUESTION_IDS, QUESTIONS, SCALE, SURVEY_VERSION } from "../shared/survey";
import type { Llm } from "./llm";
import { cleanWish, SURVEYS_PER_DAY_PER_SENDER, summarizeSurvey, surveyCsv, toResponse, type SurveyBody } from "./survey";
import { testContext } from "./test-utils";

const answer = (over: Partial<SurveyBody> = {}) => ({
  consent: true,
  version: SURVEY_VERSION,
  ratings: { one_tap: 4, food_macros: 3, heat_cold: 2, privacy: 4 },
  annoyances: ["zu kompliziert", "Werbung oder Abo-Druck"],
  currentApp: "Flo",
  ageGroup: "30-39",
  price: "bis 5 € im Monat",
  wish: "Sag mir morgens, ob heute Sauna oder kalte Dusche besser ist.",
  voice: true,
  ...over,
});

describe("survey catalog", () => {
  it("has unique ids, 10-20 questions and a 4-step scale", () => {
    expect(new Set(QUESTION_IDS).size).toBe(QUESTION_IDS.length);
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(10);
    expect(QUESTIONS.length).toBeLessThanOrEqual(20);
    expect(SCALE).toEqual(["unwichtig", "wichtig", "sehr wichtig", "ultra wichtig"]);
  });
});

describe("cleanWish", () => {
  it("removes contacts and links, keeps the wish", () => {
    expect(cleanWish("Schreib mir: lisa.m@web.de oder +49 151 2345 6789, siehe www.example.com – mehr Eisen-Tipps!")).toBe(
      "Schreib mir: [entfernt] oder [entfernt], siehe [entfernt] – mehr Eisen-Tipps!",
    );
    expect(cleanWish("  Tag 3:   weniger   Kaffee  ")).toBe("Tag 3: weniger Kaffee");
    expect(cleanWish("Folg mir: instagram.com/lisa.m oder @lisa_m, Shop lisa-mueller.de")).toBe("Folg mir: [entfernt] oder [entfernt], Shop [entfernt]");
    expect(cleanWish("Ruf an: 0151 23456789")).toBe("Ruf an: [entfernt]");
  });

  it("keeps numbers that are part of the answer", () => {
    for (const t of ["Meine Zyklen: 28 30 29 31 Tage", "1500-2000 kcal am Tag", "Kosten 10 - 15 - 20 Euro", "z. B. 2.5 g Kreatin, d. h. täglich"])
      expect(cleanWish(t)).toBe(t);
  });
});

describe("summarizeSurvey + csv", () => {
  it("ranks wishes by importance and counts choices", () => {
    const rows = [
      toResponse(answer() as SurveyBody, Date.parse("2026-11-02T10:00:00Z")),
      toResponse(answer({ ratings: { one_tap: 2, heat_cold: 4 }, currentApp: null, annoyances: [] }) as SurveyBody),
    ];
    const s = summarizeSurvey(rows);
    expect(s.responses).toBe(2);
    expect(s.ranking[0]).toMatchObject({ id: "privacy", mean: 4, n: 1 });
    expect(s.ranking.find((q) => q.id === "one_tap")).toMatchObject({ mean: 3, top: 0.5, dist: [0, 1, 0, 1] });
    expect(s.ranking.find((q) => q.id === "training")).toMatchObject({ n: 0, mean: null });
    expect(s.annoyances[0]).toMatchObject({ n: 1 });
    expect(s.currentApps).toContainEqual({ key: "keine Angabe", n: 1 });
    expect(s.prices[0]).toEqual({ key: "bis 5 € im Monat", n: 2 });
    const csv = surveyCsv(rows.map((r, i) => ({ ...r, id: `0000000${i}-0000-0000-0000-000000000000` })));
    const [head, first] = csv.split("\n");
    expect(head.split(",")).toHaveLength(3 + QUESTION_IDS.length + 6);
    expect(first.startsWith("00000000,2026-11,2026-11,4,")).toBe(true);
    expect(first).toContain("zu kompliziert | Werbung oder Abo-Druck");
  });
});

describe("POST /api/survey", () => {
  it("stores the answer anonymously", async () => {
    const { call, store } = await testContext();
    const res = await call("POST", "/api/survey", answer({ wish: "Mehr Tipps fürs Training, ruf mich an: 0151 23456789" }));
    expect(res).toEqual({ status: 200, data: { ok: true } });
    const [row] = await store.surveyResponses();
    expect(row).toMatchObject({ ratings: { one_tap: 4, food_macros: 3, heat_cold: 2, privacy: 4 }, currentApp: "Flo", voice: true });
    expect(row.wish).toBe("Mehr Tipps fürs Training, ruf mich an: [entfernt]");
    // nothing that points to a device or a sender
    expect(Object.keys(row).sort()).toEqual(["ageGroup", "annoyances", "createdMonth", "currentApp", "id", "price", "ratings", "version", "voice", "wish"]);
  });

  it("rejects unknown questions, out-of-scale values, no consent and empty answers", async () => {
    const { call } = await testContext();
    expect((await call("POST", "/api/survey", answer({ ratings: { hacked: 4 } }))).status).toBe(400);
    expect((await call("POST", "/api/survey", answer({ ratings: { one_tap: 5 } }))).status).toBe(400);
    expect((await call("POST", "/api/survey", answer({ consent: false as never }))).status).toBe(400);
    expect((await call("POST", "/api/survey", answer({ ratings: {}, wish: "  ", annoyances: [], currentApp: null, ageGroup: null, price: null }))).status).toBe(400);
    expect((await call("POST", "/api/survey", answer({ annoyances: ["erfunden" as never] }))).status).toBe(400);
    // only the free text is fine – and so are only the choice questions
    expect((await call("POST", "/api/survey", answer({ ratings: {}, wish: "Weniger Werbung" }))).status).toBe(200);
    expect((await call("POST", "/api/survey", answer({ ratings: {}, wish: "", annoyances: [], currentApp: null, ageGroup: null, price: "bis 3 € im Monat" }))).status).toBe(200);
  });

  it("limits answers per sender and day; foreign sites cannot post in production", async () => {
    const { call } = await testContext();
    for (let i = 0; i < SURVEYS_PER_DAY_PER_SENDER; i++) expect((await call("POST", "/api/survey", answer())).status).toBe(200);
    expect((await call("POST", "/api/survey", answer())).status).toBe(429);

    const prod = await testContext({ env: { VERCEL_ENV: "production" } });
    const post = (origin: string) =>
      prod.handle(new Request("http://test/api/survey", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(answer()) }));
    expect((await post("https://evil.example")).status).toBe(403);
    expect((await post("https://cyclemax.app")).status).toBe(200);
    // scripts without an Origin header are refused too
    expect((await prod.call("POST", "/api/survey", answer())).status).toBe(403);
  });

  it("admin summary: a refusal from Claude is an error, not an empty success", async () => {
    const llm = { chat: vi.fn(), json: vi.fn(async () => null) } as unknown as Llm;
    const { call } = await testContext({ llm });
    await call("POST", "/api/survey", answer());
    expect((await call("POST", "/api/admin/survey/summary", undefined, "secret")).status).toBe(502);
  });

  it("admin: ranking, wishes, csv and a Claude summary – only with the password", async () => {
    const summary = { themes: [{ title: "Sauna und Kälte", mentions: 1, quote: "Sauna oder kalte Dusche" }], features: ["Tagestipp"], frustrations: [], surprises: [] };
    const llm = { chat: vi.fn(), json: vi.fn(async () => summary) } as unknown as Llm;
    const { call, handle } = await testContext({ llm });
    await call("POST", "/api/survey", answer());
    expect((await call("GET", "/api/admin/survey")).status).toBe(401);
    const res = await call("GET", "/api/admin/survey", undefined, "secret");
    expect(res.data.summary).toMatchObject({ responses: 1, total: 1, capped: false });
    expect(res.data.wishes).toEqual([{ month: expect.any(String), text: answer().wish, voice: true }]);
    const csv = await handle(new Request("http://test/api/admin/survey?format=csv", { headers: { authorization: "Bearer secret" } }));
    expect(csv.headers.get("content-disposition")).toContain("cyclemax-umfrage.csv");
    const s = await call("POST", "/api/admin/survey/summary", undefined, "secret");
    expect(s.data).toEqual({ ok: true, count: 1, summary });
    expect((llm.json as ReturnType<typeof vi.fn>).mock.calls[0][2]).toContain("Sauna oder kalte Dusche");
  });
});
