import { redis } from './redis';
import type { Post } from './types';

const key = (id: string) => `post:${id}`;

export function newId(): string {
  // starts with a letter so upstash never deserializes it as a number
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function savePost(post: Post): Promise<Post> {
  post.updatedAt = Date.now();
  await redis().set(key(post.id), post);
  await redis().zadd('posts', { score: post.createdAt, member: post.id });
  return post;
}

export async function getPost(id: string): Promise<Post | null> {
  return (await redis().get<Post>(key(id))) ?? null;
}

export async function updatePost(id: string, patch: Partial<Post>): Promise<Post> {
  const post = await getPost(id);
  if (!post) throw new Error(`post not found: ${id}`);
  return savePost({ ...post, ...patch });
}

export async function deletePost(id: string): Promise<void> {
  await redis().del(key(id));
  await redis().zrem('posts', id);
}

export async function listPosts(): Promise<Post[]> {
  const ids = await redis().zrange<string[]>('posts', 0, -1, { rev: true });
  if (!ids.length) return [];
  const posts = await redis().mget<(Post | null)[]>(...ids.map((i) => key(String(i))));
  return posts.filter((p): p is Post => Boolean(p));
}
