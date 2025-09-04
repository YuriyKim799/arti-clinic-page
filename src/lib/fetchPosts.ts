// import type { PostCard } from './postTypes';
// import { joinPublicPath } from './basePath';

// const CACHE_NAME = 'arti-posts-v1';

// type Opts = { revalidateSeconds?: number };

// /** Ключ для метки времени конкретного URL в localStorage */
// const tsKey = (url: string) => `arti_ts_${url}`;

// const isSSR = typeof window === 'undefined';
// const isDev = (import.meta as any)?.env?.DEV ?? false;

// /** Универсальная подгрузка JSON с Cache API + мягкая ревалидация */
// async function fetchJsonWithCache<T>(
//   url: string,
//   revalidateSeconds: number
// ): Promise<T | null> {
//   // SSR/DEV: без кэша
//   if (isSSR || isDev || !('caches' in self)) {
//     const r = await fetch(url, { cache: 'no-cache' });
//     if (!r.ok) return null as any;
//     return (await r.json()) as T;
//   }

//   const cache = await caches.open(CACHE_NAME);
//   const stamp = Number(localStorage.getItem(tsKey(url)) || 0);
//   const fresh = Date.now() - stamp < revalidateSeconds * 1000;
//   const cached = await cache.match(url);

//   if (cached && fresh) {
//     // фоновой ревалид
//     void (async () => {
//       try {
//         const rr = await fetch(url, { cache: 'no-cache' });
//         if (rr.ok) {
//           await cache.put(url, rr.clone());
//           localStorage.setItem(tsKey(url), String(Date.now()));
//         }
//       } catch {}
//     })();
//     try {
//       return (await cached.clone().json()) as T;
//     } catch {
//       // битый кэш — пойдём в сеть ниже
//     }
//   }

//   try {
//     const r = await fetch(url, { cache: cached ? 'no-cache' : 'default' });
//     if (r.ok) {
//       const data = (await r.clone().json()) as T;
//       await cache.put(url, r);
//       localStorage.setItem(tsKey(url), String(Date.now()));
//       return data;
//     }
//   } catch {}

//   if (cached) {
//     try {
//       return (await cached.clone().json()) as T;
//     } catch {}
//   }
//   return null as any;
// }

// /** Универсальная подгрузка ТЕКСТА (HTML) с Cache API + мягкая ревалидация */
// async function fetchTextWithCache(
//   url: string,
//   revalidateSeconds: number
// ): Promise<string | null> {
//   if (isSSR || isDev || !('caches' in self)) {
//     const r = await fetch(url, { cache: 'no-cache' });
//     if (!r.ok) return null;
//     return r.text();
//   }

//   const cache = await caches.open(CACHE_NAME);
//   const stamp = Number(localStorage.getItem(tsKey(url)) || 0);
//   const fresh = Date.now() - stamp < revalidateSeconds * 1000;
//   const cached = await cache.match(url);

//   if (cached && fresh) {
//     void (async () => {
//       try {
//         const rr = await fetch(url, { cache: 'no-cache' });
//         if (rr.ok) {
//           await cache.put(url, rr.clone());
//           localStorage.setItem(tsKey(url), String(Date.now()));
//         }
//       } catch {}
//     })();
//     try {
//       return await cached.clone().text();
//     } catch {}
//   }

//   try {
//     const r = await fetch(url, { cache: cached ? 'no-cache' : 'default' });
//     if (r.ok) {
//       const text = await r.clone().text();
//       await cache.put(url, r);
//       localStorage.setItem(tsKey(url), String(Date.now()));
//       return text;
//     }
//   } catch {}

//   if (cached) {
//     try {
//       return await cached.clone().text();
//     } catch {}
//   }
//   return null;
// }

// /** СПИСОК постов (posts.json) */
// export async function fetchPosts(opts: Opts = {}): Promise<PostCard[]> {
//   const { revalidateSeconds = 3600 } = opts;
//   const url = joinPublicPath('posts.json');
//   const data = await fetchJsonWithCache<PostCard[]>(url, revalidateSeconds);
//   return Array.isArray(data) ? data : [];
// }

