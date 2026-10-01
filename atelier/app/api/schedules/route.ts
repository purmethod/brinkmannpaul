import { requireCtx, route } from '@/lib/auth';
import { q } from '@/lib/db';
import { upcoming } from '@/lib/schedule';

export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  const [items, notices] = await Promise.all([
    upcoming(brand.id, 2, 21),
    q("select id, text, created_at from messages where brand_id = $1 and role = 'system' and created_at > now() - interval '2 days' and text like '%not posted%' order by created_at desc limit 5", [brand.id]),
  ]);
  return Response.json({ timezone: user.timezone, items, notices });
});
