import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { neurologistConsultationPrices, rubleAmount } from '../src/data/neurologistConsultation';

const root = path.resolve('dist');
const routes: { route: string; file: string }[] = JSON.parse(fs.readFileSync('.cache/routes.json', 'utf8'));
const pathname = '/services/nevrolog';
const site = (process.env.SITE_ORIGIN || process.env.VITE_SITE_URL || 'https://articlinic.ru').replace(/\/+$/, '');
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url || '/', 'http://local').pathname);
  const route = routes.find(({ route }) => route === urlPath || route === urlPath.replace(/\/$/, ''));
  let file = path.resolve(root, route?.file || '.' + urlPath);
  let status = 200;
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    file = path.join(root, '404.html'); status = 404;
  }
  response.writeHead(status, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const staticPage = await noJs.newPage();
  assert.equal((await staticPage.goto(origin + pathname))?.status(), 200);
  assert.equal(await staticPage.locator('h1').count(), 1);
  assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'), site + pathname);
  assert.deepEqual(await staticPage.locator('#consultation-prices tbody td:last-child').allTextContents(), neurologistConsultationPrices.map(({ price }) => price));
  for (const name of ['Тян Виктория Николаевна', 'Ким Алина Александровна']) {
    assert.ok(await staticPage.getByRole('heading', { name, exact: true }).isVisible());
  }
  const serviceSchema = await staticPage.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes
    .map(node => JSON.parse(node.textContent || '{}')).flat().find(schema => schema['@type'] === 'Service'));
  assert.ok(serviceSchema, 'Service data must be present without JavaScript');
  assert.deepEqual(serviceSchema.offers.map((offer: { price: number }) => offer.price), neurologistConsultationPrices.map(({ price }) => rubleAmount(price)));
  assert.ok(serviceSchema.offers.every((offer: { priceCurrency: string; url: string }) => offer.priceCurrency === 'RUB' && offer.url === site + pathname + '#consultation-prices'));
  await noJs.close();
  console.log('[consultation] initial HTML, both doctors and all six prices/schema match the price list');

  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', isMobile: width < 700, hasTouch: width < 700 });
    await context.addInitScript(() => { try { localStorage.setItem('cookie-consent-v1', 'rejected'); } catch {} });
    let submitted: { name: string; page: string } | undefined;
    await context.route('**/*', route => {
      const request = route.request();
      if (request.method() === 'POST' && request.url() === 'https://functions.yandexcloud.net/d4ehvps5uj8pkr10vkjs') {
        submitted = request.postDataJSON();
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      }
      return request.url().startsWith(origin + '/') && !['media', 'font'].includes(request.resourceType()) ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + pathname, { waitUntil: 'networkidle' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: page overflows`);
    await page.locator('a[href="#consultation-prices"]').click();
    await page.waitForFunction(() => {
      const prices = document.getElementById('consultation-prices')?.getBoundingClientRect();
      const header = document.querySelector('[aria-label="Шапка сайта"]')?.getBoundingClientRect();
      return !!prices && !!header && prices.top >= header.bottom - 1 && prices.top < 250;
    });
    await page.screenshot({ path: `.cache/consultation-prices-${width}.png` });
    await page.getByRole('button', { name: 'Записаться к неврологу', exact: true }).click();
    const form = page.locator('form').filter({ has: page.locator('input[name="phone"]') }).last();
    await form.locator('input[name="name"]').fill('Локальная проверка невролога');
    await form.locator('input[name="phone"]').fill('+79990000000');
    await form.locator('input[name="agree"]').check();
    await form.getByRole('button', { name: 'Записаться', exact: true }).click();
    await page.getByText('Спасибо! Заявка отправлена.', { exact: true }).waitFor({ state: 'visible' });
    assert.equal(submitted?.name, 'Локальная проверка невролога');
    assert.equal(new URL(submitted!.page).pathname, pathname);
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await page.locator('main a[href="/doctors/kim-alina"]').click();
    await page.waitForURL(origin + '/doctors/kim-alina');
    await page.getByRole('heading', { name: 'Ким Алина Александровна', level: 1, exact: true }).waitFor({ state: 'visible' });
    await page.goto(origin + '/#doctor-tyan-viktoria', { waitUntil: 'networkidle' });
    await page.locator('#doctor-tyan-viktoria').waitFor({ state: 'visible' });
    // Manual selection must remain possible after arriving through a doctor anchor.
    await page.locator('#specialists button').filter({ has: page.locator('img[alt="Доктор Ким Алина Александровна"]') }).click();
    await page.locator('#doctor-kim-alina').waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Приём невролога: стоимость и запись', exact: true }).click();
    await page.getByRole('heading', { name: 'Приём невролога в Москве', exact: true }).waitFor({ state: 'visible' });
    await page.goto(origin + '/price-list', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Приём невролога: врачи, подготовка и запись →', exact: true }).click();
    await page.getByRole('heading', { name: 'Приём невролога в Москве', exact: true }).waitFor({ state: 'visible' });
    assert.deepEqual(errors, [], `${width}px: browser errors`);
    console.log(`[consultation] ${width}px: layout, mocked booking, doctor profiles, legacy anchors and price-list navigation OK`);
    await context.close();
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
