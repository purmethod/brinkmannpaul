import { requireCtx, route } from '@/lib/auth';
import { isBlobUrl, kindOf, listMedia, registerMedia } from '@/lib/media';

export const GET = route(async () => {
  const { brand } = await requireCtx();
  return Response.json({ media: await listMedia(brand.id) });
});

/** Register files after a client upload: { items: [{ url, filename, type }] } — keeps upload order. */
export const POST = route(async (req: Request) => {
  const { brand } = await requireCtx(req);
  const { items } = (await req.json()) as { items?: { url: string; filename?: string; type?: string }[] };
  const out = [];
  for (const it of items ?? []) {
    if (!isBlobUrl(it.url)) continue;
    out.push(await registerMedia(brand.id, { url: it.url, kind: kindOf(it.type || it.filename || it.url), filename: it.filename }));
  }
  return Response.json({ media: out });
});
