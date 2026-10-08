import { describe, expect, it } from "vitest";
import { SEED_LINES } from "@shared/knowledge.generated";
import { PHASE_PUSH_TEXT } from "@shared/texts";
import type { Line } from "@shared/types";
import { addDays, atLocalTime, diffDays, localDate } from "./dates";
import { NO_REPEAT_DAYS, pickLine, type LineHistory } from "./lines";
import { phasePushOn, planNotifications, type PlanInput } from "./notifications";

const base = (over: Partial<PlanInput> = {}): PlanInput => ({
  today: "2026-03-01",
  now: atLocalTime("2026-03-01", "06:00"),
  mode: "relationship",
  entries: ["2026-03-01"],
  usualLength: 28,
  dailyTime: "07:30",
  lines: SEED_LINES,
  history: {},
  seed: "device-a",
  neutral: false,
  ...over,
});

describe("phase pushes", () => {
  it("fire on the right cycle days (28)", () => {
    const start = "2026-03-01";
    const keys: Record<number, string> = {};
    for (let d = 1; d <= 28; d++) {
      const k = phasePushOn([start], addDays(start, d - 1), 28);
      if (k) keys[d] = k;
    }
    // pink day 8, green day 15, red7 day 22 (7 days before bleeding on day 29), red2 day 27
    expect(keys).toEqual({ 8: "pink", 15: "green", 22: "red7", 27: "red2" });
  });

  it("21-day cycle has no pink push", () => {
    const keys = new Set<string>();
    for (let d = 0; d < 21; d++) {
      const k = phasePushOn(["2026-03-01"], addDays("2026-03-01", d), 21);
      if (k) keys.add(k);
    }
    expect([...keys].sort()).toEqual(["green", "red2", "red7"]);
  });

  it("while late: only the gentle nudge 3 and 10 days after the expected start", () => {
    const keys: Record<number, string> = {};
    for (let d = 28; d < 80; d++) {
      const k = phasePushOn(["2026-03-01"], addDays("2026-03-01", d), 28);
      if (k) keys[d + 1] = k;
    }
    expect(keys).toEqual({ 32: "late", 39: "late" }); // expected on cycle day 29 → 3 and 10 days later
  });

  it("red7 is exactly 7 and red2 exactly 2 days before the expected bleeding for all lengths", () => {
    for (const L of [21, 25, 28, 32, 35, 40]) {
      const start = "2026-06-15";
      const expected = addDays(start, L);
      for (let d = 0; d < L; d++) {
        const date = addDays(start, d);
        const k = phasePushOn([start], date, L);
        if (k === "red7") expect(diffDays(date, expected)).toBe(7);
        if (k === "red2") expect(diffDays(date, expected)).toBe(2);
      }
    }
  });
});

