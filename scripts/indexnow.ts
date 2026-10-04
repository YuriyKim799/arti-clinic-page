import fs from 'node:fs';
import path from 'node:path';

const site = (process.env.SITE_ORIGIN || 'https://articlinic.ru').replace(/\/$/, '');
const key = process.env.INDEXNOW_KEY || '';
const dryRun = process.argv.includes('--dry-run');
const prepare = process.argv.includes('--prepare-key');
if (!dryRun && !/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw Error('A valid INDEXNOW_KEY is required');

if (prepare) {
  fs.writeFileSync(path.join('public', `${key}.txt`), key);
  console.log('[indexnow] Key file prepared; publish it before submitting URLs.');
} else {
  const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&')))];
  if (!urls.length || urls.some(url => new URL(url).origin !== site)) throw Error('Sitemap is empty or contains another origin');
  if (dryRun) {
    console.log(`[indexnow] ${urls.length} URLs validated; no requests sent.`);
  } else {
    const keyLocation = `${site}/${key}.txt`;
    const proof = await fetch(keyLocation, { signal: AbortSignal.timeout(15000) });
    if (!proof.ok || (await proof.text()).trim() !== key) throw Error('IndexNow key is not publicly accessible yet');
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ host: new URL(site).host, key, keyLocation, urlList: urls }),
    });
    console.log('[indexnow] status:', response.status);
    if (!response.ok) throw Error(`IndexNow rejected request: ${response.status}`);
  }
}
