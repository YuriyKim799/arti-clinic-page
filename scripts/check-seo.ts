import fs from 'node:fs';
import path from 'node:path';

type Page = { route: string; file: string };
type Tag = { name: string; attributes: Record<string, string> };

const dist = path.resolve('dist');
const site = new URL(process.env.SITE_ORIGIN || process.env.VITE_SITE_URL || 'https://articlinic.ru').origin;
const errors = new Set<string>();
const fail = (route: string, message: string) => errors.add(`${route}: ${message}`);

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
    sol: '/', bsol: '\\', colon: ':', period: '.',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|sol|bsol|colon|period);/gi,
    (entity, name: string) => {
      if (!name.startsWith('#')) return named[name.toLowerCase()] ?? entity;
      const hex = /^#x/i.test(name);
      const codePoint = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    });
}

function attributes(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function tags(html: string): Tag[] {
  // Comments and script contents may contain markup that is not part of the page.
  const markup = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  return [...markup.matchAll(/<([a-z][\w:-]*)\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gi)]
    .map(match => ({ name: match[1].toLowerCase(), attributes: attributes(match[2]) }));
}

function staysInDist(file: string): boolean {
  const relative = path.relative(dist, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function distFile(relative: string, route: string): string | null {
  const file = path.resolve(dist, relative);
  if (path.isAbsolute(relative) || !staysInDist(file)) {
    fail(route, `unsafe file path ${JSON.stringify(relative)}`);
    return null;
  }
  return file;
}

function read(relative: string, route = relative): string | null {
  const file = distFile(relative, route);
  if (!file) return null;
  try {
    if (!staysInDist(fs.realpathSync(file))) {
      fail(route, `file resolves outside dist: ${relative}`);
      return null;
    }
    return fs.readFileSync(file, 'utf8');
  } catch {
    fail(route, `missing or unreadable dist/${relative}`);
    return null;
  }
}

function parseJson<T>(text: string | null, label: string): T | null {
  if (text === null) return null;
  try { return JSON.parse(text) as T; }
  catch { fail(label, 'invalid JSON'); return null; }
}

function localUrl(raw: string, base: string, route: string, field: string): URL | null {
  if (!raw.trim() || /^(?:data|blob|mailto|tel|javascript):/i.test(raw.trim())) return null;
  try {
    const url = new URL(decodeEntities(raw), base);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== site) return null;
    return url;
  } catch {
    fail(route, `invalid ${field} URL ${JSON.stringify(raw)}`);
    return null;
  }
}

function localPath(url: URL, route: string): string | null {
  try {
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) {
      fail(route, `unsafe local URL path ${JSON.stringify(url.pathname)}`);
      return null;
    }
    return pathname;
  } catch {
    fail(route, `invalid URL path encoding ${JSON.stringify(url.pathname)}`);
    return null;
  }
}

function imageExists(raw: string, base: string, route: string, field: string): void {
  if (!raw.trim()) { fail(route, `empty ${field}`); return; }
  const url = localUrl(raw, base, route, field);
  if (!url) return;
  const pathname = localPath(url, route);
  if (pathname === null) return;
  const file = distFile(pathname.replace(/^\/+/, ''), route);
  if (!file) return;
  try {
    if (!fs.statSync(file).isFile() || !staysInDist(fs.realpathSync(file))) throw Error();
  } catch { fail(route, `missing local ${field}: ${raw} (dist${pathname})`); }
}

function srcsetUrls(srcset: string): string[] {
  const urls: string[] = [];
  let i = 0;
  while (i < srcset.length) {
    while (i < srcset.length && /[\s,]/.test(srcset[i])) i++;
    const start = i;
    while (i < srcset.length && !/\s/.test(srcset[i])) i++;
    let url = srcset.slice(start, i);
    if (!url) break;
    const endsInComma = url.endsWith(',');
    url = url.replace(/,+$/, '');
    if (url) urls.push(url);
    if (endsInComma) continue;
    // A data URL's internal commas belong to its URL, not another candidate.
    let parentheses = 0;
    while (i < srcset.length) {
      const character = srcset[i++];
      if (character === '(') parentheses++;
      if (character === ')') parentheses = Math.max(0, parentheses - 1);
      if (character === ',' && parentheses === 0) break;
    }
  }
  return urls;
}

function checkSchemaImages(node: unknown, base: string, route: string): void {
  if (Array.isArray(node)) { node.forEach(child => checkSchemaImages(child, base, route)); return; }
  if (!node || typeof node !== 'object') return;
  const object = node as Record<string, unknown>;
  const imageValue = (value: unknown, field: string): void => {
    if (typeof value === 'string') imageExists(value, base, route, field);
    else if (Array.isArray(value)) value.forEach(child => imageValue(child, field));
    else if (value && typeof value === 'object') {
      const image = value as Record<string, unknown>;
      for (const key of ['url', 'contentUrl']) {
        if (typeof image[key] === 'string') imageExists(image[key], base, route, `${field}.${key}`);
      }
    }
  };
  for (const key of ['image', 'logo']) {
    if (key in object) imageValue(object[key], `schema ${key}`);
  }
  const types = Array.isArray(object['@type']) ? object['@type'] : [object['@type']];
  if (types.includes('ImageObject')) {
    for (const key of ['url', 'contentUrl', 'thumbnailUrl']) {
      if (key in object) imageValue(object[key], `schema ImageObject.${key}`);
    }
  }
  // Page, organization and author URLs are identifiers, not image resources.
  Object.values(object).forEach(child => checkSchemaImages(child, base, route));
}

function routeKey(route: string): string {
  return route.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
}

let routes: Page[] = [];
try { routes = parseJson<Page[]>(fs.readFileSync('.cache/routes.json', 'utf8'), 'routes manifest') ?? []; }
catch { fail('routes manifest', 'missing .cache/routes.json; run prerender before the SEO check'); }
if (!Array.isArray(routes)) { fail('routes manifest', 'expected an array of routes'); routes = []; }

const posts = parseJson<{ slug: string }[]>(read('posts.json'), 'posts.json') ?? [];
const articles: Page[] = Array.isArray(posts)
  ? posts.filter(post => typeof post?.slug === 'string').map(post => ({
      route: `/blog/${post.slug}/`, file: `blog/${post.slug}/index.html`,
    }))
  : [];
if (!Array.isArray(posts)) fail('posts.json', 'expected an array of articles');

const sitemap = read('sitemap.xml');
const sitemapUrls = sitemap
  ? [...sitemap.matchAll(/<loc\b[^>]*>([^<]+)<\/loc>/gi)].map(match => decodeEntities(match[1].trim()))
  : [];
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml', 'duplicate URLs');
if (!sitemapUrls.length) fail('sitemap.xml', 'no page URLs');

const pages = new Map<string, Page>();
for (const page of [...routes, ...articles]) pages.set(routeKey(page.route), page);
const sitemapRoutes = new Set<string>();
for (const raw of sitemapUrls) {
  const url = localUrl(raw, site + '/', 'sitemap.xml', 'page');
  if (!url) { fail('sitemap.xml', `page URL is outside the canonical origin: ${raw}`); continue; }
  if (url.search || url.hash) fail('sitemap.xml', `page URL has a query or fragment: ${raw}`);
  const route = localPath(url, 'sitemap.xml');
  if (!route) continue;
  const key = routeKey(route);
  sitemapRoutes.add(key);
  if (!pages.has(key)) {
    pages.set(key, { route, file: route === '/' ? 'index.html' : route.replace(/^\/+|\/+$/g, '') + '/index.html' });
  }
}
for (const article of articles) {
  if (!sitemapRoutes.has(routeKey(article.route))) fail(article.route, 'article missing from sitemap');
}

for (const { route, file } of pages.values()) {
  const html = read(file, route);
  if (html === null) continue;
  const base = site + route;
  const pageTags = tags(html);
  for (const name of ['h1', 'title']) {
    const count = pageTags.filter(tag => tag.name === name).length;
    if (count !== 1) fail(route, `expected exactly one ${name.toUpperCase()}, found ${count}`);
  }
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? '';
  if (!decodeEntities(title).trim()) fail(route, 'empty title');
  const canonicals = pageTags.filter(tag => tag.name === 'link' &&
    (tag.attributes.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1) fail(route, `expected exactly one canonical, found ${canonicals.length}`);
  if (canonicals[0]?.attributes.href !== base) {
    fail(route, `wrong canonical: ${JSON.stringify(canonicals[0]?.attributes.href)}; expected ${base}`);
  }
  if (html.includes('127.0.0.1:') || html.includes('localhost:')) fail(route, 'preview origin leaked into HTML');

  const descriptions = pageTags.filter(tag => tag.name === 'meta' &&
    (tag.attributes.name || '').toLowerCase() === 'description');
  if (descriptions.length !== 1) fail(route, `expected exactly one description, found ${descriptions.length}`);
  const description = descriptions[0]?.attributes.content?.trim() ?? '';
  if (!description) fail(route, 'empty description');
  if (/Рекламу можно|С подпиской|Дзен Про|Отключить рекламу|Подписаться|подписчиков|Читать далее|\/blog\/|\/articlinic\b|https?:\/\//i.test(description)) {
    fail(route, `description contains imported UI or a raw URL/path: ${JSON.stringify(description)}`);
  }

  for (const tag of pageTags) {
    const attrs = tag.attributes;
    if (tag.name === 'img' && 'src' in attrs) imageExists(attrs.src, base, route, 'img src');
    if (['img', 'source'].includes(tag.name) && 'srcset' in attrs) {
      srcsetUrls(attrs.srcset).forEach(url => imageExists(url, base, route, `${tag.name} srcset`));
    }
    if (tag.name === 'meta' && /^(?:og:image(?::url|:secure_url)?|twitter:image)$/i.test(attrs.property || attrs.name || '')) {
      imageExists(attrs.content || '', base, route, attrs.property || attrs.name);
    }
    if (tag.name === 'a' && attrs.href && !attrs.href.startsWith('#')) {
      const url = localUrl(attrs.href, base, route, 'href');
      if (!url) continue;
      const pathname = localPath(url, route);
      if (pathname === null) continue;
      if (routeKey(pathname) === '/away' || routeKey(pathname) === '/articlinic') {
        fail(route, `imported Dzen navigation link: ${attrs.href}`);
      } else if (!pages.has(routeKey(pathname))) {
        fail(route, `internal link has no generated route: ${attrs.href}`);
      }
    }
  }

  const schemas: unknown[] = [];
  for (const match of html.matchAll(/<script\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi)) {
    if ((attributes(match[1]).type || '').toLowerCase() !== 'application/ld+json') continue;
    const schema = parseJson<unknown>(match[2], `${route} structured data`);
    if (schema !== null) schemas.push(schema);
  }
  schemas.forEach(schema => checkSchemaImages(schema, base, route));
  if (route.startsWith('/blog/') && (!pageTags.some(tag => tag.name === 'article') || !schemas.length)) {
    fail(route, 'article content or structured data missing');
  }
  if (sitemapRoutes.has(routeKey(route)) && pageTags.some(tag => tag.name === 'meta' &&
    /^(?:robots|googlebot|yandex)$/i.test(tag.attributes.name || '') && /\bnoindex\b/i.test(tag.attributes.content || ''))) {
    fail(route, 'sitemap page has a noindex directive');
  }
}

const notFoundHtml = read('404.html');
if (notFoundHtml && !tags(notFoundHtml).some(tag => tag.name === 'meta' &&
  (tag.attributes.name || '').toLowerCase() === 'robots' && /\bnoindex\b/i.test(tag.attributes.content || ''))) {
  fail('404.html', 'missing noindex robots directive');
}
const robots = read('robots.txt');
if (robots !== null) {
  try {
    if (robots !== fs.readFileSync('public/robots.txt', 'utf8')) fail('robots.txt', 'differs from public/robots.txt');
  } catch { fail('robots.txt', 'missing public/robots.txt source'); }
}
if (fs.existsSync('robots.txt')) fail('robots.txt', 'duplicate root source; use public/robots.txt');

if (errors.size) {
  console.error(`[seo] ${errors.size} validation errors:`);
  for (const error of errors) console.error(` - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[seo] ${routes.length} prerendered routes, ${articles.length} articles, ${sitemapUrls.length} sitemap URLs: metadata, images, links, robots and structured data OK`);
}
