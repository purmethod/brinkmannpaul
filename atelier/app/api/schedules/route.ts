import { after } from 'next/server';
import { requireCtx, route } from '@/lib/auth';
import { q } from '@/lib/db';
import { sweepDue, upcoming } from '@/lib/schedule';

export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  // the open app doubles as a publisher for anything due that qstash did not deliver
  after(() => sweepDue(brand.id).then(() => undefined, (e) => console.error('sweep', e)));
  const [items, notices] = await Promise.all([
    upcoming(brand.id, 2, 21),
    q("select id, text, created_at from messages where brand_id = $1 and role = 'system' and created_at > now() - interval '2 days' and (text like '%not posted%' or text like '%ready to share%') order by created_at desc limit 5", [brand.id]),
  ]);
  return Response.json({ timezone: user.timezone, items, notices });
});
