// Notification planning – one code path for web push and native local notifications.
// Rules: max 1 per day; a due phase push replaces that day's daily line. Never asks him to do anything.
import type { Line, Mode, PhasePushKey, ScheduledItem } from "@shared/types";
import { APP_NAME, NEUTRAL_BODY, NEUTRAL_TITLE, PHASE_PUSH_TEXT } from "@shared/texts";
import { addDays, atLocalTime, type DateStr } from "./dates";
import { cycleStateOn, phaseRanges, sortEntries } from "./cycle";
import { categoryFor, pickLine, pruneHistory, type LineHistory } from "./lines";

export const PLAN_DAYS = 30;

export interface PlanInput {
  today: DateStr;
  now: Date;
  days?: number;
  mode: Mode;
  entries: DateStr[];
  usualLength: number;
  dailyTime: string;
  lines: Line[];
  history: LineHistory;
  seed: string;
  neutral: boolean;
}

export interface PlannedNotification extends ScheduledItem {
  date: DateStr;
  title: string;
  body: string;
}

export interface Plan {
  /** Notifications in chronological order, max one per date, only in the future. */
  notifications: PlannedNotification[];
  /** Updated history: every planned day has its line (also shown on Home). */
  history: LineHistory;
}

/** Phase push due on `date` (relationship mode), computed from the latest entry before it. */
export function phasePushOn(entries: DateStr[], date: DateStr, usualLength: number): PhasePushKey | null {
  const s = cycleStateOn(entries, date, usualLength);
  if (!s) return null;
  // While late (no new entry yet) Cyclemax stays quiet about phases – no nudges, no tasks.
  if (s.late) return null;
  const r = phaseRanges(s.cycleLength);
  const day = s.cycleDay;
  if (day === r.red[0]) return "red7"; // 7 days before expected bleeding
  if (day === s.cycleLength - 1) return "red2"; // 2 days before expected bleeding
  if (r.pink && day === r.pink[0]) return "pink";
  if (day === r.green[0]) return "green";
  return null;
}

/** Line for one day: reuse the stored one, otherwise pick and remember it. */
export function lineForDay(input: Omit<PlanInput, "now" | "days" | "dailyTime" | "neutral">, date: DateStr): {
  line: Line | null;
  history: LineHistory;
} {
  const { mode, entries, usualLength, lines, seed } = input;
  const history = { ...input.history };
  const known = history[date] ? lines.find((l) => l.id === history[date] && (l.weight ?? 1) > 0) : undefined;
  if (known) return { line: known, history };
  const phase = mode === "relationship" ? (cycleStateOn(entries, date, usualLength)?.phase ?? null) : null;
  delete history[date];
  const line = pickLine(lines, categoryFor(mode, phase), history, date, seed);
  if (line) history[date] = line.id;
  return { line, history };
}

export function planNotifications(input: PlanInput): Plan {
  const days = input.days ?? PLAN_DAYS;
  const entries = sortEntries(input.entries);
  let history = pruneHistory(input.history, input.today);
  const notifications: PlannedNotification[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(input.today, i);
    const picked = lineForDay({ ...input, entries, history }, date);
    history = picked.history;
    const at = atLocalTime(date, input.dailyTime);
    if (at.getTime() <= input.now.getTime()) continue;

    const phaseKey = input.mode === "relationship" ? phasePushOn(entries, date, input.usualLength) : null;
    let item: Omit<PlannedNotification, "title" | "body"> & { text: string };
    if (phaseKey) {
      item = { date, at: at.toISOString(), kind: "phase", key: phaseKey, text: PHASE_PUSH_TEXT[phaseKey] };
    } else if (picked.line) {
      item = { date, at: at.toISOString(), kind: "daily", key: picked.line.id, text: picked.line.text };
    } else continue;

    const { text, ...rest } = item;
    notifications.push({
      ...rest,
      title: input.neutral ? NEUTRAL_TITLE : APP_NAME,
      body: input.neutral ? NEUTRAL_BODY : text,
    });
  }
  return { notifications, history };
}
