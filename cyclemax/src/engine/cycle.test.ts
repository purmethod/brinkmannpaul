import { describe, expect, it } from "vitest";
import type { Phase } from "@shared/types";
import { addDays, diffDays } from "./dates";
import {
  addBleeding,
  cycleStateOn,
  learnedCycleLength,
  phaseForDay,
  phaseRanges,
} from "./cycle";

const LENGTHS = [21, 25, 28, 32, 35, 40];

describe("phases cover every cycle day exactly once", () => {
  for (const L of LENGTHS) {
    it(`cycle length ${L}`, () => {
      const r = phaseRanges(L);
      const days: Phase[] = [];
      for (let d = 1; d <= L; d++) days.push(phaseForDay(d, L));
      // contiguous blocks in fixed order, no gaps, no overlaps
      const order = days.filter((p, i) => i === 0 || days[i - 1] !== p);
      expect(order).toEqual(L === 21 ? ["yellow", "green", "red"] : ["yellow", "pink", "green", "red"]);
      expect(days.filter((p) => p === "yellow")).toHaveLength(7);
      expect(days.filter((p) => p === "green")).toHaveLength(7);
      expect(days.filter((p) => p === "red")).toHaveLength(7);
      expect(days.filter((p) => p === "pink")).toHaveLength(L - 21);
      // ranges agree with phaseForDay and tile 1..L
      const covered = [r.yellow, r.pink, r.green, r.red].filter(Boolean) as [number, number][];
      expect(covered[0][0]).toBe(1);
      expect(covered[covered.length - 1][1]).toBe(L);
      for (let i = 1; i < covered.length; i++) expect(covered[i][0]).toBe(covered[i - 1][1] + 1);
    });
  }
});

describe("backward calculation from the expected bleeding", () => {
  it("red is the 7 days before, green the 7 before red (28)", () => {
    const start = "2026-03-01";
    const at = (d: number) => cycleStateOn([start], addDays(start, d - 1), 28)!;
    expect(at(1).phase).toBe("yellow");
    expect(at(7).phase).toBe("yellow");
    expect(at(8).phase).toBe("pink");
    expect(at(14).phase).toBe("pink");
    expect(at(15).phase).toBe("green");
    expect(at(21).phase).toBe("green");
    expect(at(22).phase).toBe("red");
    expect(at(28).phase).toBe("red");
    expect(at(1).expectedBleeding).toBe("2026-03-29");
  });

  it("long cycle (35) only stretches pink; green/red keep their distance to the bleeding", () => {
    const start = "2026-01-10";
    const s = (d: number) => cycleStateOn([start], addDays(start, d - 1), 35)!;
    expect(s(21).phase).toBe("pink");
    expect(s(22).phase).toBe("green");
    expect(s(28).phase).toBe("green");
    expect(s(29).phase).toBe("red");
    expect(diffDays(addDays(start, 28), s(1).expectedBleeding)).toBe(7);
  });
});

describe("late bleeding", () => {
  it("stays red until a new entry", () => {
    const start = "2026-05-01";
    for (const late of [28, 29, 35, 60, 120]) {
      const s = cycleStateOn([start], addDays(start, late), 28)!;
      expect(s.phase).toBe("red");
      expect(s.late).toBe(late >= 28);
    }
    const next = addDays(start, 33);
    const s = cycleStateOn([start, next], addDays(next, 1), 28)!;
    expect(s.phase).toBe("yellow");
    expect(s.cycleDay).toBe(2);
  });

  it("returns null before the first entry", () => {
    expect(cycleStateOn(["2026-05-01"], "2026-04-30", 28)).toBeNull();
    expect(cycleStateOn([], "2026-04-30", 28)).toBeNull();
  });
});

