import { resolveBrand } from './brand';
import { sign } from './crypto';
import { mediaByIds } from './media';
import { appOrigin } from './origin';
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
  const clips = (await mediaByIds(post.media_ids)).filter((m) => m.kind === 'video').map((m) => m.url);
  if (!clips.length) throw new Error('no video to cut');
  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    body: JSON.stringify({
      event_type: 'atelier-render',
      client_payload: {
        postId: post.id,
        callbackUrl: `${appOrigin()}/api/worker/callback`,
        callbackToken: callbackToken(post.id),
        kit: row.kit,
        template: post.template,
        clips,
        options: {
          rules: brand.cutRules,
          feedback: extra.feedback ?? null,
          language: post.options.subtitleLanguage || brand.subtitleLanguage,
          voiceover: post.options.voiceoverUrl ?? null,
          signature: row.settings?.signatureUrl ?? null,
          plan: extra.reusePlan ? post.output.plan ?? null : null,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`github ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
