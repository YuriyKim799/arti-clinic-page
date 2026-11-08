import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import blogRedirects from '../src/data/blogRedirects.json';

type RoutingRule = {
  Condition?: { KeyPrefixEquals?: string; HttpErrorCodeReturnedEquals?: string };
  Redirect?: { Protocol?: string; HostName?: string; ReplaceKeyWith?: string; ReplaceKeyPrefixWith?: string; HttpRedirectCode?: string };
};
export type WebsiteConfig = {
  IndexDocument?: { Suffix?: string };
  ErrorDocument?: { Key?: string };
  RedirectAllRequestsTo?: unknown;
  RoutingRules?: RoutingRule[];
  [key: string]: unknown;
};
type PublisherOptions = {
  bucket?: string;
  siteOrigin?: string;
  redirects?: Record<string, string>;
  runAws?: (args: string[]) => string;
};

function desiredRules(redirects: Record<string, string>, articleSlugs: string[], siteOrigin: string): RoutingRule[] {
  const origin = new URL(siteOrigin);
  if (origin.protocol !== 'https:' || origin.origin !== siteOrigin || origin.username || origin.password) {
    throw Error('SITE_ORIGIN must be an HTTPS origin without a path, credentials, query or fragment');
  }
  const sources = Object.keys(redirects);
  return Object.entries(redirects).map(([from, to]) => {
    if (![from, to].every(slug => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) || from === to ||
      Object.hasOwn(redirects, to) || !articleSlugs.includes(to) || articleSlugs.some(slug => slug.startsWith(from)) ||
      sources.some(source => source !== from && (source.startsWith(from) || from.startsWith(source)))) {
      throw Error(`Invalid or conflicting article redirect prefix: ${from} -> ${to}`);
    }
    return {
      Condition: { KeyPrefixEquals: `blog/${from}`, HttpErrorCodeReturnedEquals: '404' },
      Redirect: { Protocol: 'https', HostName: origin.hostname, ReplaceKeyWith: `blog/${to}/`, HttpRedirectCode: '301' },
    };
  });
}

/** Preserve existing hosting documents and user rule order; Yandex applies the last matching rule. */
export function mergeWebsiteConfig(
  existing: WebsiteConfig,
  redirects: Record<string, string>,
  articleSlugs: string[],
  siteOrigin = 'https://articlinic.ru',
): WebsiteConfig {
  if (!existing || typeof existing !== 'object' || Array.isArray(existing) ||
    Object.hasOwn(existing, 'RedirectAllRequestsTo') || !existing.IndexDocument?.Suffix) {
    throw Error('Bucket must already host a website with IndexDocument; refusing to replace its hosting mode');
  }
  if (existing.RoutingRules !== undefined && !Array.isArray(existing.RoutingRules)) throw Error('Invalid existing bucket website routing rules');
  const managed = desiredRules(redirects, articleSlugs, siteOrigin);
  const previousRules = existing.RoutingRules ?? [];
  for (const desired of managed) {
    const conflicting = previousRules.some(rule =>
      rule.Condition?.KeyPrefixEquals === desired.Condition!.KeyPrefixEquals &&
      rule.Condition?.HttpErrorCodeReturnedEquals === '404' && !isDeepStrictEqual(rule, desired));
    if (conflicting) throw Error(`Conflicting existing website rule for ${desired.Condition!.KeyPrefixEquals}; no changes made`);
  }
  const retained = previousRules.filter(rule => !managed.some(desired => isDeepStrictEqual(rule, desired)));
  const rules = [...retained, ...managed];
  if (rules.length > 50) throw Error('Bucket website routing rules would exceed the Yandex limit of 50');
  return { ...existing, RoutingRules: rules };
}

function generatedFallback(html: string, expected: string, destination: string): boolean {
  const normalize = (value: string) => value.replace(/\r\n/g, '\n').trim();
  const relativeDestination = new URL(destination).pathname;
  return Buffer.byteLength(html, 'utf8') <= 8192 && normalize(html) === normalize(expected) &&
    html.includes('<title>Обновлённая статья — Арти Клиник</title>') &&
    html.includes(`<link rel="canonical" href="${destination}"`) &&
    html.includes(`<meta http-equiv="refresh" content="0;url=${relativeDestination}"`) &&
    !/<(?:h1|article|script)\b/i.test(html);
}

function missingObject(error: unknown): boolean {
  const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';
  return /\((?:404|NoSuchKey|NotFound)\)/.test(stderr);
}

