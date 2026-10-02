// Uploads the rendered reel + cover into Vercel Blob (presigned targets from the app) and reports back.
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

async function upload(target, file) {
  const res = await fetch(target.url, { method: target.method || 'PUT', headers: target.headers, body: readFileSync(file) });
  if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json().catch(() => ({}));
  return json.url || target.publicUrl;
}

const body = { postId: payload.postId, token: payload.callbackToken, ok: false, error: result.error };
if (result.ok) {
  try {
    const videoUrl = await upload(payload.uploads.video, result.video);
    const coverUrl = await upload(payload.uploads.cover, result.cover);
    Object.assign(body, { ok: true, error: undefined, videoUrl, coverUrl, duration: result.duration, transcript: result.transcript, plan: result.plan });
  } catch (e) {
    body.error = `upload failed: ${e.message}`;
  }
}

const res = await fetch(payload.callbackUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
console.log('callback', res.status, await res.text());
if (!res.ok || !body.ok) process.exit(1);
