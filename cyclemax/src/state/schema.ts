import { LANGS, type Lang } from '@/content';
import {
  clampCycleLength,
  clampGestureInterval,
  clampPeriodLength,
  CYCLE_LENGTH,
  DEFAULT_GESTURE_INTERVALS,
  DEFAULT_PUSH_TIME,
  GESTURE_ORDER,
  isISODate,
  normalizeStarts,
  PERIOD_LENGTH,
  type GestureId,
  type GestureIntervals,
  type GestureLog,
  type GestureLogs,
  type GestureReminder,
  type ISODate,
} from '@/engine';

export const STATE_VERSION = 1;

export interface AppState {
  version: typeof STATE_VERSION;
  onboarded: boolean;
  /** Day the app was set up; never-logged gestures count from here. */
  installedAt: ISODate;
  /** First days of her logged periods, sorted ascending. */
  periodStarts: ISODate[];
  cycleLength: number;
  periodLength: number;
  hormonalContraception: boolean;
  notifyHour: number;
  notifyMinute: number;
  neutralNotifications: boolean;
  language: Lang;
  gestures: GestureLogs;
  gestureIntervals: GestureIntervals;
  /** Date of the last extra gesture push that went out (max. one per 30 days). */
  lastGestureReminder: ISODate | null;
  /** Extra gesture push currently scheduled. */
  pendingGestureReminder: GestureReminder | null;
}

const emptyGestures = (): GestureLogs =>
  Object.fromEntries(GESTURE_ORDER.map((id) => [id, { last: null, previous: null }])) as unknown as GestureLogs;

export function createInitialState(today: ISODate, language: Lang): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    installedAt: today,
    periodStarts: [],
    cycleLength: CYCLE_LENGTH.default,
    periodLength: PERIOD_LENGTH.default,
    hormonalContraception: false,
    notifyHour: DEFAULT_PUSH_TIME.hour,
    notifyMinute: DEFAULT_PUSH_TIME.minute,
    neutralNotifications: false,
    language,
    gestures: emptyGestures(),
    gestureIntervals: { ...DEFAULT_GESTURE_INTERVALS },
    lastGestureReminder: null,
    pendingGestureReminder: null,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const optionalDate = (v: unknown): ISODate | null => (isISODate(v) ? v : null);
const int = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

function sanitizeGestureLog(v: unknown): GestureLog {
  if (!isRecord(v)) return { last: null, previous: null };
  return { last: optionalDate(v.last), previous: optionalDate(v.previous) };
}

/**
 * Turns whatever is in storage into a valid state. Unknown or broken fields fall back to defaults,
 * so a corrupted or older file can never crash the app.
 */
export function sanitizeState(raw: unknown, fallback: AppState): AppState {
  if (!isRecord(raw)) return fallback;
  const periodStarts = Array.isArray(raw.periodStarts) ? normalizeStarts(raw.periodStarts.filter(isISODate)) : [];
  const gesturesRaw = isRecord(raw.gestures) ? raw.gestures : {};
  const intervalsRaw = isRecord(raw.gestureIntervals) ? raw.gestureIntervals : {};
  const gestures = {} as GestureLogs;
  const gestureIntervals = {} as GestureIntervals;
  for (const id of GESTURE_ORDER) {
    gestures[id] = sanitizeGestureLog(gesturesRaw[id]);
    const weeks = intervalsRaw[id];
    gestureIntervals[id] =
      typeof weeks === 'number' ? clampGestureInterval(weeks) : fallback.gestureIntervals[id];
  }
  const pendingRaw = raw.pendingGestureReminder;
  const pendingGestureReminder =
    isRecord(pendingRaw) && isISODate(pendingRaw.date) && GESTURE_ORDER.includes(pendingRaw.gesture as GestureId)
      ? { date: pendingRaw.date, gesture: pendingRaw.gesture as GestureId }
      : null;

  return {
    version: STATE_VERSION,
    onboarded: bool(raw.onboarded, false) && periodStarts.length > 0,
    installedAt: optionalDate(raw.installedAt) ?? fallback.installedAt,
    periodStarts,
    cycleLength: typeof raw.cycleLength === 'number' ? clampCycleLength(raw.cycleLength) : fallback.cycleLength,
    periodLength: typeof raw.periodLength === 'number' ? clampPeriodLength(raw.periodLength) : fallback.periodLength,
    hormonalContraception: bool(raw.hormonalContraception, fallback.hormonalContraception),
    notifyHour: int(raw.notifyHour, 0, 23, fallback.notifyHour),
    notifyMinute: int(raw.notifyMinute, 0, 59, fallback.notifyMinute),
    neutralNotifications: bool(raw.neutralNotifications, fallback.neutralNotifications),
    language: LANGS.includes(raw.language as Lang) ? (raw.language as Lang) : fallback.language,
    gestures,
    gestureIntervals,
    lastGestureReminder: optionalDate(raw.lastGestureReminder),
    pendingGestureReminder,
  };
}
