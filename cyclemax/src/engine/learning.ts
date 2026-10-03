import { addDays, diffDays, isISODate, type ISODate } from './dates';
import { clampCycleLength } from './cycle';

export const LEARNING = {
  /** Average over the last up to 6 logged cycles. */
  maxCycles: 6,
  /** Gaps outside this window are treated as a forgotten entry, not as a real cycle. */
  minValidGap: 18,
  maxValidGap: 45,
  /** Two starts closer than this are the same period → the newer entry corrects the older one. */
  correctionWindow: 14,
  /** History kept on the device (enough for learning plus a little margin). */
  keep: 13,
} as const;

/** Sorted, de-duplicated and validated copy of the logged period starts. */
export function normalizeStarts(starts: readonly ISODate[]): ISODate[] {
  return Array.from(new Set(starts.filter(isISODate))).sort();
}

export function lastPeriodStart(starts: readonly ISODate[]): ISODate | null {
  const sorted = normalizeStarts(starts);
  return sorted[sorted.length - 1] ?? null;
}

/**
 * Adds a period start. An existing entry within ±14 days is the same period and gets replaced
 * (a correction), so a mis-tap never creates a 3-day "cycle".
 */
export function addPeriodStart(starts: readonly ISODate[], date: ISODate): ISODate[] {
  if (!isISODate(date)) return normalizeStarts(starts);
  const kept = normalizeStarts(starts).filter((s) => Math.abs(diffDays(s, date)) > LEARNING.correctionWindow);
  return normalizeStarts([...kept, date]).slice(-LEARNING.keep);
}

/** Replaces the most recent start (used when the date is edited in Settings). */
export function replaceLastPeriodStart(starts: readonly ISODate[], date: ISODate): ISODate[] {
  const sorted = normalizeStarts(starts);
  return addPeriodStart(sorted.slice(0, -1), date);
}

/** Lengths of the logged cycles (gaps between consecutive starts), oldest first. */
export function loggedCycleLengths(starts: readonly ISODate[]): number[] {
  const sorted = normalizeStarts(starts);
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    lengths.push(diffDays(sorted[i]!, sorted[i - 1]!));
  }
  return lengths;
}

/**
 * Learned cycle length: rounded mean of the last up to 6 valid logged cycles, clamped to 21–40.
 * Returns null while no complete cycle has been logged.
 */
export function learnedCycleLength(starts: readonly ISODate[]): { value: number; sampleSize: number } | null {
  const valid = loggedCycleLengths(starts)
    .filter((n) => n >= LEARNING.minValidGap && n <= LEARNING.maxValidGap)
    .slice(-LEARNING.maxCycles);
  if (valid.length === 0) return null;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  return { value: clampCycleLength(mean), sampleSize: valid.length };
}

/** Earliest date the picker should allow for "erster Tag ihrer letzten Periode". */
export function earliestSelectableStart(today: ISODate): ISODate {
  return addDays(today, -90);
}
