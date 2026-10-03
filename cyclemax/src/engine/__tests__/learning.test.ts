import { addDays } from '../dates';
import {
  addPeriodStart,
  lastPeriodStart,
  learnedCycleLength,
  loggedCycleLengths,
  normalizeStarts,
  replaceLastPeriodStart,
} from '../learning';

function startsFromGaps(first: string, gaps: number[]): string[] {
  const starts = [first];
  for (const gap of gaps) starts.push(addDays(starts[starts.length - 1]!, gap));
  return starts;
}

describe('learning', () => {
  it('needs at least one complete logged cycle', () => {
    expect(learnedCycleLength([])).toBeNull();
    expect(learnedCycleLength(['2026-01-01'])).toBeNull();
  });

  it('averages the last up to 6 cycles', () => {
    const starts = startsFromGaps('2025-01-01', [40, 26, 28, 29, 27, 31, 30]);
    expect(loggedCycleLengths(starts)).toEqual([40, 26, 28, 29, 27, 31, 30]);
    // last six: 26 28 29 27 31 30 → 28.5 → 29
    expect(learnedCycleLength(starts)).toEqual({ value: 29, sampleSize: 6 });
    expect(learnedCycleLength(startsFromGaps('2025-01-01', [30, 32]))).toEqual({ value: 31, sampleSize: 2 });
  });

  it('ignores gaps that are really a forgotten entry', () => {
    expect(learnedCycleLength(startsFromGaps('2025-01-01', [28, 56, 29]))).toEqual({ value: 29, sampleSize: 2 });
    expect(learnedCycleLength(startsFromGaps('2025-01-01', [60]))).toBeNull();
  });

  it('clamps the learned value to 21–40', () => {
    expect(learnedCycleLength(startsFromGaps('2025-01-01', [19, 19]))?.value).toBe(21);
    expect(learnedCycleLength(startsFromGaps('2025-01-01', [44, 44]))?.value).toBe(40);
  });

  it('adds new periods and treats close entries as a correction', () => {
    let starts = addPeriodStart([], '2026-01-01');
    starts = addPeriodStart(starts, '2026-01-29');
    expect(starts).toEqual(['2026-01-01', '2026-01-29']);
    // Logged one day too late → corrected, not a 1-day cycle.
    starts = addPeriodStart(starts, '2026-01-28');
    expect(starts).toEqual(['2026-01-01', '2026-01-28']);
    starts = addPeriodStart(starts, 'not-a-date');
    expect(starts).toEqual(['2026-01-01', '2026-01-28']);
    expect(lastPeriodStart(starts)).toBe('2026-01-28');
  });

  it('keeps a bounded, sorted history', () => {
    let starts: string[] = [];
    for (let i = 0; i < 20; i++) starts = addPeriodStart(starts, addDays('2024-01-01', i * 28));
    expect(starts).toHaveLength(13);
    expect(starts).toEqual(normalizeStarts(starts));
    expect(lastPeriodStart(starts)).toBe(addDays('2024-01-01', 19 * 28));
  });

  it('replaces the most recent start when edited', () => {
    expect(replaceLastPeriodStart(['2026-01-01', '2026-01-29'], '2026-02-02')).toEqual(['2026-01-01', '2026-02-02']);
    expect(replaceLastPeriodStart([], '2026-02-02')).toEqual(['2026-02-02']);
    expect(lastPeriodStart([])).toBeNull();
  });
});
