import { requireCtx, route } from '@/lib/auth';
import { q } from '@/lib/db';
import { describe, propose, saveMessage } from '@/lib/planner';

export const maxDuration = 60;

export const GET = route(async () => {
  const { brand } = await requireCtx();
  const rows = await q('select id, role, text, proposal, created_at from messages where brand_id = $1 order by created_at desc limit 60', [brand.id]);
  return Response.json({ messages: rows.reverse() });
});

/** { message, media?: number[] } → plan proposal (nothing is saved until "passt") */
export const POST = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const { message, media } = (await req.json()) as { message?: string; media?: number[] };
  if (!message?.trim()) return Response.json({ error: 'say something' }, { status: 400 });
  await saveMessage(brand.id, 'user', message.trim());
  const p = await propose(brand, user.timezone, message.trim(), media);
  const lines = p.actions.map((a) => describe(a, user.timezone));
  const saved = await saveMessage(brand.id, 'assistant', p.reply, { ...p, lines });
  return Response.json({ id: saved?.id, reply: p.reply, lines, actions: p.actions });
});