describe("planNotifications", () => {
  it("max one per day, phase push replaces the daily line", () => {
    const plan = planNotifications(base());
    const dates = plan.notifications.map((n) => n.date);
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toHaveLength(30);
    const byDate = Object.fromEntries(plan.notifications.map((n) => [n.date, n]));
    expect(byDate["2026-03-08"]).toMatchObject({ kind: "phase", key: "pink", body: PHASE_PUSH_TEXT.pink });
    expect(byDate["2026-03-15"]).toMatchObject({ kind: "phase", key: "green" });
    expect(byDate["2026-03-22"]).toMatchObject({ kind: "phase", key: "red7" });
    expect(byDate["2026-03-27"]).toMatchObject({ kind: "phase", key: "red2" });
    expect(plan.notifications.filter((n) => n.kind === "phase")).toHaveLength(4);
    expect(byDate["2026-03-09"].kind).toBe("daily");
  });

  it("schedules at the chosen local time and skips today when it has passed", () => {
    const plan = planNotifications(base({ now: atLocalTime("2026-03-01", "08:00") }));
    expect(plan.notifications[0].date).toBe("2026-03-02");
    expect(plan.notifications).toHaveLength(29);
    for (const n of plan.notifications) {
      const at = new Date(n.at);
      expect(localDate(at)).toBe(n.date);
      expect(at.getHours()).toBe(7);
      expect(at.getMinutes()).toBe(30);
    }
  });

  it("single mode: only daily lines from single/any", () => {
    const plan = planNotifications(base({ mode: "single", entries: [] }));
    expect(plan.notifications.every((n) => n.kind === "daily")).toBe(true);
    const cats = new Set(plan.notifications.map((n) => SEED_LINES.find((l) => l.id === n.key)!.category));
    for (const c of cats) expect(["single", "any"]).toContain(c);
  });

  it("daily lines match the phase of the day", () => {
    const plan = planNotifications(base());
    for (const n of plan.notifications.filter((x) => x.kind === "daily")) {
      const line = SEED_LINES.find((l) => l.id === n.key)!;
      if (line.category === "any") continue;
      const day = diffDays("2026-03-01", n.date) + 1;
      const expected = day <= 7 ? "yellow" : day <= 14 ? "pink" : day <= 21 ? "green" : "red";
      expect(line.category).toBe(expected);
    }
  });

  it("no duplicates and no repeat of a line within 60 days, across replans", () => {
    for (const mode of ["relationship", "single"] as const) {
      let history: LineHistory = {};
      // replan every day for a year, like an app start each morning
      for (let i = 0; i < 365; i++) {
        const today = addDays("2026-01-01", i);
        const plan = planNotifications(
          base({ mode, today, now: atLocalTime(today, "06:00"), entries: ["2025-12-20", "2026-01-18"], history }),
        );
        history = plan.history;
        const ids = plan.notifications.filter((n) => n.kind === "daily").map((n) => n.key);
        expect(new Set(ids).size).toBe(ids.length);
      }
      // the full history (kept by app) must never contain the same line twice within 60 days
      const all: LineHistory = {};
      let h: LineHistory = {};
      for (let i = 0; i < 200; i++) {
        const today = addDays("2026-01-01", i);
        h = planNotifications(base({ mode, today, now: atLocalTime(today, "06:00"), history: h, entries: ["2025-12-20"] })).history;
        all[today] = h[today];
      }
      const dates = Object.keys(all).sort();
      for (let a = 0; a < dates.length; a++)
        for (let b = a + 1; b < dates.length && diffDays(dates[a], dates[b]) < NO_REPEAT_DAYS; b++)
          expect(all[dates[a]], `${mode} ${dates[a]} vs ${dates[b]}`).not.toBe(all[dates[b]]);
    }
  });

  it("is stable: replanning keeps the line already assigned to a day", () => {
    const first = planNotifications(base());
    const second = planNotifications(base({ history: first.history, now: atLocalTime("2026-03-01", "07:00") }));
    expect(second.notifications.map((n) => n.key)).toEqual(first.notifications.map((n) => n.key));
  });

  it("neutral notifications show only the app name", () => {
    const plan = planNotifications(base({ neutral: true }));
    for (const n of plan.notifications) {
      expect(n.title).toBe("Cyclemax");
      expect(n.body).toBe("");
    }
  });

  it("disabled (weight 0) lines are never picked", () => {
    const lines: Line[] = SEED_LINES.map((l, i) => (i % 2 ? { ...l, weight: 0 } : l));
    const plan = planNotifications(base({ lines, mode: "single" }));
    const disabled = new Set(lines.filter((l) => l.weight === 0).map((l) => l.id));
    for (const n of plan.notifications) expect(disabled.has(n.key)).toBe(false);
  });
});

describe("pickLine", () => {
  it("prefers well rated lines", () => {
    const lines: Line[] = [
      { id: "a", text: "A", category: "any", weight: 3 },
      { id: "b", text: "B", category: "any", weight: 0.5 },
    ];
    let a = 0;
    for (let i = 0; i < 400; i++) if (pickLine(lines, null, {}, addDays("2026-01-01", i), "x")!.id === "a") a++;
    expect(a).toBeGreaterThan(300);
  });
  it("falls back to the least recently used line when the pool is exhausted", () => {
    const lines: Line[] = [
      { id: "a", text: "A", category: "any" },
      { id: "b", text: "B", category: "any" },
    ];
    const line = pickLine(lines, null, { "2026-01-01": "a", "2026-01-05": "b" }, "2026-01-06", "x");
    expect(line!.id).toBe("a");
  });
  it("seed catalog is large enough for 60 days without repeats", () => {
    const single = SEED_LINES.filter((l) => l.category === "single" || l.category === "any");
    const red = SEED_LINES.filter((l) => l.category === "red" || l.category === "any");
    expect(single.length).toBeGreaterThan(NO_REPEAT_DAYS);
    expect(red.length).toBeGreaterThan(NO_REPEAT_DAYS);
  });
});
