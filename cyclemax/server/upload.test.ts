import { describe, expect, it, vi } from "vitest";
import type { Llm } from "./llm";
import { testContext } from "./test-utils";
import { anonymize, checkImage, summarize, toCsv, UPLOADS_PER_DAY_PER_SENDER, withoutGaps, type Dataset, type Extraction } from "./upload";

const NOW = Date.parse("2026-10-31T12:00:00Z");
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(120)]).toString("base64");
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(120)]).toString("base64");

const extraction = (over: Partial<Extraction> = {}): Extraction => ({
  relevant: true,
  sourceApp: "Flo",
  periodStarts: ["2026-07-03", "2026-07-31", "2026-08-30", "2026-09-27"],
  periodLengths: [5, 4, 5],
  cycleLengths: [],
  averageCycleLength: null,
  averagePeriodLength: null,
  symptoms: [
    { name: "Krämpfe", cycleDay: 1 },
    { name: "Krämpfe", cycleDay: 1 },
    { name: "Reizbarkeit", cycleDay: 25 },
  ],
  observations: [
    { category: "Stimmung", value: "Gereizt", cycleDay: 25 },
    { category: "Mood", value: "gereizt", cycleDay: 25 },
    { category: "Libido", value: "hoch", cycleDay: 13 },
    { category: "Temperatur", value: "36,7 °C", cycleDay: 15 },
    { category: "Gefühl", value: "anna@mail.de", cycleDay: 3 },
    { category: "Stimmung", value: "gut am 12.10.", cycleDay: 4 },
    { category: "Weltall", value: "ruhig", cycleDay: null },
  ],
  metrics: [
    { name: "Lutealphase", value: 13, unit: "Tage" },
    { name: "lutealphase", value: 14, unit: "Tage" },
    { name: "Zyklusschwankung", value: 3, unit: "Tage" },
  ],
  quality: "klar",
  ...over,
});

const meta = { ageGroup: "30-39" as const, contraception: "keine" as const, images: 2 };

function llmReturning(x: Extraction | null): Llm & { json: ReturnType<typeof vi.fn> } {
  return { chat: vi.fn(), json: vi.fn(async () => x) } as never;
}
const upload = (over: Record<string, unknown> = {}) => ({ consent: true, images: [{ mediaType: "image/png", data: PNG }], ...over });

