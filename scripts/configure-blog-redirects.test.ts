import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRedirectRules, configureBlogRedirects } from './configure-blog-redirects';

const redirects = { 'old-article': 'retained-article' };
const siteOrigin = 'https://articlinic.ru';
const desired = buildRedirectRules(redirects)[0];
type Call = { url: string; method: string; body?: Record<string, unknown> };

function fixture(configuration: { rules?: unknown[]; resource?: unknown; post?: unknown; patch?: unknown; operation?: unknown; status?: number; ignoreMutations?: boolean } = {}) {
  const calls: Call[] = [];
  const pauses: number[] = [];
  const rules = structuredClone(configuration.rules ?? []) as Record<string, unknown>[];
  const fetchApi: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-token');
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as Record<string, unknown> : undefined;
    calls.push({ url, method, body });
    if (configuration.status) return Response.json({ secret: 'DO-NOT-LOG-SERVER-RESPONSE' }, { status: configuration.status });
    if (url.includes('/resources/')) return Response.json(configuration.resource ?? { cname: 'articlinic.ru' });
    if (url.includes('operation.api.cloud.yandex.net/operations/')) return Response.json(configuration.operation ?? { id: 'operation-1', done: true });
    if (method === 'GET' && url.includes('/rules?')) return Response.json({ rules });
    if (method === 'POST') {
      if (!configuration.ignoreMutations) rules.push({ id: '456', ...body });
      return Response.json(configuration.post ?? { id: 'operation-1', done: true });
    }
    if (method === 'PATCH') {
      if (!configuration.ignoreMutations) {
        const rule = rules.find(candidate => String(candidate.id) === url.split('/').pop())!;
        const previousOptions = rule.options as Record<string, unknown>;
        Object.assign(rule, body, { options: { ...previousOptions, ...body?.options as object } });
      }
      return Response.json(configuration.patch ?? { id: 'operation-1', done: true });
    }
    throw Error(`Unexpected API request: ${method} ${url}`);
  };
  return {
    calls, pauses,
    options: {
      resourceId: 'cdn-resource', token: 'test-token', siteOrigin, redirects,
      fetch: fetchApi,
      sleep: async (milliseconds: number) => { pauses.push(milliseconds); },
    },
  };
}

test('builds a stable managed name and an exact pattern for all three legacy paths', () => {
  assert.equal(desired.name, buildRedirectRules(redirects)[0].name);
  assert.ok(desired.name.length <= 50);
  assert.ok(desired.rulePattern.length <= 100);
  const expression = new RegExp(desired.rulePattern);
  for (const route of desired.paths) assert.ok(expression.test(route), route);
  for (const route of ['/blog/old-article/cover.jpg', '/blog/old-article-other/', '/x/blog/old-article/', '/blog/retained-article/']) assert.ok(!expression.test(route), route);
  assert.deepEqual(desired.options.staticResponse, { enabled: true, code: '301', content: 'https://articlinic.ru/blog/retained-article/' });
});

test('rejects invalid redirects, chains, overly long patterns and unsafe origins', () => {
  const invalidMappings: Record<string, string>[] = [{ a: 'a' }, { a: 'b', b: 'c' }, { '../a': 'b' }, { ['a'.repeat(90)]: 'b' }];
  for (const mapping of invalidMappings) assert.throws(() => buildRedirectRules(mapping));
  for (const origin of ['http://articlinic.ru', 'https://articlinic.ru/path', 'https://user:pass@articlinic.ru', 'https://articlinic.ru/?q=1']) assert.throws(() => buildRedirectRules(redirects, origin));
});

test('dry run is offline and requires no credentials', async () => {
  const result = await configureBlogRedirects({ redirects, dryRun: true, fetch: async () => { throw Error('Network must not be used'); } });
  assert.ok('planned' in result);
  assert.equal(result.planned.length, 1);
});

test('creates only the managed rule after validating the resource and all existing rules', async () => {
  const f = fixture({ rules: [{ id: '91', name: 'user-images', rulePattern: '^/images/', weight: '0', options: { disableCache: { enabled: true } } }, { id: '92', name: 'user-catchall', rulePattern: '.*', weight: '10' }] });
  assert.deepEqual(await configureBlogRedirects(f.options), { created: 1, updated: 0, unchanged: 0 });
  assert.equal(f.calls.length, 4);
  assert.ok(f.calls[0].url.endsWith('/resources/cdn-resource'));
  assert.ok(f.calls[1].url.endsWith('/rules?resourceId=cdn-resource'));
  assert.deepEqual(f.calls[2], {
    url: 'https://cdn.api.cloud.yandex.net/cdn/v1/rules', method: 'POST',
    body: { resourceId: 'cdn-resource', name: desired.name, rulePattern: desired.rulePattern, weight: '0', options: desired.options },
  });
});

