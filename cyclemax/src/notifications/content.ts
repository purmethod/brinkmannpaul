import { GESTURE_NAMES, GESTURE_PUSH, NEUTRAL_TITLE, PHASE_PUSH, PHASES, type Lang } from '@/content';
import { fireTime, type PlannedNotification } from '@/engine';

export interface ScheduledRequest {
  identifier: string;
  title: string;
  /** null in neutral mode: the lock screen shows only "Cyclemax". */
  body: string | null;
  date: Date;
}

export function notificationText(
  n: PlannedNotification,
  lang: Lang,
  neutral: boolean,
): { title: string; body: string | null } {
  if (neutral) return { title: NEUTRAL_TITLE, body: null };
  if (n.kind === 'phase') return { title: PHASES[lang][n.phase].name, body: PHASE_PUSH[lang][n.phase] };
  return { title: GESTURE_NAMES[lang][n.gesture], body: GESTURE_PUSH[lang] };
}

export function buildRequests(planned: PlannedNotification[], lang: Lang, neutral: boolean): ScheduledRequest[] {
  return planned.map((n) => ({ identifier: n.id, ...notificationText(n, lang, neutral), date: fireTime(n) }));
}
