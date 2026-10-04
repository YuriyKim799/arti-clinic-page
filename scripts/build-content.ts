// scripts/build-content.ts
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import fg from 'fast-glob';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import sharp from 'sharp';
import { excerptFrom } from './content-excerpt';
import { relatedServicesForText } from '../src/data/seoTopics';

type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  updated?: string;
  cover?: string;
  excerpt?: string;
  tags?: string[];
  source?: string;
  hash: string;
};

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'posts');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const POSTS_DIR = path.join(PUBLIC_DIR, 'posts');
const POSTS_JSON = path.join(PUBLIC_DIR, 'posts.json');
const SITEMAP_XML = path.join(PUBLIC_DIR, 'sitemap.xml');
const RSS_DZEN_XML = path.join(PUBLIC_DIR, 'rss-dzen.xml');

const CACHE_DIR = path.join(ROOT, '.cache');
const MANIFEST = path.join(CACHE_DIR, 'content-manifest.json');
const CHANGED_FLAG = path.join(CACHE_DIR, 'posts.changed');

const ensureDir = (p: string) => fs.mkdirSync(p, { recursive: true });
const sha1 = (buf: Buffer | string) =>
  crypto.createHash('sha1').update(buf).digest('hex');
const read = (file: string) => fs.readFileSync(file, 'utf-8');
const fileHash = (file: string) => sha1(fs.readFileSync(file));

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

const SITE =
  process.env.SITE_ORIGIN ||
  process.env.VITE_SITE_URL ||
  'https://articlinic.ru';
const BRAND_NAME = process.env.SITE_NAME || 'Арти Клиник';
const BRAND_LOGO = process.env.SITE_LOGO || '/images/clinic-logo.png';

const INLINE_W = [400, 680, 820];
const COVER_W = [960, 1280, 1600];
const AVIF_Q = 50;
const WEBP_Q = 70;

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// ---------- общий CSS ----------
const SSR_CSS_FILE = path.join(BLOG_DIR, 'post-ssr.css');
const SSR_CSS = `body{margin:0;padding:0 16px 40px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Helvetica,Arial,sans-serif;color:#222;line-height:1.6}
main{max-width:820px;margin:32px auto}
article img{max-width:100%;height:auto;display:block;margin:16px auto}
article pre{overflow:auto;background:#f6f6f6;padding:12px;border-radius:8px}
article blockquote{margin:16px 0;padding:8px 16px;border-left:4px solid #e0e0e0;color:#555;background:#fafafa}
h1{font-size:32px;margin:20px 0}
time{color:#666;font-size:14px}
.post-meta{font-size:14px;color:#666}
.article-links{margin-top:32px;padding-top:16px;border-top:1px solid #ddd}
`;

// ---------- helpers ----------
const isAbsUrl = (u?: string) => !!u && /^https?:\/\//i.test(u);
const isRooted = (u?: string) => !!u && u.startsWith('/');
const absUrl = (site: string, url: string) =>
  isAbsUrl(url)
    ? url
    : site.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const stripScripts = (html: string) =>
  html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

