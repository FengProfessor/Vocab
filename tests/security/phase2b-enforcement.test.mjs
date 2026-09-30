import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import net from 'node:net';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'p2b-enforcement-'));
const read = (path) => readFileSync(join(root, path), 'utf8');
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const originalConsole = { log: console.log, warn: console.warn, error: console.error };
const logs = [];
let serial = 0;
const modules = new Map();
const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init, headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
});
class TestNextResponse extends Response {
  static json(body, init) {
    return new TestNextResponse(JSON.stringify(body), {
      ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  }
}
globalThis.__p2bNextResponse = TestNextResponse;
globalThis.__p2bStubs = {};

async function load(name, source) {
  const path = join(temp, `${name}-${serial++}.mjs`);
  writeFileSync(path, ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const url = pathToFileURL(path).href;
  modules.set(name, url);
  return import(url);
}

function replaceImports(source) {
  const file = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
  const edits = [];
  for (const node of file.statements.filter(ts.isImportDeclaration)) {
    const specifier = node.moduleSpecifier.text;
    if (specifier !== 'next/server' && !specifier.startsWith('@/')) continue;
    const binding = node.importClause?.namedBindings;
    assert(binding && ts.isNamedImports(binding), `unexpected import in test: ${specifier}`);
    const names = binding.elements.filter(item => !item.isTypeOnly)
      .map(item => item.propertyName ? `${item.propertyName.text}: ${item.name.text}` : item.name.text);
    const target = specifier === 'next/server'
      ? '{ NextResponse: globalThis.__p2bNextResponse }'
      : `globalThis.__p2bStubs[${JSON.stringify(specifier)}]`;
    edits.push({ start: node.getStart(file), end: node.end, text: `const { ${names.join(', ')} } = ${target};` });
  }
  for (const edit of edits.reverse()) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  return source;
}

function extractFunction(path, name) {
  const source = read(path);
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  return file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(file);
}

// RESP adapter chỉ dùng Redis service cô lập của CI, không kết nối production.
function parseResp(buffer, offset = 0) {
  const end = buffer.indexOf('\r\n', offset);
  if (end < 0) return null;
  const type = String.fromCharCode(buffer[offset]);
  const value = buffer.toString('utf8', offset + 1, end);
  let next = end + 2;
  if (type === '-') throw new Error(`Test Redis error: ${value}`);
  if (type === '+') return { value, next };
  if (type === ':') return { value: Number(value), next };
  if (type === '$') {
    const length = Number(value);
    if (length === -1) return { value: null, next };
    if (buffer.length < next + length + 2) return null;
    return { value: buffer.toString('utf8', next, next + length), next: next + length + 2 };
  }
  if (type === '*') {
    const values = [];
    for (let index = 0; index < Number(value); index++) {
      const item = parseResp(buffer, next);
      if (!item) return null;
      values.push(item.value);
      next = item.next;
    }
    return { value: values, next };
  }
  throw new Error('Unexpected test Redis response');
}

async function redis(args) {
  const port = Number(process.env.P2B_REDIS_TEST_PORT);
  assert(Number.isInteger(port) && port > 0 && port < 65536);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    let data = Buffer.alloc(0);
    socket.setTimeout(4000, () => { socket.destroy(); reject(new Error('Test Redis timeout')); });
    socket.on('error', reject);
    socket.on('connect', () => {
      const parts = [`*${args.length}\r\n`];
      for (const arg of args) {
        const string = String(arg);
        parts.push(`$${Buffer.byteLength(string)}\r\n${string}\r\n`);
      }
      socket.write(parts.join(''));
    });
    socket.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
      try {
        const parsed = parseResp(data);
        if (parsed) { socket.end(); resolve(parsed.value); }
      } catch (error) { socket.destroy(); reject(error); }
    });
  });
}

