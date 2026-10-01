import { NextResponse, type NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { SESSION_COOKIE, isValidSession } from '@/lib/auth';

// client uploads go straight from the phone into vercel blob; this route only issues the token
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await isValidSession(req.cookies.get(SESSION_COOKIE)?.value))) throw new Error('unauthorized');
        return {
          allowedContentTypes: ['video/*', 'image/*'],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
