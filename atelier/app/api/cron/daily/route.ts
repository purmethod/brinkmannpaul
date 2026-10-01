import { safeEqual } from '@/lib/crypto';
import { refreshConnections } from '@/lib/platforms';

export const maxDuration = 300;

// daily: extend platform tokens before they expire
export async function GET(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(token, secret)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return Response.json({ connections: await refreshConnections() });
}