test('an existing identical managed rule is a read-only no-op', async () => {
  const f = fixture({ rules: [{ id: '123', ...desired, options: { ...desired.options, disableCache: { enabled: true } } }] });
  assert.deepEqual(await configureBlogRedirects(f.options), { created: 0, updated: 0, unchanged: 1 });
  assert.deepEqual(f.calls.map(call => call.method), ['GET', 'GET']);
});

test('updates only the managed rule and masks the whole staticResponse option', async () => {
  const f = fixture({ rules: [{ id: '123', ...desired, weight: '9', options: { disableCache: { enabled: true }, staticResponse: { enabled: true, code: '302', content: 'https://articlinic.ru/old-target/' } } }] });
  assert.deepEqual(await configureBlogRedirects(f.options), { created: 0, updated: 1, unchanged: 0 });
  const patch = f.calls[2];
  assert.equal(patch.method, 'PATCH');
  assert.ok(patch.url.endsWith('/rules/123'));
  assert.equal(patch.body?.updateMask, 'options.staticResponse');
  assert.equal(patch.body?.weight, '0');
  assert.deepEqual(patch.body?.options, desired.options);
  assert.ok(!Object.hasOwn(patch.body!, 'originsGroupId'));
  assert.ok(f.calls[3].url.endsWith('/rules?resourceId=cdn-resource'));
});

test('verification detects an API that silently leaves the previous weight unchanged', async () => {
  const f = fixture({ rules: [{ id: '123', ...desired, weight: '9' }], ignoreMutations: true });
  await assert.rejects(configureBlogRedirects(f.options), /did not confirm.*weight 0/);
  assert.equal(f.calls[2].method, 'PATCH');
  assert.equal(f.calls[2].body?.weight, '0');
});

test('verification detects a missing rule after a completed create operation', async () => {
  const f = fixture({ ignoreMutations: true });
  await assert.rejects(configureBlogRedirects(f.options), /did not confirm.*weight 0/);
});

test('refuses competing highest-priority rules and unsupported regex without mutating anything', async () => {
  for (const pattern of ['^/blog/', '.*', '(?P<unsupported>.*)']) {
    const f = fixture({ rules: [{ id: '1', name: 'user-rule', rulePattern: pattern, weight: '0' }] });
    await assert.rejects(configureBlogRedirects(f.options), /highest.priority/);
    assert.ok(f.calls.every(call => call.method === 'GET'));
  }
});

test('checks every planned redirect before any write', async () => {
  const f = fixture({ rules: [{ id: '1', name: 'user-rule', rulePattern: '^/blog/second/', weight: '0' }] });
  await assert.rejects(configureBlogRedirects({ ...f.options, redirects: { ...redirects, second: 'second-target' } }), /highest priority/);
  assert.ok(f.calls.every(call => call.method === 'GET'));
});

test('refuses managed-name collisions and duplicate managed rules', async () => {
  for (const rules of [
    [{ id: '1', name: desired.name, rulePattern: '^/unrelated/', weight: '0' }],
    [{ id: '1', ...desired }, { id: '2', ...desired }],
  ]) {
    const f = fixture({ rules });
    await assert.rejects(configureBlogRedirects(f.options), /no rules were changed/);
    assert.ok(f.calls.every(call => call.method === 'GET'));
  }
});

test('refuses a resource serving another site before listing or mutating rules', async () => {
  const f = fixture({ resource: { cname: 'alinakim.site' } });
  await assert.rejects(configureBlogRedirects(f.options), /does not serve/);
  assert.equal(f.calls.length, 1);
});

test('accepts SITE_ORIGIN as a secondary hostname', async () => {
  const f = fixture({ resource: { cname: 'www.articlinic.ru', secondaryHostnames: ['articlinic.ru'] } });
  assert.equal((await configureBlogRedirects(f.options)).created, 1);
});

test('waits for async operations using the documented operation API', async () => {
  const f = fixture({ post: { id: 'operation-1', done: false } });
  assert.equal((await configureBlogRedirects(f.options)).created, 1);
  assert.deepEqual(f.pauses, [5000]);
  assert.equal(f.calls[3].url, 'https://operation.api.cloud.yandex.net/operations/operation-1');
});

test('aborts on failed operations and pending operation timeouts', async () => {
  const failed = fixture({ post: { id: 'operation-1', done: true, error: { code: 7 } } });
  await assert.rejects(configureBlogRedirects(failed.options), /operation failed \(code 7\)/);
  const pending = fixture({ post: { id: 'operation-1' }, operation: { id: 'operation-1', done: false } });
  await assert.rejects(configureBlogRedirects(pending.options), /still pending after 120 seconds/);
  assert.equal(pending.pauses.length, 24);
});

test('permission failures are actionable and do not reveal token or API body', async () => {
  const f = fixture({ status: 403 });
  await assert.rejects(configureBlogRedirects(f.options), error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /HTTP 403.*cdn.editor/);
    assert.ok(!error.message.includes('test-token'));
    assert.ok(!error.message.includes('DO-NOT-LOG'));
    return true;
  });
});
