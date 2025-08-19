// scripts/build-content.ts
import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { marked } from 'marked';

marked.use({ gfm: true }); // Markdown с таблицами/чекбоксами и т.д.

const ROOT = process.cwd();
const SITE = 'https://arti-clinic.ru'; // твой домен
const CONTENT_DIR = path.join(ROOT, 'content', 'posts');
const PUBLIC_DIR = path.join(ROOT, 'public');
const FEED_PATH = path.join(PUBLIC_DIR, 'rss-dzen.xml');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const POSTS_JSON = path.join(PUBLIC_DIR, 'posts.json');

export type FrontMatter = {
  title: string;
  slug: string;
  excerpt?: string;
  cover?: string; // /blog/<slug>/cover.jpg
  tags?: string[];
  date?: string; // ISO
  updated?: string; // ISO
  origin?: 'site' | 'dzen';
  source?: string;
  draft?: boolean;
};

export type PostCard = {
  id: string;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  cover?: string;
  tags: string[];
  date: string; // ISO
  origin?: 'site' | 'dzen';
  source?: string | null;
};

function escapeXml(s: string) {
  return s.replace(
    /[<>&'"]/g,
    (m) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[
        m
      ]!)
  );
}
function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
// делаем абсолютные пути для RSS (картинки/ссылки в Дзене)
function absolutizeHtml(html: string, site: string): string {
  return html.replace(
    /(src|href)="\/(?!\/)/g,
    (_, attr) => `${attr}="${site}/`
  );
}
// чистим мусор из Дзена и пустые ссылки [](/path)
function cleanMd(md: string): string {
  let s = md.replace(/\[\]\(\s*\/[^)\s]+\s*\)/g, ''); // [](/path) → убрать

  const lines = s.split(/\r?\n/);
  const out: string[] = [];
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    const hasSubs = /подписчик/iu.test(line);
    const hasSubscribe = /подписат/iu.test(line); // «подписаться»
    const hasDzen = /\bд[зе]н\b/iu.test(line); // «дзен»
    const isShort = line.length <= 80;

    if (
      (hasSubs && hasSubscribe) ||
      (hasSubscribe && isShort) ||
      (hasDzen && isShort)
    ) {
      continue; // выбрасываем сервисные хвосты
    }
    out.push(lineRaw);
  }
  s = out.join('\n').replace(/\n{3,}/g, '\n\n'); // схлопываем лишние пустые строки
  return s;
}
function pickExcerptFromMd(md: string): string {
  const paras = md
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const stop = /подписчик|подписат|дзен|канал|подпишитесь/iu;
  const p =
    paras.find((x) => x.length >= 40 && !stop.test(x)) ?? paras[0] ?? '';
  const trimmed = p.replace(/\s+/g, ' ').trim();
  return trimmed.length > 220 ? trimmed.slice(0, 220) + '…' : trimmed;
}
function rssItem(p: {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  html: string;
  fullText: string;
  categories?: string[];
  author?: string;
}) {
  const cats = (p.categories || [])
    .map((c) => `<category>${escapeXml(String(c))}</category>`)
    .join('');
  return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${p.link}</link>
      <guid isPermaLink="false">${escapeXml(p.guid)}</guid>
      <pubDate>${new Date(p.pubDate).toUTCString()}</pubDate>
      ${cats}
      <author>${escapeXml(p.author || 'Arti Clinic')}</author>
      <content:encoded><![CDATA[${p.html}]]></content:encoded>
      <yandex:full-text><![CDATA[${p.fullText}]]></yandex:full-text>
    </item>`;
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const mdFiles = await fg(['*.md'], { cwd: CONTENT_DIR, absolute: true });
  const posts: PostCard[] = [];
  const rssItems: string[] = [];
  const urls: { loc: string; lastmod: string }[] = [];

  for (const file of mdFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const fm = data as FrontMatter;

    if (fm.draft) continue; // черновики пропускаем
    if (!fm.slug || !fm.title) {
      console.warn(
        '[build-content] пропущен (нет slug/title):',
        path.basename(file)
      );
      continue;
    }

    const slug = String(fm.slug);
    const url = `${SITE}/blog/${slug}`;
    const pubIso = fm.date || fm.updated || new Date().toISOString();

    // 1) Готовим HTML из Markdown (очищаем мусор)
    const cleanedMd = cleanMd(content);
    const htmlRaw = marked.parse(cleanedMd) as string;

    // 1a) HTML для сайта (можно оставлять относительные пути)
    const htmlForSite = htmlRaw;

    // 1b) HTML для RSS (делаем абсолютные src/href)
    const htmlForRss = absolutizeHtml(htmlRaw, SITE);
    const fullText = stripHtml(htmlForRss);

    // 2) Аккуратный excerpt, если не задан во фронт-маттере
    const excerptSafe =
      (fm.excerpt ?? '').trim() ||
      pickExcerptFromMd(cleanedMd) ||
      (fullText ? fullText.slice(0, 220) + '…' : '');

    // 3) Сохраняем HTML статьи в public/blog/<slug>/post.html
    const pubDir = path.join(PUBLIC_DIR, 'blog', slug);
    fs.mkdirSync(pubDir, { recursive: true });
    fs.writeFileSync(path.join(pubDir, 'post.html'), htmlForSite, 'utf8');

    // (опционально — можно больше не писать post.md; оставлю на всякий случай)
    fs.writeFileSync(path.join(pubDir, 'post.md'), raw, 'utf8');

    // 4) Собираем карточку для posts.json
    posts.push({
      id: slug,
      slug,
      url,
      title: fm.title,
      excerpt: excerptSafe,
      cover: fm.cover,
      tags: fm.tags || [],
      date: pubIso,
      origin: fm.origin || 'site',
      source: fm.source || null,
    });

    // 5) Добавляем в RSS
    rssItems.push(
      rssItem({
        title: fm.title,
        link: url,
        guid: `arti:${slug}`,
        pubDate: pubIso,
        html: htmlForRss,
        fullText,
        categories: fm.tags || [],
      })
    );

    // 6) Для sitemap
    urls.push({ loc: url, lastmod: new Date(pubIso).toISOString() });
  }

  // posts.json — отсортирован по дате
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2));

  // RSS
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"
       xmlns:content="http://purl.org/rss/1.0/modules/content/"
       xmlns:yandex="http://news.yandex.ru">
    <channel>
      <title>Arti Clinic — Блог</title>
      <link>${SITE}/blog</link>
      <description>Неврология, грыжи дисков, реабилитация</description>
      ${rssItems.join('\n')}
    </channel>
  </rss>`;
  fs.writeFileSync(FEED_PATH, rss.trim());

  // Sitemap
  const staticPages = ['/', '/blog'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${[...new Set(staticPages.map((p) => `${SITE}${p}`))]
      .map(
        (loc) => `<url><loc>${loc}</loc><changefreq>weekly</changefreq></url>`
      )
      .join('\n')}
    ${urls
      .map(
        (u) =>
          `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq></url>`
      )
      .join('\n')}
  </urlset>`;
  fs.writeFileSync(SITEMAP_PATH, sitemap.trim());

  console.log('[build-content] posts:', posts.length);
  console.log('[build-content] rss   :', FEED_PATH);
  console.log('[build-content] sitemap:', SITEMAP_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
