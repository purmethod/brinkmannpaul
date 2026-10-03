import { simulate } from '@/test-utils/simulate';

import { addDays, atLocalTime } from '../dates';
import { getPhaseSegments } from '../cycle';
import { DEFAULT_GESTURE_INTERVALS, GESTURE_ORDER, type GestureLogs } from '../gestures';
import { firstEligibleDate, planNotifications, planPhasePushes } from '../notifications';

const cycle = { lastPeriodStart: '2026-03-01', cycleLength: 28, periodLength: 5 };
const at8 = { hour: 8, minute: 0 };
const summary = (list: { date: string; kind: string; phase?: string }[]) =>
  list.map((n) => `${n.date} ${'phase' in n ? n.phase : n.kind}`);

describe('planPhasePushes', () => {
  it('plans one push on the first day of each phase plus the next period', () => {
    const pushes = planPhasePushes(cycle, atLocalTime('2026-02-28', 12, 0), at8);
    expect(summary(pushes)).toEqual([
      '2026-03-01 ruhe',
      '2026-03-06 aufwind',
      '2026-03-12 hochphase',
      '2026-03-24 brandung',
      '2026-03-29 ruhe',
    ]);
    expect(pushes.every((p) => p.hour === 8 && p.minute === 0)).toBe(true);
    expect(new Set(pushes.map((p) => p.id)).size).toBe(pushes.length);
  });

  it('skips pushes whose time has passed', () => {
    expect(summary(planPhasePushes(cycle, atLocalTime('2026-03-01', 7, 59), at8))[0]).toBe('2026-03-01 ruhe');
    expect(summary(planPhasePushes(cycle, atLocalTime('2026-03-01', 8, 0), at8))[0]).toBe('2026-03-06 aufwind');
    expect(summary(planPhasePushes(cycle, atLocalTime('2026-03-20', 12, 0), at8))).toEqual([
      '2026-03-24 brandung',
      '2026-03-29 ruhe',
    ]);
  });

  it('plans nothing while the period is late (phase stays Brandung)', () => {
    expect(planPhasePushes(cycle, atLocalTime('2026-03-29', 9, 0), at8)).toEqual([]);
    expect(planPhasePushes(cycle, atLocalTime('2026-04-10', 9, 0), at8)).toEqual([]);
  });

  it.each([21, 28, 35, 40])('hits the right days for a %i-day cycle', (L) => {
    for (const P of [3, 5, 8]) {
      const input = { lastPeriodStart: '2026-01-10', cycleLength: L, periodLength: P };
      const pushes = planPhasePushes(input, atLocalTime('2026-01-01', 0, 0), at8);
      const expected = getPhaseSegments(L, P).map((s) => `${addDays('2026-01-10', s.startDay - 1)} ${s.phase}`);
      expect(summary(pushes)).toEqual([...expected, `${addDays('2026-01-10', L)} ruhe`]);
    }
  });

  it('only announces period starts with hormonal contraception', () => {
    const pushes = planPhasePushes({ ...cycle, hormonalContraception: true }, atLocalTime('2026-02-28', 12, 0), at8);
    expect(summary(pushes)).toEqual(['2026-03-01 ruhe', '2026-03-29 ruhe']);
  });

  it('uses the chosen push time', () => {
    const pushes = planPhasePushes(cycle, atLocalTime('2026-02-28', 12, 0), { hour: 21, minute: 30 });
    expect(pushes[0]).toMatchObject({ hour: 21, minute: 30 });
    expect(firstEligibleDate(atLocalTime('2026-03-01', 21, 0), { hour: 21, minute: 30 })).toBe('2026-03-01');
    expect(firstEligibleDate(atLocalTime('2026-03-01', 21, 30), { hour: 21, minute: 30 })).toBe('2026-03-02');
  });
});

