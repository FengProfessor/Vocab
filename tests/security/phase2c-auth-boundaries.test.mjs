import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'p2c-auth-boundary-'));
const oldEnv = { ...process.env };
const oldFetch = globalThis.fetch;
const stubs = {};
globalThis.__p2cAuthStubs = stubs;
let serial = 0;
const source = path => readFileSync(join(root, path), 'utf8');
class TestResponse extends Response {
  static json(data, init = {}) { return new TestResponse(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } }); }
  static redirect(url, init = {}) { return new TestResponse(null, { status: 303, ...init, headers: { Location: String(url), ...init.headers } }); }
}
stubs['next/server'] = { NextResponse: TestResponse };
async function load(path) {
  let text = source(path);
  const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements.filter(ts.isImportDeclaration).reverse()) {
    const spec = node.moduleSpecifier.text;
    if (!stubs[spec] || node.importClause?.isTypeOnly) continue;
    const binding = node.importClause?.namedBindings;
    assert(binding && ts.isNamedImports(binding));
    const names = binding.elements.filter(n => !n.isTypeOnly).map(n => n.propertyName ? `${n.propertyName.text}: ${n.name.text}` : n.name.text);
    text = text.slice(0, node.getStart(ast)) + `const { ${names.join(', ')} } = globalThis.__p2cAuthStubs[${JSON.stringify(spec)}];` + text.slice(node.end);
  }
  const file = join(temp, `module-${serial++}.mjs`);
  writeFileSync(file, ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  return import(pathToFileURL(file).href);
}
const origin = 'https://lingopro.online';
const uuid = '11111111-1111-4111-8111-111111111111';
const sid = '22222222-2222-4222-8222-222222222222';
const jwt = (sessionId = sid) => `header.${Buffer.from(JSON.stringify({ session_id: sessionId })).toString('base64url')}.synthetic`;
const user = { id: uuid, email: 'dedicated@example.test', email_confirmed_at: '2026-01-01', user_metadata: { full_name: 'Fixture', provider_token: 'must-not-leak' } };
const providerSession = { user, access_token: jwt(), refresh_token: 'synthetic-refresh-secret', expires_at: Math.floor(Date.now()/1000)+3600 };
let record = null, active = true, authError = null, refreshes = 0, signups = 0, effects = 0, outage = false;
let lease = null, flow = null;
class StoreError extends Error {}
const store = {
  SessionStoreUnavailableError: StoreError, SESSION_LIFETIME_MS: 604800000, FLOW_LIFETIME_MS: 600000,
  createSessionVault: async input => { if (outage) throw new StoreError(); record = { vault: { ...input, createdAt: Date.now(), expiresAt: Date.now()+604800000 }, revision: 'r1' }; return randomBytes(32).toString('base64url'); },
  readSessionVault: async () => { if (outage) throw new StoreError(); return record; },
  revokeSessionVault: async () => { if (outage) throw new StoreError(); record = null; },
  acquireSessionLease: async () => { if (lease) return null; lease = 'owner'; return lease; },
  releaseSessionLease: async () => { lease = null; },
  replaceSessionVault: async (_id, previous, owner, next) => { if (!record || record.revision !== previous.revision || lease !== owner) return false; record = { vault: next, revision: 'r2' }; return true; },
  createAuthFlow: async input => { flow = input; return 'F'.repeat(43); },
  consumeAuthFlow: async () => { const value = flow; flow = null; return value; },
};
stubs['@/lib/server-session-store'] = store;
const authClient = { auth: {
  getUser: async () => ({ data: { user }, error: authError }),
  refreshSession: async () => { refreshes++; await new Promise(r => setTimeout(r, 15)); return { data: { session: providerSession }, error: authError }; },
  signInWithPassword: async () => ({ data: { session: authError ? null : providerSession }, error: authError }),
  signInWithOAuth: async () => ({ data: { url: 'https://provider.example/authorize?code_challenge=synthetic' }, error: null }),
  exchangeCodeForSession: async () => { effects++; return { data: { session: providerSession }, error: authError }; },
  signUp: async () => { signups++; return { data: { user: { ...user, email_confirmed_at: null }, session: null }, error: null }; },
} };
stubs['@supabase/supabase-js'] = { createClient: (_url, _key, config) => { config.auth.storage.setItem('lingopro-server-auth-code-verifier', JSON.stringify('synthetic-verifier')); return authClient; } };
stubs['@/lib/supabase-server'] = { createServiceClient: () => ({ rpc: async () => ({ data: active, error: null }), auth: { admin: { signOut: async () => { active = false; return { error: null }; }, deleteUser: async () => ({error:null}) } } }) };
const request = (path = '/api/auth/session', method = 'GET', options = {}) => new Request(origin+path, {
  method, headers: { 'X-LingoPro-Request': '1', ...(method === 'GET' ? {} : { Origin: origin }), Cookie: '__Host-lingopro-session='+ 'N'.repeat(43), 'Content-Type': 'application/json', ...options.headers },
  ...(method === 'GET' || method === 'HEAD' ? {} : { body: JSON.stringify(options.body ?? {}) }),
});
try {
  process.env.NODE_ENV = 'production';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-public-key';
  const auth = await load('src/lib/server-auth-session.ts'); stubs['@/lib/server-auth-session'] = auth;
  const responses = await load('src/lib/session-response.ts'); stubs['@/lib/session-response'] = responses;
  const redirect = await load('src/lib/internal-redirect.ts'); stubs['@/lib/internal-redirect'] = redirect;
  stubs['@/lib/api-security'] = { checkRateLimitAsync: async () => ({allowed:true}), getClientIp: () => 'test-ip', rateLimitUnavailableResponse: () => null };
  const first = await auth.createVerifiedAppSession(request('/api/auth/login', 'POST'), providerSession);
  assert(!first.setCookie.startsWith('__Host-lingopro-session='+ 'N'.repeat(43)), 'fresh login must rotate the supplied opaque id');
  assert.match(first.setCookie, /__Host-lingopro-session=.*; Path=\/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure/);
  assert(!JSON.stringify(first.publicSession).includes('synthetic-refresh-secret'));
  assert(!JSON.stringify(first.publicSession).includes('access_token'));
  assert(!JSON.stringify(first.publicSession).includes('provider_token'));
  assert.equal((await auth.verifiedAppSession(request())).user.id, uuid);
  const proxied = new Request('https://127.0.0.1:3000/api/auth/session', {
    headers: { Host: 'lingopro.online', Origin: origin, 'X-LingoPro-Request': '1' },
  });
  assert.equal(auth.appOrigin(proxied), origin, 'public allowlisted Host overrides internal Next URL');
  auth.assertAppRequest(proxied);
  for (const headers of [
    { Host: 'evil.example', 'X-Forwarded-Host': 'lingopro.online' },
    { Host: 'evil.example@lingopro.online' },
    { Host: 'lingopro.online/other' },
    { Host: 'lingopro.online', Origin: 'https://evil.example' },
  ]) {
    const rejected = new Request('https://127.0.0.1:3000/api/auth/session', {
      headers: { Origin: origin, 'X-LingoPro-Request': '1', ...headers },
    });
    assert.throws(() => auth.assertAppRequest(rejected), error => error.status === 403);
  }
  assert.throws(() => auth.appOrigin(new Request('http://127.0.0.1:3000/api/auth/session', {
    headers: { Host: 'lingopro.online' },
  })), error => error.status === 403, 'production transport must remain HTTPS');
  for (const headers of [{ Origin:'https://evil.example' }, { 'X-LingoPro-Request':'' }, { 'Sec-Fetch-Site':'cross-site' }, { Authorization:'Bearer '+jwt() }]) {
    await assert.rejects(auth.verifiedAppSession(request('/api/auth/session', 'GET', {headers})), error => error.status === 403);
  }
  assert.equal(await auth.verifiedAppSession(request('/api/auth/session','GET',{headers:{Cookie:'__Host-lingopro-session=bad'}})),null);
  assert.equal(auth.requestCookie(request('/api/auth/session','GET',{headers:{Cookie:'__Host-lingopro-session='+ 'N'.repeat(43)+'; __Host-lingopro-session='+ 'M'.repeat(43)}}),auth.sessionCookieName()),null);
  active = false; assert.equal(await auth.verifiedAppSession(request()), null); assert.equal(record,null);
  active = true; await auth.createVerifiedAppSession(request('/api/auth/login','POST'),providerSession);
  authError = {status:503}; await assert.rejects(auth.verifiedAppSession(request()), StoreError); assert(record);
  authError = null; outage = true; await assert.rejects(auth.verifiedAppSession(request()), StoreError); outage = false;
  record.vault.tokenExpiresAt = Date.now()-1;
  const parallel = await Promise.all(Array.from({length:20},()=>auth.verifiedAppSession(request())));
  assert(parallel.every(session=>session.user.id === uuid)); assert.equal(refreshes,1);
  await auth.logoutAppSession(request('/api/auth/logout','POST'));
  assert.equal(await auth.verifiedAppSession(request()),null,'old cookie replay denied');
  active = true;
  await assert.rejects(auth.createVerifiedAppSession(request('/api/auth/login','POST'),{...providerSession,user:{...user,email_confirmed_at:null}}),error=>error.status===401);
  const login = await load('src/app/api/auth/login/route.ts');
  const loggedIn = await login.POST(request('/api/auth/login','POST',{body:{email:user.email,password:'fixture-password'}}));
  assert.equal(loggedIn.status,200); assert.match(loggedIn.headers.get('Cache-Control'),/no-store/);
  assert(!JSON.stringify(await loggedIn.json()).includes('synthetic-refresh-secret'));
  assert.equal((await login.POST(request('/api/auth/login','POST',{headers:{Origin:'https://evil.example'}}))).status,403);
  authError={status:400}; assert.equal((await login.POST(request('/api/auth/login','POST',{body:{email:user.email,password:'wrong'}}))).status,401); authError=null;
  const register = await load('src/app/api/auth/register/route.ts');
  const registered = await register.POST(request('/api/auth/register','POST',{body:{email:user.email,password:'fixture-password',role:'admin'}}));
  assert.equal(registered.status,200); assert.equal((await registered.json()).verificationRequired,true); assert.equal(signups,1);
  assert(!registered.headers.get('Set-Cookie').includes('__Host-lingopro-session='));
  const oauth = await load('src/app/api/auth/oauth/route.ts');
  const start = await oauth.POST(request('/api/auth/oauth','POST')); assert.equal(start.status,200);
  const callback = await load('src/app/auth/callback/route.ts');
  const callbackReq = new Request(origin+'/auth/callback?code=fixture-code',{headers:{Cookie:'__Host-lingopro-auth-flow='+ 'F'.repeat(43)}});
  const done = await callback.GET(callbackReq); assert.equal(done.status,303); assert.equal(done.headers.get('Location'),origin+'/auth/complete');
  const oldEffects=effects; const replay=await callback.GET(callbackReq); assert.equal(replay.headers.get('Location'),origin+'/auth?error=oauth_relogin'); assert.equal(effects,oldEffects);
  flow={kind:'oauth',verifier:'test',next:'//evil.example'}; assert.equal((await callback.GET(callbackReq)).headers.get('Location'),origin+'/auth/complete');
  flow={kind:'signup',verifier:'test',next:'/auth?confirmed=1'}; const confirmed=await callback.GET(callbackReq); assert.equal(confirmed.headers.get('Location'),origin+'/auth?confirmed=1'); assert(!confirmed.headers.get('Set-Cookie').includes('__Host-lingopro-session='));
  active=true; await auth.createVerifiedAppSession(request('/api/auth/login','POST'),providerSession);
  const data = await load('src/app/api/auth/data/[...path]/route.ts');
  let upstream=0;
  globalThis.fetch=async (url,init)=>{ upstream++; assert.equal(new URL(url).origin,'https://fixture.supabase.co'); assert.equal(init.headers.get('Authorization'),'Bearer '+jwt()); assert.equal(init.headers.get('Accept-Profile'),'public'); return TestResponse.json([{id:'fixture'}],{headers:{'Set-Cookie':'must-not-forward','Content-Range':'0-0/1'}}); };
  const context={params:Promise.resolve({path:['profiles']})};
  const read=await data.GET(request('/api/auth/data/profiles','GET',{headers:{'Accept-Profile':'auth'}}),context); assert.equal(read.status,200); assert.equal(read.headers.get('Set-Cookie'),null); assert.equal(read.headers.get('Content-Range'),'0-0/1');
  assert.equal((await data.GET(request(),{params:Promise.resolve({path:['extension_tokens']})})).status,404);
  assert.equal((await data.GET(request(),{params:Promise.resolve({path:['rpc','claim_teacher_role']})})).status,404);
  assert.equal(upstream,1);
  assert.equal((await data.POST(request('/api/auth/data/profiles','POST',{headers:{Cookie:''}}),context)).status,401);
  assert.equal((await data.GET(request('/api/auth/data/profiles','GET',{headers:{Cookie:'__Host-lingopro-session=invalid'}}),context)).status,401);
  outage=true; assert.equal((await data.GET(request(),context)).status,503); outage=false;
  globalThis.fetch=oldFetch;
  const originalGetUser=authClient.auth.getUser;
  let releaseUser; authClient.auth.getUser=()=>new Promise(resolve=>{releaseUser=resolve;});
  const overlapping=auth.verifiedAppSession(request());
  await new Promise(resolve=>setTimeout(resolve,0));
  await auth.logoutAppSession(request('/api/auth/logout','POST'));
  releaseUser({data:{user},error:null}); assert.equal(await overlapping,null,'logout during pending provider verification must fail closed');
  authClient.auth.getUser=originalGetUser;
  console.log('[P2C] Actual server auth/routes: cookie/DTO/fixation/CSRF/revocation/replay/refresh/OAuth/signup/RLS boundary/outage PASS');

  // Browser facade must discard an earlier session read after logout; no storage token writes.
  const fakeStorage = new Map([['sb-fixture-auth-token','synthetic-old-token'],['lp:profile:old','cached-user'],['study-preference','keep']]);
  const storage={get length(){return fakeStorage.size;},key:i=>[...fakeStorage.keys()][i],removeItem:key=>fakeStorage.delete(key)};
  globalThis.window={ localStorage:storage,sessionStorage:storage,location:{origin,hash:'#access_token=old',pathname:'/student',search:'',assign:()=>{}},history:{replaceState:()=>{}},addEventListener:()=>{} };
  const oldChannel=globalThis.BroadcastChannel;
  globalThis.BroadcastChannel=class { postMessage(value){assert.deepEqual(value,{type:'invalidate'});} };
  let finishRead;
  globalThis.fetch=async path=>path==='/api/auth/session'?new Promise(resolve=>{finishRead=resolve;}):TestResponse.json({});
  const browser=await load('src/lib/app-auth-client.ts');
  const pending=browser.appAuth.getSession(); await browser.appAuth.signOut();
  finishRead(TestResponse.json({session:first.publicSession})); assert.equal((await pending).data.session,null);
  assert(!fakeStorage.has('sb-fixture-auth-token'));assert(!fakeStorage.has('lp:profile:old'));assert.equal(fakeStorage.get('study-preference'),'keep');
  const pendingRecovery = browser.appAuth.getSession();
  browser.appAuth.passwordRecoveryCompleted();
  finishRead(TestResponse.json({ session: first.publicSession }));
  assert.equal((await pendingRecovery).data.session, null, 'reset must discard pre-reset pending browser identity');
  assert.equal(fakeStorage.get('study-preference'), 'keep');
  console.log('[P3B] Browser reset completion invalidates pending reads, broadcasts logout and preserves preferences PASS');
  Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled storage');}});browser.clearLegacyAuthStorage();
  globalThis.BroadcastChannel=oldChannel; delete globalThis.window;
  console.log('[P2C] Browser storage cleanup + stale-response/logout race PASS');
} finally {
  globalThis.fetch=oldFetch; delete globalThis.window; delete globalThis.__p2cAuthStubs;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key]; Object.assign(process.env,oldEnv);
  for(const file of readdirSync(temp))unlinkSync(join(temp,file));rmdirSync(temp);
}
