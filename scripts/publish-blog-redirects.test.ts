import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { mergeWebsiteConfig, publishBlogRedirects, type WebsiteConfig } from './publish-blog-redirects';

const redirects = { 'old-article': 'retained-article' };
const slugs = ['retained-article', 'other-article'];
const keys = ['blog/old-article', 'blog/old-article/', 'blog/old-article/index.html'];
const base: WebsiteConfig = { IndexDocument: { Suffix: 'index.html' }, ErrorDocument: { Key: '404.html' } };
const fallback = '<!doctype html><title>Обновлённая статья — Арти Клиник</title>\n<link rel="canonical" href="https://articlinic.ru/blog/retained-article/" />\n<meta http-equiv="refresh" content="0;url=/blog/retained-article/" /><p><a href="/blog/retained-article/">Открыть обновлённую статью</a></p>';

function fixture(t: TestContext, settings: { config?: WebsiteConfig; fail?: string; wrongReadback?: boolean; missingTarget?: boolean; missingOld?: boolean; oldBody?: string; changedBeforeDelete?: boolean } = {}) {
  const root = path.resolve(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(root, 'arti-publisher-test-'));
  t.after(() => {
    if (path.dirname(directory) === root && path.basename(directory).startsWith('arti-publisher-test-')) fs.rmSync(directory, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(directory, 'blog/old-article'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'posts.json'), JSON.stringify(slugs.map(slug => ({ slug }))));
  fs.writeFileSync(path.join(directory, 'blog/old-article/index.html'), fallback);
  let config = structuredClone(settings.config ?? base);
  const objects = new Map<string, string>();
  if (!settings.missingTarget) objects.set('blog/retained-article/index.html', '<h1>Published retained article</h1>');
  if (!settings.missingOld) for (const key of keys) objects.set(key, settings.oldBody ?? fallback);
  objects.set('blog/old-article/cover.jpg', 'original image');
  const calls: string[][] = [];
  const headCounts = new Map<string, number>();
  let reads = 0;
  function runAws(args: string[]) {
    calls.push(args);
    const operation = args[1];
    const key = args[args.indexOf('--key') + 1];
    if (settings.fail === operation) throw Object.assign(Error('contains sensitive CLI details'), { stderr: 'AccessDenied credentials DO-NOT-PRINT' });
    if (operation === 'get-bucket-website') {
      reads++;
      return JSON.stringify(settings.wrongReadback && reads > 1 ? base : config);
    }
    if (operation === 'put-bucket-website') {
      const filename = args[args.indexOf('--website-configuration') + 1].replace(/^file:\/\//, '');
      config = JSON.parse(fs.readFileSync(filename, 'utf8'));
      return '';
    }
    if (operation === 'head-object') {
      const body = objects.get(key);
      if (body === undefined) throw Object.assign(Error('missing object'), { stderr: 'An error occurred (404) when calling HeadObject' });
      const count = (headCounts.get(key) ?? 0) + 1;
      headCounts.set(key, count);
      const etag = createHash('sha256').update(body).digest('hex');
      return JSON.stringify({ ContentLength: Buffer.byteLength(body), ContentType: 'text/html; charset=utf-8', ETag: settings.changedBeforeDelete && keys.includes(key) && count > 1 ? 'different-etag' : etag });
    }
    if (operation === 'get-object') {
      fs.writeFileSync(args[args.indexOf('--key') + 2], objects.get(key)!);
      return JSON.stringify({ ContentType: 'text/html' });
    }
    if (operation === 'delete-object') { objects.delete(key); return ''; }
    throw Error(`Unexpected AWS operation: ${operation}`);
  }
  return {
    directory, objects, calls, getConfig: () => config,
    publish: (dryRun = false) => publishBlogRedirects(directory, dryRun, { bucket: 'articlinic.ru', siteOrigin: 'https://articlinic.ru', redirects, runAws }),
  };
}

test('merge preserves website documents and existing rule order, and appends one 404-only permanent redirect', () => {
  const existing: WebsiteConfig = { ...base, RoutingRules: [
    { Condition: { KeyPrefixEquals: 'images/' }, Redirect: { HostName: 'images.example.com' } },
    { Condition: { HttpErrorCodeReturnedEquals: '404' }, Redirect: { ReplaceKeyWith: 'not-found/' } },
  ] };
  const snapshot = structuredClone(existing);
  const result = mergeWebsiteConfig(existing, redirects, slugs);
  assert.deepEqual(existing, snapshot);
  assert.deepEqual(result.IndexDocument, existing.IndexDocument);
  assert.deepEqual(result.ErrorDocument, existing.ErrorDocument);
  assert.deepEqual(result.RoutingRules!.slice(0, 2), existing.RoutingRules);
  assert.deepEqual(result.RoutingRules![2], {
    Condition: { KeyPrefixEquals: 'blog/old-article', HttpErrorCodeReturnedEquals: '404' },
    Redirect: { Protocol: 'https', HostName: 'articlinic.ru', ReplaceKeyWith: 'blog/retained-article/', HttpRedirectCode: '301' },
  });
});

test('merge is idempotent and keeps managed rules last without reordering user rules', () => {
  const once = mergeWebsiteConfig(base, redirects, slugs);
  assert.deepEqual(mergeWebsiteConfig(once, redirects, slugs), once);
  const userRule = { Condition: { KeyPrefixEquals: 'other/' }, Redirect: { ReplaceKeyWith: 'new/' } };
  const result = mergeWebsiteConfig({ ...once, RoutingRules: [...once.RoutingRules!, userRule] }, redirects, slugs);
  assert.deepEqual(result.RoutingRules, [userRule, ...once.RoutingRules!]);
});

test('merge rejects hosting mode changes, conflicting rules and more than 50 rules', () => {
  assert.throws(() => mergeWebsiteConfig({ RedirectAllRequestsTo: { HostName: 'other.example' } }, redirects, slugs), /hosting mode/);
  const conflict = mergeWebsiteConfig(base, redirects, slugs);
  conflict.RoutingRules![0].Redirect!.ReplaceKeyWith = 'another-target/';
  assert.throws(() => mergeWebsiteConfig(conflict, redirects, slugs), /Conflicting/);
  const many = Array.from({ length: 50 }, (_, i) => ({ Condition: { KeyPrefixEquals: `other-${i}/` }, Redirect: { ReplaceKeyWith: 'x/' } }));
  assert.throws(() => mergeWebsiteConfig({ ...base, RoutingRules: many }, redirects, slugs), /limit of 50/);
});

test('merge rejects active-prefix collisions, chains, missing targets and unsafe origins', () => {
  for (const active of [['retained-article', 'old-article'], ['retained-article', 'old-article-copy'], ['other-article']]) assert.throws(() => mergeWebsiteConfig(base, redirects, active), /prefix/);
  assert.throws(() => mergeWebsiteConfig(base, { a: 'b', b: 'c' }, ['c']), /prefix/);
  assert.throws(() => mergeWebsiteConfig(base, redirects, slugs, 'http://articlinic.ru'), /HTTPS/);
  assert.throws(() => mergeWebsiteConfig(base, redirects, slugs, 'https://articlinic.ru/path'), /HTTPS/);
});

test('dry run validates local data without invoking AWS', t => {
  const f = fixture(t);
  assert.deepEqual(f.publish(true), { rules: 1, removed: 0 });
  assert.equal(f.calls.length, 0);
});

test('publisher verifies website config before deleting exactly three generated HTML keys and preserves images', t => {
  const f = fixture(t);
  assert.deepEqual(f.publish(), { rules: 1, removed: 3 });
  const deletes = f.calls.filter(call => call[1] === 'delete-object');
  assert.deepEqual(deletes.map(call => call[call.indexOf('--key') + 1]), keys);
  assert.ok(f.objects.has('blog/old-article/cover.jpg'));
  assert.ok(f.objects.has('blog/retained-article/index.html'));
  const firstDelete = f.calls.findIndex(call => call[1] === 'delete-object');
  assert.equal(f.calls.slice(0, firstDelete).filter(call => call[1] === 'get-bucket-website').length, 2);
  assert.ok(f.calls.some(call => call[1] === 'put-bucket-website'));
  assert.ok(!f.calls.some(call => call.includes('--website-redirect-location') || call[1] === 'put-object'));
});

test('publisher can repeat without writing website config or deleting nonexistent objects', t => {
  const f = fixture(t, { config: mergeWebsiteConfig(base, redirects, slugs), missingOld: true });
  assert.deepEqual(f.publish(), { rules: 1, removed: 0 });
  assert.ok(!f.calls.some(call => ['put-bucket-website', 'delete-object', 'get-object'].includes(call[1])));
});

test('publisher rejects original article content before any website write or deletion', t => {
  const f = fixture(t, { oldBody: '<h1>Original article with useful content</h1>' });
  assert.throws(() => f.publish(), /non-generated redirect HTML/);
  assert.ok(!f.calls.some(call => ['put-bucket-website', 'delete-object'].includes(call[1])));
});

test('publisher refuses oversized HTML and changed objects', t => {
  const oversized = fixture(t, { oldBody: 'x'.repeat(9000) });
  assert.throws(() => oversized.publish(), /unrecognized object/);
  assert.ok(!oversized.calls.some(call => call[1] === 'delete-object'));
  const changed = fixture(t, { changedBeforeDelete: true });
  assert.throws(() => changed.publish(), /changed before removal/);
  assert.ok(!changed.calls.some(call => call[1] === 'delete-object'));
});

test('target HEAD failure, website GET/PUT failure and mismatched read-back prevent all deletions', t => {
  for (const settings of [{ missingTarget: true }, { fail: 'get-bucket-website' }, { fail: 'put-bucket-website' }, { wrongReadback: true }]) {
    const f = fixture(t, settings);
    assert.throws(() => f.publish());
    assert.ok(!f.calls.some(call => call[1] === 'delete-object'));
  }
});

test('AWS errors do not expose captured stderr or credentials', t => {
  const f = fixture(t, { fail: 'get-bucket-website' });
  assert.throws(() => f.publish(), error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /website read\/write permissions/);
    assert.ok(!error.message.includes('DO-NOT-PRINT'));
    return true;
  });
});
