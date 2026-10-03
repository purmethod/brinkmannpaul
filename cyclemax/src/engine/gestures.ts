import { addDays, diffDays, maxISO, type ISODate } from './dates';
import { getCycleStatus } from './cycle';
import type { CycleInput, CycleStatus } from './types';

export type GestureId = 'flowers' | 'date' | 'letter' | 'surprise' | 'time';

export const GESTURE_ORDER: readonly GestureId[] = ['flowers', 'date', 'letter', 'surprise', 'time'];

/** Default reminder intervals in weeks (changeable in Settings). */
export const DEFAULT_GESTURE_INTERVALS: Record<GestureId, number> = {
  flowers: 8,
  date: 3,
  letter: 4,
  surprise: 6,
  time: 2,
};

export const GESTURE_INTERVAL_RANGE = { min: 1, max: 16 } as const;

export const GESTURE_REMINDER = {
  /** At most one extra push per month: two reminders are always at least 30 days apart. */
  minDaysBetween: 30,
  /** After a gesture becomes due, wait up to this many days for a good phase (Aufwind/Hochphase). */
  preferWindowDays: 14,
  /** How far ahead to look for the next due gesture. */
  searchDays: 120,
} as const;

export interface GestureLog {
  last: ISODate | null;
  /** The value before the last "Erledigt", so a mis-tap can be undone. */
  previous: ISODate | null;
}

export type GestureLogs = Record<GestureId, GestureLog>;
export type GestureIntervals = Record<GestureId, number>;

export function clampGestureInterval(weeks: number): number {
  if (!Number.isFinite(weeks)) return GESTURE_INTERVAL_RANGE.min;
  return Math.min(GESTURE_INTERVAL_RANGE.max, Math.max(GESTURE_INTERVAL_RANGE.min, Math.round(weeks)));
}

/** A gesture never logged counts from the day the app was set up. */
export function gestureDueDate(log: GestureLog, intervalWeeks: number, installedAt: ISODate): ISODate {
  return addDays(log.last ?? installedAt, clampGestureInterval(intervalWeeks) * 7);
}

export function weeksSince(last: ISODate | null, today: ISODate): number | null {
  if (!last) return null;
  return Math.max(0, Math.floor(diffDays(today, last) / 7));
}

export function daysSince(last: ISODate | null, today: ISODate): number | null {
  if (!last) return null;
  return Math.max(0, diffDays(today, last));
}

/** Most recent gesture of any type. */
export function lastAnyGesture(logs: GestureLogs): ISODate | null {
  let latest: ISODate | null = null;
  for (const id of GESTURE_ORDER) {
    const last = logs[id].last;
    if (last && (!latest || last > latest)) latest = last;
  }
  return latest;
}

/** Gestures due on a date, most overdue first. */
export function dueGestures(
  logs: GestureLogs,
  intervals: GestureIntervals,
  installedAt: ISODate,
  date: ISODate,
): GestureId[] {
  return GESTURE_ORDER.map((id, index) => ({ id, index, due: gestureDueDate(logs[id], intervals[id], installedAt) }))
    .filter((g) => g.due <= date)
    .sort((a, b) => (a.due === b.due ? a.index - b.index : a.due < b.due ? -1 : 1))
    .map((g) => g.id);
}

export interface GestureReminderInput {
  cycle: CycleInput;
  logs: GestureLogs;
  intervals: GestureIntervals;
  installedAt: ISODate;
  /** Date of the last extra push that actually went out. */
  lastReminder: ISODate | null;
  /** Today if today's push time is still ahead, otherwise tomorrow. */
  firstEligibleDate: ISODate;
}

export interface GestureReminder {
  date: ISODate;
  gesture: GestureId;
}

/** Days that already carry a phase push (see planPhasePushes): every phase start and the predicted next period. */
function isPhasePushDay(s: CycleStatus): boolean {
  if (s.isLate) return s.daysLate === 1;
  return s.mode === 'periodOnly' ? s.cycleDay === 1 : s.dayInPhase === 1;
}

function isGoodDay(s: CycleStatus): boolean {
  if (s.isLate || isPhasePushDay(s)) return false;
  if (s.mode === 'periodOnly') return !s.isPeriodDay;
  return s.phase === 'aufwind' || s.phase === 'hochphase';
}

/**
 * Picks the day for the single extra push: the first day a gesture is overdue, moved to the next
 * Aufwind/Hochphase day within two weeks if possible, never on a phase-push day if avoidable,
 * and never within 30 days of the previous extra push.
 */
export function planGestureReminder(input: GestureReminderInput): GestureReminder | null {
  const { cycle, logs, intervals, installedAt, lastReminder } = input;
  const eligible = lastReminder
    ? maxISO(input.firstEligibleDate, addDays(lastReminder, GESTURE_REMINDER.minDaysBetween))
    : input.firstEligibleDate;
  const due = (date: ISODate) => dueGestures(logs, intervals, installedAt, date);

  let firstDue: ISODate | null = null;
  for (let i = 0; i <= GESTURE_REMINDER.searchDays; i++) {
    const date = addDays(eligible, i);
    if (due(date).length > 0) {
      firstDue = date;
      break;
    }
  }
  if (!firstDue) return null;

  const window = Array.from({ length: GESTURE_REMINDER.preferWindowDays + 1 }, (_, i) => {
    const date = addDays(firstDue, i);
    return { date, status: getCycleStatus(cycle, date) };
  });
  const pick =
    window.find((d) => isGoodDay(d.status)) ?? window.find((d) => !isPhasePushDay(d.status)) ?? window[0]!;
  return { date: pick.date, gesture: due(pick.date)[0]! };
}
