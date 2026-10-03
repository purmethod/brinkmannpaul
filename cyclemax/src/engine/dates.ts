/**
 * Calendar-date arithmetic on plain 'YYYY-MM-DD' strings.
 * Dates are mapped to UTC day numbers, so DST shifts and time zones can never move a day.
 */
export type ISODate = string;

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** Days since 1970-01-01 for a calendar date. */
export function toDayNumber(iso: ISODate): number {
  const m = ISO_RE.exec(iso);
  if (!m || !isISODate(iso)) throw new RangeError(`Invalid ISO date: ${iso}`);
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY);
}

export function fromDayNumber(day: number): ISODate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(iso) + days);
}

/** a − b in whole days. */
export function diffDays(a: ISODate, b: ISODate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/** The local calendar date of a JS Date (what the user sees on his phone). */
export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A JS Date at local wall-clock time on the given calendar date. */
export function atLocalTime(iso: ISODate, hour: number, minute: number): Date {
  const m = ISO_RE.exec(iso);
  if (!m) throw new RangeError(`Invalid ISO date: ${iso}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, minute, 0, 0);
}

export function minISO(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}