describe("anonymize", () => {
  it("turns calendar dates into cycle lengths and keeps no date", () => {
    const d = anonymize(extraction(), meta, NOW)!;
    expect(d.cycleLengths).toEqual([28, 30, 28]);
    expect(d.avgCycle).toBe(28.7);
    expect(d.avgPeriod).toBe(4.7);
    expect(d.createdMonth).toBe("2026-10");
    expect(JSON.stringify(d)).not.toMatch(/2026-0[789]-\d\d/);
  });

  it("drops gaps, future and implausible values, and duplicate symptoms", () => {
    const d = anonymize(
      extraction({
        periodStarts: ["2026-01-01", "2026-06-01", "2026-06-29", "2027-01-01", "kaputt"],
        periodLengths: [0, 5, 40],
        symptoms: [
          { name: "Krämpfe", cycleDay: 1 },
          { name: "Krämpfe", cycleDay: 1 },
          { name: "Akne", cycleDay: 400 },
        ],
      }),
      meta,
      NOW,
    )!;
    expect(d.cycleLengths).toEqual([28]);
    expect(d.periodLengths).toEqual([5]);
    expect(d.symptoms).toEqual([
      { name: "Krämpfe", cycleDay: 1 },
      { name: "Akne", cycleDay: null },
    ]);
  });

  it("uses the lengths the app shows when there are no start dates, and its averages when plausible", () => {
    const d = anonymize(extraction({ periodStarts: [], cycleLengths: [29, 31, 5], averageCycleLength: 30, averagePeriodLength: 99 }), meta, NOW)!;
    expect(d.cycleLengths).toEqual([29, 31]);
    expect(d.avgCycle).toBe(30);
    expect(d.avgPeriod).toBe(4.7);
  });

  it("maps apps, symptoms and quality off the list instead of failing", () => {
    const d = anonymize(
      extraction({
        sourceApp: "Samsung Health",
        quality: "good",
        symptoms: [
          { name: "Cramps", cycleDay: 2 },
          { name: "headache", cycleDay: null },
          { name: "Mood swings", cycleDay: 26 },
          { name: "Weltschmerz", cycleDay: 3 },
          { name: "krämpfe", cycleDay: 2 },
        ],
      }),
      meta,
      NOW,
    )!;
    expect(d.sourceApp).toBe("andere");
    expect(d.quality).toBe("teilweise");
    expect(d.symptoms).toEqual([
      { name: "Krämpfe", cycleDay: 2 },
      { name: "Kopfschmerzen", cycleDay: null },
      { name: "Stimmungsschwankungen", cycleDay: 26 },
      { name: "Sonstiges", cycleDay: 3 },
    ]);
    expect(anonymize(extraction({ sourceApp: "apple health" }), meta, NOW)!.sourceApp).toBe("Apple Health");
  });

  it("does not invent long cycles from a missing start or a non-existent date", () => {
    // July and September only: 62 days is a gap, not a cycle
    expect(anonymize(extraction({ periodStarts: ["2026-07-01", "2026-09-01"], periodLengths: [5] }), meta, NOW)!.cycleLengths).toEqual([]);
    expect(withoutGaps([28, 29, 57, 27])).toEqual([28, 29, 27]);
    // long but regular cycles stay; ~1.7x the typical length is a missed entry
    expect(withoutGaps([40, 42, 41, 60])).toEqual([40, 42, 41, 60]);
    expect(withoutGaps([40, 42, 41, 70])).toEqual([40, 42, 41]);
    // 30 February does not exist (would roll over to 2 March and fake a 26-day cycle)
    expect(anonymize(extraction({ periodStarts: ["2026-02-30", "2026-03-28"], periodLengths: [5] }), meta, NOW)!.cycleLengths).toEqual([]);
  });

  it("prefers the cycle lengths the app lists when it shows more of them", () => {
    const d = anonymize(extraction({ periodStarts: ["2026-08-30", "2026-09-27"], cycleLengths: [27, 29, 28, 30] }), meta, NOW)!;
    expect(d.cycleLengths).toEqual([27, 29, 28, 30]);
  });

  it("keeps mood, desire, temperature and the app's statistics – never contacts or dates", () => {
    const d = anonymize(extraction(), meta, NOW)!;
    expect(d.observations).toEqual([
      { category: "Stimmung", value: "gereizt", cycleDay: 25 },
      { category: "Lust", value: "hoch", cycleDay: 13 },
      { category: "Temperatur", value: "36,7 °c", cycleDay: 15 },
      { category: "Sonstiges", value: "ruhig", cycleDay: null },
    ]);
    expect(d.metrics).toEqual([
      { name: "Lutealphase", value: 13, unit: "Tage" },
      { name: "Zyklusschwankung", value: 3, unit: "Tage" },
    ]);
    // a screenshot with only mood entries is still worth a dataset
    expect(anonymize(extraction({ periodStarts: [], periodLengths: [], symptoms: [], metrics: [] }), meta, NOW)?.observations).toHaveLength(4);
  });

  it("returns null for pictures without cycle data", () => {
    expect(anonymize(extraction({ relevant: false }), meta, NOW)).toBeNull();
    expect(anonymize(extraction({ periodStarts: [], periodLengths: [], symptoms: [], observations: [], metrics: [] }), meta, NOW)).toBeNull();
  });
});

describe("checkImage", () => {
  it("accepts real image bytes of the declared type only", () => {
    expect(checkImage({ mediaType: "image/png", data: PNG })).toBeNull();
    expect(checkImage({ mediaType: "image/jpeg", data: JPEG })).toBeNull();
    expect(checkImage({ mediaType: "image/jpeg", data: PNG })).toMatch(/JPEG/);
    expect(checkImage({ mediaType: "image/png", data: "not base64!" + PNG })).toMatch(/beschädigt/);
  });
});

