import { HttpError, requireCtx, route } from '@/lib/auth';
import { one } from '@/lib/db';
import { apply, saveMessage, type Proposal } from '@/lib/planner';

export const maxDuration = 300;

/** "passt": { messageId } → executes the confirmed proposal exactly once */
export const POST = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const { messageId } = (await req.json()) as { messageId?: string };
  const msg = await one<{ id: string; proposal: (Proposal & { applied?: boolean }) | null }>(
    "update messages set proposal = proposal || '{\"applied\": true}'::jsonb where id = $1 and brand_id = $2 and coalesce((proposal->>'applied')::boolean, false) = false returning id, proposal",
    [messageId, brand.id],
  );
  if (!msg?.proposal) throw new HttpError(409, 'already applied or not found');
  const result = await apply(brand, user.timezone, msg.proposal.actions);
  await saveMessage(brand.id, 'system', result.join('\n'));
  return Response.json({ result });
});
