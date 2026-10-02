import { Receiver } from '@upstash/qstash';
import { autopilotTick } from '@/lib/autopilot';
import { runSchedule, sweepDue } from '@/lib/schedule';

export const maxDuration = 300;

// delivered by upstash qstash at the scheduled minute
export async function POST(req: Request) {
  const body = await req.text();
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? '',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? '',
  });
  const ok = await receiver.verify({ signature: req.headers.get('upstash-signature') ?? '', body }).catch(() => false);
  if (!ok) return Response.json({ error: 'invalid signature' }, { status: 401 });
  const msg = JSON.parse(body) as { scheduleId?: string; heartbeat?: boolean };
  if (msg.heartbeat) {
    const swept = await sweepDue().catch((e) => [{ error: (e as Error).message }]);
    const autopilot = await autopilotTick(1, 200_000).catch((e) => [{ error: (e as Error).message }]);
    return Response.json({ swept, autopilot });
  }
  const scheduleId = msg.scheduleId!;
  try {
    return Response.json(await runSchedule(scheduleId));
  } catch (e) {
    console.error(e);
    // 200: our own retry logic already handled it; never let qstash double-post
    return Response.json({ error: (e as Error).message });
  }
}
