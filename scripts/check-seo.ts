import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const routes: { route: string; file: string }[] = JSON.parse(fs.readFileSync('.cache/routes.json', 'utf8'));
const site = (process.env.SITE_ORIGIN || 'https://articlinic.ru').replace(/\/$/, '');
const read = (file: string) => fs.readFileSync(path.join('dist', file), 'utf8');
for (const { route, file } of routes) {
  const html = read(file);
  assert.match(html, /<h1[\s>]/, `${route}: no H1 in initial HTML`);
  assert.equal((html.match(/<title[\s>]/g) || []).length, 1, `${route}: duplicate title`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${route}: duplicate canonical`);
  assert.ok(html.includes(`href="${site}${route}"`), `${route}: wrong canonical`);
  assert.ok(!html.includes('127.0.0.1:'), `${route}: leaked preview origin`);
}
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const file = routes.find(r => r.route === pathname)?.file || pathname.slice(1) + 'index.html';
  const html = read(file);
  assert.ok(!/<meta[^>]*name="robots"[^>]*noindex/.test(html), `${url}: noindex`);
  if (pathname.startsWith('/blog/')) {
    assert.match(html, /<article>/, `${url}: no article content`);
    const json = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.ok(json.length, `${url}: no structured data`);
    json.forEach(m => JSON.parse(m[1]));
  }
}
assert.match(read('404.html'), /noindex/);
assert.equal(read('robots.txt'), fs.readFileSync('public/robots.txt', 'utf8'));
assert.ok(!fs.existsSync('robots.txt'), 'Duplicate robots.txt source');
console.log(`[seo] ${routes.length} prerendered routes, ${urls.length} sitemap URLs, robots and structured data OK`);
