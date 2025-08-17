import type { PostCard } from './postTypes';

export async function fetchPosts(): Promise<PostCard[]> {
  const res = await fetch('/posts.json', { cache: 'no-cache' });
  if (!res.ok) return [];
  return res.json();
}
