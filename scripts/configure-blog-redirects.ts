import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import blogRedirects from '../src/data/blogRedirects.json';

const CDN_API = 'https://cdn.api.cloud.yandex.net/cdn/v1';
const OPERATION_API = 'https://operation.api.cloud.yandex.net/operations';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type StaticResponse = { enabled?: boolean; code?: string | number; content?: string };
type Rule = {
  id?: string | number;
  name?: string;
  rulePattern?: string;
  weight?: string | number;
  options?: { staticResponse?: StaticResponse; [key: string]: unknown };
};
type Operation = { id?: string; done?: boolean; error?: { code?: number } };
export type RedirectRule = {
  name: string;
  rulePattern: string;
  weight: '0';
  options: { staticResponse: { enabled: true; code: '301'; content: string } };
  paths: string[];
};
export type ConfigureOptions = {
  resourceId?: string;
  token?: string;
  siteOrigin?: string;
  redirects?: Record<string, string>;
  dryRun?: boolean;
  fetch?: typeof globalThis.fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

export function buildRedirectRules(redirects: Record<string, string>, siteOrigin = 'https://articlinic.ru'): RedirectRule[] {
  const site = siteOrigin.replace(/\/+$/, '');
  const origin = new URL(site);
  if (origin.protocol !== 'https:' || origin.origin !== site || origin.username || origin.password) {
    throw Error('SITE_ORIGIN must be an HTTPS origin without a path, credentials, query or fragment');
  }
  return Object.entries(redirects).map(([from, to]) => {
    if (!SLUG.test(from) || !SLUG.test(to) || from === to || Object.hasOwn(redirects, to)) {
      throw Error(`Invalid article redirect: ${from} -> ${to}`);
    }
    const rulePattern = `^/blog/${from}(/index[.]html|/)?$`;
    if (rulePattern.length > 100) throw Error(`Article redirect pattern exceeds the CDN limit of 100 characters: ${from}`);
    return {
      name: `blog-redirect-${createHash('sha256').update(from).digest('hex').slice(0, 16)}`,
      rulePattern,
      weight: '0',
      options: { staticResponse: { enabled: true, code: '301', content: `${site}/blog/${to}/` } },
      paths: [`/blog/${from}`, `/blog/${from}/`, `/blog/${from}/index.html`],
    };
  });
}

function priority(rule: Rule): number {
  const value = Number(rule.weight ?? 0);
  if (!Number.isInteger(value) || value < 0 || value > 9999) throw Error('CDN returned an invalid rule weight; no rules were changed');
  return value;
}

function matches(pattern: string | undefined, paths: string[]): boolean {
  if (typeof pattern !== 'string' || !pattern) throw Error('Cannot assess an existing highest-priority CDN rule without its pattern');
  try {
    const expression = new RegExp(pattern);
    return paths.some(route => expression.test(route));
  } catch {
    throw Error('Cannot safely assess an existing highest-priority CDN rule pattern; no rules were changed');
  }
}

/** Uses only the official CDN ResourceRules API. Other resources and rules are never changed. */
export async function configureBlogRedirects(options: ConfigureOptions = {}) {
  const desired = buildRedirectRules(options.redirects ?? blogRedirects, options.siteOrigin);
  if (options.dryRun) return { created: 0, updated: 0, unchanged: 0, planned: desired };
  const { resourceId, token } = options;
  if (!resourceId || !/^[a-zA-Z0-9_-]{1,50}$/.test(resourceId)) throw Error('A valid YC_CDN_ID is required');
  if (!token || /[\r\n]/.test(token)) throw Error('IAM_TOKEN is required');
  const fetchApi = options.fetch ?? globalThis.fetch;
  const sleep = options.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));

  async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetchApi(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw Error(`CDN ${method} request failed or timed out; check connectivity before retrying`);
    }
    if (!response.ok) {
      const permission = response.status === 401 || response.status === 403
        ? '; check IAM_TOKEN and the service account cdn.editor role in the resource folder'
        : '';
      throw Error(`CDN ${method} request failed with HTTP ${response.status}${permission}`);
    }
    try { return await response.json() as T; }
    catch { throw Error(`CDN ${method} request returned invalid JSON`); }
  }

  async function waitForOperation(operation: Operation): Promise<void> {
    for (let attempt = 0; ; attempt++) {
      if (operation.error) throw Error(`CDN rule operation failed (code ${operation.error.code ?? 'unknown'})`);
      if (operation.done) return;
      if (!operation.id || !/^[a-zA-Z0-9_-]+$/.test(operation.id)) throw Error('CDN returned an invalid operation identifier');
      if (attempt >= 24) throw Error('CDN rule operation is still pending after 120 seconds; inspect it before retrying');
      await sleep(5000);
      operation = await request<Operation>(`${OPERATION_API}/${encodeURIComponent(operation.id)}`);
    }
  }

  // Check the configured resource before any mutation, preventing deployment to another site's CDN.
  const resource = await request<{ cname?: string; secondaryHostnames?: string[] }>(`${CDN_API}/resources/${encodeURIComponent(resourceId)}`);
  const hostname = new URL(options.siteOrigin ?? 'https://articlinic.ru').hostname;
  const hostnames = [resource.cname, ...(resource.secondaryHostnames ?? [])].map(host => host?.toLowerCase());
  if (!hostnames.includes(hostname.toLowerCase())) throw Error('YC_CDN_ID does not serve SITE_ORIGIN; no rules were changed');

  // ResourceRules.List is not paginated: the official response contains the complete rules array.
  const listing = await request<{ rules?: Rule[] }>(`${CDN_API}/rules?resourceId=${encodeURIComponent(resourceId)}`);
  if (listing.rules !== undefined && !Array.isArray(listing.rules)) throw Error('CDN returned an invalid rules list');
  const existing = listing.rules ?? [];
  const plan = desired.map(rule => {
    const sameName = existing.filter(candidate => candidate.name === rule.name);
    if (sameName.length > 1) throw Error(`Duplicate managed CDN rule name: ${rule.name}; no rules were changed`);
    const own = sameName[0];
    if (own && own.rulePattern !== rule.rulePattern) throw Error(`Managed CDN rule name conflicts with another pattern: ${rule.name}; no rules were changed`);
    if (own && !/^[1-9][0-9]*$/.test(String(own.id ?? ''))) throw Error('Managed CDN rule has an invalid identifier; no rules were changed');
    for (const other of existing) {
      if (other === own) continue;
      if (priority(other) === 0 && matches(other.rulePattern, rule.paths)) {
        throw Error(`An existing CDN rule has equal highest priority for ${rule.paths[0]}; no rules were changed`);
      }
    }
    const actual = own?.options?.staticResponse;
    const unchanged = own && priority(own) === 0 && actual?.enabled === true && String(actual.code) === '301' && actual.content === rule.options.staticResponse.content;
    return { rule, own, action: unchanged ? 'unchanged' as const : own ? 'update' as const : 'create' as const };
  });

  const result = { created: 0, updated: 0, unchanged: 0 };
  for (const { rule, own, action } of plan) {
    if (action === 'unchanged') { result.unchanged++; continue; }
    const { paths: _paths, ...configuration } = rule;
    if (action === 'update') {
      // FieldMask's JSON representation uses lowerCamelCase. Mask the whole option, preserving other options.
      await waitForOperation(await request<Operation>(`${CDN_API}/rules/${own!.id}`, 'PATCH', {
        resourceId, ...configuration, updateMask: 'options.staticResponse',
      }));
      result.updated++;
    } else {
      await waitForOperation(await request<Operation>(`${CDN_API}/rules`, 'POST', { resourceId, ...configuration }));
      result.created++;
    }
  }
  if (result.created || result.updated) {
    const verification = await request<{ rules?: Rule[] }>(`${CDN_API}/rules?resourceId=${encodeURIComponent(resourceId)}`);
    if (!Array.isArray(verification.rules)) throw Error('CDN rule verification returned an invalid rules list');
    for (const rule of desired) {
      const stored = verification.rules.filter(candidate => candidate.name === rule.name);
      const actual = stored[0]?.options?.staticResponse;
      if (stored.length !== 1 || stored[0].rulePattern !== rule.rulePattern || priority(stored[0]) !== 0 ||
        actual?.enabled !== true || String(actual.code) !== '301' || actual.content !== rule.options.staticResponse.content) {
        throw Error(`CDN did not confirm the expected HTTP 301 rule and weight 0 for ${rule.paths[0]}; inspect the managed rule before retrying`);
      }
    }
  }
  return result;
}

const normalizeEntrypoint = (filename: string) => process.platform === 'win32' ? path.resolve(filename).toLowerCase() : path.resolve(filename);
if (process.argv[1] && normalizeEntrypoint(process.argv[1]) === normalizeEntrypoint(fileURLToPath(import.meta.url))) {
  try {
    const result = await configureBlogRedirects({
      resourceId: process.env.YC_CDN_ID,
      token: process.env.IAM_TOKEN,
      siteOrigin: process.env.SITE_ORIGIN,
      dryRun: process.argv.includes('--dry-run'),
    });
    if ('planned' in result) {
      for (const rule of result.planned ?? []) console.log(`[blog redirects] ${rule.rulePattern} -> ${rule.options.staticResponse.content} (CDN HTTP 301)`);
    } else console.log(`[blog redirects] CDN rules: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged. Allow up to 15 minutes for propagation.`);
  } catch (error) {
    console.error(`[blog redirects] ${error instanceof Error ? error.message : 'CDN configuration failed'}`);
    process.exitCode = 1;
  }
}
