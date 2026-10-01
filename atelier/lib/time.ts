/** Parts of a date in an IANA timezone. */
export function zoned(timeZone: string, d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: p.weekday as string };
}

/** "2026-10-05T15:00" meant in `timeZone` → UTC Date. */
export function localToUtc(local: string, timeZone: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) throw new Error(`invalid time: ${local}`);
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // offset of the zone at that moment (two passes cover dst edges)
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const z = zoned(timeZone, new Date(guess));
    const shown = Date.UTC(+z.date.slice(0, 4), +z.date.slice(5, 7) - 1, +z.date.slice(8, 10), +z.time.slice(0, 2), +z.time.slice(3, 5));
    guess += asUtc - shown;
  }
  return new Date(guess);
}

export function fmtLocal(iso: string | Date, timeZone: string): string {
  const z = zoned(timeZone, new Date(iso));
  return `${z.weekday.toLowerCase()} ${z.date.slice(8, 10)}.${z.date.slice(5, 7)}. ${z.time}`;
}
