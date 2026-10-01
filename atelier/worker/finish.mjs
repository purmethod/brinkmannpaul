// Uploads the rendered reel + cover to Vercel Blob and reports back to the app.
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

const body = { postId: payload.postId, token: payload.callbackToken, ok: false, error: result.error };
if (result.ok) {
  try {
    const { put } = await import('@vercel/blob');
    const opts = { access: 'public', addRandomSuffix: true, token: process.env.BLOB_READ_WRITE_TOKEN };
    const video = await put(`posts/${payload.postId}/reel.mp4`, readFileSync(result.video), { ...opts, contentType: 'video/mp4', multipart: true });
    const cover = await put(`posts/${payload.postId}/cover.jpg`, readFileSync(result.cover), { ...opts, contentType: 'image/jpeg' });
    Object.assign(body, {
      ok: true,
      error: undefined,
      videoUrl: video.url,
      coverUrl: cover.url,
      duration: result.duration,
      transcript: result.transcript,
      plan: result.plan,
    });
  } catch (e) {
    body.error = `upload failed: ${e.message}`;
  }
}

const res = await fetch(payload.callbackUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
console.log('callback', res.status, await res.text());
if (!res.ok || !body.ok) process.exit(1);
