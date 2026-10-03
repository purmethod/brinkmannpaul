import { addDays, atLocalTime, toISODate, type ISODate } from './dates';
import { getPhaseSegments, phaseStartDate } from './cycle';
import {
  planGestureReminder,
  type GestureId,
  type GestureIntervals,
  type GestureLogs,
  type GestureReminder,
} from './gestures';
import type { CycleInput, PhaseId } from './types';

export interface PushTime {
  hour: number;
  minute: number;
}

export const DEFAULT_PUSH_TIME: PushTime = { hour: 8, minute: 0 };

interface PlannedBase {
  /** Deterministic: the same push always gets the same id, so re-planning never duplicates it. */
  id: string;
  date: ISODate;
  hour: number;
  minute: number;
}

export type PlannedNotification =
  | (PlannedBase & { kind: 'phase'; phase: PhaseId })
  | (PlannedBase & { kind: 'gesture'; gesture: GestureId });

export function fireTime(n: { date: ISODate; hour: number; minute: number }): Date {
  return atLocalTime(n.date, n.hour, n.minute);
}

/** Today if today's push time is still ahead, otherwise tomorrow. */
export function firstEligibleDate(now: Date, time: PushTime): ISODate {
  const today = toISODate(now);
  return atLocalTime(today, time.hour, time.minute) > now ? today : addDays(today, 1);
}

/**
 * Exactly one push on the first day of every phase:
 * the logged cycle's four phase starts plus the predicted start of the next period.
 * Nothing beyond that: if the period is late, the phase stays Brandung and no further phase begins
 * until a new period is logged (which re-plans everything).
 * With hormonal contraception only period starts are announced.
 */
export function planPhasePushes(cycle: CycleInput, now: Date, time: PushTime): PlannedNotification[] {
  const segments = getPhaseSegments(cycle.cycleLength, cycle.periodLength);
  const cycleLength = segments[segments.length - 1]!.endDay;
  const periodOnly = Boolean(cycle.hormonalContraception);
  const make = (phase: PhaseId, date: ISODate): PlannedNotification => ({
    id: `phase:${date}:${phase}`,
    kind: 'phase',
    phase,
    date,
    hour: time.hour,
    minute: time.minute,
  });

  const pushes = segments
    .filter((s) => !periodOnly || s.phase === 'ruhe')
    .map((s) => make(s.phase, phaseStartDate(cycle.lastPeriodStart, s)));
  pushes.push(make('ruhe', addDays(cycle.lastPeriodStart, cycleLength)));
  return pushes.filter((p) => fireTime(p) > now);
}

export interface NotificationPlanInput {
  cycle: CycleInput;
  time: PushTime;
  logs: GestureLogs;
  intervals: GestureIntervals;
  installedAt: ISODate;
  lastGestureReminder: ISODate | null;
  pendingGestureReminder: GestureReminder | null;
}

export interface NotificationPlan {
  notifications: PlannedNotification[];
  lastGestureReminder: ISODate | null;
  pendingGestureReminder: GestureReminder | null;
}

/**
 * Complete, deterministic plan of every local notification. The caller cancels everything
 * it scheduled before and schedules exactly this list.
 */
export function planNotifications(input: NotificationPlanInput, now: Date): NotificationPlan {
  let lastGestureReminder = input.lastGestureReminder;
  const pending = input.pendingGestureReminder;
  // A pending extra push whose time has passed has gone out: it counts for the 30-day rule.
  if (pending && fireTime({ ...pending, ...input.time }) <= now) {
    if (!lastGestureReminder || pending.date > lastGestureReminder) lastGestureReminder = pending.date;
  }

  const notifications = planPhasePushes(input.cycle, now, input.time);
  const reminder = planGestureReminder({
    cycle: input.cycle,
    logs: input.logs,
    intervals: input.intervals,
    installedAt: input.installedAt,
    lastReminder: lastGestureReminder,
    firstEligibleDate: firstEligibleDate(now, input.time),
  });
  if (reminder) {
    notifications.push({
      id: `gesture:${reminder.date}:${reminder.gesture}`,
      kind: 'gesture',
      gesture: reminder.gesture,
      date: reminder.date,
      hour: input.time.hour,
      minute: input.time.minute,
    });
  }
  notifications.sort((a, b) => fireTime(a).getTime() - fireTime(b).getTime() || a.id.localeCompare(b.id));
  return { notifications, lastGestureReminder, pendingGestureReminder: reminder };
}
