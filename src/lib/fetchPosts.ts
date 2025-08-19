// src/lib/fetchPosts.ts
import type { PostCard } from './postTypes';
import { joinPublicPath } from './basePath';

export async function fetchPosts(): Promise<PostCard[]> {
  const res = await fetch(joinPublicPath('posts.json'), { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPostHtml(slug: string): Promise<string | null> {
  const res = await fetch(joinPublicPath(`blog/${slug}/post.html`), {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.text();
}
