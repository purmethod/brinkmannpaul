import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCtx } from '@/lib/auth';

// phone → vercel blob directly (large files); this route only issues the upload token
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getCtx())) throw new Error('unauthorized');
        return { allowedContentTypes: ['video/*', 'image/*', 'audio/*'], maximumSizeInBytes: 4 * 1024 ** 3, addRandomSuffix: true };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
