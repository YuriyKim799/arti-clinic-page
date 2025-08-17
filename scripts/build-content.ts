// scripts/build-content.ts
import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = process.cwd();
const SITE = 'https://arti-clinic.ru'; // поменяй на свой домен, если нужен другой
const CONTENT_DIR = path.join(ROOT, 'content', 'posts'); // твои локальные посты
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
function cleanMd(md: string): string {
  // 1) убираем пустые ссылки вида [](/path)
  let s = md.replace(/\[\]\(\s*\/[^)\s]+\s*\)/g, '');

  // 2) убираем сервисные строки из Дзена: "…подписчиков Подписаться", "Дзен", короткие призывы
  const lines = s.split(/\r?\n/);
  const out: string[] = [];
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    const hasSubs = /подписчик/iu.test(line);
    const hasSubscribe = /подписать/iu.test(line); // ловит "подписаться"
    const hasDzen = /\bд[зе]н\b/iu.test(line); // "дзен"
    const isShort = line.length <= 80;

    if (
      (hasSubs && hasSubscribe) ||
      (hasSubscribe && isShort) ||
      (hasDzen && isShort)
    ) {
      continue; // пропускаем мусорную строку
    }
    out.push(lineRaw);
  }
  s = out.join('\n');

  // 3) схлопываем лишние пустые строки
  s = s.replace(/\n{3,}/g, '\n\n');

  return s;
}

function pickExcerptFromMd(md: string): string {
  // Берём первый нормальный абзац ≥ 40 символов и без "подписаться/дзен"
  const paras = md
    .split(/\r?\n\s*\r?\n/) // делим по пустым строкам
    .map((p) => p.trim())
    .filter(Boolean);

  const stop = /подписчик|подписать|дзен|канал|подпишитесь/iu;
  const p =
    paras.find((x) => x.length >= 40 && !stop.test(x)) ?? paras[0] ?? '';
  const trimmed = p.replace(/\s+/g, ' ').trim();
  return trimmed.length > 220 ? trimmed.slice(0, 220) + '…' : trimmed;
}
function absolutizeHtml(html: string, site: string): string {
  // src="/path" или href="/path" → src="https://site/path"
  return html.replace(
    /(src|href)="\/(?!\/)/g,
    (_, attr) => `${attr}="${site}/`
  );
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
    const cleanedMd = cleanMd(content);
    const htmlRaw = marked.parse(cleanedMd) as string;
    const html = absolutizeHtml(htmlRaw, SITE);
    const fullText = stripHtml(html);

    // безопасный excerpt (всегда строка)
    const excerptSafe =
      (fm.excerpt ?? '').trim() || // если в фронт-маттере уже задан
      pickExcerptFromMd(cleanedMd) || // иначе берём первый внятный абзац
      (fullText ? fullText.slice(0, 220) + '…' : ''); // крайний резерв

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

    rssItems.push(
      rssItem({
        title: fm.title,
        link: url,
        guid: `arti:${slug}`,
        pubDate: pubIso,
        html,
        fullText,
        categories: fm.tags || [],
      })
    );

    urls.push({ loc: url, lastmod: new Date(pubIso).toISOString() });

    // кладём исходник в public — фронт будет забирать post.md по slug
    const pubMdDir = path.join(PUBLIC_DIR, 'blog', slug);
    fs.mkdirSync(pubMdDir, { recursive: true });
    fs.writeFileSync(path.join(pubMdDir, 'post.md'), raw);
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2));

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

  const staticPages = ['/', '/blog']; // добавь остальные страницы, если есть
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
