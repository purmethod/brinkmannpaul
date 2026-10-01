import { requireCtx, route } from '@/lib/auth';
import { learnRules } from '@/lib/rules';

export const maxDuration = 60;

// "update rules from feedback"
export const POST = route(async () => {
  const { brand } = await requireCtx();
  return Response.json({ cutRules: await learnRules(brand) });
});
