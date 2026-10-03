import {
  addDays,
  addPeriodStart,
  atLocalTime,
  DEFAULT_GESTURE_INTERVALS,
  fireTime,
  GESTURE_ORDER,
  lastPeriodStart,
  learnedCycleLength,
  planNotifications,
  type GestureLogs,
  type GestureReminder,
  type ISODate,
  type PlannedNotification,
} from '@/engine';

export interface FiredNotification {
  id: string;
  kind: PlannedNotification['kind'];
  date: ISODate;
  label: string;
}

export interface SimulationOptions {
  /** First simulated day. */
  from: ISODate;
  days: number;
  /** Logged start of the period before the simulation begins. */
  initialStart: ISODate;
  cycleLength: number;
  periodLength: number;
  /** Real period starts during the simulation; logged on that day at logHour. */
  realStarts: ISODate[];
  logHour?: number;
  /** Hours at which the app is opened each day (each opening re-plans). */
  openHours?: number[];
  pushHour?: number;
  hormonalContraception?: boolean;
  gestures?: GestureLogs;
  installedAt?: ISODate;
}

const emptyLogs = (): GestureLogs =>
  Object.fromEntries(GESTURE_ORDER.map((id) => [id, { last: null, previous: null }])) as unknown as GestureLogs;

/**
 * Plays the app forward hour by hour like the OS would: scheduled notifications fire when their time
 * passes, every app open or period entry cancels everything and schedules the fresh plan.
 */
export function simulate(o: SimulationOptions) {
  let starts = [o.initialStart];
  let cycleLength = o.cycleLength;
  let lastGestureReminder: ISODate | null = null;
  let pendingGestureReminder: GestureReminder | null = null;
  let scheduled: PlannedNotification[] = [];
  const fired: FiredNotification[] = [];
  const time = { hour: o.pushHour ?? 8, minute: 0 };
  const logs = o.gestures ?? emptyLogs();
  const installedAt = o.installedAt ?? o.from;

  const advanceTo = (now: Date) => {
    const due = scheduled.filter((n) => fireTime(n) <= now);
    scheduled = scheduled.filter((n) => fireTime(n) > now);
    for (const n of due) {
      fired.push({ id: n.id, kind: n.kind, date: n.date, label: n.kind === 'phase' ? n.phase : n.gesture });
    }
  };

  const replan = (now: Date) => {
    const plan = planNotifications(
      {
        cycle: {
          lastPeriodStart: lastPeriodStart(starts)!,
          cycleLength,
          periodLength: o.periodLength,
          hormonalContraception: o.hormonalContraception,
        },
        time,
        logs,
        intervals: DEFAULT_GESTURE_INTERVALS,
        installedAt,
        lastGestureReminder,
        pendingGestureReminder,
      },
      now,
    );
    lastGestureReminder = plan.lastGestureReminder;
    pendingGestureReminder = plan.pendingGestureReminder;
    // cancelAll + schedule: the scheduled set is replaced, never appended.
    scheduled = plan.notifications;
  };

  replan(atLocalTime(o.from, 0, 0));
  for (let i = 0; i < o.days; i++) {
    const day = addDays(o.from, i);
    const events: { hour: number; action: () => void }[] = (o.openHours ?? [12]).map((hour) => ({
      hour,
      action: () => replan(atLocalTime(day, hour, 0)),
    }));
    if (o.realStarts.includes(day)) {
      events.push({
        hour: o.logHour ?? 19,
        action: () => {
          starts = addPeriodStart(starts, day);
          cycleLength = learnedCycleLength(starts)?.value ?? cycleLength;
          replan(atLocalTime(day, o.logHour ?? 19, 0));
        },
      });
    }
    events.sort((a, b) => a.hour - b.hour);
    for (const e of events) {
      advanceTo(atLocalTime(day, e.hour, 0));
      e.action();
    }
    advanceTo(atLocalTime(day, 23, 59));
  }
  return { fired, scheduled };
}