describe("summarize and csv", () => {
  it("aggregates and exports without dates", () => {
    const a = anonymize(extraction(), meta, NOW)!;
    const b = anonymize(extraction({ periodStarts: [], cycleLengths: [35], sourceApp: "Clue" }), { ...meta, ageGroup: null }, NOW)!;
    const s = summarize([a, b]);
    expect(s.datasets).toBe(2);
    expect(s.cycles).toBe(4);
    expect(s.cycleLength.median).toBe(29);
    expect(s.cycleLength.histogram.find((h) => h.key === "26-30")?.n).toBe(3);
    expect(s.symptoms[0]).toEqual({ key: "Krämpfe", n: 2 });
    expect(s.ageGroups).toContainEqual({ key: "keine Angabe", n: 1 });
    // where things show up in Cyclemax's phases (28.7-day cycle: day 25 is red; with the 35-day cycle of b it is green)
    expect(s.byPhase.find((p) => p.phase === "red")?.top).toEqual([
      { key: "Reizbarkeit", n: 1 },
      { key: "Stimmung: gereizt", n: 1 },
    ]);
    expect(s.byPhase.find((p) => p.phase === "pink")?.top).toContainEqual({ key: "Lust: hoch", n: 2 });
    expect(s.observations.find((o) => o.category === "Stimmung")).toEqual({ category: "Stimmung", n: 2, top: [{ key: "gereizt", n: 2 }] });
    expect(s.metrics[0]).toEqual({ name: "Lutealphase", unit: "Tage", n: 2, mean: 13 });
    const csv = toCsv([{ ...a, id: "abcdef12-0000-0000-0000-000000000000" } as Dataset & { id: string }]);
    expect(csv.split("\n")[1]).toBe(
      "abcdef12,2026-10,Flo,30-39,keine,28 30 28,5 4 5,28.7,4.7,Krämpfe@1 Reizbarkeit@25,Stimmung:gereizt@25 | Lust:hoch@13 | Temperatur:36,7 °c@15 | Sonstiges:ruhig,Lutealphase=13 Tage | Zyklusschwankung=3 Tage,klar,2"
        .replace("Stimmung:gereizt@25 | Lust:hoch@13 | Temperatur:36,7 °c@15 | Sonstiges:ruhig", '"Stimmung:gereizt@25 | Lust:hoch@13 | Temperatur:36,7 °c@15 | Sonstiges:ruhig"'),
    );
    // text from screenshots never becomes a spreadsheet formula
    const evil = toCsv([{ ...a, id: "abcdef12-0000-0000-0000-000000000000", metrics: [{ name: "=hyperlink(x)", value: 1, unit: "" }] } as Dataset & { id: string }]);
    expect(evil).toContain(",'=hyperlink(x)=1,");
  });
});

