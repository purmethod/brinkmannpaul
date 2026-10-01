import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { requireCtx, route } from '@/lib/auth';
import { kindOf, registerMedia } from '@/lib/media';
import { describe, propose, saveMessage } from '@/lib/planner';

export const maxDuration = 60;

/**
 * iOS shortcut, step 1 (Authorization: Bearer <personal key>):
 * POST { filename, type, say? } → { number, upload: { url, method: "PUT", headers } }
 * Step 2: PUT the file to upload.url with those headers. The medium appears as #number;
 * "say" (e.g. "post this at 18:00") becomes a plan waiting for "passt" in the chat.
 */
export const POST = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const body = (await req.json().catch(() => ({}))) as { filename?: string; type?: string; say?: string };
  const rw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!rw) throw new Error('BLOB_READ_WRITE_TOKEN missing');
  const storeId = rw.split('_')[3];
  const type = body.type || 'application/octet-stream';
  const ext = (body.filename?.split('.').pop() || (type.split('/')[1] ?? 'bin')).toLowerCase().replace(/[^a-z0-9]/g, '');
  const pathname = `media/${brand.id}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const token = await generateClientTokenFromReadWriteToken({
    token: rw,
    pathname,
    allowedContentTypes: ['video/*', 'image/*'],
    maximumSizeInBytes: 4 * 1024 ** 3,
    addRandomSuffix: false,
    validUntil: Date.now() + 3600_000,
  });
  const media = await registerMedia(brand.id, {
    url: `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com/${pathname}`,
    kind: kindOf(type || body.filename || ''),
    filename: body.filename,
    status: 'uploading',
  });

  if (body.say?.trim()) {
    const text = `#${media.number}: ${body.say.trim()}`;
    await saveMessage(brand.id, 'user', text);
    try {
      const p = await propose(brand, user.timezone, text, [media.number]);
      await saveMessage(brand.id, 'assistant', p.reply, { ...p, lines: p.actions.map((a) => describe(a, user.timezone)) });
    } catch (e) {
      await saveMessage(brand.id, 'system', `could not plan: ${(e as Error).message}`);
    }
  }

  return Response.json({
    number: media.number,
    upload: {
      url: `https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`,
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': '12',
        'x-vercel-blob-access': 'public',
        'x-content-type': type,
        'x-add-random-suffix': '0',
      },
    },
  });
});
