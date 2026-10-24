import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium, type Page } from 'playwright';
import { neurologistConsultationPrices } from '../src/data/neurologistConsultation';

const root = path.resolve('dist');
const routes: { route: string; file: string }[] = JSON.parse(fs.readFileSync('.cache/routes.json', 'utf8'));
const site = (process.env.SITE_ORIGIN || process.env.VITE_SITE_URL || 'https://articlinic.ru').replace(/\/+$/, '');
const profiles = [
  { id: 'tyan-viktoria', name: 'Тян Виктория Николаевна', documentCount: 7 },
  { id: 'kim-alina', name: 'Ким Алина Александровна', documentCount: 4 },
];
const mime: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
};
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

type Schema = Record<string, unknown>;
async function structuredData(page: Page): Promise<Schema[]> {
  const results: Schema[] = [];
  function collect(value: unknown) {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (value && typeof value === 'object') {
      const object = value as Schema;
      results.push(object);
      if (object['@graph']) collect(object['@graph']);
    }
  }
  for (const text of await page.locator('script[type="application/ld+json"]').allTextContents()) {
    collect(JSON.parse(text || '{}'));
  }
  return results;
}
function hasType(schema: Schema, type: string): boolean {
  const types = schema['@type'];
  return Array.isArray(types) ? types.includes(type) : types === type;
}
function pricesFor(id: string) {
  return neurologistConsultationPrices.filter(({ neurologyConsultation }) =>
    id === 'tyan-viktoria'
      ? neurologyConsultation.doctorId === id
      : !neurologyConsultation.doctorId);
}

