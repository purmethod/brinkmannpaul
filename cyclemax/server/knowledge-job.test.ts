import { describe, expect, it, vi } from "vitest";
import { SEED_LINES } from "../shared/knowledge.generated";
import { similarity, isDuplicate } from "../shared/similarity";
import { CriticSchema, GeneratorSchema, passesFormat, runKnowledgeJob } from "./knowledge-job";
import type { Llm } from "./llm";
import { testContext } from "./test-utils";

const generated = {
  lines: [
    { text: "Ruhe ist keine Schwäche. Sie ist dein Fundament.", category: "any" }, // 0 ok → live
    { text: "Ein Mann reagiert nicht – er entscheidet.", category: "any" }, // 1 duplicate of seed
    { text: "Progesteron macht sie ruhiger. Nutze die Woche.", category: "green" }, // 2 factual → review
    { text: "Sag ihr, was sie hören will, dann bekommst du alles.", category: "pink" }, // 3 manipulation → critic fails
    { text: "Stark bleiben 💪", category: "any" }, // 4 emoji → format fails
    { text: "Eins. Zwei. Drei Sätze sind zu viel.", category: "red" }, // 5 three sentences → format fails
    { text: "Beim ersten Date zählt, wie du zuhörst, nicht wie du redest.", category: "single" }, // 6 ok
  ],
  principles: [
    "Fragt er nach einem Streit, erst seinen Puls runter, dann ein Satz für sie.", // ok → live
    "Ruhe ist keine Schwäche. Sie ist dein Fundament!", // duplicate of candidate 0
  ],
};

function mockClaude(): Llm & { json: ReturnType<typeof vi.fn> } {
  return {
    chat: vi.fn(),
    json: vi.fn(async (schema: unknown, _system: string, prompt: string) => {
      if (schema === GeneratorSchema) return generated;
      if (schema === CriticSchema) {
        // indexes refer to the format-filtered list: 0,1,2,3,6,p0,p1 → 0..6
        const texts = prompt.split("\n").filter((l) => /^\d+: /.test(l));
        return {
          verdicts: texts.map((l, index) => ({
            index,
            pass: !l.includes("bekommst du alles"),
            factual: l.includes("Progesteron"),
            reason: "",
          })),
        };
      }
      return null;
    }),
  } as never;
}

describe("knowledge job", () => {
  it("generator → critic → duplicate check → live / review", async () => {
    const { store } = await testContext();
    await store.addTopic("Streit");
    const llm = mockClaude();
    const summary = await runKnowledgeJob(store, llm);
    expect(summary).toMatchObject({
      status: "ok",
      generated: 9,
      rejectedFormat: 2,
      rejectedByCritic: 1,
      duplicates: 2,
      live: 3,
      review: 1,
      topics: ["Streit"],
    });
    // generator saw knowledge, examples and topics
    const [, sys, prompt] = llm.json.mock.calls[0];
    expect(sys).toContain("PURE");
    expect(prompt).toContain("Streit");
    expect(prompt).toContain("7");

    const lines = await store.allLines();
    const gen = lines.filter((l) => l.source === "generated");
    expect(gen.map((l) => [l.text, l.status])).toEqual(
      expect.arrayContaining([
        ["Ruhe ist keine Schwäche. Sie ist dein Fundament.", "live"],
        ["Beim ersten Date zählt, wie du zuhörst, nicht wie du redest.", "live"],
        ["Progesteron macht sie ruhiger. Nutze die Woche.", "review"],
      ]),
    );
    expect(gen).toHaveLength(3);
    // review lines are not delivered until approved in /admin
    const catalog = await store.catalog();
    expect(catalog.find((l) => l.text.startsWith("Progesteron"))).toBeUndefined();
    expect(catalog).toHaveLength(SEED_LINES.length + 2);
    const principles = await store.allPrinciples();
    expect(principles.filter((p) => p.source === "generated")).toHaveLength(1);
    expect((await store.jobRuns())[0].summary.live).toBe(3);
  });

  it("is skipped without API key and records an error when Claude fails", async () => {
    const { store } = await testContext();
    expect((await runKnowledgeJob(store, null)).status).toBe("skipped");
    const broken = { chat: vi.fn(), json: vi.fn(async () => null) } as never;
    const res = await runKnowledgeJob(store, broken);
    expect(res.status).toBe("error");
    expect(await store.allLines()).toHaveLength(SEED_LINES.length);
  });

  it("runs from the cron endpoint with the cron secret", async () => {
    const { call } = await testContext({ llm: mockClaude() });
    expect((await call("GET", "/api/cron/knowledge")).status).toBe(401);
    expect((await call("GET", "/api/cron/knowledge", undefined, "cron")).data).toMatchObject({ ok: true, live: 3 });
  });
});

describe("format and similarity", () => {
  it("max two sentences, no emoji, short", () => {
    expect(passesFormat("Ein Satz. Zweiter Satz.")).toBe(true);
    expect(passesFormat("Eins. Zwei. Drei.")).toBe(false);
    expect(passesFormat("Kraft 🔥")).toBe(false);
    expect(passesFormat("x".repeat(161))).toBe(false);
  });
  it("detects near duplicates but not different lines", () => {
    expect(similarity("Ein Mann reagiert nicht. Er entscheidet.", "Ein Mann reagiert nicht – er entscheidet!")).toBeGreaterThan(0.8);
    expect(isDuplicate("Halte den Druck statt ihn abzuladen. Das ist Stärke!", SEED_LINES.map((l) => l.text))).toBe(true);
    expect(isDuplicate("Beim ersten Date zählt, wie du zuhörst.", SEED_LINES.map((l) => l.text))).toBe(false);
    // the seed set itself has no near duplicates
    const texts = SEED_LINES.map((l) => l.text);
    for (let i = 0; i < texts.length; i++) expect(isDuplicate(texts[i], texts.filter((_, j) => j !== i)), texts[i]).toBe(false);
  });
});