// /** ОДИН пост целиком как JSON (posts/<slug>.json) — удобно для клиентского Markdown-рендера */
// export async function fetchPost(
//   slug: string,
//   opts: Opts = {}
// ): Promise<(PostCard & { content: string }) | null> {
//   const { revalidateSeconds = 3600 } = opts;
//   const url = joinPublicPath(`posts/${slug}.json`);
//   return await fetchJsonWithCache<PostCard & { content: string }>(
//     url,
//     revalidateSeconds
//   );
// }

// /** Статический HTML версии поста: сперва /blog/<slug>/index.html, затем /blog/<slug>/post.html (совместимость) */
// export async function fetchPostHtml(
//   slug: string,
//   opts: Opts = {}
// ): Promise<string | null> {
//   const { revalidateSeconds = 3600 } = opts;
//   const tryUrls = [
//     joinPublicPath(`blog/${slug}/index.html`),
//     joinPublicPath(`blog/${slug}/post.html`),
//   ];

//   // SSR/DEV — идём по порядку без кэша
//   if (isSSR || isDev || !('caches' in self)) {
//     for (const url of tryUrls) {
//       const r = await fetch(url, { cache: 'no-cache' });
//       if (r.ok) return r.text();
//     }
//     return null;
//   }

//   // c кэшем — попробуем по очереди
//   for (const url of tryUrls) {
//     const text = await fetchTextWithCache(url, revalidateSeconds);
//     if (text) return text;
//   }
//   return null;
// }
// src/lib/fetchPosts.ts
import type { PostCard } from './postTypes';
import { joinPublicPath } from './basePath';

const CACHE_NAME = 'arti-posts-v1';
type Opts = { revalidateSeconds?: number };

const isSSR = typeof window === 'undefined';
const isDev = (import.meta as any)?.env?.DEV ?? false;

const hasFetch = typeof (globalThis as any).fetch === 'function';
const hasCachesFlag = typeof (self as any) !== 'undefined' && 'caches' in self;

let cacheUsable: boolean | null = null; // лениво определяем

/* ───────────── helpers ───────────── */

function lsGet(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}
const tsKey = (url: string) => `arti_ts_${url}`;

function safeParseJSON(text: string): any {
  const t1 = text.replace(/^\uFEFF/, '').trim();
  try {
    return JSON.parse(t1);
  } catch {
    /* fallthrough */
  }
  const t2 = t1.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  try {
    return JSON.parse(t2);
  } catch {
    return null;
  }
}

async function httpGetText(
  url: string,
  cacheMode: RequestCache
): Promise<string | null> {
  // fetch
  if (hasFetch) {
    try {
      const res = await fetch(url, { cache: cacheMode, credentials: 'omit' });
      return await res.text();
    } catch {
      /* next */
    }
  }
  // XHR фолбэк
  return await new Promise<string | null>((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      if ((xhr as any).overrideMimeType)
        xhr.overrideMimeType('application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) resolve(xhr.responseText || null);
      };
      xhr.onerror = function () {
        resolve(null);
      };
      xhr.send();
    } catch {
      resolve(null);
    }
  });
}

function makeTextResponse(text: string, type: string): Response | null {
  try {
    return new Response(text, { headers: { 'Content-Type': type } });
  } catch {
    return null;
  }
}

async function canUseCache(): Promise<boolean> {
  if (!hasCachesFlag || isSSR || isDev) return false;
  if (cacheUsable != null) return cacheUsable;
  try {
    await caches.open(CACHE_NAME);
    cacheUsable = true;
  } catch {
    cacheUsable = false; // Safari/старые WebView/Privacy режим
  }
  return cacheUsable!;
}

/* ───────────── core loaders ───────────── */

