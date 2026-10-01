import { NextResponse } from 'next/server';
import { bearerMatches } from '@/lib/auth';
import { brandKey, getBrand, listBrandIds } from '@/lib/brand';
import { pickNext, publishPost } from '@/lib/queue';
import { redis } from '@/lib/redis';
import { zonedNow } from '@/lib/time';
import { refreshToken } from '@/lib/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Vercel cron fires at 16:00 and 17:00 UTC. Every brand publishes in the run that lands
 * on its own post hour in its own timezone (18:00 europe/berlin, summer and winter).
 * ?force=1[&brand=<id>] (with ADMIN_SECRET) publishes immediately.
 */
export async function GET(req: Request) {
  if (!bearerMatches(req, process.env.CRON_SECRET, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';
  const only = url.searchParams.get('brand');
  const results: Record<string, unknown>[] = [];

  for (const brandId of listBrandIds()) {
    if (only && only !== brandId) continue;
    const r: Record<string, unknown> = { brand: brandId };
    results.push(r);
    try {
      const brand = await getBrand(brandId);
      const { date, hour } = zonedNow(brand.timezone);
      // monthly token refresh piggybacks on the daily cron
      r.token = await refreshToken(brandId).catch((e: Error) => ({ refreshed: false, error: e.message }));

      if (!force && hour !== brand.postHour) {
        r.skipped = `local hour ${hour}`;
        continue;
      }
      const dayKey = brandKey(brandId, 'published', date);
      if (!force && !(await redis().set(dayKey, 1, { nx: true, ex: 60 * 60 * 26 }))) {
        r.skipped = 'already ran today';
        continue;
      }
      const next = await pickNext(brandId, date);
      if (!next) {
        await redis().del(dayKey);
        r.skipped = 'queue empty';
        continue;
      }
      const post = await publishPost(next.id);
      r.post = { id: post.id, status: post.status, error: post.error, permalink: post.permalink };
    } catch (e) {
      r.error = (e as Error).message;
    }
  }
  return NextResponse.json({ results });
}
