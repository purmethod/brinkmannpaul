// Cycle engine: the man only enters the first day of bleeding. Phases are computed
// BACKWARDS from the next expected bleeding (the post-ovulation part is the most stable).
//
//   yellow · Kümmern  day 1–7
//   pink   · Spielen  day 8 until green starts (variable; empty for 21-day cycles)
//   green  · Nähe     the 7 days before red
//   red    · Leiser   the 7 days before the expected bleeding – stays until a new entry
import type { Phase } from "@shared/types";
import { addDays, diffDays, type DateStr } from "./dates";

export const DEFAULT_CYCLE_LENGTH = 28;
export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 45;
/** Intervals outside this window are treated as missed/erroneous entries and ignored for learning. */
export const MIN_VALID_INTERVAL = 18;
export const MAX_VALID_INTERVAL = 50;
/** Learning window: mean of the last up to 6 intervals. */
export const LEARN_WINDOW = 6;
/** An entry closer than this to an existing one corrects it instead of starting a new cycle. */
export const MERGE_WINDOW_DAYS = 14;
export const MAX_STORED_ENTRIES = 13;

export const PHASE_LENGTH = 7;

export function clampCycleLength(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_CYCLE_LENGTH;
  return Math.min(MAX_CYCLE_LENGTH, Math.max(MIN_CYCLE_LENGTH, Math.round(n)));
}

export function sortEntries(entries: DateStr[]): DateStr[] {
  return [...new Set(entries)].sort();
}

/**
 * Add a bleeding start. If it lies within MERGE_WINDOW_DAYS of an existing entry,
 * it replaces that entry (double tap / correction via the wheel). Keeps the newest entries.
 */
export function addBleeding(entries: DateStr[], date: DateStr): DateStr[] {
  const sorted = sortEntries(entries);
  const near = sorted.findIndex((e) => Math.abs(diffDays(e, date)) < MERGE_WINDOW_DAYS);
  if (near >= 0) sorted.splice(near, 1);
  return sortEntries([...sorted, date]).slice(-MAX_STORED_ENTRIES);
}

/** Learned cycle length: mean of the last up to 6 valid intervals, else the usual length. */
export function learnedCycleLength(entries: DateStr[], usualLength = DEFAULT_CYCLE_LENGTH): number {
  const sorted = sortEntries(entries);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const d = diffDays(sorted[i - 1], sorted[i]);
    if (d >= MIN_VALID_INTERVAL && d <= MAX_VALID_INTERVAL) intervals.push(d);
  }
  const recent = intervals.slice(-LEARN_WINDOW);
  if (recent.length === 0) return clampCycleLength(usualLength);
  return clampCycleLength(recent.reduce((a, b) => a + b, 0) / recent.length);
}

export interface PhaseRanges {
  /** Inclusive cycle-day ranges. `pink` is null when empty (21-day cycle). */
  yellow: [number, number];
  pink: [number, number] | null;
  green: [number, number];
  red: [number, number];
}

export function phaseRanges(cycleLength: number): PhaseRanges {
  const L = clampCycleLength(cycleLength);
  const redStart = L - PHASE_LENGTH + 1;
  const greenStart = redStart - PHASE_LENGTH;
  const pinkStart = PHASE_LENGTH + 1;
  return {
    yellow: [1, PHASE_LENGTH],
    pink: greenStart > pinkStart ? [pinkStart, greenStart - 1] : null,
    green: [greenStart, redStart - 1],
    red: [redStart, L],
  };
}

/** Phase for a 1-based cycle day. Days beyond the cycle length stay red (late bleeding). */
export function phaseForDay(cycleDay: number, cycleLength: number): Phase {
  const r = phaseRanges(cycleLength);
  if (cycleDay < 1) throw new Error("cycleDay must be >= 1");
  if (cycleDay <= r.yellow[1]) return "yellow";
  if (r.pink && cycleDay <= r.pink[1]) return "pink";
  if (cycleDay <= r.green[1]) return "green";
  return "red";
}

export interface CycleState {
  phase: Phase;
  cycleDay: number;
  cycleLength: number;
  lastBleeding: DateStr;
  expectedBleeding: DateStr;
  /** True when the expected bleeding date has passed without a new entry. */
  late: boolean;
}

/** Cycle state on `date`, or null if there is no entry on/before that date. */
export function cycleStateOn(entries: DateStr[], date: DateStr, usualLength = DEFAULT_CYCLE_LENGTH): CycleState | null {
  const sorted = sortEntries(entries);
  const past = sorted.filter((e) => e <= date);
  if (past.length === 0) return null;
  const last = past[past.length - 1];
  // Learn only from entries known at that date.
  const cycleLength = learnedCycleLength(past, usualLength);
  const cycleDay = diffDays(last, date) + 1;
  return {
    phase: phaseForDay(cycleDay, cycleLength),
    cycleDay,
    cycleLength,
    lastBleeding: last,
    expectedBleeding: addDays(last, cycleLength),
    late: cycleDay > cycleLength,
  };
}
