import { NextResponse } from 'next/server';
import { bearerMatches } from '@/lib/auth';
import { refreshToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

// manual / external trigger; the daily publish cron already refreshes monthly
export async function GET(req: Request) {
  if (!bearerMatches(req, process.env.CRON_SECRET, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await refreshToken(new URL(req.url).searchParams.get('force') === '1'));
}
