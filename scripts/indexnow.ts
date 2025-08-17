// scripts/indexnow.ts
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://arti-clinic.ru'; // поменяй при надобности
const KEY = process.env.INDEXNOW_KEY || 'PUT-YOUR-GENERATED-KEY-HERE';
const KEY_FILE = path.join(process.cwd(), 'public', `${KEY}.txt`);
const POSTS_JSON = path.join(process.cwd(), 'public', 'posts.json');

if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, KEY);
  console.log('[indexnow] created key file:', KEY_FILE);
}

type PostCard = { url: string };
const posts: PostCard[] = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));
const urls = [SITE + '/', SITE + '/blog', ...posts.map((p) => p.url)];

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
