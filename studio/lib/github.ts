import type { Post } from './types';

export function appOrigin(fallback: string): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return fallback;
}

/** Triggers .github/workflows/process-video.yml via repository_dispatch. */
export async function dispatchVideoJob(post: Post, origin: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');
  const repo = process.env.GITHUB_REPO || 'purmethod/brinkmannpaul';
  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'process-video',
      client_payload: {
        postId: post.id,
        brandId: post.brandId,
        templateId: post.templateId,
        clips: post.source.media ?? [],
        callbackUrl: `${appOrigin(origin)}/api/video/callback`,
      },
    }),
  });
  if (!res.ok) throw new Error(`github ${res.status}: ${await res.text()}`);
}
