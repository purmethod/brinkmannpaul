import { describe, expect, it } from "vitest";
import { SEED_LINES } from "./knowledge.generated";
import { fallbackAnswer } from "./fallback";

const ask = (content: string, phase: "red" | "pink" | null = "red", mode: "relationship" | "single" = "relationship") =>
  fallbackAnswer({ mode, phase, messages: [{ role: "user", content }] }, SEED_LINES);

describe("offline answers", () => {
  it("'Wie soll ich antworten?' gets a ready sentence for the phase", () => {
    expect(ask("Sie schreit mich an. Wie soll ich antworten?")).toMatch(/Sag: „Ich bin da\. Wir reden morgen in Ruhe\.“/);
    expect(ask("Was soll ich ihr sagen?", "pink")).toMatch(/Sag: „Samstagabend gehört uns/);
    expect(ask("Was schreibe ich ihr nach dem Date?", null, "single")).toMatch(/Sag: „Ich hatte einen schönen Abend/);
    expect(ask("Was sag ich jetzt?", null)).toMatch(/^Erst atmen/);
    // "sagt" in a report is not a request for words
    expect(ask("Sie sagt, ich höre nie zu. Was mache ich?")).not.toMatch(/Sag:/);
  });
  it("anything else: a line of the phase (or any), deterministic", () => {
    const a = ask("Sie ist so gereizt heute.");
    expect(a).toBe(ask("Sie ist so gereizt heute."));
    const line = SEED_LINES.find((l) => l.text === a)!;
    expect(["red", "any"]).toContain(line.category);
  });
});
