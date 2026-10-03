import { simulate } from '@/test-utils/simulate';

import { addDays, diffDays } from '../dates';
import {
  DEFAULT_GESTURE_INTERVALS,
  dueGestures,
  gestureDueDate,
  GESTURE_ORDER,
  lastAnyGesture,
  planGestureReminder,
  weeksSince,
  type GestureLogs,
} from '../gestures';

const cycle = { lastPeriodStart: '2026-03-01', cycleLength: 28, periodLength: 5 };
// Phases: Ruhe 03-01…03-05 · Aufwind 03-06…03-11 · Hochphase 03-12…03-23 · Brandung 03-24…03-28

function logs(lastByGesture: Partial<Record<string, string>>): GestureLogs {
  return Object.fromEntries(
    GESTURE_ORDER.map((id) => [id, { last: lastByGesture[id] ?? null, previous: null }]),
  ) as unknown as GestureLogs;
}

const fresh = '2026-03-01';
const allFresh = logs({ flowers: fresh, date: fresh, letter: fresh, surprise: fresh, time: fresh });

describe('gesture intervals', () => {
  it('computes due dates from the last gesture or the install date', () => {
    expect(gestureDueDate({ last: '2026-01-01', previous: null }, 8, '2025-06-01')).toBe('2026-02-26');
    expect(gestureDueDate({ last: null, previous: null }, 3, '2026-03-01')).toBe('2026-03-22');
  });

  it('uses the defaults flowers 8 and date 3 weeks', () => {
    expect(DEFAULT_GESTURE_INTERVALS.flowers).toBe(8);
    expect(DEFAULT_GESTURE_INTERVALS.date).toBe(3);
  });

  it('lists due gestures, most overdue first', () => {
    const l = logs({ flowers: '2026-01-01', date: '2026-02-01', letter: fresh, surprise: fresh, time: '2026-02-20' });
    // flowers due 02-26, date due 02-22, time due 03-06
    expect(dueGestures(l, DEFAULT_GESTURE_INTERVALS, fresh, '2026-03-01')).toEqual(['date', 'flowers']);
    expect(dueGestures(l, DEFAULT_GESTURE_INTERVALS, fresh, '2026-03-06')).toEqual(['date', 'flowers', 'time']);
    expect(dueGestures(l, { ...DEFAULT_GESTURE_INTERVALS, flowers: 12 }, fresh, '2026-03-01')).toEqual(['date']);
  });

  it('reports weeks since the last gesture', () => {
    expect(weeksSince(null, '2026-03-01')).toBeNull();
    expect(weeksSince('2026-03-01', '2026-03-07')).toBe(0);
    expect(weeksSince('2026-01-01', '2026-03-05')).toBe(9);
    expect(lastAnyGesture(logs({ date: '2026-02-01', time: '2026-02-20' }))).toBe('2026-02-20');
  });
});

describe('planGestureReminder', () => {
  const base = {
    cycle,
    intervals: DEFAULT_GESTURE_INTERVALS,
    installedAt: '2026-02-20',
    lastReminder: null,
    firstEligibleDate: '2026-03-02',
  };

  it('moves an overdue reminder into Aufwind, avoiding the phase-push day', () => {
    const l = logs({ flowers: '2026-01-01', date: fresh, letter: fresh, surprise: fresh, time: fresh });
    expect(planGestureReminder({ ...base, logs: l })).toEqual({ date: '2026-03-07', gesture: 'flowers' });
  });

  it('waits for the gesture to become due', () => {
    const l = logs({ date: '2026-02-21', flowers: fresh, letter: fresh, surprise: fresh, time: fresh });
    // date due 03-14 (Hochphase, not a phase start) → that very day.
    expect(planGestureReminder({ ...base, logs: l })).toEqual({ date: '2026-03-14', gesture: 'date' });
  });

  it('keeps 30 days between two extra pushes', () => {
    const l = logs({ flowers: '2026-01-01', date: fresh, letter: fresh, surprise: fresh, time: fresh });
    expect(planGestureReminder({ ...base, logs: l, lastReminder: '2026-02-20' })).toEqual({
      date: '2026-03-22',
      gesture: 'flowers',
    });
  });

  it('falls back to the first due day when no good phase is within reach', () => {
    const l = logs({ flowers: '2026-01-01', date: fresh, letter: fresh, surprise: fresh, time: fresh });
    // Eligible from 03-27 (Brandung), afterwards the period is late → Brandung stays.
    expect(planGestureReminder({ ...base, logs: l, lastReminder: '2026-02-25' })).toEqual({
      date: '2026-03-27',
      gesture: 'flowers',
    });
  });

  it('prefers days outside the period with hormonal contraception', () => {
    const l = logs({ flowers: '2026-01-01', date: fresh, letter: fresh, surprise: fresh, time: fresh });
    const reminder = planGestureReminder({ ...base, cycle: { ...cycle, hormonalContraception: true }, logs: l });
    expect(reminder).toEqual({ date: '2026-03-06', gesture: 'flowers' });
  });

  it('returns nothing when nothing becomes due within the search window', () => {
    const intervals = { flowers: 16, date: 16, letter: 16, surprise: 16, time: 16 };
    expect(planGestureReminder({ ...base, logs: allFresh, intervals, firstEligibleDate: '2026-03-02' })).toEqual({
      date: addDays(fresh, 112),
      gesture: 'flowers',
    });
    expect(
      planGestureReminder({
        ...base,
        logs: logs({
          flowers: '2026-03-02',
          date: '2026-03-02',
          letter: '2026-03-02',
          surprise: '2026-03-02',
          time: '2026-03-02',
        }),
        intervals,
        firstEligibleDate: '2025-11-01',
      }),
    ).toBeNull();
  });
});

describe('extra gesture push over a year', () => {
  it('sends at most one extra push per 30 days, preferably in Aufwind or Hochphase', () => {
    const starts = Array.from({ length: 15 }, (_, k) => addDays('2026-03-01', k * 28));
    const { fired } = simulate({
      from: '2026-02-20',
      days: 400,
      initialStart: '2026-02-01',
      cycleLength: 28,
      periodLength: 5,
      realStarts: starts,
      openHours: [7, 12, 21],
      installedAt: '2026-01-01',
    });
    const reminders = fired.filter((f) => f.kind === 'gesture');
    expect(reminders.length).toBeGreaterThanOrEqual(10);
    expect(new Set(reminders.map((r) => r.id)).size).toBe(reminders.length);
    for (let i = 1; i < reminders.length; i++) {
      expect(diffDays(reminders[i]!.date, reminders[i - 1]!.date)).toBeGreaterThanOrEqual(30);
    }
    // Never on the same day as a phase push.
    const phaseDays = new Set(fired.filter((f) => f.kind === 'phase').map((f) => f.date));
    for (const r of reminders) expect(phaseDays.has(r.date)).toBe(false);
  });
});
