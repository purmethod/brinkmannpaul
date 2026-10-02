import { requireCtx, route } from '@/lib/auth';
import { autopilotOf, reviewStats } from '@/lib/autopilot';
import { q } from '@/lib/db';
import type { Post } from '@/lib/types';

/** The active channel's review queue: posts waiting for the owner's ok, soonest first. */
export const GET = route(async () => {
  const { brand } = await requireCtx();
  const posts = await q<Post & { at: string | null }>(
    `select p.*, (select s.at from schedules s where s.post_id = p.id and s.status = 'pending' order by s.at limit 1) as at
       from posts p where p.brand_id = $1 and p.options->>'review' = 'pending'
      order by at nulls last, p.created_at limit 30`,
    [brand.id],
  );
  return Response.json({ posts, stats: reviewStats(autopilotOf(brand)), name: brand.settings?.channel?.name ?? brand.name });
});
