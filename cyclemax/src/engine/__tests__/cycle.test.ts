import { addDays } from '../dates';
import { clampCycleLength, clampPeriodLength, getCycleStatus, getPhaseSegments, ovulationDay } from '../cycle';
import { CYCLE_LENGTH, PERIOD_LENGTH, PHASE_ORDER, type PhaseId } from '../types';

const ALL_CYCLES = Array.from({ length: CYCLE_LENGTH.max - CYCLE_LENGTH.min + 1 }, (_, i) => CYCLE_LENGTH.min + i);
const ALL_PERIODS = Array.from({ length: PERIOD_LENGTH.max - PERIOD_LENGTH.min + 1 }, (_, i) => PERIOD_LENGTH.min + i);

describe('getPhaseSegments', () => {
  it.each([
    [
      28,
      5,
      [
        [1, 5],
        [6, 11],
        [12, 23],
        [24, 28],
      ],
    ],
    [
      21,
      3,
      [
        [1, 3],
        [4, 4],
        [5, 16],
        [17, 21],
      ],
    ],
    [
      21,
      8,
      [
        [1, 8],
        [9, 9],
        [10, 16],
        [17, 21],
      ],
    ],
    [
      35,
      5,
      [
        [1, 5],
        [6, 18],
        [19, 30],
        [31, 35],
      ],
    ],
    [
      40,
      8,
      [
        [1, 8],
        [9, 23],
        [24, 35],
        [36, 40],
      ],
    ],
    [
      40,
      3,
      [
        [1, 3],
        [4, 23],
        [24, 35],
        [36, 40],
      ],
    ],
  ])('cycle %i / period %i', (cycle, period, expected) => {
    const segments = getPhaseSegments(cycle, period);
    expect(segments.map((s) => s.phase)).toEqual(PHASE_ORDER);
    expect(segments.map((s) => [s.startDay, s.endDay])).toEqual(expected);
  });

  it('splits every cycle 21–40 with period 3–8 into 4 gap-free, non-overlapping phases', () => {
    for (const L of ALL_CYCLES) {
      for (const P of ALL_PERIODS) {
        const segments = getPhaseSegments(L, P);
        expect(segments).toHaveLength(4);
        expect(segments[0]!.startDay).toBe(1);
        expect(segments[3]!.endDay).toBe(L);
        for (let i = 0; i < 4; i++) {
          const s = segments[i]!;
          expect(s.length).toBeGreaterThanOrEqual(1);
          expect(s.length).toBe(s.endDay - s.startDay + 1);
          if (i > 0) expect(s.startDay).toBe(segments[i - 1]!.endDay + 1);
        }
        expect(segments.reduce((sum, s) => sum + s.length, 0)).toBe(L);
        // Ruhe is exactly the period, Brandung exactly the last 5 days.
        expect(segments[0]!.length).toBe(P);
        expect(segments[3]!.startDay).toBe(L - 4);
        // Hochphase ends 6 days before the next period (day L + 1).
        expect(segments[2]!.endDay).toBe(L + 1 - 6);
        // Where the period does not collide with it, the ovulation window is exact.
        if (ovulationDay(L) - 2 >= P + 2) {
          expect(segments[1]!.endDay).toBe(ovulationDay(L) - 3);
          expect(segments[2]!.startDay).toBe(ovulationDay(L) - 2);
        }
      }
    }
  });

  it('clamps out-of-range input', () => {
    expect(clampCycleLength(50)).toBe(40);
    expect(clampCycleLength(10)).toBe(21);
    expect(clampCycleLength(Number.NaN)).toBe(28);
    expect(clampPeriodLength(1)).toBe(3);
    expect(clampPeriodLength(12)).toBe(8);
    expect(getPhaseSegments(99, 99)).toEqual(getPhaseSegments(40, 8));
  });
});

