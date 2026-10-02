import { safeEqual } from '@/lib/crypto';
import { autopilotTick } from '@/lib/autopilot';
import { sweepDue } from '@/lib/schedule';

export const maxDuration = 300;

// every few minutes (github actions): publishes due posts that qstash did not deliver
export async function GET(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = [process.env.CRON_SECRET, process.env.ADMIN_SECRET].some((s) => s && safeEqual(token, s));
  if (!ok) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const swept = await sweepDue();
  return Response.json({ swept, autopilot: await autopilotTick(1, 200_000) });
}
