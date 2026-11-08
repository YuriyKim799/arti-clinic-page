import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import blogRedirects from '../src/data/blogRedirects.json';

export function publishBlogRedirects(directory = 'public', dryRun = false) {
  const bucket = process.env.YC_BUCKET;
  const site = (process.env.SITE_ORIGIN || 'https://articlinic.ru').replace(/\/+$/, '');
  if (!bucket && !dryRun) throw Error('YC_BUCKET is required');
  const posts: { slug: string }[] = JSON.parse(fs.readFileSync(path.join(directory, 'posts.json'), 'utf8'));
  const articleSlugs = new Set(posts.map(post => post.slug));
  const redirects: Record<string, string> = blogRedirects;
  for (const [from, to] of Object.entries(redirects)) {
    if (![from, to].every(slug => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) ||
      from === to || Object.hasOwn(redirects, to) || !articleSlugs.has(to) || articleSlugs.has(from)) {
      throw Error(`Invalid article redirect: ${from} -> ${to}`);
    }
    const body = path.join(directory, 'blog', from, 'index.html');
    if (!fs.existsSync(body)) throw Error(`Missing article redirect HTML: ${body}`);
    const destination = `${site}/blog/${to}/`;
    for (const key of [`blog/${from}`, `blog/${from}/`, `blog/${from}/index.html`]) {
      if (dryRun) {
        console.log(`[blog redirects] ${key} -> ${destination} (HTML fallback; HTTP 301 is configured in CDN)`);
        continue;
      }
      execFileSync('aws', [
        's3api', 'put-object', '--body', body, '--bucket', bucket!, '--key', key,
        '--endpoint-url', 'https://storage.yandexcloud.net',
        '--content-type', 'text/html; charset=utf-8', '--cache-control', 'no-store',
      ], { stdio: ['ignore', 'ignore', 'inherit'] });
    }
  }
}

async function checkPublishedBlogRedirects() {
  const site = (process.env.SITE_ORIGIN || 'https://articlinic.ru').replace(/\/+$/, '');
  for (const [from, to] of Object.entries(blogRedirects)) {
    const target = `${site}/blog/${to}/`;
    for (const route of [`/blog/${from}`, `/blog/${from}/`, `/blog/${from}/index.html`]) {
      const response = await fetch(site + route, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const location = response.headers.get('location');
      if (response.status !== 301 || !location || new URL(location, site).href !== target) {
        throw Error(`Expected article redirect ${route} -> ${target}, received HTTP ${response.status}, Location ${location}`);
      }
    }
  }
  console.log('[blog redirects] Published article redirects return HTTP 301 and the expected Location');
}

const normalizeEntrypoint = (filename: string) => process.platform === 'win32' ? path.resolve(filename).toLowerCase() : path.resolve(filename);
if (process.argv[1] && normalizeEntrypoint(process.argv[1]) === normalizeEntrypoint(fileURLToPath(import.meta.url))) {
  if (process.argv.includes('--check-published')) await checkPublishedBlogRedirects();
  else publishBlogRedirects('public', process.argv.includes('--dry-run'));
}
