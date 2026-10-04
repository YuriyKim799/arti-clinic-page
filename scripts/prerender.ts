import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const dist = path.resolve('dist');
const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const site = (process.env.SITE_ORIGIN || 'https://articlinic.ru').replace(/\/$/, '');
const serviceSource = fs.readFileSync('src/data/services.ts', 'utf8');
const slugs = [...serviceSource.matchAll(/\bslug:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
if (!slugs.length || slugs.some(slug => !/^[a-z0-9-]+$/.test(slug))) throw Error('Invalid service routes');
const routes = ['/', '/services', ...slugs.map(s => `/services/${s}`), '/price-list', '/blog', '/agreement', '/politic'];
const posts = JSON.parse(fs.readFileSync(path.join(dist, 'posts.json'), 'utf8'));
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
// Serve the untouched shell for every app route; never render a previously saved snapshot.
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  if (routes.includes(pathname) || pathname === '/__prerender_not_found__') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(shell); return;
  }
  const file = path.resolve(dist, '.' + pathname);
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address() as { port: number };
const origin = `http://127.0.0.1:${address.port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-v1', 'rejected'));
  await context.route('**/*', route => {
    const request = route.request();
    if (!request.url().startsWith(origin + '/') || ['media', 'font'].includes(request.resourceType())) return route.abort();
    return route.continue();
  });
  const manifest: { route: string; file: string }[] = [];
  for (const route of [...routes, '/__prerender_not_found__']) {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.locator('h1').first().waitFor({ state: 'attached' });
    await page.waitForFunction(() => !!document.querySelector('link[rel="canonical"]'));
    if (route === '/') await page.locator('#contact #record').waitFor({ state: 'attached' });
    if (route === '/blog') await page.waitForFunction(count => document.querySelectorAll('main a[href^="/blog/"]').length === count, posts.length);
    if (errors.length) throw Error(`${route}: ${errors.join('; ')}`);
    const metadata = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      title: document.title,
      text: document.querySelector('#root')?.textContent || '',
    }));
    if (route !== '/__prerender_not_found__' && metadata.canonical !== site + route) throw Error(`Wrong canonical for ${route}: ${metadata.canonical}`);
    if (!metadata.title || metadata.text.length < (route === '/__prerender_not_found__' ? 30 : 100)) throw Error(`Empty prerender for ${route}`);
    await page.evaluate(isNotFound => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      // Helmet's route metadata takes precedence over the fallback from index.html.
      for (const selector of ['title', 'meta[name="description"]', 'meta[property="og:locale"]']) {
        const nodes = [...document.head.querySelectorAll(selector)];
        if (nodes.some(el => el.hasAttribute('data-rh'))) nodes.filter(el => !el.hasAttribute('data-rh')).forEach(el => el.remove());
      }
      document.querySelectorAll('script[src^="http"]').forEach(el => el.remove());
      // Let React select the video for the visitor's screen before any download.
      // Posters remain in the HTML, so the first frame is available without JS.
      document.querySelectorAll('video').forEach(video => {
        video.removeAttribute('src');
        video.removeAttribute('autoplay');
        video.setAttribute('preload', 'none');
        video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
      });
      if (isNotFound) document.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach(el => el.remove());
    }, route === '/__prerender_not_found__');
    const file = route === '/' ? 'index.html' : route === '/__prerender_not_found__' ? '404.html' : route.slice(1) + '/index.html';
    fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
    fs.writeFileSync(path.join(dist, file), await page.content());
    if (route !== '/__prerender_not_found__') manifest.push({ route, file });
    await page.close();
  }
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync('.cache/routes.json', JSON.stringify(manifest, null, 2));
  fs.writeFileSync('.cache/cdn-purge.json', JSON.stringify({ paths: [...new Set([
    ...manifest.flatMap(({ route }) => route === '/' ? ['/', '/index.html'] : [route, route + '/', route + '/index.html']),
    '/robots.txt', '/sitemap.xml', '/posts.json', '/rss-dzen.xml', '/404.html',
  ])] }));
  console.log(`[prerender] ${manifest.length} pages + 404.html`);
} finally {
  await browser?.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