try {
  for (const name of ['log', 'warn', 'error']) console[name] = (...args) => logs.push(args.join(' '));
  const limiter = await load('limiter', read('src/lib/distributed-rate-limit.ts'));
  const auth = await load('billing-auth', read('src/lib/billing-webhook-auth.ts'));
  const billingKey = 'dedicated-billing-test-credential-'.padEnd(64, 'b');
  const cronKey = 'unrelated-cron-test-credential-'.padEnd(64, 'c');
  const managementKey = 'unrelated-management-credential-'.padEnd(64, 'm');
  Object.assign(process.env, {
    BILLING_WEBHOOK_SECRET: billingKey, CRON_SECRET: cronKey,
    WEBHOOK_SECRET: managementKey, SEPAY_WEBHOOK_KEY: managementKey, SEPAY_API_KEY: managementKey,
    UPSTASH_REDIS_REST_URL: 'https://synthetic.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'synthetic-redis-token',
  });
  const headers = value => new Headers(value ? { authorization: value } : {});
  assert(auth.isBillingWebhookAuthorized(headers(`Apikey ${billingKey}`)));
  assert(auth.isBillingWebhookAuthorized(headers(`aPiKeY ${billingKey}`)));
  for (const value of [null, '', `Bearer ${billingKey}`, `Apikey ${cronKey}`, `Apikey ${managementKey}`,
    'Apikey wrong', `Apikey ${billingKey} extra`, `Apikey  ${billingKey}`, `Apikey ${'x'.repeat(513)}`]) {
    assert.equal(auth.isBillingWebhookAuthorized(headers(value)), false);
  }
  for (const name of ['secure-token', 'x-webhook-secret', 'x-api-key']) {
    assert.equal(auth.isBillingWebhookAuthorized(new Headers({ [name]: billingKey })), false);
  }
  delete process.env.BILLING_WEBHOOK_SECRET;
  assert.equal(auth.isBillingWebhookAuthorized(headers(`Apikey ${billingKey}`)), false);
  process.env.BILLING_WEBHOOK_SECRET = cronKey;
  assert.equal(auth.isBillingWebhookAuthorized(headers(`Apikey ${cronKey}`)), false);
  process.env.BILLING_WEBHOOK_SECRET = billingKey;

  // Unit: provider failures không trở thành allow, local bucket hay quota exhausted.
  const unavailable = limiter.RateLimitUnavailableError;
  for (const result of [null, {}, { result: 1 }, { result: [1] }, { result: ['1', 100] },
    { result: [0, 100] }, { result: [1, -1] }, { result: [1, 60001] }, { error: 'provider error', result: [1, 100] }]) {
    globalThis.fetch = async () => json(result);
    await assert.rejects(limiter.checkRateLimitAsync('unit', 2), unavailable);
  }
  for (const status of [401, 429, 500]) {
    globalThis.fetch = async () => json({}, { status });
    await assert.rejects(limiter.checkRateLimitAsync('unit', 2), unavailable);
  }
  globalThis.fetch = async () => { throw new Error('secret provider details must not escape'); };
  await assert.rejects(limiter.checkRateLimitAsync('unit', 2), error => error instanceof unavailable && !error.message.includes('secret provider'));
  globalThis.fetch = async () => new Response('not json');
  await assert.rejects(limiter.checkRateLimitAsync('unit', 2), unavailable);
  for (const name of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
    const previous = process.env[name];
    delete process.env[name];
    await assert.rejects(limiter.checkRateLimitAsync('unit', 2), unavailable);
    process.env[name] = previous;
  }
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body));
    assert.equal(init.method, 'POST');
    assert.equal(init.cache, 'no-store');
    return json({ result: [2, 1234] });
  };
  assert.deepEqual(await limiter.checkRateLimitAsync('route-a:user-a', 2, 2000), { allowed: true, remaining: 0, resetIn: 1234 });
  assert.equal((await limiter.checkRateLimitAsync('route-a:user-a', 1, 2000)).allowed, false);
  await limiter.checkRateLimitAsync('route-b:user-a', 2, 2000);
  await limiter.checkRateLimitAsync('route-a:user-b', 2, 2000);
  assert.deepEqual(calls.map(call => call[3]), ['rl:route-a:user-a', 'rl:route-a:user-a', 'rl:route-b:user-a', 'rl:route-a:user-b']);
  assert(calls.every(call => call[0] === 'EVAL' && call[2] === '1' && call[4] === '2000'));

  // Load shared API error mapping with the actual limiter class identity.
  const securitySource = read('src/lib/api-security.ts')
    .replaceAll("'@/lib/distributed-rate-limit'", JSON.stringify(modules.get('limiter')));
  globalThis.__p2bStubs['@/lib/supabase-server'] = { createServiceClient: () => { throw new Error('Unexpected service client'); } };
  globalThis.__p2bStubs['@/lib/ttl-cache'] = { cacheGet: () => undefined, cacheSet: () => {} };
  globalThis.__p2bStubs['@/lib/cron-auth'] = { isCronAuthorizationValid: () => false };
  globalThis.__p2bStubs['@/lib/server-auth-session'] = { getWebUser: async () => ({data:{user:null}}), sessionCookieName: () => '__Host-lingopro-session', assertAppRequest: () => {} };
  globalThis.__p2bStubs['@/lib/session-response'] = { sessionErrorResponse: () => null, PRIVATE_SESSION_HEADERS: {} };
  const security = await load('security', replaceImports(securitySource));
  const outageResponse = security.rateLimitUnavailableResponse(new unavailable());
  assert.equal(outageResponse.status, 503);
  assert.equal((await outageResponse.json()).error, 'RATE_LIMIT_UNAVAILABLE');
  assert.equal(security.safeErrorResponse(new unavailable()).status, 503);
  globalThis.__p2bStubs['@/lib/api-security'] = security;
  const quotaSource = replaceImports(read('src/lib/anti-scrape.ts'));
  const scrape = await load('anti-scrape-bound', quotaSource);
  globalThis.fetch = async () => json({}, { status: 503 });
  assert.equal((await scrape.assertScrapeQuota('test', [{ suffix: 'm', limit: 2, windowMs: 60000 }])).status, 503);

  let forbiddenEffects = 0;
  const poison = () => { forbiddenEffects++; throw new Error('Unexpected downstream effect'); };
  globalThis.__p2bStubs['@/lib/api-security'] = { ...security, getAuthUser: poison };
  globalThis.__p2bStubs['@/lib/supabase'] = { createPublicAuthClient: poison };
  globalThis.__p2bStubs['@/lib/supabase-server'] = { createServiceClient: poison };
  for (const path of ['src/app/api/auth/register/route.ts', 'src/app/api/demo/codemix-upgrade/route.ts', 'src/app/api/practice/pack-passage/route.ts']) {
    const source = read(path);
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const node of file.statements.filter(ts.isImportDeclaration)) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith('@/') && !globalThis.__p2bStubs[specifier]) {
        globalThis.__p2bStubs[specifier] = new Proxy({}, { get: () => poison });
      }
    }
    const route = await load('outage-route', replaceImports(source));
    const response = await route.POST(new Request('https://app.test/api', { method: 'POST', body: '{}' }));
    assert.equal(response.status, 503, path);
    const body = await response.json();
    assert.equal(body.error, 'RATE_LIMIT_UNAVAILABLE');
    assert.equal(body.upgradeTo, undefined);
    assert.equal(forbiddenEffects, 0, 'outage must reject before account/AI/payment work');
  }
  const quotaHelpers = ['checkAndConsumeCodemixUpgrade', 'checkAndConsumePackReading'].map(name => extractFunction('src/lib/entitlement-server.ts', name)).join('\n')
    .replaceAll("'@/lib/api-security'", JSON.stringify(modules.get('security')));
  const quotas = await load('quotas', 'const FREE_CODEMIX_UPGRADE_DAILY_LIMIT = 1; const FREE_PACK_READING_DAILY_LIMIT = 2;\n' + quotaHelpers);
  await assert.rejects(quotas.checkAndConsumeCodemixUpgrade('user', 'free', 'ip'), unavailable);
  await assert.rejects(quotas.checkAndConsumePackReading('user', 'free', 'ip'), unavailable);

  // Actual webhook + actual confirmOrder service, with an isolated stateful RPC adapter.
  const confirm = await load('confirm-order', extractFunction('src/lib/billing.ts', 'confirmOrder'));
  const orderId = 'a1b2c3d4-0000-0000-0000-000000000001';
  let db;
  const resetDb = () => {
    db = { order: { id: orderId, user_id: 'synthetic-user', amount: 99000, status: 'pending', order_kind: 'standard' },
      events: new Map(), profilePlan: 'free', subscriptions: [], rpcCalls: 0, mutations: 0, clients: 0 };
  };
  function service() {
    db.clients++;
    return {
      from(table) {
        const filters = [];
        const query = {
          select: () => query,
          eq: (name, value) => { filters.push([name, value]); return query; },
          gte: () => query, lte: () => query,
          maybeSingle: async () => ({ data: table === 'orders' ? db.order : db.events.get(filters.find(([name]) => name === 'event_key')?.[1]) ?? null }),
          then(resolve) { return Promise.resolve({ data: table === 'orders' && db.order.status === 'pending' ? [db.order] : [], error: null }).then(resolve); },
          upsert: async row => { db.events.set(row.event_key, { ...row }); db.mutations++; return { error: null }; },
          update: row => ({ eq: async (_, key) => { Object.assign(db.events.get(key), row); db.mutations++; return { error: null }; } }),
        };
        return query;
      },
      async rpc(name, args) {
        if (name === 'fn_process_referral_reward') return { data: null, error: null };
        assert.equal(name, 'confirm_paid_order');
        db.rpcCalls++;
        if (db.order.status === 'paid') return { data: { success: true, plan: 'pro', expiresAt: '2030-01-01' }, error: null };
        assert.equal(args.p_order_id, orderId);
        db.order.status = 'paid';
        db.profilePlan = 'pro';
        db.subscriptions.push({ orderId, paymentRef: args.p_payment_ref });
        db.mutations++;
        return { data: { success: true, plan: 'pro', expiresAt: '2030-01-01' }, error: null };
      },
    };
  }
  globalThis.__p2bStubs['@/lib/supabase-server'] = { createServiceClient: service };
  globalThis.__p2bStubs['@/lib/billing'] = confirm;
  globalThis.__p2bStubs['@/lib/billing-webhook-auth'] = auth;
  globalThis.__p2bStubs['@/lib/api-security'] = security;
  const webhook = await load('webhook', replaceImports(read('src/app/api/billing/webhook/route.ts')));
  const event = { transferType: 'in', content: 'LINGOPRO a1b2c3d4', transferAmount: 99000, referenceCode: 'synthetic-payment-reference' };
  const post = (customHeaders, body = event) => webhook.POST(new Request('https://app.test/api/billing/webhook', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...customHeaders }, body: JSON.stringify(body),
  }));
  delete process.env.PAYOS_CHECKSUM_KEY;
  for (const customHeaders of [{}, { authorization: 'Apikey wrong' }, { authorization: `Apikey ${cronKey}` },
    { authorization: `Apikey ${managementKey}` }, { authorization: `Bearer ${billingKey}` },
    { 'secure-token': billingKey }, { 'x-webhook-secret': billingKey }, { 'x-api-key': billingKey }]) {
    resetDb();
    assert.equal((await post(customHeaders)).status, 401);
    assert.equal(db.clients, 0); assert.equal(db.mutations, 0); assert.equal(db.rpcCalls, 0);
    assert.equal(db.profilePlan, 'free'); assert.equal(db.subscriptions.length, 0);
  }
  resetDb();
  delete process.env.BILLING_WEBHOOK_SECRET;
  assert.equal((await post({ authorization: `Apikey ${billingKey}` })).status, 401);
  assert.equal(db.clients, 0);
  process.env.BILLING_WEBHOOK_SECRET = billingKey;
  const validHeaders = { authorization: `Apikey ${billingKey}` };
  resetDb();
  const empty = await post(validHeaders, { error: 0, data: [] });
  assert.equal((await empty.json()).processed, 0); assert.equal(db.clients, 0);
  const paid = await post(validHeaders);
  assert.equal((await paid.json()).processed, 1);
  assert.equal(db.profilePlan, 'pro'); assert.equal(db.subscriptions.length, 1);
  const mutationCount = db.mutations;
  await post(validHeaders);
  assert.equal(db.mutations, mutationCount); assert.equal(db.subscriptions.length, 1);
  resetDb();
  await Promise.all([post(validHeaders), post(validHeaders)]);
  assert.equal(db.subscriptions.length, 1, 'duplicate concurrent events must not double grant');
  resetDb();
  process.env.PAYOS_CHECKSUM_KEY = 'synthetic-payos-checksum';
  const data = { amount: 99000, description: 'LINGOPRO a1b2c3d4', reference: 'synthetic-payos-reference' };
  const signature = crypto.createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
    .update(Object.keys(data).sort().map(key => `${key}=${data[key]}`).join('&')).digest('hex');
  assert.equal((await post({}, { signature, data })).status, 200);
  resetDb();
  assert.equal((await post({}, { signature: '0'.repeat(64), data })).status, 401);
  assert.equal(db.clients, 0);
  for (const key of [billingKey, cronKey, managementKey, process.env.UPSTASH_REDIS_REST_TOKEN]) {
    assert(!logs.some(line => line.includes(key)), 'credentials must not be logged');
  }

  // Real Lua execution: race, independent module instances, TTL, expiry, repair legacy keys.
  if (process.env.P2B_REDIS_TEST_PORT) {
    assert.equal(await redis(['PING']), 'PONG');
    globalThis.fetch = async (_, init) => json({ result: await redis(JSON.parse(init.body)) });
    const second = await load('limiter-second-instance', read('src/lib/distributed-rate-limit.ts'));
    const key = `security-test:${crypto.randomUUID()}`;
    const results = await Promise.all(Array.from({ length: 40 }, (_, index) =>
      (index % 2 ? second : limiter).checkRateLimitAsync(key, 9, 5000)));
    assert.equal(results.filter(result => result.allowed).length, 9);
    assert.equal(await redis(['GET', `rl:${key}`]), '40');
    const ttl = await redis(['PTTL', `rl:${key}`]);
    assert(ttl > 0 && ttl <= 5000);
    await new Promise(resolve => setTimeout(resolve, 30));
    const third = await load('limiter-restarted-instance', read('src/lib/distributed-rate-limit.ts'));
    assert.equal((await third.checkRateLimitAsync(key, 9, 5000)).allowed, false);
    assert(await redis(['PTTL', `rl:${key}`]) < ttl, 'requests must not renew fixed window');
    const expiring = `security-test:${crypto.randomUUID()}`;
    assert((await limiter.checkRateLimitAsync(expiring, 1, 80)).allowed);
    assert.equal((await limiter.checkRateLimitAsync(expiring, 1, 80)).allowed, false);
    await new Promise(resolve => setTimeout(resolve, 120));
    assert((await second.checkRateLimitAsync(expiring, 1, 80)).allowed);
    const legacy = `security-test:${crypto.randomUUID()}`;
    await redis(['SET', `rl:${legacy}`, '1']);
    assert.equal(await redis(['PTTL', `rl:${legacy}`]), -1);
    await limiter.checkRateLimitAsync(legacy, 5, 1000);
    assert(await redis(['PTTL', `rl:${legacy}`]) > 0);
    const otherRoute = await limiter.checkRateLimitAsync(`${key}:other-route`, 9, 5000);
    const otherUser = await limiter.checkRateLimitAsync(`${key}:other-user`, 9, 5000);
    assert.equal(otherRoute.remaining, 8); assert.equal(otherUser.remaining, 8);
    originalConsole.log('[P2B] Real Redis Lua race/restart/TTL/expiry/legacy repair PASS');
  } else {
    originalConsole.log('[P2B] Real Redis integration SKIP locally; required in clean CI via P2B_REDIS_TEST_PORT');
  }
  assert(!read('src/lib/api-security.ts').includes('new Map<string, Bucket>'));
  assert(!read('src/lib/distributed-rate-limit.ts').includes('checkRateLimit('));
  assert(read('src/app/api/translate/route.ts').includes('`translate:${ip}`, 60, 60_000'));
  originalConsole.log('[P2B] Dedicated auth/zero mutation/service replay/concurrency/outage/paywall regressions PASS');
} finally {
  globalThis.fetch = originalFetch;
  for (const name of Object.keys(process.env)) if (!(name in originalEnv)) delete process.env[name];
  Object.assign(process.env, originalEnv);
  Object.assign(console, originalConsole);
  delete globalThis.__p2bNextResponse;
  delete globalThis.__p2bStubs;
  const cleanupPath = realpathSync(temp);
  assert.equal(dirname(cleanupPath), realpathSync(tmpdir()));
  assert(basename(cleanupPath).startsWith('p2b-enforcement-'));
  rmSync(cleanupPath, { recursive: true, force: true });
}
