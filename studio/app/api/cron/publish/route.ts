import { NextResponse } from 'next/server';
import { bearerMatches } from '@/lib/auth';
import { loadBrand } from '@/lib/brand';
import { pickNext, publishPost } from '@/lib/queue';
import { redis } from '@/lib/redis';
import { zonedNow } from '@/lib/time';
import { refreshToken } from '@/lib/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Vercel cron fires at 16:00 and 17:00 UTC; only the run that lands on the brand's
 * post hour in its timezone (18:00 europe/berlin, summer and winter) publishes.
 * ?force=1 (with ADMIN_SECRET) publishes immediately.
 */
export async function GET(req: Request) {
  if (!bearerMatches(req, process.env.CRON_SECRET, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const brand = loadBrand();
  const force = new URL(req.url).searchParams.get('force') === '1';
  const { date, hour } = zonedNow(brand.timezone);

  // monthly token refresh piggybacks on the daily cron
  const token = await refreshToken().catch((e: Error) => ({ refreshed: false, error: e.message }));

  if (!force && hour !== brand.postHour) return NextResponse.json({ skipped: `local hour ${hour}`, token });

  const dayKey = `cron:published:${date}`;
  if (!force && !(await redis().set(dayKey, 1, { nx: true, ex: 60 * 60 * 26 }))) {
    return NextResponse.json({ skipped: 'already ran today', token });
  }
  const next = await pickNext(date);
  if (!next) {
    await redis().del(dayKey);
    return NextResponse.json({ skipped: 'queue empty', token });
  }
  const post = await publishPost(next.id);
  return NextResponse.json({ post: { id: post.id, status: post.status, error: post.error, permalink: post.permalink }, token });
}