describe("learning", () => {
  it("uses the usual length until there is an interval", () => {
    expect(learnedCycleLength(["2026-01-01"], 31)).toBe(31);
    expect(learnedCycleLength([], 28)).toBe(28);
  });

  it("averages the last up to 6 intervals", () => {
    // intervals: 40, 40, 26, 28, 30, 26, 28, 30 -> last 6 = 26,28,30,26,28,30 -> 28
    const gaps = [40, 40, 26, 28, 30, 26, 28, 30];
    const entries = ["2025-01-01"];
    for (const g of gaps) entries.push(addDays(entries[entries.length - 1], g));
    expect(learnedCycleLength(entries, 35)).toBe(28);
    expect(learnedCycleLength(entries.slice(0, 3), 28)).toBe(40);
    expect(learnedCycleLength(entries.slice(0, 4), 28)).toBe(35); // (40+40+26)/3 = 35.3
  });

  it("every entry improves the forecast", () => {
    const entries = ["2026-01-01", "2026-02-02"]; // 32
    expect(cycleStateOn(entries, "2026-02-03", 28)!.cycleLength).toBe(32);
    expect(cycleStateOn(entries, "2026-02-03", 28)!.expectedBleeding).toBe("2026-03-06");
  });

  it("ignores implausible intervals (a missed entry)", () => {
    expect(learnedCycleLength(["2026-01-01", "2026-01-29", "2026-03-26"], 28)).toBe(28); // 28, 56
  });

  it("only learns from entries known at that date", () => {
    const entries = ["2026-01-01", "2026-01-23", "2026-02-14"]; // 22, 22
    expect(cycleStateOn(entries, "2026-01-10", 30)!.cycleLength).toBe(30);
    expect(cycleStateOn(entries, "2026-02-15", 30)!.cycleLength).toBe(22);
  });

  it("clamps to 21..45", () => {
    expect(learnedCycleLength(["2026-01-01"], 10)).toBe(21);
    expect(learnedCycleLength(["2026-01-01"], 99)).toBe(45);
  });
});

describe("addBleeding", () => {
  it("adds, sorts and dedupes", () => {
    expect(addBleeding(["2026-02-01"], "2026-01-01")).toEqual(["2026-01-01", "2026-02-01"]);
    expect(addBleeding(["2026-01-01"], "2026-01-01")).toEqual(["2026-01-01"]);
  });
  it("a second tap within 14 days corrects the entry instead of starting a cycle", () => {
    expect(addBleeding(["2026-01-01", "2026-01-29"], "2026-01-31")).toEqual(["2026-01-01", "2026-01-31"]);
  });
  it("keeps the newest entries only", () => {
    let e: string[] = [];
    for (let i = 0; i < 20; i++) e = addBleeding(e, addDays("2024-01-01", i * 28));
    expect(e).toHaveLength(13);
    expect(e[e.length - 1]).toBe(addDays("2024-01-01", 19 * 28));
  });
});

describe("month, year and leap-year boundaries", () => {
  it("month change", () => {
    const s = cycleStateOn(["2026-01-25"], "2026-02-01", 28)!;
    expect(s.cycleDay).toBe(8);
    expect(s.phase).toBe("pink");
  });
  it("year change", () => {
    const s = cycleStateOn(["2026-12-20"], "2027-01-10", 28)!;
    expect(s.cycleDay).toBe(22);
    expect(s.phase).toBe("red");
    expect(s.expectedBleeding).toBe("2027-01-17");
  });
  it("leap year: 29 February counts as a day", () => {
    const s = cycleStateOn(["2028-02-20"], "2028-03-01", 28)!;
    expect(s.cycleDay).toBe(11);
    expect(s.expectedBleeding).toBe("2028-03-19");
    const n = cycleStateOn(["2027-02-20"], "2027-03-01", 28)!;
    expect(n.cycleDay).toBe(10);
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2100-02-28", 1)).toBe("2100-03-01");
  });
  it("DST change does not shift the cycle day", () => {
    expect(cycleStateOn(["2026-03-20"], "2026-04-02", 28)!.cycleDay).toBe(14);
    expect(cycleStateOn(["2026-10-20"], "2026-11-02", 28)!.cycleDay).toBe(14);
  });
});
