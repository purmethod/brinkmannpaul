import { DEFAULT_GESTURE_INTERVALS } from '@/engine';

import {
  applyNotificationPlan,
  completeOnboarding,
  logPeriod,
  markGestureDone,
  resetState,
  setGestureInterval,
  setPreferences,
  undoGesture,
  updateCycle,
} from '../actions';
import { createInitialState, sanitizeState } from '../schema';
import { cycleInput, learnedSampleSize, notificationPlanInput, statusOn } from '../selectors';

const today = '2026-03-10';
const onboarded = () =>
  completeOnboarding(createInitialState(today, 'de'), { lastPeriodStart: '2026-03-01', cycleLength: 30, periodLength: 6 }, today);

describe('actions', () => {
  it('completes the onboarding', () => {
    const s = onboarded();
    expect(s).toMatchObject({ onboarded: true, periodStarts: ['2026-03-01'], cycleLength: 30, periodLength: 6 });
    expect(statusOn(s, today)).toMatchObject({ phase: 'aufwind', cycleDay: 10 });
    // A future date is never accepted.
    const future = completeOnboarding(createInitialState(today, 'de'), { lastPeriodStart: '2026-04-01', cycleLength: 28, periodLength: 5 }, today);
    expect(future.periodStarts).toEqual([today]);
  });

  it('logs a new period and learns the cycle length', () => {
    let s = onboarded();
    s = logPeriod(s, '2026-03-27', '2026-03-27');
    expect(s.periodStarts).toEqual(['2026-03-01', '2026-03-27']);
    expect(s.cycleLength).toBe(26);
    expect(learnedSampleSize(s)).toBe(1);
    s = logPeriod(s, '2026-04-26', '2026-04-26');
    expect(s.cycleLength).toBe(28);
    expect(logPeriod(s, '2026-06-01', '2026-05-01')).toBe(s);
  });

  it('edits cycle data in settings', () => {
    let s = onboarded();
    s = updateCycle(s, { lastPeriodStart: '2026-03-03' }, today);
    expect(s.periodStarts).toEqual(['2026-03-03']);
    s = updateCycle(s, { cycleLength: 99, periodLength: 1 }, today);
    expect(s).toMatchObject({ cycleLength: 40, periodLength: 3 });
    expect(updateCycle(s, { lastPeriodStart: '2026-04-01' }, today).periodStarts).toEqual(['2026-03-03']);
  });

  it('marks gestures done and can undo a mis-tap', () => {
    let s = onboarded();
    s = markGestureDone(s, 'flowers', '2026-03-05');
    s = markGestureDone(s, 'flowers', today);
    expect(s.gestures.flowers).toEqual({ last: today, previous: '2026-03-05' });
    expect(markGestureDone(s, 'flowers', today)).toBe(s);
    s = undoGesture(s, 'flowers');
    expect(s.gestures.flowers).toEqual({ last: '2026-03-05', previous: null });
  });

  it('clamps preferences and intervals', () => {
    let s = setPreferences(onboarded(), { notifyHour: 25, notifyMinute: -3, neutralNotifications: true });
    expect(s).toMatchObject({ notifyHour: 23, notifyMinute: 0, neutralNotifications: true });
    s = setGestureInterval(s, 'date', 0);
    expect(s.gestureIntervals.date).toBe(1);
    s = setGestureInterval(s, 'date', 30);
    expect(s.gestureIntervals.date).toBe(16);
  });

  it('only changes state when the reminder bookkeeping changes', () => {
    const s = onboarded();
    const same = applyNotificationPlan(s, { notifications: [], lastGestureReminder: null, pendingGestureReminder: null });
    expect(same).toBe(s);
    const changed = applyNotificationPlan(s, {
      notifications: [],
      lastGestureReminder: null,
      pendingGestureReminder: { date: '2026-03-14', gesture: 'date' },
    });
    expect(changed.pendingGestureReminder).toEqual({ date: '2026-03-14', gesture: 'date' });
  });

  it('resets everything', () => {
    const s = resetState(today, 'en');
    expect(s).toEqual(createInitialState(today, 'en'));
    expect(cycleInput(s)).toBeNull();
    expect(notificationPlanInput(s)).toBeNull();
  });
});

describe('sanitizeState', () => {
  const fallback = createInitialState(today, 'de');

  it('round-trips a valid state', () => {
    const s = markGestureDone(onboarded(), 'time', today);
    expect(sanitizeState(JSON.parse(JSON.stringify(s)), fallback)).toEqual(s);
  });

  it('never crashes on garbage', () => {
    for (const raw of [null, undefined, 42, 'x', [], { periodStarts: 'nope', gestures: 5, language: 'fr' }]) {
      const s = sanitizeState(raw, fallback);
      expect(s.version).toBe(1);
      expect(s.language).toBe('de');
      expect(s.gestureIntervals).toEqual(DEFAULT_GESTURE_INTERVALS);
    }
  });

  it('repairs individual broken fields', () => {
    const s = sanitizeState(
      {
        onboarded: true,
        periodStarts: ['2026-03-01', 'bad', '2026-02-01', '2026-02-01'],
        cycleLength: 55,
        periodLength: 'x',
        notifyHour: 30,
        gestures: { flowers: { last: '2026-02-30', previous: '2026-01-01' } },
        gestureIntervals: { date: 40 },
        pendingGestureReminder: { date: '2026-03-14', gesture: 'yacht' },
        language: 'en',
      },
      fallback,
    );
    expect(s.periodStarts).toEqual(['2026-02-01', '2026-03-01']);
    expect(s).toMatchObject({ onboarded: true, cycleLength: 40, periodLength: 5, notifyHour: 8, language: 'en' });
    expect(s.gestures.flowers).toEqual({ last: null, previous: '2026-01-01' });
    expect(s.gestureIntervals.date).toBe(16);
    expect(s.pendingGestureReminder).toBeNull();
  });

  it('sends a user without cycle data back to onboarding', () => {
    expect(sanitizeState({ onboarded: true, periodStarts: [] }, fallback).onboarded).toBe(false);
  });
});