function dzenSource(source: unknown): string | undefined {
  if (typeof source !== 'string') return undefined;
  try {
    const url = new URL(source);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    if (!['dzen.ru', 'www.dzen.ru'].includes(url.hostname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function cleanImportedContent(content: string, source: unknown) {
  if (!dzenSource(source)) return content;
  const heading = content.search(/^#\s+\S/m);
  const article = (heading >= 0 ? content.slice(heading) : content)
    .replace(/^(#\s+[^\r\n]+)\r?\n/gm, '$1\n\n');
  // The imported preview repeats the opening and ends with Dzen's UI label.
  return article
    .split(/\r?\n\s*\r?\n/)
    .filter((paragraph) => !/Читать\s+далее\s*$/iu.test(paragraph.trim()))
    .join('\n\n');
}

function unwrapDzenLinks(html: string) {
  return html.replace(/(<a\b[^>]*\bhref=)(["'])([^"']+)\2/gi,
    (original, prefix, quote, href) => {
      try {
        const raw = href.replace(/&amp;/g, '&');
        const wrapper = new URL(raw, SITE);
        const relative = raw.startsWith('/away?');
        if (!['http:', 'https:'].includes(wrapper.protocol) || wrapper.pathname !== '/away' ||
          (!relative && !['dzen.ru', 'www.dzen.ru'].includes(wrapper.hostname))) return original;
        const destination = wrapper.searchParams.get('to');
        if (!destination) return original;
        const url = new URL(destination);
        if (!['http:', 'https:'].includes(url.protocol)) return original;
        return `${prefix}"${escapeHtml(url.toString())}"`;
      } catch {
        return original;
      }
    });
}

// относительные картинки из md/html
function collectLocalImages(text: string): string[] {
  const set = new Set<string>();
  const mdImg = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlImg = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = mdImg.exec(text))) set.add(m[1]);
  while ((m = htmlImg.exec(text))) set.add(m[1]);
  return [...set].filter((p) => !isAbsUrl(p) && !isRooted(p));
}

// копируем относительные картинки рядом с md → /public/blog/<slug>/
function copyImages(mdDir: string, slug: string, relPaths: string[]) {
  const outDir = path.join(BLOG_DIR, slug);
  ensureDir(outDir);
  const map = new Map<string, string>();
  for (const rel of relPaths) {
    const srcAbs = path.join(mdDir, rel);
    if (!fs.existsSync(srcAbs)) continue;
    const fileName = path.basename(rel);
    const dstAbs = path.join(outDir, fileName);
    if (!fs.existsSync(dstAbs) || fileHash(dstAbs) !== fileHash(srcAbs))
      fs.copyFileSync(srcAbs, dstAbs);
    map.set(rel, `/blog/${slug}/${fileName}`);
  }
  return map;
}

function rewriteImagePaths(text: string, mapping: Map<string, string>) {
  let t = text;
  for (const [rel, web] of mapping) {
    const safeRel = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reMd = new RegExp(`(\\()${safeRel}(\\s+"[^"]*")?(\\))`, 'g');
    const reHtml = new RegExp(`(src=["'])${safeRel}(["'])`, 'g');
    t = t.replace(reMd, `$1${web}$2$3`).replace(reHtml, `$1${web}$2`);
  }
  return t;
}

function imageOutputIsCurrent(file: string, sourceMtime: number) {
  if (!fs.existsSync(file)) return false;
  const output = fs.statSync(file);
  return output.isFile() && output.size > 0 && output.mtimeMs >= sourceMtime;
}

async function ensureVariants(
  absSrc: string,
  outDir: string,
  baseName: string,
  widths: number[]
): Promise<string[]> {
  const keep: string[] = [];
  const nameNoExt = baseName.replace(/\.[^.]+$/, '');
  const sourceMtime = fs.statSync(absSrc).mtimeMs;
  const probe = sharp(absSrc);
  const meta = await probe.metadata();
  const targetWidths = [
    ...new Set(widths.map((w) => (meta.width ? Math.min(meta.width, w) : w))),
  ];
  for (const targetW of targetWidths) {
    const avifOut = path.join(outDir, `${nameNoExt}-${targetW}.avif`);
    const webpOut = path.join(outDir, `${nameNoExt}-${targetW}.webp`);
    if (!imageOutputIsCurrent(avifOut, sourceMtime)) {
      await sharp(absSrc)
        .resize({ width: targetW, withoutEnlargement: true })
        .avif({ quality: AVIF_Q })
        .toFile(avifOut);
    }
    if (!imageOutputIsCurrent(webpOut, sourceMtime)) {
      await sharp(absSrc)
        .resize({ width: targetW, withoutEnlargement: true })
        .webp({ quality: WEBP_Q })
        .toFile(webpOut);
    }
    keep.push(path.basename(avifOut), path.basename(webpOut));
  }
  keep.push(baseName);
  return keep;
}

async function ensureOgFromCover(absSrc: string, outDir: string) {
  const ogPath = path.join(outDir, 'og.jpg');
  if (imageOutputIsCurrent(ogPath, fs.statSync(absSrc).mtimeMs)) return 'og.jpg';
  await sharp(absSrc)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 85, progressive: true })
    .toFile(ogPath);
  return 'og.jpg';
}

async function cleanupVariants(dir: string, allow: Set<string>) {
  const all = await fg(['*.*'], { cwd: dir, onlyFiles: true });
  for (const f of all) {
    const isVariant = /-\d+\.(avif|webp)$/.test(f);
    const isOldSize = /-(768|1024|1440|1920)\.(avif|webp)$/.test(f);
    if ((isVariant || isOldSize) && !allow.has(f)) fs.rmSync(path.join(dir, f));
  }
}

function replaceImgWithPicture(
  html: string,
  slug: string,
  variants: Map<string, string[]>,
  coverBase?: string
) {
  return html.replace(
    /<img\s+([^>]*?)src=["'](\/blog\/[^"']+)["']([^>]*)>/gi,
    (_m, pre, src, post) => {
      const m = src.match(new RegExp(String.raw`^/blog/${slug}/([^/\s]+)$`));
      if (!m) return _m;
      const file = m[1];
      const nameNoExt = file.replace(/\.[^.]+$/, '');
      const isCover = coverBase && file === coverBase;
      const alt =
        (pre + ' ' + post).match(/\balt=["']([^"']*)["']/i)?.[1] || '';
      if (!fs.existsSync(path.join(BLOG_DIR, slug, file))) {
        if (!alt.trim()) return '';
        console.warn(`[content] Missing image with alt text: ${src}`);
        return _m;
      }
      const available = variants.get(file) || [];
      const forFormat = (format: 'avif' | 'webp') => available
        .map((name) => {
          const match = name.match(/^(.*)-(\d+)\.(avif|webp)$/);
          return match && match[1] === nameNoExt && match[3] === format
            ? { name, width: Number(match[2]) } : undefined;
        })
        .filter((entry): entry is { name: string; width: number } => !!entry)
        .sort((a, b) => a.width - b.width);
      const avif = forFormat('avif');
      const webp = forFormat('webp');
      if (!avif.length && !webp.length) return _m;
      const srcset = (files: { name: string; width: number }[]) => files
        .map(({ name, width }) => `/blog/${slug}/${name} ${width}w`)
        .join(', ');
      const sizes = isCover
        ? '(max-width: 1360px) 100vw, 1280px'
        : '(max-width: 900px) 100vw, 820px';
      const title = (pre + ' ' + post).match(/\btitle=["']([^"']*)["']/i)?.[1];
      const cls = (pre + ' ' + post).match(/\bclass=["']([^"']*)["']/i)?.[1];
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const classAttr = cls ? ` class="${escapeHtml(cls)}"` : '';
      const fallback = webp.length
        ? `/blog/${slug}/${webp[Math.floor(webp.length / 2)].name}`
        : src;
      return `<picture>
  ${avif.length ? `<source type="image/avif" srcset="${srcset(avif)}" sizes="${sizes}">` : ''}
  ${webp.length ? `<source type="image/webp" srcset="${srcset(webp)}" sizes="${sizes}">` : ''}
  <img${classAttr} src="${fallback}" alt="${escapeHtml(
        alt
      )}"${titleAttr} loading="lazy" decoding="async">
</picture>`;
    }
  );
}

// --- hash/manifest ---
function postHash(mdPath: string, slug: string) {
  const mdHash = fileHash(mdPath);
  const imgDir = path.join(BLOG_DIR, slug);
  let imgsHash = '';
  if (fs.existsSync(imgDir)) {
    const files = fg
      .sync(['**/*.*'], { cwd: imgDir, onlyFiles: true, dot: false })
      .filter((file) => !['index.html', 'post-ssr.css', 'og.jpg'].includes(file) &&
        !/-\d+\.(avif|webp)$/.test(file))
      .sort();
    const combo = files.map((f) => fileHash(path.join(imgDir, f))).join('|');
    imgsHash = sha1(combo);
  }
  return sha1(`html-seo-v4|${mdHash}|${imgsHash}`);
}

function loadManifest(): Record<string, PostMeta> {
  if (fs.existsSync(MANIFEST)) return JSON.parse(read(MANIFEST));
  return {};
}
function saveManifest(m: Record<string, PostMeta>) {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2), 'utf-8');
}
function savePostsJson(list: Omit<PostMeta, 'hash'>[]) {
  ensureDir(PUBLIC_DIR);
  fs.writeFileSync(POSTS_JSON, JSON.stringify(list, null, 2), 'utf-8');
}

function xmlEscape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canonicalSite() {
  return SITE.replace(/\/+$/, '');
}

function canonicalPath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

function canonicalBlogPath(slug: string) {
  return `/blog/${slug}/`;
}

function getServiceSlugs() {
  const servicesFile = path.join(ROOT, 'src', 'data', 'services.ts');
  if (!fs.existsSync(servicesFile)) return [];
  const source = read(servicesFile);
  return [...source.matchAll(/\bslug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

function sitemapUrl(pathname: string, lastmod?: string) {
  const loc = `${canonicalSite()}${pathname}`;
  const lastmodTag = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : '';
  return `  <url><loc>${xmlEscape(
    loc
  )}</loc>${lastmodTag}<changefreq>weekly</changefreq></url>`;
}

function saveSitemap(list: Omit<PostMeta, 'hash'>[]) {
  const staticPaths = ['/', '/blog', '/services', '/price-list'];
  const servicePaths = getServiceSlugs().map((slug) => `/services/${slug}`);

  const urls = [
    ...staticPaths.map((pathname) => sitemapUrl(pathname)),
    ...servicePaths.map((pathname) => sitemapUrl(canonicalPath(pathname))),
    ...list.map((post) => {
      const lastmodSource = post.updated || post.date;
      return sitemapUrl(
        canonicalBlogPath(post.slug),
        lastmodSource ? new Date(lastmodSource).toISOString() : undefined
      );
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  ensureDir(PUBLIC_DIR);
  fs.writeFileSync(SITEMAP_XML, xml, 'utf-8');
}

function cdata(s: string) {
  return s.replace(/]]>/g, ']]]]><![CDATA[>');
}

function absolutizeHtml(html: string) {
  return html
    .replace(
      /\b(src|href)=["']\/([^"']*)["']/g,
      (_m, attr, pathPart) => `${attr}="${canonicalSite()}/${pathPart}"`
    )
    .replace(/\bsrcset=["']([^"']*)["']/g, (_m, value) => {
      const nextValue = value
        .split(',')
        .map((part: string) => {
          const chunks = part.trim().split(/\s+/);
          const url = chunks.shift() || '';
          const abs = url.startsWith('/') ? `${canonicalSite()}${url}` : url;
          return [abs, ...chunks].join(' ');
        })
        .join(', ');

      return `srcset="${nextValue}"`;
    });
}

function readArticleHtml(slug: string) {
  const htmlPath = path.join(BLOG_DIR, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) return '';

  const html = read(htmlPath);
  const match = html.match(/<article>\s*([\s\S]*?)\s*<\/article>/i);
  return match?.[1]?.trim() || '';
}

function saveRssDzen(list: Omit<PostMeta, 'hash'>[]) {
  const items = list
    .map((post) => {
      const link = `${canonicalSite()}${canonicalBlogPath(post.slug)}`;
      const dateSource = post.date || post.updated;
      const pubDate = dateSource
        ? new Date(dateSource).toUTCString()
        : new Date().toUTCString();
      const articleHtml = readArticleHtml(post.slug);
      const description = post.excerpt || post.title;
      const categories = (post.tags?.length ? post.tags : ['arti-clinic', 'dzen'])
        .map((tag) => `<category>${xmlEscape(tag)}</category>`)
        .join('');
      const fallbackHtml = `<h1>${escapeHtml(post.title)}</h1>\n<p>${escapeHtml(
        description
      )}</p>`;

      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">arti:${xmlEscape(post.slug)}</guid>
      <pubDate>${xmlEscape(pubDate)}</pubDate>
      ${categories}
      <author>${xmlEscape(BRAND_NAME)}</author>
      <description>${xmlEscape(description)}</description>
      <content:encoded><![CDATA[${cdata(
        articleHtml ? absolutizeHtml(articleHtml) : absolutizeHtml(fallbackHtml)
      )}]]></content:encoded>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:yandex="http://news.yandex.ru">
  <channel>
    <title>${xmlEscape(`${BRAND_NAME} - Блог`)}</title>
    <link>${xmlEscape(`${canonicalSite()}/blog`)}</link>
    <description>${xmlEscape('Неврология, грыжи дисков, реабилитация')}</description>
${items}
  </channel>
</rss>
`;

  ensureDir(PUBLIC_DIR);
  fs.writeFileSync(RSS_DZEN_XML, xml, 'utf-8');
}

// --- HTML шаблон ---
function htmlTemplate(opts: {
  title: string;
  description: string;
  canonicalPath: string; // /blog/slug/
  ogImage?: string;
  articleHtml: string; // sanitized
  date?: string;
  updated?: string;
  source?: string;
  tags?: string[];
}) {
  const canonical = absUrl(SITE, opts.canonicalPath);
  const ogAbs = opts.ogImage ? absUrl(SITE, opts.ogImage) : undefined;
  const published = opts.date ? new Date(opts.date) : undefined;
  const publishedDate = published && !Number.isNaN(published.getTime())
    ? `<span>Опубликовано: <time datetime="${escapeHtml(opts.date!)}">${published.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow',
    })}</time></span>` : '';
  const source = dzenSource(opts.source);
  const sourceLink = source
    ? `<span>Источник: <a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Дзен</a></span>` : '';
  const articleMeta = [publishedDate, sourceLink].filter(Boolean).join(' · ');
  const relatedServices = relatedServicesForText([opts.title, ...(opts.tags || [])].join(' '));
  const relatedNavigation = relatedServices.length
    ? `<nav class="article-links" aria-label="Услуги по теме статьи">${relatedServices
      .map(({ href, label }) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`)
      .join(' · ')}</nav>` : '';

  const jsonLdBlogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date,
    dateModified: opts.updated || opts.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: ogAbs,
    author: { '@type': 'Organization', name: BRAND_NAME, url: `${canonicalSite()}/` },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      url: `${canonicalSite()}/`,
      logo: { '@type': 'ImageObject', url: absUrl(SITE, BRAND_LOGO) },
    },
  };
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: `${canonicalSite()}/`,
    logo: absUrl(SITE, BRAND_LOGO),
  };

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}" />
<meta property="og:title" content="${escapeHtml(opts.title)}" />
<meta property="og:description" content="${escapeHtml(opts.description)}" />
<meta property="og:url" content="${canonical}" />
${
  ogAbs
    ? `<meta property="og:image" content="${ogAbs}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${ogAbs}" />`
    : `<meta name="twitter:card" content="summary" />`
}
<link rel="stylesheet" href="/blog/post-ssr.css" />
<script type="application/ld+json">${JSON.stringify([jsonLdBlogPosting, jsonLdOrg]).replace(/</g, '\\u003c')}</script>
</head>
<body>
<main>
<nav aria-label="Навигация"><a href="/">Арти Клиник</a> · <a href="/services">Услуги</a> · <a href="/blog">Все статьи</a></nav>
${articleMeta ? `<p class="post-meta">${articleMeta}</p>` : ''}
<article>
${opts.articleHtml}
</article>
${relatedNavigation}
<nav class="article-links" aria-label="Услуги и стоимость"><a href="/services">Услуги клиники</a> · <a href="/price-list">Стоимость услуг</a></nav>
</main>
</body>
</html>`;
}

// --- main ---
async function main() {
  ensureDir(POSTS_DIR);
  ensureDir(CACHE_DIR);
  ensureDir(BLOG_DIR);
  // общий CSS для всех постов (обновляем каждый запуск)
  fs.writeFileSync(SSR_CSS_FILE, SSR_CSS, 'utf-8');

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[content] Нет каталога ${CONTENT_DIR} — пропускаю.`);
    return;
  }

  const prevManifest = loadManifest();
  const mdFiles = (await fg(['**/*.md'], { cwd: CONTENT_DIR, onlyFiles: true }))
    .sort((a, b) => {
      const aCopy = /\bcopy\b/i.test(a);
      const bCopy = /\bcopy\b/i.test(b);
      if (aCopy !== bCopy) return aCopy ? 1 : -1;
      return a.localeCompare(b);
    });

  const nextManifest: Record<string, PostMeta> = {};
  const slugsSet = new Set<string>();
  let changed = 0;

  for (const rel of mdFiles) {
    const mdPath = path.join(CONTENT_DIR, rel);
    const raw = read(mdPath);
    const { data, content } = matter(raw);

    const base = path.basename(rel, path.extname(rel));
    const slug = (data.slug as string) || slugify(base);
    if (!slug) {
      console.warn(`[content] Пропуск ${rel}: пустой slug`);
      continue;
    }
    if (slugsSet.has(slug)) {
      console.warn(`[content] Дубликат slug ${slug} в ${rel} — пропускаю.`);
      continue;
    }
    slugsSet.add(slug);

    const mdDir = path.join(CONTENT_DIR, path.dirname(rel));
    const blogDir = path.join(BLOG_DIR, slug);
    ensureDir(blogDir);

    // 1) локальные картинки → копировать и переписать пути
    const cleanedContent = cleanImportedContent(content, data.source);
    const locals = collectLocalImages(cleanedContent);
    const mapping = copyImages(mdDir, slug, locals);
    let contentRewritten = rewriteImagePaths(cleanedContent, mapping);

    // 2) cover
    let cover = data.cover as string | undefined;
    let coverBaseName: string | undefined;
    const variants = new Map<string, string[]>();
    const coverVariants = new Set<string>();

    if (cover && !isAbsUrl(cover) && !isRooted(cover)) {
      // относительный рядом с md
      const fileName = path.basename(cover);
      coverBaseName = fileName;
      const srcAbs = path.join(mdDir, cover);
      const dstAbs = path.join(blogDir, fileName);
      if (fs.existsSync(srcAbs)) {
        if (!fs.existsSync(dstAbs) || fileHash(dstAbs) !== fileHash(srcAbs))
          fs.copyFileSync(srcAbs, dstAbs);
        const keep = await ensureVariants(dstAbs, blogDir, fileName, COVER_W);
        variants.set(fileName, keep);
        keep.forEach((file) => coverVariants.add(file));
        await ensureOgFromCover(dstAbs, blogDir);
        cover = `/blog/${slug}/${fileName}`;
      }
    } else if (cover && !isAbsUrl(cover) && isRooted(cover)) {
      // /blog/<slug>/<file> → проверим в public
      const fileName = path.basename(cover);
      coverBaseName = fileName;
      const abs = path.join(PUBLIC_DIR, cover.replace(/^\//, '')); // ВАЖНО: Windows-friendly
      if (fs.existsSync(abs)) {
        const keep = await ensureVariants(abs, blogDir, fileName, COVER_W);
        variants.set(fileName, keep);
        keep.forEach((file) => coverVariants.add(file));
        await ensureOgFromCover(abs, blogDir);
      }
    }

    // 3) inline (после переписи путей собираем /blog/<slug>/<name>)
    const inlineNames = new Set<string>();
    const mdImgAbs = new RegExp(
      String.raw`!\[[^\]]*]\((/blog/${slug}/[^)\s]+)`,
      'g'
    );
    const htmlImgAbs = new RegExp(
      String.raw`<img\s+[^>]*src=["'](/blog/${slug}/[^"']+)["']`,
      'gi'
    );
    let mi: RegExpExecArray | null;
    while ((mi = mdImgAbs.exec(contentRewritten)))
      inlineNames.add(path.posix.basename(mi[1]));
    while ((mi = htmlImgAbs.exec(contentRewritten)))
      inlineNames.add(path.posix.basename(mi[1]));

    // если файла в blogDir нет — попробуем взять из mdDir (фолбэк)
    for (const file of inlineNames) {
      const absBlog = path.join(blogDir, file);
      if (!fs.existsSync(absBlog)) {
        const tryMd = path.join(mdDir, file);
        if (fs.existsSync(tryMd)) {
          fs.copyFileSync(tryMd, absBlog);
        }
      }
    }

    const allow = new Set<string>(['index.html', 'post-ssr.css']);
    coverVariants.forEach((file) => allow.add(file));
    if (coverBaseName) allow.add(coverBaseName);
    for (const file of inlineNames) allow.add(file);

    // генерим вариации для inline (если теперь оригиналы найдены)
    for (const file of inlineNames) {
      const abs = path.join(blogDir, file);
      if (!fs.existsSync(abs)) continue;
      if (file === coverBaseName && variants.has(file)) continue;
      const keep = await ensureVariants(abs, blogDir, file, INLINE_W);
      variants.set(file, keep);
      keep.forEach((k) => allow.add(k));
    }
    // cover варианты и og.jpg
    if (coverBaseName) {
      allow.add('og.jpg');
    }

    // 4) HTML
    const bodyHtml = md.render(contentRewritten);
    const bodyHtmlSafe = stripScripts(
      unwrapDzenLinks(replaceImgWithPicture(bodyHtml, slug, variants, coverBaseName))
    );

    // 5) hash/мета
    const h = postHash(mdPath, slug);
    const was = prevManifest[slug];
    let needRebuild = !was || was.hash !== h;

    const meta: PostMeta = {
      slug,
      title: (data.title as string) || base,
      date: data.date as string | undefined,
      updated: data.updated as string | undefined,
      cover,
      excerpt: (typeof data.excerpt === 'string' ? excerptFrom(data.excerpt) : '') || excerptFrom(contentRewritten),
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
      source: data.source as string | undefined,
      hash: h,
    };
    nextManifest[slug] = meta;

    // всегда создаём файлы, если их нет
    const jsonPath = path.join(POSTS_DIR, `${slug}.json`);
    const htmlPath = path.join(blogDir, 'index.html');
    if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath))
      needRebuild = true;

    // JSON
    if (needRebuild || !fs.existsSync(jsonPath)) {
      const { hash, ...pubMeta } = meta;
      ensureDir(POSTS_DIR);
      fs.writeFileSync(
        jsonPath,
        JSON.stringify({ ...pubMeta, content: contentRewritten }, null, 2),
        'utf-8'
      );
    }

    // HTML index.html
    const ogCandidate = fs.existsSync(path.join(blogDir, 'og.jpg'))
      ? `/blog/${slug}/og.jpg`
      : meta.cover;
    if (needRebuild || !fs.existsSync(htmlPath)) {
      const html = htmlTemplate({
        title: meta.title,
        description: meta.excerpt || meta.title,
        canonicalPath: `/blog/${slug}/`,
        ogImage: ogCandidate,
        articleHtml: bodyHtmlSafe,
        date: meta.date,
        updated: meta.updated,
        source: meta.source,
        tags: meta.tags,
      });
      fs.writeFileSync(htmlPath, html, 'utf-8');
    }

    // cleanup — выполняем каждый проход (не завязываем на needRebuild)
    await cleanupVariants(blogDir, allow);
    if (needRebuild) changed++;
  }

  // удаление исчезнувших постов
  for (const slug of Object.keys(prevManifest)) {
    if (!slugsSet.has(slug)) {
      const perPostJson = path.join(POSTS_DIR, `${slug}.json`);
      if (fs.existsSync(perPostJson)) fs.rmSync(perPostJson);
      const blogDir = path.join(BLOG_DIR, slug);
      if (fs.existsSync(blogDir))
        fs.rmSync(blogDir, { recursive: true, force: true });
    }
  }

  // список постов
  const list = Object.values(nextManifest)
    .map(({ hash, ...pub }) => ({ ...pub, url: `/blog/${pub.slug}/` }))
    .sort(
      (a, b) =>
        (b.date || '').localeCompare(a.date || '') ||
        a.slug.localeCompare(b.slug)
    );

  const prevStr = fs.existsSync(POSTS_JSON)
    ? fs.readFileSync(POSTS_JSON, 'utf8')
    : '';
  const nextStr = JSON.stringify(list, null, 2);
  if (prevStr !== nextStr) {
    ensureDir(CACHE_DIR);
    fs.writeFileSync(CHANGED_FLAG, '1');
    console.log('[content] posts.json изменился');
  } else {
    if (fs.existsSync(CHANGED_FLAG)) fs.rmSync(CHANGED_FLAG);
    console.log('[content] posts.json без изменений');
  }
  saveManifest(nextManifest);
  savePostsJson(list);
  saveSitemap(list);
  saveRssDzen(list);
  console.log(`[content] обновлено постов: ${changed}. Всего: ${list.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

console.log('start build-content');
