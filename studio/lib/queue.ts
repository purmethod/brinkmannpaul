import { publishToInstagram } from './instagram';
import { redis } from './redis';
import { getPost, listPosts, savePost } from './store';
import type { Post } from './types';

/** Next approved post: due desired dates first (oldest date first), then undated in approval order. */
export async function pickNext(brandId: string, today: string): Promise<Post | null> {
  const approved = (await listPosts(brandId)).filter((p) => p.status === 'approved');
  const dated = approved
    .filter((p) => p.scheduledFor && p.scheduledFor <= today)
    .sort((a, b) => a.scheduledFor!.localeCompare(b.scheduledFor!) || (a.approvedAt ?? 0) - (b.approvedAt ?? 0));
  if (dated.length) return dated[0];
  const undated = approved.filter((p) => !p.scheduledFor).sort((a, b) => (a.approvedAt ?? a.createdAt) - (b.approvedAt ?? b.createdAt));
  return undated[0] ?? null;
}

export async function publishPost(id: string): Promise<Post> {
  const lockKey = `lock:publish:${id}`;
  if (!(await redis().set(lockKey, 1, { nx: true, ex: 900 }))) throw new Error('post is already being published');
  try {
    const post = await getPost(id);
    if (!post) throw new Error(`post not found: ${id}`);
    if (post.status !== 'approved') throw new Error(`post is ${post.status}, not approved`);
    try {
      const { mediaId, permalink } = await publishToInstagram(post);
      return await savePost({ ...post, status: 'posted', postedAt: Date.now(), igMediaId: mediaId, permalink, error: null });
    } catch (e) {
      return await savePost({ ...post, status: 'error', error: (e as Error).message });
    }
  } finally {
    await redis().del(lockKey);
  }
}
