import { describe, expect, it } from "vitest";
import { headsUp, isPhasePushKey, PHASE_ORDER, PHASE_PUSH_TEXT, PHASES, PUSH_URL } from "./texts";

describe("texts", () => {
  it("heads-up: 'morgen' lower-case mid-sentence, capitalised at the start", () => {
    expect(headsUp("red", 1)).toBe("Hey Man, morgen beginnt Standfest. Sie kann dünnhäutiger werden – du bleibst ruhig.");
    expect(headsUp("green", 2)).toBe("Übermorgen beginnt Nähe. Ruhigere Tage, gut für Gespräche, die anstehen.");
  });
  it("push keys and deep links", () => {
    expect(isPhasePushKey("red7")).toBe(true);
    expect(isPhasePushKey("checkin")).toBe(false);
    expect(isPhasePushKey("late")).toBe(false);
    expect(isPhasePushKey("s-abc")).toBe(false);
    expect(isPhasePushKey("toString")).toBe(false);
    expect(PUSH_URL).toBe("/heute/");
  });
  it("every phase has attitude, forecast, hormones and his lead – short", () => {
    expect(PHASE_ORDER).toEqual(["yellow", "pink", "green", "red"]);
    for (const p of PHASE_ORDER) {
      const t = PHASES[p];
      for (const s of [t.attitude, t.forecast, t.hormones, t.lead]) {
        expect(s.length).toBeGreaterThan(10);
        expect(s.length).toBeLessThan(130);
      }
    }
  });
  it("Cyclemax never gives him a task about her period and makes no fertility claims", () => {
    const all = [
      ...Object.values(PHASE_PUSH_TEXT),
      ...PHASE_ORDER.flatMap((p) => Object.values(PHASES[p])),
    ].join(" ");
    expect(all).not.toMatch(/Eisprung|fruchtbar|Fruchtbarkeit|Verhütung|schwanger/i);
    expect(all).not.toMatch(/Entlastung|\bTee\b|Wärmflasche|Abwasch|Erzähl's mir|Tap in Cyclemax/i);
  });
});
