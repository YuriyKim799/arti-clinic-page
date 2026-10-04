import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const bucket = process.env.YC_BUCKET;
const dryRun = process.argv.includes('--dry-run');
if (!bucket && !dryRun) throw Error('YC_BUCKET is required');
const routes: { route: string; file: string }[] = JSON.parse(fs.readFileSync('.cache/routes.json', 'utf8'));
// Exact object keys avoid the error-document fallback (which retains HTTP 404).
for (const { route, file } of routes) {
  if (route === '/') continue;
  if (!fs.existsSync(`dist/${file}`)) throw Error(`Missing HTML: ${file}`);
  for (const key of [route.slice(1), route.slice(1) + '/', route.slice(1) + '/index.html']) {
    if (dryRun) { console.log(`${file} -> ${key}`); continue; }
    // put-object preserves a trailing slash in the key; s3 cp treats it as a directory.
    execFileSync('aws', ['s3api', 'put-object', '--body', `dist/${file}`, '--bucket', bucket!, '--key', key,
      '--endpoint-url', 'https://storage.yandexcloud.net', '--content-type', 'text/html; charset=utf-8',
      '--cache-control', 'no-store'], { stdio: ['ignore', 'ignore', 'inherit'] });
  }
}
console.log(`[routes] ${dryRun ? 'Validated' : 'Published'} ${routes.length - 1} application routes`);
