import {
  getCycleStatus,
  lastPeriodStart,
  learnedCycleLength,
  type CycleInput,
  type CycleStatus,
  type ISODate,
  type NotificationPlanInput,
} from '@/engine';

import type { AppState } from './schema';

export function cycleInput(state: AppState): CycleInput | null {
  const start = lastPeriodStart(state.periodStarts);
  if (!start) return null;
  return {
    lastPeriodStart: start,
    cycleLength: state.cycleLength,
    periodLength: state.periodLength,
    hormonalContraception: state.hormonalContraception,
  };
}

export function statusOn(state: AppState, date: ISODate): CycleStatus | null {
  const input = cycleInput(state);
  return input ? getCycleStatus(input, date) : null;
}

export function learnedSampleSize(state: AppState): number {
  return learnedCycleLength(state.periodStarts)?.sampleSize ?? 0;
}

export function notificationPlanInput(state: AppState): NotificationPlanInput | null {
  const cycle = cycleInput(state);
  if (!cycle || !state.onboarded) return null;
  return {
    cycle,
    time: { hour: state.notifyHour, minute: state.notifyMinute },
    logs: state.gestures,
    intervals: state.gestureIntervals,
    installedAt: state.installedAt,
    lastGestureReminder: state.lastGestureReminder,
    pendingGestureReminder: state.pendingGestureReminder,
  };
}
