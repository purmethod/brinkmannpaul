import { HttpError, requireCtx, route } from '@/lib/auth';
import { autopilotOf, composeLongevity, openSlots, runAutopilot } from '@/lib/autopilot';
import { one } from '@/lib/db';
import type { BrandRow } from '@/lib/types';

export const maxDuration = 300;

/** Fill the next open slot now (instead of waiting for the heartbeat). */
export const POST = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  if (!autopilotOf(brand).enabled) throw new HttpError(409, 'switch the autopilot on first');
  const made = await runAutopilot(brand, user, 1, 250_000);
  if (!made.length) {
    const fresh = (await one<BrandRow>('select * from brands where id = $1', [brand.id]))!;
    const open = await openSlots(fresh, user.timezone);
    throw new HttpError(409, open.length ? 'already working on one — try again in a minute' : 'the next 30 hours are already planned');
  }
  return Response.json({ made });
});

/** Preview: what the autopilot would write next — nothing is saved. */
export const GET = route(async () => {
  const { brand } = await requireCtx();
  return Response.json(await composeLongevity(brand, null));
});
