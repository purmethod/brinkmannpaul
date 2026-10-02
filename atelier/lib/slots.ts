import { q } from './db';
import { localToUtc, zoned } from './time';

const pad = (n: number) => String(n).padStart(2, '0');

/** Adds days to a YYYY-MM-DD calendar date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Next posting slot that is still free: the brand's daily slot times, at least `leadMinutes` from now,
 * skipping minutes that already hold a post. Pure — `taken` are utc ms.
 */
export function pickSlot(o: { now: Date; timezone: string; slots: string[]; taken: number[]; leadMinutes?: number; skip?: number }): string {
  const slots = [...(o.slots.length ? o.slots : ['18:00'])].sort();
  const earliest = o.now.getTime() + (o.leadMinutes ?? 20) * 60_000;
  const taken = new Set(o.taken.map((t) => Math.round(t / 60_000)));
  const today = zoned(o.timezone, o.now).date;
  let skip = o.skip ?? 0;
  for (let d = 0; d < 400; d++) {
    const date = addDays(today, d);
    for (const s of slots) {
      const local = `${date}T${s}`;
      const t = localToUtc(local, o.timezone).getTime();
      if (t < earliest || taken.has(Math.round(t / 60_000))) continue;
      if (skip-- > 0) continue;
      return local;
    }
  }
  throw new Error('no free slot found');
}

export async function nextFreeSlot(brandId: string, timezone: string, slots: string[], extraTaken: number[] = []): Promise<string> {
  const rows = await q<{ at: string }>("select at from schedules where brand_id = $1 and status in ('pending', 'done') and at > now()", [brandId]);
  return pickSlot({ now: new Date(), timezone, slots, taken: [...rows.map((r) => new Date(r.at).getTime()), ...extraTaken] });
}
