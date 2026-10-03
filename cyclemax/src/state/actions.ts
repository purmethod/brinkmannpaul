import type { Lang } from '@/content';
import {
  addPeriodStart,
  clampCycleLength,
  clampGestureInterval,
  clampPeriodLength,
  isISODate,
  learnedCycleLength,
  replaceLastPeriodStart,
  type GestureId,
  type ISODate,
  type NotificationPlan,
} from '@/engine';

import { createInitialState, type AppState } from './schema';

/** Pure state transitions. Every function returns a new state (or the same one if nothing changed). */

export interface CycleSetup {
  lastPeriodStart: ISODate;
  cycleLength: number;
  periodLength: number;
}

const withLearning = (state: AppState, periodStarts: ISODate[]): AppState => {
  const learned = learnedCycleLength(periodStarts);
  return { ...state, periodStarts, cycleLength: learned ? learned.value : state.cycleLength };
};

export function completeOnboarding(state: AppState, setup: CycleSetup, today: ISODate): AppState {
  const start = isISODate(setup.lastPeriodStart) && setup.lastPeriodStart <= today ? setup.lastPeriodStart : today;
  return {
    ...state,
    onboarded: true,
    installedAt: today,
    periodStarts: [start],
    cycleLength: clampCycleLength(setup.cycleLength),
    periodLength: clampPeriodLength(setup.periodLength),
  };
}

/** "Periode hat begonnen" – a new cycle; the cycle length re-learns from the history. */
export function logPeriod(state: AppState, date: ISODate, today: ISODate): AppState {
  if (!isISODate(date) || date > today) return state;
  return withLearning(state, addPeriodStart(state.periodStarts, date));
}

/** Settings: edit the last period start, cycle length or period length. */
export function updateCycle(state: AppState, patch: Partial<CycleSetup>, today: ISODate): AppState {
  let next = state;
  if (patch.lastPeriodStart && isISODate(patch.lastPeriodStart) && patch.lastPeriodStart <= today) {
    next = withLearning(next, replaceLastPeriodStart(next.periodStarts, patch.lastPeriodStart));
  }
  if (patch.cycleLength !== undefined) next = { ...next, cycleLength: clampCycleLength(patch.cycleLength) };
  if (patch.periodLength !== undefined) next = { ...next, periodLength: clampPeriodLength(patch.periodLength) };
  return next;
}

export type Preferences = Pick<
  AppState,
  'hormonalContraception' | 'notifyHour' | 'notifyMinute' | 'neutralNotifications' | 'language'
>;

export function setPreferences(state: AppState, patch: Partial<Preferences>): AppState {
  const next = { ...state, ...patch };
  next.notifyHour = Math.min(23, Math.max(0, Math.round(next.notifyHour)));
  next.notifyMinute = Math.min(59, Math.max(0, Math.round(next.notifyMinute)));
  return next;
}

export function markGestureDone(state: AppState, id: GestureId, today: ISODate): AppState {
  const log = state.gestures[id];
  if (log.last === today) return state;
  return { ...state, gestures: { ...state.gestures, [id]: { last: today, previous: log.last } } };
}

export function undoGesture(state: AppState, id: GestureId): AppState {
  const log = state.gestures[id];
  return { ...state, gestures: { ...state.gestures, [id]: { last: log.previous, previous: null } } };
}

export function setGestureInterval(state: AppState, id: GestureId, weeks: number): AppState {
  return { ...state, gestureIntervals: { ...state.gestureIntervals, [id]: clampGestureInterval(weeks) } };
}

/** Stores the reminder bookkeeping of a fresh notification plan; unchanged plans keep the same object. */
export function applyNotificationPlan(state: AppState, plan: NotificationPlan): AppState {
  const samePending =
    state.pendingGestureReminder?.date === plan.pendingGestureReminder?.date &&
    state.pendingGestureReminder?.gesture === plan.pendingGestureReminder?.gesture;
  if (samePending && state.lastGestureReminder === plan.lastGestureReminder) return state;
  return {
    ...state,
    lastGestureReminder: plan.lastGestureReminder,
    pendingGestureReminder: plan.pendingGestureReminder,
  };
}

/** "Alle Daten löschen": back to a fresh install (language is kept for the onboarding). */
export function resetState(today: ISODate, language: Lang): AppState {
  return createInitialState(today, language);
}
