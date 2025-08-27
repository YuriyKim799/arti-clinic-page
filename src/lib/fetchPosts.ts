
// import type { PostCard } from './postTypes';
// import { joinPublicPath } from './basePath';

// export async function fetchPosts(): Promise<PostCard[]> {
//   const res = await fetch(joinPublicPath('posts.json'), { cache: 'no-store' });
//   if (!res.ok) return [];
//   return res.json();
// }

// export async function fetchPostHtml(slug: string): Promise<string | null> {
//   const res = await fetch(joinPublicPath(`blog/${slug}/post.html`), {
//     cache: 'no-store',
//   });
//   if (!res.ok) return null;
//   return res.text();
// }

import type { PostCard } from './postTypes';
import { joinPublicPath } from './basePath';

const CACHE_NAME = 'arti-posts-v1';

type Opts = { revalidateSeconds?: number };

/** Ключ для метки времени конкретного URL */
const tsKey = (url: string) => `arti_ts_${url}`;

const isSSR = typeof window === 'undefined';
const isDev = import.meta.env?.DEV ?? false;

export async function fetchPosts(opts: Opts = {}): Promise<PostCard[]> {
  const { revalidateSeconds = 3600 } = opts;
  const url = joinPublicPath('posts.json');

  // SSR / Dev: без кэша, чтобы не мешать разработке
  if (isSSR || isDev || !('caches' in self)) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return [];
    return r.json();
  }

  const cache = await caches.open(CACHE_NAME);
  const now = Date.now();
  const stamp = Number(localStorage.getItem(tsKey(url)) || 0);
  const fresh = now - stamp < revalidateSeconds * 1000;

  // 1) пытаемся мгновенно отдать кэш
  const cached = await cache.match(url);
  if (cached && fresh) {
    // фоном ревалидируем (без await)
    void revalidate(url, cache);
    try {
      return await cached.clone().json();
    } catch {
      // если кэш битый — продолжим вниз на сеть
    }
  }

  // 2) сеть (с ревалидацией по ETag/Last-Modified)
  try {
    const r = await fetch(url, { cache: cached ? 'no-cache' : 'default' });
    if (r.ok) {
      const data = await r.clone().json();
      await cache.put(url, r);
      localStorage.setItem(tsKey(url), String(Date.now()));
      return data;
    }
  } catch {
    // офлайн / ошибка сети
  }

  // 3) fallback: если сеть не дала, но кэш есть — вернём его
  if (cached) {
    try {
      return await cached.clone().json();
    } catch {}
  }

  return [];
}

export async function fetchPostHtml(
  slug: string,
  opts: Opts = {}
): Promise<string | null> {
  const { revalidateSeconds = 3600 } = opts;
  const url = joinPublicPath(`blog/${slug}/post.html`);

  if (isSSR || isDev || !('caches' in self)) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return null;
    return r.text();
  }

  const cache = await caches.open(CACHE_NAME);
  const now = Date.now();
  const stamp = Number(localStorage.getItem(tsKey(url)) || 0);
  const fresh = now - stamp < revalidateSeconds * 1000;

  const cached = await cache.match(url);
  if (cached && fresh) {
    void revalidate(url, cache);
    try {
      return await cached.clone().text();
    } catch {}
  }

  try {
    const r = await fetch(url, { cache: cached ? 'no-cache' : 'default' });
    if (r.ok) {
      const text = await r.clone().text();
      await cache.put(url, r);
      localStorage.setItem(tsKey(url), String(Date.now()));
      return text;
    }
  } catch {}

  if (cached) {
    try {
      return await cached.clone().text();
    } catch {}
  }

  return null;
}

async function revalidate(url: string, cache: Cache) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (r.ok) {
      await cache.put(url, r.clone());
      localStorage.setItem(tsKey(url), String(Date.now()));
    }
  } catch {
    // тихо игнорируем офлайн
  }
}