async function fetchJsonWithCache<T>(
  url: string,
  revalidateSeconds: number
): Promise<T | null> {
  // Если кэш недоступен — просто сеть (с фолбэком)
  if (!(await canUseCache())) {
    const txt = await httpGetText(url, 'no-cache');
    return txt == null ? null : (safeParseJSON(txt) as T);
  }

  const cache = await caches.open(CACHE_NAME);
  const stamp = Number(lsGet(tsKey(url)) || 0);
  const fresh = Date.now() - stamp < revalidateSeconds * 1000;
  const cached = await cache.match(url);

  if (cached && fresh) {
    // Фоновая ревалидция
    void (async () => {
      try {
        const t = await httpGetText(url, 'no-cache');
        if (t != null) {
          const resp = makeTextResponse(t, 'application/json');
          if (resp) {
            await cache.put(url, resp.clone());
            lsSet(tsKey(url), String(Date.now()));
          }
        }
      } catch {}
    })();
    try {
      const txt = await cached.clone().text();
      return safeParseJSON(txt) as T;
    } catch {
      /* fallthrough */
    }
  }

  try {
    const txt = await httpGetText(url, cached ? 'no-cache' : 'default');
    if (txt != null) {
      const resp = makeTextResponse(txt, 'application/json');
      if (resp) {
        await cache.put(url, resp.clone());
        lsSet(tsKey(url), String(Date.now()));
      }
      return safeParseJSON(txt) as T;
    }
  } catch {}

  if (cached) {
    try {
      const txt = await cached.clone().text();
      return safeParseJSON(txt) as T;
    } catch {}
  }
  return null;
}

async function fetchTextWithCache(
  url: string,
  revalidateSeconds: number
): Promise<string | null> {
  if (!(await canUseCache())) {
    return await httpGetText(url, 'no-cache');
  }

  const cache = await caches.open(CACHE_NAME);
  const stamp = Number(lsGet(tsKey(url)) || 0);
  const fresh = Date.now() - stamp < revalidateSeconds * 1000;
  const cached = await cache.match(url);

  if (cached && fresh) {
    void (async () => {
      try {
        const t = await httpGetText(url, 'no-cache');
        if (t != null) {
          const resp = makeTextResponse(t, 'text/html; charset=utf-8');
          if (resp) {
            await cache.put(url, resp.clone());
            lsSet(tsKey(url), String(Date.now()));
          }
        }
      } catch {}
    })();
    try {
      return await cached.clone().text();
    } catch {}
  }

  try {
    const txt = await httpGetText(url, cached ? 'no-cache' : 'default');
    if (txt != null) {
      const resp = makeTextResponse(txt, 'text/html; charset=utf-8');
      if (resp) {
        await cache.put(url, resp.clone());
        lsSet(tsKey(url), String(Date.now()));
      }
      return txt;
    }
  } catch {}

  if (cached) {
    try {
      return await cached.clone().text();
    } catch {}
  }
  return null;
}

/* ───────────── public API ───────────── */

export async function fetchPosts(opts: Opts = {}): Promise<PostCard[]> {
  const { revalidateSeconds = 3600 } = opts;
  const url = joinPublicPath('posts.json');
  const data = await fetchJsonWithCache<any>(url, revalidateSeconds);
  return Array.isArray(data) ? (data as PostCard[]) : [];
}

export async function fetchPost(
  slug: string,
  opts: Opts = {}
): Promise<(PostCard & { content: string }) | null> {
  const { revalidateSeconds = 3600 } = opts;
  const url = joinPublicPath(`posts/${slug}.json`);
  const data = await fetchJsonWithCache<any>(url, revalidateSeconds);
  return data && typeof data === 'object'
    ? (data as PostCard & { content: string })
    : null;
}

export async function fetchPostHtml(
  slug: string,
  opts: Opts = {}
): Promise<string | null> {
  const { revalidateSeconds = 3600 } = opts;
  const tryUrls = [
    joinPublicPath(`blog/${slug}/index.html`),
    joinPublicPath(`blog/${slug}/post.html`),
  ];

  if (!(await canUseCache())) {
    for (const u of tryUrls) {
      const t = await httpGetText(u, 'no-cache');
      if (t) return t;
    }
    return null;
  }

  for (const u of tryUrls) {
    const t = await fetchTextWithCache(u, revalidateSeconds);
    if (t) return t;
  }
  return null;
}
