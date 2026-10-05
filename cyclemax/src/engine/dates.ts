// Calendar-day arithmetic on "YYYY-MM-DD" strings. Pure, DST-safe (uses UTC day numbers).

export type DateStr = string;

const DAY_MS = 86_400_000;
const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateStr(value: unknown): value is DateStr {
  if (typeof value !== "string") return false;
  const m = RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Days since 1970-01-01 for a calendar date. */
export function dayNumber(date: DateStr): number {
  const m = RE.exec(date);
  if (!m) throw new Error(`Invalid date: ${date}`);
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS);
}

export function fromDayNumber(n: number): DateStr {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(date: DateStr, days: number): DateStr {
  return fromDayNumber(dayNumber(date) + days);
}

/** b - a in whole days. */
export function diffDays(a: DateStr, b: DateStr): number {
  return dayNumber(b) - dayNumber(a);
}

/** Local calendar date of an instant (device time zone). */
export function localDate(instant: Date): DateStr {
  const y = instant.getFullYear();
  const m = String(instant.getMonth() + 1).padStart(2, "0");
  const d = String(instant.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Instant of a local wall-clock time ("HH:MM") on a calendar date (device time zone). */
export function atLocalTime(date: DateStr, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function isTimeStr(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