export function publishBlogRedirects(directory = 'public', dryRun = false, options: PublisherOptions = {}) {
  const bucket = options.bucket ?? process.env.YC_BUCKET;
  const site = (options.siteOrigin ?? process.env.SITE_ORIGIN ?? 'https://articlinic.ru').replace(/\/+$/, '');
  if (!bucket && !dryRun) throw Error('YC_BUCKET is required');
  const posts: { slug: string }[] = JSON.parse(fs.readFileSync(path.join(directory, 'posts.json'), 'utf8'));
  if (!Array.isArray(posts) || posts.some(post => typeof post.slug !== 'string')) throw Error('Invalid posts index');
  const redirects = options.redirects ?? blogRedirects;
  desiredRules(redirects, posts.map(post => post.slug), site);
  const entries = Object.entries(redirects).map(([from, to]) => {
    const file = path.join(directory, 'blog', from, 'index.html');
    const expected = fs.readFileSync(file, 'utf8');
    const destination = `${site}/blog/${to}/`;
    if (!generatedFallback(expected, expected, destination)) throw Error(`Invalid generated redirect HTML: ${from}`);
    return { from, to, expected, destination, keys: [`blog/${from}`, `blog/${from}/`, `blog/${from}/index.html`] };
  });
  if (dryRun) {
    for (const entry of entries) console.log(`[blog redirects] ${entry.from} -> ${entry.destination} (website HTTP 301 on 404; remove only three validated HTML keys; keep images)`);
    return { rules: entries.length, removed: 0 };
  }
  const runAws = options.runAws ?? (args => execFileSync('aws', args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, maxBuffer: 5 * 1024 * 1024, windowsHide: true,
  }));
  function aws(operation: string, args: string[], optionalMissing = false): string | undefined {
    try { return runAws(['s3api', operation, '--bucket', bucket!, ...args, '--endpoint-url', 'https://storage.yandexcloud.net', '--output', 'json']); }
    catch (error) {
      if (optionalMissing && missingObject(error)) return undefined;
      throw Error(`Object Storage ${operation} failed; verify S3 credentials, website read/write permissions and the bucket name`);
    }
  }
  function json<T>(operation: string, args: string[] = [], optionalMissing = false): T | undefined {
    const output = aws(operation, args, optionalMissing);
    if (output === undefined) return undefined;
    try { return JSON.parse(output) as T; }
    catch { throw Error(`Object Storage ${operation} returned invalid JSON`); }
  }
  const tempRoot = path.resolve(os.tmpdir());
  const temporary = fs.mkdtempSync(path.join(tempRoot, 'arti-blog-redirects-'));
  let removed = 0;
  try {
    const current = json<WebsiteConfig>('get-bucket-website')!;
    const expectedConfig = mergeWebsiteConfig(current, redirects, posts.map(post => post.slug), site);
    for (const entry of entries) json('head-object', ['--key', `blog/${entry.to}/index.html`]);
    const inspected: { key: string; etag?: string; size: number }[] = [];
    for (const entry of entries) {
      for (const key of entry.keys) {
        const head = json<{ ContentLength?: number; ContentType?: string; ETag?: string }>('head-object', ['--key', key], true);
        if (!head) continue;
        if (typeof head.ContentLength !== 'number' || head.ContentLength > 8192 || !head.ContentType?.toLowerCase().startsWith('text/html')) {
          throw Error(`Refusing to remove an unrecognized object at ${key}`);
        }
        const downloaded = path.join(temporary, `object-${inspected.length}.html`);
        aws('get-object', ['--key', key, downloaded]);
        const html = fs.readFileSync(downloaded, 'utf8');
        if (!generatedFallback(html, entry.expected, entry.destination)) throw Error(`Refusing to remove non-generated redirect HTML at ${key}`);
        inspected.push({ key, etag: head.ETag, size: head.ContentLength });
      }
    }
    if (!isDeepStrictEqual(current, expectedConfig)) {
      const configuration = path.join(temporary, 'website.json');
      fs.writeFileSync(configuration, JSON.stringify(expectedConfig), 'utf8');
      aws('put-bucket-website', ['--website-configuration', `file://${configuration}`]);
    }
    const stored = json<WebsiteConfig>('get-bucket-website');
    if (!isDeepStrictEqual(stored, expectedConfig)) throw Error('Bucket website configuration read-back did not match; no HTML objects were removed');
    // A configuration change alone cannot redirect existing 200 objects. Remove only inspected generated HTML.
    for (const object of inspected) {
      const latest = json<{ ContentLength?: number; ETag?: string }>('head-object', ['--key', object.key], true);
      if (!latest) continue;
      if (latest.ContentLength !== object.size || latest.ETag !== object.etag) throw Error(`Object changed before removal: ${object.key}; stopped safely`);
      aws('delete-object', ['--key', object.key]);
      removed++;
    }
    console.log(`[blog redirects] Verified ${entries.length} website HTTP 301 rule(s); removed ${removed} generated HTML object(s); images preserved`);
    return { rules: entries.length, removed };
  } finally {
    const relative = path.relative(tempRoot, temporary);
    if (relative.startsWith('arti-blog-redirects-') && !relative.includes(path.sep)) fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export async function checkPublishedBlogRedirects() {
  const site = (process.env.SITE_ORIGIN || 'https://articlinic.ru').replace(/\/+$/, '');
  for (const [from, to] of Object.entries(blogRedirects)) {
    const target = `${site}/blog/${to}/`;
    for (const route of [`/blog/${from}`, `/blog/${from}/`, `/blog/${from}/index.html`]) {
      const response = await fetch(site + route, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const location = response.headers.get('location');
      if (response.status !== 301 || location !== target) throw Error(`Expected HTTP 301 and absolute Location for ${route}; received HTTP ${response.status}`);
    }
  }
  console.log('[blog redirects] Published article redirects return HTTP 301 and the expected absolute Location');
}

const normalizeEntrypoint = (filename: string) => process.platform === 'win32' ? path.resolve(filename).toLowerCase() : path.resolve(filename);
if (process.argv[1] && normalizeEntrypoint(process.argv[1]) === normalizeEntrypoint(fileURLToPath(import.meta.url))) {
  try {
    if (process.argv.includes('--check-published')) await checkPublishedBlogRedirects();
    else publishBlogRedirects('public', process.argv.includes('--dry-run'));
  } catch (error) {
    console.error(`[blog redirects] ${error instanceof Error ? error.message : 'Publication failed'}`);
    process.exitCode = 1;
  }
}
