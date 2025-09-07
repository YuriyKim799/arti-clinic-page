// scripts/build-content.ts
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import fg from 'fast-glob';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import sharp from 'sharp';

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

function excerptFrom(text: string, max = 180) {
  let t = text;

  // 1) Удаляем HTML-картинки полностью
  t = t.replace(/<img\b[^>]*>/gi, '');

  // 2) Удаляем markdown-картинки полностью: ![alt](url)
  t = t.replace(/!\[[^\]]*]\([^)]*\)/g, '');

  // 3) Markdown-ссылки превращаем в текст: [title](url) -> title
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // 4) Защитный кейс: голые скобки с путями вида (/blog/slug/file.jpg)
  t = t.replace(/\(\s*\/blog\/[^)]+\)/gi, '');

  // 5) Сносим прочую HTML-разметку
  t = t.replace(/<\/?[^>]+>/g, '');

  // 6) Чистим базовые markdown-артефакты
  t = t.replace(/[#>*_`]/g, '');

  // 7) Пробелы и обрезка
  t = t.replace(/\s+/g, ' ').trim();

  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
}

const SITE =
  process.env.SITE_ORIGIN ||
  process.env.VITE_SITE_URL ||
  'https://articlinic.ru';
const BRAND_NAME = process.env.SITE_NAME || 'Arti Clinic';
const BRAND_LOGO = process.env.SITE_LOGO || '/logo-512x512.png';

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

async function ensureVariants(
  absSrc: string,
  outDir: string,
  baseName: string,
  widths: number[]
): Promise<string[]> {
  const keep: string[] = [];
  const nameNoExt = baseName.replace(/\.[^.]+$/, '');
  const probe = sharp(absSrc);
  const meta = await probe.metadata();
  for (const w of widths) {
    const targetW = meta.width ? Math.min(meta.width, w) : w;
    const avifOut = path.join(outDir, `${nameNoExt}-${targetW}.avif`);
    const webpOut = path.join(outDir, `${nameNoExt}-${targetW}.webp`);
    if (!fs.existsSync(avifOut)) {
      await sharp(absSrc)
        .resize({ width: targetW, withoutEnlargement: true })
        .avif({ quality: AVIF_Q })
        .toFile(avifOut);
    }
    if (!fs.existsSync(webpOut)) {
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
  if (fs.existsSync(ogPath)) return 'og.jpg';
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

function replaceImgWithPicture(html: string, slug: string, coverBase?: string) {
  return html.replace(
    /<img\s+([^>]*?)src=["'](\/blog\/[^"']+)["']([^>]*)>/gi,
    (_m, pre, src, post) => {
      const m = src.match(new RegExp(String.raw`^/blog/${slug}/([^/\s]+)$`));
      if (!m) return _m;
      const file = m[1];
      const nameNoExt = file.replace(/\.[^.]+$/, '');
      const isCover = coverBase && file === coverBase;
      const widths = isCover ? COVER_W : INLINE_W;
      const avifSrcset = widths
        .map((w) => `/blog/${slug}/${nameNoExt}-${w}.avif ${w}w`)
        .join(', ');
      const webpSrcset = widths
        .map((w) => `/blog/${slug}/${nameNoExt}-${w}.webp ${w}w`)
        .join(', ');
      const sizes = isCover
        ? '(max-width: 1360px) 100vw, 1280px'
        : '(max-width: 900px) 100vw, 820px';
      const alt =
        (pre + ' ' + post).match(/\balt=["']([^"']*)["']/i)?.[1] || '';
      const title = (pre + ' ' + post).match(/\btitle=["']([^"']*)["']/i)?.[1];
      const cls = (pre + ' ' + post).match(/\bclass=["']([^"']*)["']/i)?.[1];
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const classAttr = cls ? ` class="${escapeHtml(cls)}"` : '';
      const fallback = `/blog/${slug}/${nameNoExt}-${
        widths[Math.floor(widths.length / 2)]
      }.webp`;
      return `<picture>
  <source type="image/avif" srcset="${avifSrcset}" sizes="${sizes}">
  <source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">
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
      .sort();
    const combo = files.map((f) => fileHash(path.join(imgDir, f))).join('|');
    imgsHash = sha1(combo);
  }
  return sha1(`${mdHash}|${imgsHash}`);
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

// --- HTML шаблон ---
function htmlTemplate(opts: {
  title: string;
  description: string;
  canonicalPath: string; // /blog/slug/
  ogImage?: string;
  articleHtml: string; // sanitized
  date?: string;
  updated?: string;
}) {
  const canonical = absUrl(SITE, opts.canonicalPath);
  const ogAbs = opts.ogImage ? absUrl(SITE, opts.ogImage) : undefined;

  const jsonLdBlogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date,
    dateModified: opts.updated || opts.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: ogAbs,
    author: { '@type': 'Organization', name: BRAND_NAME },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      logo: { '@type': 'ImageObject', url: absUrl(SITE, BRAND_LOGO) },
    },
  };
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: SITE,
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
</head>
<body>
<main>
<article>
${opts.articleHtml}
</article>
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
  const mdFiles = await fg(['**/*.md'], { cwd: CONTENT_DIR, onlyFiles: true });

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
    slugsSet.add(slug);

    const mdDir = path.join(CONTENT_DIR, path.dirname(rel));
    const blogDir = path.join(BLOG_DIR, slug);
    ensureDir(blogDir);

    // 1) локальные картинки → копировать и переписать пути
    const locals = collectLocalImages(content);
    const mapping = copyImages(mdDir, slug, locals);
    let contentRewritten = rewriteImagePaths(content, mapping);

    // 2) cover
    let cover = data.cover as string | undefined;
    let coverBaseName: string | undefined;

    if (cover && !isAbsUrl(cover) && !isRooted(cover)) {
      // относительный рядом с md
      const fileName = path.basename(cover);
      coverBaseName = fileName;
      const srcAbs = path.join(mdDir, cover);
      const dstAbs = path.join(blogDir, fileName);
      if (fs.existsSync(srcAbs)) {
        if (!fs.existsSync(dstAbs) || fileHash(dstAbs) !== fileHash(srcAbs))
          fs.copyFileSync(srcAbs, dstAbs);
        await ensureVariants(dstAbs, blogDir, fileName, COVER_W);
        await ensureOgFromCover(dstAbs, blogDir);
        cover = `/blog/${slug}/${fileName}`;
      }
    } else if (cover && !isAbsUrl(cover) && isRooted(cover)) {
      // /blog/<slug>/<file> → проверим в public
      const fileName = path.basename(cover);
      coverBaseName = fileName;
      const abs = path.join(PUBLIC_DIR, cover.replace(/^\//, '')); // ВАЖНО: Windows-friendly
      if (fs.existsSync(abs)) {
        await ensureVariants(abs, blogDir, fileName, COVER_W);
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
    if (coverBaseName) allow.add(coverBaseName);
    for (const file of inlineNames) allow.add(file);

    // генерим вариации для inline (если теперь оригиналы найдены)
    for (const file of inlineNames) {
      const abs = path.join(blogDir, file);
      if (!fs.existsSync(abs)) continue;
      const keep = await ensureVariants(abs, blogDir, file, INLINE_W);
      keep.forEach((k) => allow.add(k));
    }
    // cover варианты и og.jpg
    if (coverBaseName) {
      for (const w of COVER_W) {
        allow.add(`${coverBaseName.replace(/\.[^.]+$/, '')}-${w}.avif`);
        allow.add(`${coverBaseName.replace(/\.[^.]+$/, '')}-${w}.webp`);
      }
      allow.add('og.jpg');
    }

    // 4) HTML
    const bodyHtml = md.render(contentRewritten);
    const bodyHtmlSafe = stripScripts(
      replaceImgWithPicture(bodyHtml, slug, coverBaseName)
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
      excerpt: (data.excerpt as string) || excerptFrom(contentRewritten),
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
  console.log(`[content] обновлено постов: ${changed}. Всего: ${list.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

console.log('!');