describe('getCycleStatus', () => {
  const base = { lastPeriodStart: '2026-01-01', cycleLength: 28, periodLength: 5 };

  it('assigns exactly one phase to every day, including days before the logged start', () => {
    for (const L of [21, 28, 35, 40]) {
      for (const P of ALL_PERIODS) {
        const input = { lastPeriodStart: '2026-03-10', cycleLength: L, periodLength: P };
        const segments = getPhaseSegments(L, P);
        const expectedFor = (day: number): PhaseId => segments.find((s) => day >= s.startDay && day <= s.endDay)!.phase;
        // Two cycles before the start up to the last day before the next period.
        for (let offset = -2 * L; offset < L; offset++) {
          const status = getCycleStatus(input, addDays(input.lastPeriodStart, offset));
          const day = (((offset % L) + L) % L) + 1;
          expect(status.cycleDay).toBe(day);
          expect(status.phase).toBe(expectedFor(day));
          expect(status.isLate).toBe(false);
          expect(status.dayInPhase).toBeGreaterThanOrEqual(1);
          expect(status.dayInPhase).toBeLessThanOrEqual(status.phaseLength);
        }
      }
    }
  });

  it('reports day X of Y and the next period', () => {
    const s = getCycleStatus(base, '2026-01-24');
    expect(s).toMatchObject({
      phase: 'brandung',
      cycleDay: 24,
      cycleLength: 28,
      dayInPhase: 1,
      phaseLength: 5,
      cycleStart: '2026-01-01',
      nextPeriodStart: '2026-01-29',
      isPeriodDay: false,
      mode: 'natural',
    });
  });

  it('handles a leap day inside the cycle', () => {
    const input = { lastPeriodStart: '2024-02-26', cycleLength: 28, periodLength: 5 };
    expect(getCycleStatus(input, '2024-02-29').cycleDay).toBe(4);
    expect(getCycleStatus(input, '2024-03-01')).toMatchObject({ cycleDay: 5, phase: 'ruhe' });
    expect(getCycleStatus(input, '2024-03-02')).toMatchObject({ cycleDay: 6, phase: 'aufwind' });
    expect(getCycleStatus(input, '2024-02-26').nextPeriodStart).toBe('2024-03-25');
  });

  it('handles month and year changes', () => {
    const jan = { lastPeriodStart: '2025-01-30', cycleLength: 28, periodLength: 5 };
    expect(getCycleStatus(jan, '2025-02-02')).toMatchObject({ cycleDay: 4, phase: 'ruhe' });
    expect(getCycleStatus(jan, '2025-02-03')).toMatchObject({ cycleDay: 5, phase: 'ruhe' });
    expect(getCycleStatus(jan, '2025-02-04')).toMatchObject({ cycleDay: 6, phase: 'aufwind' });
    const dec = { lastPeriodStart: '2025-12-20', cycleLength: 35, periodLength: 6 };
    expect(getCycleStatus(dec, '2026-01-07')).toMatchObject({ cycleDay: 19, phase: 'hochphase' });
    expect(getCycleStatus(dec, '2026-01-20').nextPeriodStart).toBe('2026-01-24');
  });

  it('stays in Brandung while the period is late', () => {
    expect(getCycleStatus(base, '2026-01-28')).toMatchObject({ phase: 'brandung', isLate: false, cycleDay: 28 });
    expect(getCycleStatus(base, '2026-01-29')).toMatchObject({
      phase: 'brandung',
      isLate: true,
      daysLate: 1,
      cycleDay: 29,
      dayInPhase: 6,
      cycleStart: '2026-01-01',
    });
    const muchLater = getCycleStatus(base, '2026-03-15');
    expect(muchLater).toMatchObject({ phase: 'brandung', isLate: true, daysLate: 46, cycleDay: 74 });
  });

  it('projects backwards for dates before the logged start', () => {
    expect(getCycleStatus(base, '2025-12-31')).toMatchObject({
      cycleDay: 28,
      phase: 'brandung',
      cycleIndex: -1,
      cycleStart: '2025-12-04',
      nextPeriodStart: '2026-01-01',
    });
    expect(getCycleStatus(base, '2025-12-04')).toMatchObject({ cycleDay: 1, phase: 'ruhe' });
  });

  it('only shows period days with hormonal contraception', () => {
    const input = { ...base, hormonalContraception: true };
    const period = getCycleStatus(input, '2026-01-03');
    expect(period).toMatchObject({ mode: 'periodOnly', isPeriodDay: true, cycleDay: 3 });
    const other = getCycleStatus(input, '2026-01-15');
    expect(other).toMatchObject({ mode: 'periodOnly', isPeriodDay: false, cycleDay: 15 });
    expect(getCycleStatus(base, '2026-01-15').mode).toBe('natural');
  });
});
