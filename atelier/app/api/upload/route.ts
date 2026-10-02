import { NextResponse } from 'next/server';
import { issueSignedToken } from '@vercel/blob';
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { getCtx } from '@/lib/auth';
import { MAX_UPLOAD, UPLOAD_TYPES, blobMode } from '@/lib/blob';

// tells the app which upload mode the connected blob store uses
export async function GET(req: Request) {
  if (!(await getCtx())) return NextResponse.json({ ok: false, reason: 'not logged in' }, { status: 401 });
  const mode = blobMode();
  if (!mode) {
    return NextResponse.json({ ok: false, reason: 'file storage not connected — vercel → storage → blob (public) → connect project atelier (production)' });
  }
  const info: Record<string, unknown> = {
    ok: true,
    mode,
    storeId: Boolean(process.env.BLOB_STORE_ID),
    readWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
  // ?test=1: actually ask the blob api for an upload permission
  if (new URL(req.url).searchParams.get('test')) {
    try {
      await issueSignedToken({ pathname: 'media/healthcheck.jpg', operations: ['put'] });
      info.test = 'ok';
    } catch (e) {
      info.ok = false;
      info.test = (e as Error).message;
    }
  }
  return NextResponse.json(info);
}

// phone → vercel blob directly (large files); this route only authorizes the upload
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody | HandleUploadPresignedBody;
  try {
    const authorize = async () => {
      if (!(await getCtx())) throw new Error('unauthorized');
    };
    if (body.type === 'blob.generate-presigned-url' || (body.type === 'blob.upload-completed' && blobMode() === 'presigned')) {
      const json = await handleUploadPresigned({
        body: body as HandleUploadPresignedBody,
        request: req,
        getSignedToken: async (pathname) => {
          await authorize();
          const token = await issueSignedToken({
            pathname,
            operations: ['put'],
            allowedContentTypes: UPLOAD_TYPES,
            maximumSizeInBytes: MAX_UPLOAD,
          });
          return { token, urlOptions: { allowedContentTypes: UPLOAD_TYPES, maximumSizeInBytes: MAX_UPLOAD } };
        },
      });
      return NextResponse.json(json);
    }
    const json = await handleUpload({
      body: body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async () => {
        await authorize();
        return { allowedContentTypes: UPLOAD_TYPES, maximumSizeInBytes: MAX_UPLOAD, addRandomSuffix: true };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    console.error('upload authorize failed', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