describe("POST /api/upload", () => {
  it("reads the screenshots, stores only the anonymous dataset and returns a deletion code", async () => {
    const llm = llmReturning(extraction());
    const { call, store } = await testContext({ llm });
    const res = await call("POST", "/api/upload", upload({ ageGroup: "20-29" }));
    expect(res.status).toBe(200);
    expect(res.data.saved.cycleLengths).toEqual([28, 30, 28]);
    expect(res.data.saved.symptoms).toEqual(["Krämpfe", "Reizbarkeit"]);
    // the images went to Claude once …
    expect(llm.json.mock.calls[0][4]).toEqual({ images: [{ mediaType: "image/png", data: PNG }], maxRetries: 0, timeoutMs: 50_000 });
    // … but nothing of them is stored
    const rows = await store.datasets();
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(PNG.slice(0, 20));
    expect(rows[0]).toMatchObject({ id: res.data.code, ageGroup: "20-29", sourceApp: "Flo" });

    expect((await call("DELETE", `/api/upload/${res.data.code}`)).data).toEqual({ ok: true, deleted: true });
    expect(await store.datasets()).toHaveLength(0);
    expect((await call("DELETE", `/api/upload/${res.data.code}`)).data.deleted).toBe(false);
    expect((await call("DELETE", "/api/upload/nope")).status).toBe(400);
  });

  it("needs consent and real images", async () => {
    const { call } = await testContext({ llm: llmReturning(extraction()) });
    expect((await call("POST", "/api/upload", upload({ consent: false }))).status).toBe(400);
    expect((await call("POST", "/api/upload", upload({ images: [] }))).status).toBe(400);
    expect((await call("POST", "/api/upload", upload({ images: [{ mediaType: "image/gif", data: PNG }] }))).status).toBe(400);
    expect((await call("POST", "/api/upload", upload({ images: [{ mediaType: "image/jpeg", data: PNG }] }))).status).toBe(400);
    const seven = Array.from({ length: 7 }, () => ({ mediaType: "image/png", data: PNG }));
    expect((await call("POST", "/api/upload", upload({ images: seven }))).status).toBe(400);
  });

  it("stores nothing when the pictures show no cycle data", async () => {
    const { call, store } = await testContext({ llm: llmReturning(extraction({ relevant: false })) });
    const res = await call("POST", "/api/upload", upload());
    expect(res.status).toBe(422);
    expect(await store.datasets()).toHaveLength(0);
  });

  it("without Claude or when Claude fails: clear error, nothing stored", async () => {
    expect((await (await testContext()).call("POST", "/api/upload", upload())).status).toBe(503);
    const broken = { chat: vi.fn(), json: vi.fn(async () => Promise.reject(new Error("401 invalid x-api-key"))) } as never;
    const { call, store } = await testContext({ llm: broken });
    expect((await call("POST", "/api/upload", upload())).status).toBe(502);
    expect(await store.datasets()).toHaveLength(0);
  });

  it("limits uploads per sender and day", async () => {
    const { call } = await testContext({ llm: llmReturning(extraction()) });
    for (let i = 0; i < UPLOADS_PER_DAY_PER_SENDER; i++) expect((await call("POST", "/api/upload", upload())).status).toBe(200);
    expect((await call("POST", "/api/upload", upload())).status).toBe(429);
  });

  it("in production only cyclemax.app may post (no uploads from other sites' visitors)", async () => {
    const { handle } = await testContext({ llm: llmReturning(extraction()), env: { VERCEL_ENV: "production" } });
    const post = (origin: string) =>
      handle(new Request("http://test/api/upload", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(upload()) }));
    expect((await post("https://evil.example")).status).toBe(403);
    expect((await post("https://cyclemax.app")).status).toBe(200);
  });

  it("has its own daily budget and never uses up the chat's Claude budget", async () => {
    const chatLlm = { ...llmReturning(extraction()), chat: vi.fn(async () => ({ text: "Ruhig bleiben.", refused: false })) } as never;
    const { call } = await testContext({ llm: chatLlm, env: { UPLOAD_DAILY_LIMIT: "1", CLAUDE_DAILY_LIMIT: "1" } });
    expect((await call("POST", "/api/upload", upload())).status).toBe(200);
    expect((await call("POST", "/api/upload", upload())).status).toBe(503);
    const chat = await call("POST", "/api/chat", { deviceId: "11111111-2222-3333-4444-555555555555", mode: "relationship", phase: "red", cycleDay: 24, messages: [{ role: "user", content: "Hi" }] });
    expect(chat.data.source).toBe("claude");
  });

  it("admin: aggregates and csv, only with the password", async () => {
    const { call, handle } = await testContext({ llm: llmReturning(extraction()) });
    await call("POST", "/api/upload", upload());
    expect((await call("GET", "/api/admin/datasets")).status).toBe(401);
    const res = await call("GET", "/api/admin/datasets", undefined, "secret");
    expect(res.data.summary).toMatchObject({ datasets: 1, cycles: 3 });
    const csv = await handle(new Request("http://test/api/admin/datasets?format=csv", { headers: { authorization: "Bearer secret" } }));
    expect(csv.headers.get("content-type")).toMatch(/text\/csv/);
    expect((await csv.text()).split("\n")).toHaveLength(3);
  });
});
