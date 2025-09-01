import type { PostCard } from './postTypes';
import { joinPublicPath } from './basePath';

const CACHE_NAME = 'arti-posts-v1';

type Opts = { revalidateSeconds?: number };

/** Ключ для метки времени конкретного URL в localStorage */
const tsKey = (url: string) => `arti_ts_${url}`;

const isSSR = typeof window === 'undefined';
const isDev = (import.meta as any)?.env?.DEV ?? false;

/** Универсальная подгрузка JSON с Cache API + мягкая ревалидация */
async function fetchJsonWithCache<T>(
  url: string,
  revalidateSeconds: number
): Promise<T | null> {
  // SSR/DEV: без кэша
  if (isSSR || isDev || !('caches' in self)) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return null as any;
    return (await r.json()) as T;
  }

  const cache = await caches.open(CACHE_NAME);
  const stamp = Number(localStorage.getItem(tsKey(url)) || 0);
  const fresh = Date.now() - stamp < revalidateSeconds * 1000;
  const cached = await cache.match(url);

  if (cached && fresh) {
    // фоновой ревалид
    void (async () => {
      try {
        const rr = await fetch(url, { cache: 'no-cache' });
        if (rr.ok) {
          await cache.put(url, rr.clone());
          localStorage.setItem(tsKey(url), String(Date.now()));
        }
      } catch {}
    })();
    try {
      return (await cached.clone().json()) as T;
    } catch {
      // битый кэш — пойдём в сеть ниже
    }
  }

  try {
    const r = await fetch(url, { cache: cached ? 'no-cache' : 'default' });
    if (r.ok) {
      const data = (await r.clone().json()) as T;
      await cache.put(url, r);
      localStorage.setItem(tsKey(url), String(Date.now()));
      return data;
    }
  } catch {}

  if (cached) {
    try {
      return (await cached.clone().json()) as T;
    } catch {}
  }
  return null as any;
}

/** Универсальная подгрузка ТЕКСТА (HTML) с Cache API + мягкая ревалидация */
async function fetchTextWithCache(
  url: string,
  revalidateSeconds: number
): Promise<string | null> {
  if (isSSR || isDev || !('caches' in self)) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return null;
    return r.text();
  }

  const cache = await caches.open(CACHE_NAME);
  const stamp = Number(localStorage.getItem(tsKey(url)) || 0);
  const fresh = Date.now() - stamp < revalidateSeconds * 1000;
  const cached = await cache.match(url);

  if (cached && fresh) {
    void (async () => {
      try {
        const rr = await fetch(url, { cache: 'no-cache' });
        if (rr.ok) {
          await cache.put(url, rr.clone());
          localStorage.setItem(tsKey(url), String(Date.now()));
        }
      } catch {}
    })();
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

/** СПИСОК постов (posts.json) */
export async function fetchPosts(opts: Opts = {}): Promise<PostCard[]> {
  const { revalidateSeconds = 3600 } = opts;
  const url = joinPublicPath('posts.json');
  const data = await fetchJsonWithCache<PostCard[]>(url, revalidateSeconds);
  return Array.isArray(data) ? data : [];
}

/** ОДИН пост целиком как JSON (posts/<slug>.json) — удобно для клиентского Markdown-рендера */
export async function fetchPost(
  slug: string,
  opts: Opts = {}
): Promise<(PostCard & { content: string }) | null> {
  const { revalidateSeconds = 3600 } = opts;
  const url = joinPublicPath(`posts/${slug}.json`);
  return await fetchJsonWithCache<PostCard & { content: string }>(
    url,
    revalidateSeconds
  );
}

/** Статический HTML версии поста: сперва /blog/<slug>/index.html, затем /blog/<slug>/post.html (совместимость) */
export async function fetchPostHtml(
  slug: string,
  opts: Opts = {}
): Promise<string | null> {
  const { revalidateSeconds = 3600 } = opts;
  const tryUrls = [
    joinPublicPath(`blog/${slug}/index.html`),
    joinPublicPath(`blog/${slug}/post.html`),
  ];

  // SSR/DEV — идём по порядку без кэша
  if (isSSR || isDev || !('caches' in self)) {
    for (const url of tryUrls) {
      const r = await fetch(url, { cache: 'no-cache' });
      if (r.ok) return r.text();
    }
    return null;
  }

  // c кэшем — попробуем по очереди
  for (const url of tryUrls) {
    const text = await fetchTextWithCache(url, revalidateSeconds);
    if (text) return text;
  }
  return null;
}
