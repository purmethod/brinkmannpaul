import { uploadTarget } from './blob';
import { resolveBrand } from './brand';
import { sign } from './crypto';
import { mediaByIds } from './media';
import { appOrigin } from './origin';
import { LOOKS, type LookId } from './reel';
import type { BrandRow, Post } from './types';

export const callbackToken = (postId: string) => sign(`render:${postId}`);

/**
 * Render worker = github action (.github/workflows/atelier-render.yml) via repository_dispatch.
 * Swap this function to move rendering to an own server — the payload stays the same.
 */
export async function dispatchRender(post: Post, row: BrandRow, extra: { feedback?: string; reusePlan?: boolean } = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN missing (needed to cut videos)');
  const repo = process.env.GITHUB_REPO || 'purmethod/brinkmannpaul';
  const brand = resolveBrand(row);
  // the channel's look and word style (or this post's own); without a chosen style the brand's subtitles stay
  const style = row.settings?.style ?? {};
  const look = LOOKS[(post.options.look ?? style.look ?? 'natural') as LookId] ?? LOOKS.natural;
  const textStyle = post.options.textStyle ?? style.text ?? null;
  const clips = (await mediaByIds(post.media_ids)).filter((m) => m.kind === 'video').map((m) => m.url);
  if (!clips.length) throw new Error('no video to cut');
  // the worker uploads straight into blob with these (no storage credentials in github)
  const v = Date.now().toString(36);
  const [video, cover] = await Promise.all([
    uploadTarget(`posts/${post.id}/${v}/reel.mp4`, 'video/mp4', ['video/mp4'], 6),
    uploadTarget(`posts/${post.id}/${v}/cover.jpg`, 'image/jpeg', ['image/jpeg'], 6),
  ]);
  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    body: JSON.stringify({
      event_type: 'atelier-render',
      client_payload: {
        postId: post.id,
        ref: process.env.WORKER_REF || process.env.VERCEL_GIT_COMMIT_REF || undefined,
        callbackUrl: `${appOrigin()}/api/worker/callback`,
        callbackToken: callbackToken(post.id),
        kit: row.kit,
        template: post.template,
        clips,
        uploads: { video, cover },
        options: {
          rules: brand.cutRules,
          feedback: extra.feedback ?? null,
          language: post.options.subtitleLanguage || brand.subtitleLanguage,
          voiceover: post.options.voiceoverUrl ?? null,
          signature: row.settings?.signatureUrl ?? null,
          plan: extra.reusePlan ? post.output.plan ?? null : null,
          // montage (mostly silent footage): what it is about steers the beats and the words on screen
          description: post.description ?? null,
          notes: post.options.notes ?? null,
          targetSeconds: 7,
          look: look.filter,
          textStyle,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`github ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