let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const staticPage = await noJs.newPage();
  assert.equal((await staticPage.goto(origin + '/doctors'))?.status(), 200);
  assert.equal(await staticPage.locator('h1').count(), 1);
  assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'), site + '/doctors');
  for (const profile of profiles) {
    const doctorPath = '/doctors/' + profile.id;
    assert.ok(await staticPage.locator(`main a[href="${doctorPath}"]`).count() > 0, `${profile.name}: directory has an ordinary profile link`);
  }

  for (const profile of profiles) {
    const doctorPath = '/doctors/' + profile.id;
    assert.equal((await staticPage.goto(origin + doctorPath))?.status(), 200);
    assert.equal(await staticPage.locator('h1').count(), 1);
    assert.equal(await staticPage.locator('h1').textContent(), profile.name);
    assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'), site + doctorPath);
    assert.ok((await staticPage.title()).includes(profile.name), `${profile.name}: individual document title`);
    assert.deepEqual(await staticPage.locator('#doctor-prices tbody td:last-child').allTextContents(), pricesFor(profile.id).map(({ price }) => price));
    const schemas = await structuredData(staticPage);
    const person = schemas.find(schema => hasType(schema, 'Person') && schema.name === profile.name);
    const clinic = schemas.find(schema => hasType(schema, 'MedicalClinic'));
    assert.ok(person, `${profile.name}: Person data exists without JavaScript`);
    assert.ok(clinic, `${profile.name}: separate MedicalClinic data exists without JavaScript`);
    assert.ok(!hasType(person, 'MedicalClinic') && !hasType(clinic, 'Person'), 'A doctor and a clinic must have separate identities');
    assert.equal(person.url, site + doctorPath);
    if (person.worksFor && typeof person.worksFor === 'object' && '@id' in person.worksFor) {
      assert.equal(person.worksFor['@id'], clinic['@id']);
    }
    assert.ok((await staticPage.locator('#doctor-biography').innerText()).length > 200, 'The detailed biography is present in initial HTML');
    assert.ok((await staticPage.locator('#doctor-education').innerText()).length > 100, 'Education is present in initial HTML');
    assert.equal(await staticPage.getByRole('heading', { name: 'Консультация и направления лечения', exact: true }).count(), 0);

    const documents = staticPage.locator('#doctor-documents a:has(img)');
    const documentCount = await documents.count();
    assert.equal(documentCount, profile.documentCount, `${profile.name}: unexpected document coverage`);
    assert.equal(await staticPage.locator('#doctor-documents figcaption').count(), documentCount);
    if (profile.id === 'kim-alina') {
      assert.ok(await staticPage.locator('#doctor-documents').getByText(
        'Документы об образовании выданы на девичью фамилию — Тян.',
        { exact: true },
      ).isVisible(), 'Kim’s maiden surname is explained alongside the documents without JavaScript');
    }
    for (let index = 0; index < documentCount; index++) {
      const link = documents.nth(index);
      const href = await link.getAttribute('href');
      assert.ok(href && !href.startsWith('#'), `${profile.name}: document has a direct URL`);
      const documentUrl = new URL(href, origin);
      assert.equal(documentUrl.origin, origin, 'QA only accesses local documents');
      const response = await noJs.request.get(documentUrl.href);
      assert.equal(response.status(), 200, `${profile.name}: document ${index + 1} loads`);
      assert.match(response.headers()['content-type'], /^(image\/|application\/pdf)/);
      assert.ok((await link.locator('img').getAttribute('alt'))?.trim(), 'Document images have readable labels');
    }
    console.log(`[doctors] ${doctorPath}: initial HTML, prices, Person/MedicalClinic and ${documentCount} direct documents OK`);
  }

  await staticPage.goto(origin + '/');
  for (const profile of profiles) {
    assert.ok(await staticPage.locator(`#specialists a[href="/doctors/${profile.id}"]`).count() > 0, `${profile.name}: homepage profile link exists without interaction`);
  }
  assert.equal(await staticPage.locator('#services a[href^="/services/"]').count(), 9);
  assert.equal(await staticPage.getByRole('navigation', { name: 'Основное меню', includeHidden: true }).getByRole('link', { name: 'Специалисты', exact: true, includeHidden: true }).getAttribute('href'), '/#specialists');
  assert.equal(await staticPage.getByRole('navigation', { name: 'Разделы сайта' }).getByRole('link', { name: 'Врачи', exact: true }).getAttribute('href'), '/doctors');
  assert.equal((await staticPage.goto(origin + '/doctors/nonexistent-qa-doctor'))?.status(), 404);
  assert.match(await staticPage.locator('meta[name="robots"]').getAttribute('content') || '', /noindex/);
  assert.ok(!(await structuredData(staticPage)).some(schema => hasType(schema, 'Person')), 'A missing profile must not describe a doctor');
  await noJs.close();

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
    for (let index = 0; index < profiles.length; index++) {
      const profile = profiles[index];
      const doctorPath = '/doctors/' + profile.id;
      await page.goto(origin + '/services/nevrolog', { waitUntil: 'networkidle' });
      await page.locator(`main a[href="${doctorPath}"]`).click();
      await page.waitForURL(origin + doctorPath);
      await page.getByRole('heading', { name: profile.name, level: 1, exact: true }).waitFor({ state: 'visible' });
      // Documents remain on each doctor's page; the homepage links there without a separate gallery.
      await page.goto(origin + '/#doctor-' + profile.id, { waitUntil: 'networkidle' });
      const doctorCard = page.locator('#doctor-' + profile.id);
      await doctorCard.waitFor({ state: 'visible' });
      assert.equal(await doctorCard.getByText('Документы и сертификаты', { exact: true }).count(), 0);
      assert.equal(await doctorCard.getByRole('button', { name: 'Открыть', exact: true }).count(), 0);
      assert.equal(await page.getByRole('dialog', { name: /^Документы и сертификаты —/ }).count(), 0);
      const profileLink = doctorCard.getByRole('link', { name: 'Подробнее о враче', exact: true });
      assert.equal(await profileLink.getAttribute('href'), doctorPath);
      await profileLink.click();
      await page.waitForURL(origin + doctorPath);
      await page.getByRole('heading', { name: profile.name, level: 1, exact: true }).waitFor({ state: 'visible' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px ${doctorPath}: page overflows`);
      await page.locator('a[href="#doctor-prices"]').first().click();
      await page.waitForFunction(() => {
        const prices = document.getElementById('doctor-prices')?.getBoundingClientRect();
        const header = document.querySelector('[aria-label="Шапка сайта"]')?.getBoundingClientRect();
        return !!prices && !!header && prices.top >= header.bottom - 1 && prices.top < 250;
      });
      await page.screenshot({ path: `.cache/doctor-${profile.id}-${width}.png` });

      await page.getByRole('button', { name: 'Записаться на приём', exact: true }).first().click();
      const form = page.locator('form').filter({ has: page.locator('input[name="phone"]') }).last();
      await form.locator('input[name="name"]').fill('Локальная проверка профиля врача');
      await form.locator('input[name="phone"]').fill('+79990000000');
      await form.locator('input[name="agree"]').check();
      await form.getByRole('button', { name: 'Записаться', exact: true }).click();
      await page.getByText('Спасибо! Заявка отправлена.', { exact: true }).waitFor({ state: 'visible' });
      assert.equal(submitted?.name, 'Локальная проверка профиля врача');
      assert.equal(new URL(submitted!.page).pathname, doctorPath);
      await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
      await page.getByRole('link', { name: '← Все врачи Арти Клиник', exact: true }).click();
      await page.waitForURL(origin + '/doctors');
      await page.getByRole('heading', { name: 'Врачи Арти Клиник', level: 1, exact: true }).waitFor({ state: 'visible' });
    }
    await page.goto(origin + '/doctors', { waitUntil: 'networkidle' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: directory overflows`);
    const navigation = page.getByRole('navigation', { name: 'Основное меню' });
    if (width < 700) await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
    await navigation.getByRole('link', { name: 'Специалисты', exact: true }).click();
    await page.waitForURL(origin + '/#specialists');
    await page.waitForFunction(() => {
      const section = document.getElementById('specialists')?.getBoundingClientRect();
      const header = document.querySelector('[aria-label="Шапка сайта"]')?.getBoundingClientRect();
      return !!section && !!header && section.top >= header.bottom - 1 && section.top < 250;
    });
    if (width < 700) assert.equal(await page.getByRole('button', { name: 'Открыть меню', exact: true }).getAttribute('aria-expanded'), 'false');
    await page.goto(origin + '/doctors/nonexistent-qa-doctor', { waitUntil: 'networkidle' });
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content') || '', /noindex/);
    assert.ok(!(await structuredData(page)).some(schema => hasType(schema, 'Person')));
    assert.deepEqual(errors, [], `${width}px: browser errors`);
    console.log(`[doctors] ${width}px: both profiles, price anchors, mocked booking, navigation and missing profile OK`);
    await context.close();
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
