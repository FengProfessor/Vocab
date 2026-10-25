import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'p3b-recovery-'));
const savedEnv = { ...process.env }, savedFetch = globalThis.fetch;
const stubs = {}; globalThis.__p3bStubs = stubs;
let serial = 0;
async function load(path) {
  let text = readFileSync(join(root, path), 'utf8');
  const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements.filter(ts.isImportDeclaration).reverse()) {
    const spec = node.moduleSpecifier.text;
    if (!stubs[spec] || node.importClause?.isTypeOnly) continue;
    const names = node.importClause.namedBindings.elements.filter(n => !n.isTypeOnly)
      .map(n => n.propertyName ? `${n.propertyName.text}:${n.name.text}` : n.name.text);
    text = text.slice(0, node.getStart(ast)) + `const {${names}}=globalThis.__p3bStubs[${JSON.stringify(spec)}];` + text.slice(node.end);
  }
  const pathOut = join(temp, `${serial++}.mjs`);
  writeFileSync(pathOut, ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  return import(pathToFileURL(pathOut).href);
}

const origin = 'https://lingopro.online';
const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222';
const sid = '33333333-3333-4333-8333-333333333333';
const jwt = `header.${Buffer.from(JSON.stringify({ session_id: sid })).toString('base64url')}.synthetic`;
const user = { id: b, email: 'recovery@example.test', email_confirmed_at: '2026-01-01', user_metadata: {} };
let providerError = false, updateFailure = false, storeFailure = false, active = true, ipAllowed = true, emailAllowed = true;
let signouts = 0, mutations = 0, requests = 0, wrongKind = false, pending = false, forceExpiry = false;
let signoutFailure = false;
let passwordA = 'fixture-old-a', passwordB = 'fixture-old-b';
const records = new Map(), codes = new Map(), rates = [], vaults = new Map();
class StoreError extends Error {}
class LimitError extends Error {}
let rateOutage = false;
stubs['@/lib/server-session-store'] = {
  SessionStoreUnavailableError: StoreError, FLOW_LIFETIME_MS: 600000, SESSION_LIFETIME_MS: 604800000,
  createRecoveryRecord: async value => {
    if (storeFailure) throw new StoreError();
    const id = randomBytes(32).toString('base64url');
    records.set(id, { ...value, purpose: 'password-recovery', expiresAt: Date.now() + 600000 }); return id;
  },
  recoveryRecord: async (id, phase, consume) => {
    if (storeFailure) throw new StoreError();
    const value = records.get(id);
    if (consume) records.delete(id);
    if (!value || value.phase !== phase || value.purpose !== 'password-recovery' || forceExpiry || value.expiresAt <= Date.now()) return null;
    return value;
  },
  beginPasswordReset: async id => {
    assert.equal(id, b); if (storeFailure) throw new StoreError(); if (pending) return null;
    pending = true;
    for (const [key, value] of vaults) if (value.vault.userId === b) vaults.delete(key);
    return 'R'.repeat(43);
  },
  endPasswordReset: async (id, owner) => { assert.equal(id, b); assert.equal(owner, 'R'.repeat(43)); pending = false; },
  revokeSessionVault: async id => { vaults.delete(id); },
  readSessionVault: async id => vaults.get(id) ?? null,
  createSessionVault: async value => {
    assert(!pending); const id = randomBytes(32).toString('base64url');
    vaults.set(id, { vault: { ...value, createdAt: Date.now(), expiresAt: Date.now() + 604800000 }, revision: 'fixture' }); return id;
  },
};
stubs['@/lib/distributed-rate-limit'] = { RateLimitUnavailableError: LimitError, checkRateLimitAsync: async key => {
  rates.push(key); if (rateOutage) throw new LimitError();
  return { allowed: key.includes('recovery-email:') ? emailAllowed : ipAllowed, resetIn: 60000, remaining: 1 };
} };
stubs['@/lib/api-security'] = { getClientIp: () => '192.0.2.1' };
stubs['@/lib/api-security'].checkRateLimitAsync = stubs['@/lib/distributed-rate-limit'].checkRateLimitAsync;
stubs['@/lib/api-security'].rateLimitUnavailableResponse = () => null;
stubs['next/server'] = { NextResponse: Response };
stubs['@/lib/session-response'] = { PRIVATE_SESSION_HEADERS: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Origin' } };
stubs['@/lib/supabase-server'] = { createServiceClient: () => ({
  rpc: async () => ({ data: active, error: null }),
  auth: { admin: { signOut: async (_token, scope) => { assert.equal(scope, 'global'); signouts++; active = false; return { error: null }; } } },
}) };
stubs['@supabase/supabase-js'] = { createClient: (_url, _key, config) => ({ auth: {
  getUser: async token => { assert.equal(token, jwt); return { data: { user }, error: active ? null : { status: 401 } }; },
  resetPasswordForEmail: async (email, options) => {
    requests++; assert.equal(options.redirectTo, origin + '/auth/recovery/callback');
    const verifier = JSON.stringify(`${randomBytes(32).toString('base64url')}/recovery`);
    config.auth.storage.setItem('lingopro-server-auth-code-verifier', verifier);
    if (email === user.email && !providerError) codes.set('fixture-recovery-code', verifier);
    return { data: {}, error: providerError ? { message: 'synthetic-secret-provider-error' } : null };
  },
  exchangeCodeForSession: async code => {
    const verifier = config.auth.storage.getItem('lingopro-server-auth-code-verifier');
    const valid = codes.get(code) === verifier; codes.delete(code);
    return { data: { redirectType: wrongKind ? 'signup' : 'recovery', session: valid ? {
      user, access_token: jwt, refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600,
    } : null }, error: valid ? null : { status: 400 } };
  },
  signInWithPassword: async input => {
    const valid = input.email === user.email && input.password === passwordB;
    if (valid) active = true;
    return { data: { session: valid ? { user, access_token: jwt, refresh_token: 'synthetic-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600 } : null }, error: valid ? null : { status: 400 } };
  },
} }) };
const request = (path, method = 'POST', body = {}, headers = {}) => new Request(origin + path, {
  method, headers: { 'X-LingoPro-Request': '1', ...(method === 'GET' ? {} : { Origin: origin }),
    'Content-Type': 'application/json', ...headers }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
});
const cookie = (response, name) => response.headers.getSetCookie().find(value => value.startsWith(name + '='))?.split(';')[0];

try {
  process.env.NODE_ENV = 'production'; process.env.AUTH_SESSION_ENCRYPTION_KEY = '1'.repeat(64);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-public';
  const auth = await load('src/lib/server-auth-session.ts'); stubs['@/lib/server-auth-session'] = auth;
  const recovery = await load('src/lib/password-recovery.ts'); stubs['@/lib/password-recovery'] = recovery;
  const start = await load('src/app/api/auth/recovery/request/route.ts');
  const callback = await load('src/app/auth/recovery/callback/route.ts');
  const reset = await load('src/app/api/auth/recovery/route.ts');
  const login = await load('src/app/api/auth/login/route.ts');
  const flowName = recovery.recoveryCookieName(true), resetName = recovery.recoveryCookieName();
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://fixture.supabase.co/auth/v1/logout?scope=global') {
      assert.equal(init.method, 'POST'); assert.equal(init.headers.Authorization, 'Bearer ' + jwt);
      assert.equal(init.headers.apikey, 'fixture-public'); assert(init.signal); assert.equal(init.cache, 'no-store');
      if (signoutFailure) return new Response(null, { status: 503 });
      signouts++; active = false; return new Response(null, { status: 204 });
    }
    assert.equal(String(url), 'https://fixture.supabase.co/auth/v1/user'); assert.equal(init.method, 'PUT');
    assert.equal(init.headers.Authorization, 'Bearer ' + jwt); assert.equal(init.cache, 'no-store');
    if (updateFailure) return Response.json({ error: 'synthetic-provider-secret' }, { status: 500 });
    const body = JSON.parse(init.body); assert.deepEqual(Object.keys(body), ['password']);
    mutations++; passwordB = body.password; return Response.json({ id: b });
  };
  const existing = await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email, next: '//evil.example' }));
  const unknown = await start.POST(request('/api/auth/recovery/request', 'POST', { email: 'unknown@example.test' }));
  assert.equal(existing.status, 200); assert.deepEqual(await existing.clone().json(), await unknown.json());
  assert.match(cookie(existing, flowName), /^__Host-lingopro-recovery-flow=[A-Za-z0-9_-]{43}$/);
  assert(existing.headers.getSetCookie().every(c => /HttpOnly/.test(c) && /Secure/.test(c)));
  assert.match(existing.headers.get('Cache-Control'), /private.*no-store/);
  for (const email of ['', 'invalid', null]) assert.equal((await start.POST(request('/api/auth/recovery/request', 'POST', { email }))).status, 400);
  assert.equal((await start.POST(request('/api/auth/recovery/request', 'POST', { email: 'x'.repeat(13000) }))).status, 400);
  providerError = true; const failedMail = await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email }));
  assert.deepEqual(await failedMail.json(), await existing.clone().json()); providerError = false;
  emailAllowed = false; const before = requests;
  assert.equal((await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email }))).status, 200);
  assert.equal(requests, before); emailAllowed = true;
  ipAllowed = false; assert.equal((await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email }))).status, 429); ipAllowed = true;
  rateOutage = true; assert.equal((await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email }))).status, 503); rateOutage = false;
  assert(rates.every(key => !key.includes('@') && !key.includes('192.0.2.1')));
  const validBody = { password: 'fixture-new-b', confirmation: 'fixture-new-b' };
  const noMutation = async req => { const count = mutations; const response = await reset.POST(req); assert.notEqual(response.status, 200); assert.equal(mutations, count); return response; };
  await noMutation(request('/api/auth/recovery', 'POST', { ...validBody, email: user.email }));
  await noMutation(request('/api/auth/recovery', 'POST', { ...validBody, userId: a }));
  await noMutation(request('/api/auth/recovery', 'POST', validBody));
  assert.equal((await callback.GET(request('/auth/recovery/callback', 'GET'))).status, 303);
  for (const suffix of ['?code=short', '?code=fixture-recovery-code&next=//evil.example', '?code=fixture-recovery-code&type=signup', '?access_token=forged', '?code=fixture-recovery-code&code=duplicate']) {
    assert.equal((await callback.GET(request('/auth/recovery/callback' + suffix, 'GET', {}, { Cookie: cookie(existing, flowName) }))).headers.get('Location'), origin + '/auth/recovery?invalid=1');
  }
  async function context() {
    active = true;
    const issued = await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email }));
    const req = request('/auth/recovery/callback?code=fixture-recovery-code', 'GET', {}, {
      Cookie: cookie(issued, flowName) + '; __Host-lingopro-session=' + 'A'.repeat(43),
    });
    const verified = await callback.GET(req);
    assert.equal(verified.headers.get('Location'), origin + '/auth/recovery');
    assert(!verified.headers.getSetCookie().some(c => c.startsWith('__Host-lingopro-session=')));
    assert.equal((await callback.GET(req)).headers.get('Location'), origin + '/auth/recovery?invalid=1');
    return cookie(verified, resetName);
  }
  const resetCookie = await context();
  const legacyVault = { vault: { userId: b, providerSessionId: sid, accessToken: jwt,
    refreshToken: 'synthetic-refresh', tokenExpiresAt: Date.now() + 3600000,
    createdAt: Date.now(), expiresAt: Date.now() + 604800000 }, revision: 'fixture' };
  vaults.set('O'.repeat(43), legacyVault);
  vaults.set('A'.repeat(43), { ...legacyVault, vault: { ...legacyVault.vault, userId: a } });
  vaults.set('Z'.repeat(43), { ...legacyVault, vault: { ...legacyVault.vault, userId: a } });
  assert.deepEqual(await (await reset.GET(request('/api/auth/recovery', 'GET', {}, { Cookie: resetCookie }))).json(), { ready: true });
  for (const headers of [{ Origin: 'https://evil.example' }, { 'X-LingoPro-Request': '' }, { Authorization: 'Bearer forged' }]) {
    assert.equal((await noMutation(request('/api/auth/recovery', 'POST', validBody, { Cookie: resetCookie, ...headers }))).status, 403);
  }
  await noMutation(request('/api/auth/recovery', 'POST', { ...validBody, confirmation: 'mismatch' }, { Cookie: resetCookie }));
  await noMutation(request('/api/auth/recovery', 'POST', { password: 'short', confirmation: 'short' }, { Cookie: resetCookie }));
  const responses = await Promise.all(Array.from({ length: 10 }, () => reset.POST(request('/api/auth/recovery', 'POST', validBody, { Cookie: resetCookie + '; __Host-lingopro-session=' + 'A'.repeat(43) }))));
  assert.equal(responses.filter(r => r.status === 200).length, 1); assert.equal(mutations, 1); assert.equal(signouts, 1);
  assert.equal(passwordA, 'fixture-old-a'); assert.equal(passwordB, validBody.password);
  assert(vaults.has('Z'.repeat(43)), 'other account session must survive');
  assert.equal(await auth.verifiedAppSession(request('/api/auth/session', 'GET', {}, { Cookie: '__Host-lingopro-session=' + 'O'.repeat(43) })), null);
  assert(responses.find(r => r.status === 200).headers.getSetCookie().every(c => c.includes('Max-Age=0')));
  await noMutation(request('/api/auth/recovery', 'POST', validBody, { Cookie: resetCookie }));
  assert.equal((await reset.GET(request('/api/auth/recovery', 'GET', {}, { Cookie: resetCookie }))).status, 401);
  assert.equal((await login.POST(request('/api/auth/login', 'POST', { email: user.email, password: 'fixture-old-b' }))).status, 401);
  const newLogin = await login.POST(request('/api/auth/login', 'POST', { email: user.email, password: validBody.password }));
  assert.equal(newLogin.status, 200); assert(!JSON.stringify(await newLogin.json()).includes('synthetic-refresh'));
  assert.equal(await auth.verifiedAppSession(request('/api/auth/session', 'GET', {}, { Cookie: '__Host-lingopro-session=' + 'O'.repeat(43) })), null);
  const expired = await context(); forceExpiry = true;
  assert.equal((await noMutation(request('/api/auth/recovery', 'POST', validBody, { Cookie: expired }))).status, 401); forceExpiry = false;
  const outage = await context(); storeFailure = true;
  assert.equal((await noMutation(request('/api/auth/recovery', 'POST', validBody, { Cookie: outage }))).status, 503); storeFailure = false;
  const providerFail = await context(); updateFailure = true;
  const failure = await noMutation(request('/api/auth/recovery', 'POST', validBody, { Cookie: providerFail }));
  assert.equal(failure.status, 503); assert(!(await failure.text()).includes('synthetic-provider-secret')); updateFailure = false;
  const failedSignout = await context(); signoutFailure = true;
  const priorMutations = mutations;
  const partial = await reset.POST(request('/api/auth/recovery', 'POST', validBody, { Cookie: failedSignout }));
  assert.equal(partial.status, 503); assert.equal(mutations, priorMutations + 1);
  assert.equal(await auth.verifiedAppSession(request('/api/auth/session', 'GET', {}, { Cookie: '__Host-lingopro-session=' + 'O'.repeat(43) })), null);
  assert.equal((await reset.POST(request('/api/auth/recovery', 'POST', validBody, { Cookie: failedSignout }))).status, 401);
  signoutFailure = false;
  wrongKind = true;
  const wrongStart = await start.POST(request('/api/auth/recovery/request', 'POST', { email: user.email }));
  assert.equal((await callback.GET(request('/auth/recovery/callback?code=fixture-recovery-code', 'GET', {}, { Cookie: cookie(wrongStart, flowName) }))).headers.get('Location'), origin + '/auth/recovery?invalid=1'); wrongKind = false;
  // Isolated provider credential behavior; no live account reset or credential output.
  assert.equal(passwordB === 'fixture-old-b', false); assert.equal(passwordB === validBody.password, true);
  const clientSource = readFileSync(join(root, 'src/components/auth/PasswordRecoveryForm.tsx'), 'utf8');
  assert(!/localStorage|sessionStorage|console\.|track\(|access_token|refresh_token/.test(clientSource));
  console.log('[P3B] Actual recovery routes/auth: enumeration, quotas/outage, PKCE purpose/replay/redirect, account B vs A, CSRF, update/expiry/concurrency/provider failures PASS');
  console.log('[P3B] Isolated provider credential state and token-free client source PASS; live email/login pending operator');
} finally {
  globalThis.fetch = savedFetch; process.env = savedEnv; delete globalThis.__p3bStubs;
  for (const file of readdirSync(temp)) unlinkSync(join(temp, file)); rmdirSync(temp);
}
