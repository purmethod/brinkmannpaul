import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCtx } from '@/lib/auth';

// readiness check for a clear message in the app
export async function GET() {
  if (!(await getCtx())) return NextResponse.json({ ok: false, reason: 'not logged in' }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, reason: 'file storage not connected — vercel → storage → blob (public) → connect project atelier (production)' });
  }
  return NextResponse.json({ ok: true });
}

// phone → vercel blob directly (large files); this route only issues the upload token
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getCtx())) throw new Error('unauthorized');
        if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('file storage not connected');
        return { allowedContentTypes: ['video/*', 'image/*', 'audio/*'], maximumSizeInBytes: 4 * 1024 ** 3, addRandomSuffix: true };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
