// Uploads the rendered reel to Vercel Blob and reports the result to the app.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const work = process.env.WORK_DIR || 'work';
const payload = JSON.parse(process.env.PAYLOAD || '{}');

let result;
try {
  result = JSON.parse(readFileSync(path.join(work, 'result.json'), 'utf8'));
} catch {
  result = { ok: false, error: 'worker crashed before writing a result (see github action log)' };
}

const body = { postId: payload.postId, ok: false, error: result.error };
if (result.ok) {
  try {
    const { put } = await import('@vercel/blob');
    const blob = await put(`posts/${payload.postId}/reel.mp4`, readFileSync(result.video), {
      access: 'public',
      contentType: 'video/mp4',
      addRandomSuffix: true,
      multipart: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    Object.assign(body, { ok: true, error: undefined, videoUrl: blob.url, duration: result.duration, transcript: result.transcript });
  } catch (e) {
    body.error = `blob upload failed: ${e.message}`;
  }
}

const res = await fetch(payload.callbackUrl, {
  method: 'POST',
  headers: { authorization: `Bearer ${process.env.ADMIN_SECRET}`, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
console.log('callback', res.status, await res.text());
if (!res.ok || !body.ok) process.exit(1);
