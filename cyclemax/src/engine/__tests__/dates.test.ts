import { addDays, atLocalTime, diffDays, fromDayNumber, isISODate, toDayNumber, toISODate } from '../dates';

describe('dates', () => {
  it('validates ISO dates including leap days', () => {
    expect(isISODate('2024-02-29')).toBe(true);
    expect(isISODate('2025-02-29')).toBe(false);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('2026-1-01')).toBe(false);
    expect(isISODate(20260101)).toBe(false);
  });

  it('adds days across month, year and leap-year boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
    expect(addDays('2025-01-31', 1)).toBe('2025-02-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not affected by daylight saving time', () => {
    expect(diffDays('2026-03-30', '2026-03-28')).toBe(2);
    expect(diffDays('2026-10-26', '2026-10-24')).toBe(2);
    expect(atLocalTime('2026-03-29', 8, 0).getHours()).toBe(8);
    expect(toISODate(atLocalTime('2026-10-25', 8, 30))).toBe('2026-10-25');
  });

  it('round-trips day numbers', () => {
    for (const iso of ['1999-12-31', '2024-02-29', '2026-10-03']) {
      expect(fromDayNumber(toDayNumber(iso))).toBe(iso);
    }
    expect(() => toDayNumber('2026-02-30')).toThrow(RangeError);
  });

  it('reads the local calendar day, not the UTC one', () => {
    // 00:30 in Berlin on 4 Oct is still 3 Oct in UTC.
    const justAfterMidnight = new Date(2026, 9, 4, 0, 30);
    expect(justAfterMidnight.toISOString()).toBe('2026-10-03T22:30:00.000Z');
    expect(toISODate(justAfterMidnight)).toBe('2026-10-04');
  });
});