describe('push delivery over many cycles', () => {
  const regularStarts = Array.from({ length: 7 }, (_, k) => addDays('2026-03-01', k * 28));

  it.each([
    ['after the push time', 19],
    ['before the push time', 6],
  ])('delivers exactly 4 pushes per cycle when the period is logged %s', (_label, logHour) => {
    const { fired } = simulate({
      from: '2026-02-20',
      days: 6 * 28 + 9,
      initialStart: '2026-02-01',
      cycleLength: 28,
      periodLength: 5,
      realStarts: regularStarts,
      logHour,
      openHours: [7, 12, 22],
      // All gestures fresh, so no extra push interferes with the count.
      gestures: Object.fromEntries(
        GESTURE_ORDER.map((id) => [id, { last: '2027-12-31', previous: null }]),
      ) as unknown as GestureLogs,
    });
    const phasePushes = fired.filter((f) => f.kind === 'phase');
    expect(new Set(phasePushes.map((f) => f.id)).size).toBe(phasePushes.length);
    for (const start of regularStarts.slice(0, 6)) {
      const inCycle = phasePushes.filter((f) => f.date >= start && f.date < addDays(start, 28));
      expect(inCycle.map((f) => `${f.date} ${f.label}`)).toEqual([
        `${start} ruhe`,
        `${addDays(start, 5)} aufwind`,
        `${addDays(start, 11)} hochphase`,
        `${addDays(start, 23)} brandung`,
      ]);
    }
  });

  it('never fires a phase push twice with irregular cycles and frequent re-planning', () => {
    const gaps = [30, 26, 33, 28, 24, 35, 29];
    const starts = gaps.reduce<string[]>((acc, gap) => [...acc, addDays(acc[acc.length - 1]!, gap)], ['2026-03-01']);
    const { fired } = simulate({
      from: '2026-02-25',
      days: 230,
      initialStart: '2026-02-01',
      cycleLength: 28,
      periodLength: 5,
      realStarts: starts,
      openHours: [6, 8, 9, 13, 20],
    });
    const phase = fired.filter((f) => f.kind === 'phase');
    expect(new Set(phase.map((f) => f.id)).size).toBe(phase.length);
    // Per logged cycle each phase is announced at most once. Aufwind and Hochphase always start
    // before the next period; Brandung is skipped only when the period came before it.
    for (let i = 0; i < starts.length - 1; i++) {
      const inCycle = phase.filter((f) => f.date > starts[i]! && f.date < starts[i + 1]!);
      const count = (label: string) => inCycle.filter((f) => f.label === label).length;
      expect(count('aufwind')).toBe(1);
      expect(count('hochphase')).toBe(1);
      expect(count('brandung')).toBeLessThanOrEqual(1);
      expect(count('ruhe')).toBeLessThanOrEqual(1);
      if (gaps[i]! >= 30) expect(count('brandung')).toBe(1);
    }
  });
});

describe('planNotifications', () => {
  const logs = Object.fromEntries(
    GESTURE_ORDER.map((id) => [id, { last: null, previous: null }]),
  ) as unknown as GestureLogs;
  const input = {
    cycle,
    time: at8,
    logs,
    intervals: DEFAULT_GESTURE_INTERVALS,
    installedAt: '2026-01-01',
    lastGestureReminder: null,
    pendingGestureReminder: null,
  };

  it('is deterministic: re-planning yields the same unique ids', () => {
    const now = atLocalTime('2026-03-02', 12, 0);
    const a = planNotifications(input, now);
    const b = planNotifications({ ...input, pendingGestureReminder: a.pendingGestureReminder }, now);
    expect(b.notifications).toEqual(a.notifications);
    expect(new Set(a.notifications.map((n) => n.id)).size).toBe(a.notifications.length);
    expect(a.notifications.filter((n) => n.kind === 'gesture')).toHaveLength(1);
  });

  it('counts a pending gesture push as sent once its time has passed', () => {
    const pending = { date: '2026-03-07', gesture: 'time' as const };
    const before = planNotifications({ ...input, pendingGestureReminder: pending }, atLocalTime('2026-03-07', 7, 0));
    expect(before.lastGestureReminder).toBeNull();
    const after = planNotifications({ ...input, pendingGestureReminder: pending }, atLocalTime('2026-03-07', 9, 0));
    expect(after.lastGestureReminder).toBe('2026-03-07');
    expect(after.pendingGestureReminder!.date >= '2026-04-06').toBe(true);
  });

  it('sorts notifications by time', () => {
    const plan = planNotifications(input, atLocalTime('2026-03-02', 12, 0));
    const dates = plan.notifications.map((n) => n.date);
    expect(dates).toEqual([...dates].sort());
  });
});
