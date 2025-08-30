//build-content
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import fg from 'fast-glob';
import matter from 'gray-matter';

type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  updated?: string;
  cover?: string;
  excerpt?: string;
  tags?: string[];
  source?: string;
  hash: string; // внутренний хэш для инкрементальности (не публикуем)
};

const ROOT = process.cwd();

const CONTENT_DIR = path.join(ROOT, 'content', 'posts'); // md-файлы
const PUBLIC_DIR = path.join(ROOT, 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog'); // картинки по slug
const POSTS_DIR = path.join(PUBLIC_DIR, 'posts'); // per-post JSON тут
const POSTS_JSON = path.join(PUBLIC_DIR, 'posts.json'); // СПИСОК в корне public

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
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/[#>*_`]/g, '')
    .trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + '…' : clean;
}

// Хэш поста = hash(md) + hash(всех связанных изображений в public/blog/<slug>)
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

function loadPostsJson(): Omit<PostMeta, 'hash'>[] {
  if (!fs.existsSync(POSTS_JSON)) return [];
  try {
    return JSON.parse(read(POSTS_JSON));
  } catch {
    return [];
  }
}
function savePostsJson(list: Omit<PostMeta, 'hash'>[]) {
  ensureDir(PUBLIC_DIR);
  fs.writeFileSync(POSTS_JSON, JSON.stringify(list, null, 2), 'utf-8');
}

async function main() {
  ensureDir(POSTS_DIR);
  ensureDir(CACHE_DIR);

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[content] Нет каталога ${CONTENT_DIR} — пропускаю.`);
    return;
  }

  const prevList = loadPostsJson();
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
    slugsSet.add(slug);

    const h = postHash(mdPath, slug);
    const was = prevManifest[slug];
    const needRebuild = !was || was.hash !== h;

    const meta: PostMeta = {
      slug,
      title: (data.title as string) || base,
      date: data.date as string | undefined,
      updated: data.updated as string | undefined,
      cover: data.cover as string | undefined,
      excerpt: (data.excerpt as string) || excerptFrom(content),
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
      source: data.source as string | undefined,
      hash: h,
    };
    nextManifest[slug] = meta;

    if (needRebuild) {
      changed++;
      const perPostJson = path.join(POSTS_DIR, `${slug}.json`);
      const { hash, ...pubMeta } = meta; // не светим hash наружу
      fs.writeFileSync(
        perPostJson,
        JSON.stringify({ ...pubMeta, content }, null, 2),
        'utf-8'
      );
    }
  }

  // Удаление артефактов для постов, которых больше нет
  for (const slug of Object.keys(prevManifest)) {
    if (!slugsSet.has(slug)) {
      const perPostJson = path.join(POSTS_DIR, `${slug}.json`);
      if (fs.existsSync(perPostJson)) fs.rmSync(perPostJson);
    }
  }

  // Итоговый список (без внутреннего hash)
  const list = Object.values(nextManifest)
    .map(({ hash, ...pub }) => ({
      ...pub,
      // УДОБНО: сразу кладём url — фронту и IndexNow проще
      url: `/blog/${pub.slug}`,
    }))
    .sort(
      (a, b) =>
        (b.date || '').localeCompare(a.date || '') ||
        a.slug.localeCompare(b.slug)
    );

  // Сравниваем с прежним списком, пишем только при реальной разнице
  const prevStr = fs.existsSync(POSTS_JSON)
    ? fs.readFileSync(POSTS_JSON, 'utf8')
    : '';
  const nextStr = JSON.stringify(list, null, 2);

  if (prevStr !== nextStr) {
    fs.writeFileSync(CHANGED_FLAG, '1');
    console.log('[content] posts.json изменился');
  } else {
    if (fs.existsSync(CHANGED_FLAG)) fs.rmSync(CHANGED_FLAG);
    console.log('[content] posts.json без изменений');
  }
  savePostsJson(list);

  saveManifest(nextManifest);
  console.log(`[content] изменено постов: ${changed}. Всего: ${list.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
