import { changePassword, requireCtx, route } from '@/lib/auth';

/** { current, next } — change the password */
export const PATCH = route(async (req: Request) => {
  const { user } = await requireCtx(req);
  const b = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  await changePassword(user, b.current ?? '', b.next ?? '');
  return Response.json({ ok: true });
});
