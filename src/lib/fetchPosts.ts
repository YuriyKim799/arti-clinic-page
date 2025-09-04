import type { PostCard } from './postTypes';
import { joinPublicPath } from './basePath';

const CACHE_NAME = 'arti-posts-v1';
type Opts = { revalidateSeconds?: number };

const isSSR = typeof window === 'undefined';
const isDev = (import.meta as any)?.env?.DEV ?? false;

const hasFetch = typeof (globalThis as any).fetch === 'function';
const hasCachesFlag = (() => {
  try { return typeof self !== 'undefined' && 'caches' in self; } catch { return false; }
})();

let cacheUsable: boolean | null = null; // лениво определяем пригодность Cache API

/* ───────── helpers ───────── */

const tsKey = (url: string) => `arti_ts_${url}`;
function lsGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} }

function safeParseJSON(text: string): any {
  const t1 = text.replace(/^\uFEFF/, '').trim();
  try { return JSON.parse(t1); } catch {}
  const t2 = t1.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  try { return JSON.parse(t2); } catch { return null; }
}

async function httpGetText(url: string, cacheMode: RequestCache): Promise<string | null> {
  if (hasFetch) {
    try {
      const res = await fetch(url, { cache: cacheMode, credentials: 'omit' });
      return await res.text();
    } catch { /* next */ }
  }
  // XHR фолбэк (старые Android/Samsung WebView)
  return await new Promise<string | null>((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      if ((xhr as any).overrideMimeType) xhr.overrideMimeType('application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) resolve(xhr.responseText || null);
      };
      xhr.onerror = function () { resolve(null); };
      xhr.send();
    } catch { resolve(null); }
  });
}

function makeTextResponse(text: string, contentType: string): Response | null {
  try { return new Response(text, { headers: { 'Content-Type': contentType } }); } catch { return null; }
}

async function canUseCache(): Promise<boolean> {
  if (!hasCachesFlag || isSSR || isDev) return false;
  if (cacheUsable != null) return cacheUsable;
  try { await caches.open(CACHE_NAME); cacheUsable = true; }
  catch { cacheUsable = false; }
  return cacheUsable!;
}

/* ───────── core loaders ───────── */

async function fetchJsonWithCache<T>(url: string, revalidateSeconds: number): Promise<T | null> {
  // Без кэша — просто сеть с фолбэком
  if (!(await canUseCache())) {
    const txt = await httpGetText(url, 'no-cache');
    return (txt == null) ? null : (safeParseJSON(txt) as T);
  }

  const cache = await caches.open(CACHE_NAME);
  const stamp = Number(lsGet(tsKey(url)) || 0);
  const fresh = Date.now() - stamp < revalidateSeconds * 1000;
  const cached = await cache.match(url);

  if (cached && fresh) {
    // фонова́я ревалидация
    void (async () => {
      try {
        const t = await httpGetText(url, 'no-cache');
        if (t != null) {
          const resp = makeTextResponse(t, 'application/json');
          if (resp) { await cache.put(url, resp.clone()); lsSet(tsKey(url), String(Date.now())); }
        }
      } catch {}
    })();
    try {
      const txt = await cached.clone().text();
      return safeParseJSON(txt) as T;
    } catch { /* fallthrough */ }
  }

  try {
    const txt = await httpGetText(url, cached ? 'no-cache' : 'default');
    if (txt != null) {
      const resp = makeTextResponse(txt, 'application/json');
      if (resp) { await cache.put(url, resp.clone()); lsSet(tsKey(url), String(Date.now())); }
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

async function fetchTextWithCache(url: string, revalidateSeconds: number): Promise<string | null> {
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
          if (resp) { await cache.put(url, resp.clone()); lsSet(tsKey(url), String(Date.now())); }
        }
      } catch {}
    })();
    try { return await cached.clone().text(); } catch {}
  }

  try {
    const txt = await httpGetText(url, cached ? 'no-cache' : 'default');
    if (txt != null) {
      const resp = makeTextResponse(txt, 'text/html; charset=utf-8');
      if (resp) { await cache.put(url, resp.clone()); lsSet(tsKey(url), String(Date.now())); }
      return txt;
    }
  } catch {}

  if (cached) {
    try { return await cached.clone().text(); } catch {}
  }
  return null;
}

/* ───────── public API ───────── */

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
  return data && typeof data === 'object' ? (data as PostCard & { content: string }) : null;
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
    for (const url of tryUrls) {
      const t = await httpGetText(url, 'no-cache');
      if (t) return t;
    }
    return null;
  }

  for (const url of tryUrls) {
    const text = await fetchTextWithCache(url, revalidateSeconds);
    if (text) return text;
  }
  return null;
}
