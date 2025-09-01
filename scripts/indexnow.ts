//indexnow

import fs from 'node:fs';
import path from 'node:path';

// Домен сайта (можно переопределить в CI переменной SITE_ORIGIN)
const SITE = process.env.SITE_ORIGIN || 'https://articlinic.ru';

// Ключ IndexNow (SECRET в CI: INDEXNOW_KEY). Скрипт создаст public/<KEY>.txt, если его нет.
const KEY = process.env.INDEXNOW_KEY || 'PUT-YOUR-GENERATED-KEY-HERE';
const KEY_FILE = path.join(process.cwd(), 'public', `${KEY}.txt`);

// Наш список постов теперь в public/posts.json
const POSTS_JSON = path.join(process.cwd(), 'public', 'posts.json');

if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, KEY);
  console.log('[indexnow] created key file:', KEY_FILE);
}

type PostCard = { slug?: string; url?: string };
const posts: PostCard[] = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));

// Если в посте есть url — используем его; иначе собираем из slug
const urls = [
  `${SITE}/`,
  `${SITE}/blog`,
  ...posts.map((p) =>
    p.url ? `${SITE}${p.url}` : `${SITE}/blog/${p.slug ?? ''}`
  ),
];

const payload = {
  host: new URL(SITE).host,
  key: KEY,
  keyLocation: `${SITE}/${KEY}.txt`,
  urlList: urls,
};

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

console.log('[indexnow] status:', res.status);
if (!res.ok) process.exit(1);
