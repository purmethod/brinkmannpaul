// Daily line selection: fitting category, weighted by ratings, never the same line
// within 60 days. Deterministic per device + date so app and notification agree.
import type { Line, LineCategory, Mode, Phase } from "@shared/types";
import { addDays, diffDays, type DateStr } from "./dates";

export const NO_REPEAT_DAYS = 60;
/** Phase-specific lines are preferred over general ones on matching days. */
const CATEGORY_BONUS = 1.5;

/** date -> line id. Persisted on the device. */
export type LineHistory = Record<DateStr, string>;

export function categoryFor(mode: Mode, phase: Phase | null): LineCategory | null {
  if (mode === "single") return "single";
  return phase;
}

/** Small deterministic PRNG (mulberry32) seeded from a string. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function eligible(lines: Line[], category: LineCategory | null): Line[] {
  return lines.filter(
    (l) => (l.weight ?? 1) > 0 && (l.category === "any" || (category !== null && l.category === category)),
  );
}

/** Ids used within NO_REPEAT_DAYS of `date` (both directions, since future days may be planned). */
export function blockedIds(history: LineHistory, date: DateStr): Set<string> {
  const out = new Set<string>();
  for (const [d, id] of Object.entries(history)) {
    if (d !== date && Math.abs(diffDays(d, date)) < NO_REPEAT_DAYS) out.add(id);
  }
  return out;
}

export function pickLine(
  lines: Line[],
  category: LineCategory | null,
  history: LineHistory,
  date: DateStr,
  seed: string,
): Line | null {
  const pool = eligible(lines, category);
  if (pool.length === 0) return null;
  const blocked = blockedIds(history, date);
  const fresh = pool.filter((l) => !blocked.has(l.id));
  if (fresh.length === 0) {
    // Pool exhausted (tiny catalog): least recently used line.
    const lastUse = new Map<string, number>();
    for (const [d, id] of Object.entries(history)) {
      const dist = Math.abs(diffDays(d, date));
      lastUse.set(id, Math.min(lastUse.get(id) ?? Infinity, dist));
    }
    return [...pool].sort((a, b) => (lastUse.get(b.id) ?? Infinity) - (lastUse.get(a.id) ?? Infinity))[0];
  }
  const weights = fresh.map((l) => (l.weight ?? 1) * (l.category !== "any" ? CATEGORY_BONUS : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = seededRandom(`${seed}:${date}`)() * total;
  for (let i = 0; i < fresh.length; i++) {
    r -= weights[i];
    if (r < 0) return fresh[i];
  }
  return fresh[fresh.length - 1];
}

/** Remove history older than the no-repeat window (keeps storage small). */
export function pruneHistory(history: LineHistory, today: DateStr): LineHistory {
  const cutoff = addDays(today, -NO_REPEAT_DAYS);
  return Object.fromEntries(Object.entries(history).filter(([d]) => d >= cutoff));
}
