import { after } from 'next/server';
import { requireCtx, route } from '@/lib/auth';
import { q } from '@/lib/db';
import { pendingReviews, runAutopilot } from '@/lib/autopilot';
import { resolveBrand } from '@/lib/brand';
import { sweepDue, upcoming } from '@/lib/schedule';

export const maxDuration = 300;

export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  // the open app doubles as a publisher for anything due that qstash did not deliver
  after(async () => {
    await sweepDue(brand.id).catch((e) => console.error('sweep', e));
    // and keeps this account's autopilot topped up (locked: one generation at a time)
    await runAutopilot(brand, user, 1).catch((e) => console.error('autopilot', e));
  });
  const [items, notices] = await Promise.all([
    upcoming(brand.id, 2, 21),
    q("select id, text, created_at from messages where brand_id = $1 and role = 'system' and created_at > now() - interval '2 days' and (text like '%not posted%' or text like '%ready to share%') order by created_at desc limit 5", [brand.id]),
  ]);
  const k = resolveBrand(brand);
  return Response.json({ timezone: user.timezone, items, notices, channel: { name: k.name, handle: k.handle, waiting: await pendingReviews(brand.id) } });
});
