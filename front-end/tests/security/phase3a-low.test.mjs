import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'p3a-low-'));
const read = path => readFileSync(join(root, path), 'utf8');
const savedEnv = { ...process.env };
const stubs = {};
globalThis.__p3aStubs = stubs;
let serial = 0;
async function load(path) {
  let source = read(path);
  source = source.replace("export { checkRateLimitAsync, RateLimitUnavailableError } from '@/lib/distributed-rate-limit';",
    "export const checkRateLimitAsync = globalThis.__p3aStubs['@/lib/distributed-rate-limit'].checkRateLimitAsync; export { RateLimitUnavailableError };");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements.filter(ts.isImportDeclaration).reverse()) {
    const specifier = node.moduleSpecifier.text;
    if (!stubs[specifier] || node.importClause?.isTypeOnly) continue;
    const bindings = node.importClause?.namedBindings;
    assert(bindings && ts.isNamedImports(bindings));
    const names = bindings.elements.filter(n => !n.isTypeOnly).map(n => n.propertyName ? `${n.propertyName.text}: ${n.name.text}` : n.name.text);
    source = source.slice(0, node.getStart(ast)) + `const { ${names.join(',')} } = globalThis.__p3aStubs[${JSON.stringify(specifier)}];` + source.slice(node.end);
  }
  const pathOut = join(temp, `${serial++}.mjs`);
  writeFileSync(pathOut, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  return import(pathToFileURL(pathOut).href);
}
class JsonResponse extends Response {
  static json(body, init = {}) { return new JsonResponse(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } }); }
}
class StoreError extends Error {}
const origin = 'https://lingopro.online';
const caller = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const user = { id: caller, email: 'caller@example.test', email_confirmed_at: '2026-01-01', user_metadata: {} };
const token = `header.${Buffer.from(JSON.stringify({ session_id: sessionId })).toString('base64url')}.synthetic`;
let authenticated = false, outage = false, providerError = false, role = 'student', profileError = false, dbError = false;
let serviceClients = 0;
let extensionState = 'active';
const reads = [], writes = [];
const coupons = new Map();
const presence = new Map([[caller, { id: caller }], [target, { id: target }]]);
const resetEffects = () => { serviceClients = 0; reads.length = 0; writes.length = 0; };
const snapshot = () => JSON.stringify({ coupons: [...coupons.entries()], presence: [...presence.entries()] });
const store = {
  SessionStoreUnavailableError: StoreError, SESSION_LIFETIME_MS: 604800000, FLOW_LIFETIME_MS: 600000,
  readSessionVault: async () => {
    if (outage) throw new StoreError('synthetic-provider-secret-do-not-disclose');
    return authenticated ? { revision: 'fixture', vault: { userId: caller, providerSessionId: sessionId, accessToken: token, refreshToken: 'synthetic-refresh', tokenExpiresAt: Date.now()+3600000, createdAt: Date.now(), expiresAt: Date.now()+604800000 } } : null;
  },
  revokeSessionVault: async () => { authenticated = false; },
};
stubs['next/server'] = { NextResponse: JsonResponse };
stubs['@/lib/server-session-store'] = store;
stubs['@supabase/supabase-js'] = { createClient: () => ({ auth: { getUser: async () => ({ data: { user }, error: providerError ? { status: 503 } : null }) } }) };
stubs['@/lib/supabase-server'] = { createServiceClient: () => {
  serviceClients++;
  return {
    rpc: async () => ({ data: true, error: null }),
    from(table) {
      let operation = 'select', payload = null;
      const filters = {};
      const query = {
        select() { return query; }, eq(key, value) { filters[key] = value; return query; },
        neq() { return query; }, is() { return query; }, limit() { return query; },
        insert(value) { operation = 'insert'; payload = value; return query; },
        update(value) { operation = 'update'; payload = value; return query; },
        delete() { operation = 'delete'; return query; },
        async single() { return finish(); }, async maybeSingle() { return finish(); },
        async order() { return finish(); }, then(resolve, reject) { return finish().then(resolve, reject); },
      };
      async function finish() {
        if (table === 'extension_tokens' && operation === 'select') return { data: { user_id: caller, expires_at: new Date(Date.now()+(extensionState === 'expired' ? -1000 : 3600000)).toISOString(), revoked_at: extensionState === 'revoked' ? '2026-01-01' : null }, error: null };
        if (table === 'profiles') {
          reads.push({ table, filters: { ...filters } });
          assert.equal(filters.id, caller, 'role lookup must use verified caller, never attacker input');
          return { data: profileError ? null : { role, email: user.email }, error: profileError ? { message: 'synthetic-db-secret' } : null };
        }
        if (operation !== 'select') {
          if (dbError) return { data: null, error: { message: 'synthetic-db-secret /internal/path SQL' } };
          writes.push({ table, operation, payload, filters: { ...filters } });
          if (table === 'coupons') {
            if (operation === 'insert') coupons.set(target, payload);
            if (operation === 'delete') coupons.delete(filters.id);
          }
          if (table === 'room_presence' && operation === 'delete') presence.delete(filters.user_id);
          return { data: { id: target, ...payload }, error: null };
        }
        reads.push({ table, filters: { ...filters } });
        if (dbError) return { data: null, error: { message: 'synthetic-db-secret /internal/path SQL' } };
        if (table === 'coupons') {
          const coupon = [...coupons.values()].find(value => value.code === filters.code);
          return { data: filters.code ? coupon ? { ...coupon, valid_from: '2026-01-01', used_count: 0, is_active: true } : null : [...coupons.values()], error: null };
        }
        if (table === 'pilot_leads') return { data: { contacted_at: null, converted_at: null }, error: null };
        if (table === 'challenge_participants') return { data: filters.user_id ? null : [], error: null };
        if (table === 'challenges') return { data: { id: target, status: 'open', deposit_amount: 100 }, error: null };
        throw new Error(`Unexpected fixture table ${table}`);
      }
      return query;
    },
  };
} };
stubs['@/lib/ttl-cache'] = { cacheGet: () => undefined, cacheSet: () => {} };
stubs['@/lib/cron-auth'] = { isCronAuthorizationValid: () => false };
stubs['@/lib/distributed-rate-limit'] = { RateLimitUnavailableError: class extends Error {}, checkRateLimitAsync: async () => ({ allowed: true }) };
stubs['@/lib/challenge'] = { slugify: value => String(value).toLowerCase() };
stubs['@/lib/pilot-sales'] = { isPilotLeadStatus: value => ['contacted', 'qualified', 'won'].includes(value) };
stubs['@/lib/billing'] = { normalizePeriodMonths: value => value, normalizeSeats: value => value, isKhaiGiangCampaignCode: () => false, isTrialCouponCode: () => false, assertCouponAllowedForOrder: () => {}, computeBasePrice: () => 100, applyDiscount: () => 90, trialCouponDays: () => null };
stubs['@/lib/pack-passage'] = { DEMO_PACKS: [], PACK_PASSAGE_MIN_WORDS: 5, PACK_PASSAGE_MAX_WORDS: 15 };
stubs['@/lib/pack-themes'] = { PACK_THEMES: [] };
stubs['@/lib/pack-levels'] = { PACK_READING_LEVELS: [], DEFAULT_PACK_READING_LEVEL_ID: 'fixture' };
stubs['@/lib/entitlement'] = { FREE_PACK_READING_DAILY_LIMIT: 2 };
stubs['@/lib/entitlement-server'] = { resolvePlanByUserId: async (_client, id) => { assert.equal(id,caller); return 'free'; } };
stubs['@/lib/room-presence'] = { PRESENCE_ONLINE_MS: 30000 };
stubs['@/lib/display-name'] = {};
stubs['@/lib/daily-reading-generator'] = { todayVN: () => '2026-01-01', findUserUncompletedExercise: async (_client, id) => { assert.equal(id,caller); return { exercise: { id: target } }; }, formatExerciseForClient: (exercise, id) => { assert.equal(id,caller); return exercise; } };
const request = (method, options = {}) => new Request(origin+'/api/fixture'+(options.query ?? ''), {
  method, headers: { 'X-LingoPro-Request': '1', ...(method === 'GET' ? {} : { Origin: origin }), ...(authenticated ? { Cookie: '__Host-lingopro-session='+ 'N'.repeat(43) } : {}), 'Content-Type': 'application/json', ...options.headers },
  ...(method === 'GET' ? {} : { body: JSON.stringify(Object.hasOwn(options,'body') ? options.body : { id: target, status: 'contacted', name: 'Fixture', code: 'SAFE', user_id: target, role: 'admin' }) }),
});
const context = { params: Promise.resolve({ id: target }) };
try {
  process.env.NODE_ENV = 'production';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-public-key';
  delete process.env.ADMIN_EMAILS;
  const auth = await load('src/lib/server-auth-session.ts'); stubs['@/lib/server-auth-session'] = auth;
  const responses = await load('src/lib/session-response.ts'); stubs['@/lib/session-response'] = responses;
  const security = await load('src/lib/api-security.ts'); stubs['@/lib/api-security'] = security;
  const admin = await load('src/lib/admin-auth.ts'); stubs['@/lib/admin-auth'] = admin;
  const couponsRoute = await load('src/app/api/billing/coupons/route.ts');
  const pilot = await load('src/app/api/admin/pilot-leads/route.ts');
  const challenges = await load('src/app/api/challenges/route.ts');
  const challenge = await load('src/app/api/challenges/[id]/route.ts');
  const joinChallenge = await load('src/app/api/challenges/[id]/join/route.ts');
  const validate = await load('src/app/api/billing/coupons/validate/route.ts');
  const retiredBilling = await load('src/app/api/billing/claim-upgrade-gift/route.ts');
  const retiredCampaign = await load('src/app/api/campaign/claim-upgrade-gift/route.ts');
  const dailyReading = await load('src/app/api/practice/daily-reading/generate/route.ts');
  const hub = await load('src/app/api/hub/presence/route.ts');
  const pack = await load('src/app/api/practice/pack-passage/route.ts');
  const handlers = [[couponsRoute.GET,'GET'], [couponsRoute.POST,'POST'], [couponsRoute.DELETE,'DELETE'], [pilot.GET,'GET'], [pilot.PATCH,'PATCH'], [challenges.POST,'POST'], [challenge.PATCH,'PATCH'], [joinChallenge.POST,'POST'], [validate.POST,'POST'], [retiredBilling.POST,'POST'], [retiredCampaign.POST,'POST'], [dailyReading.POST,'POST'], [hub.DELETE,'DELETE'], [pack.GET,'GET',200]];
  for (const [handler, method, anonymousStatus = 401] of handlers) {
    const before = snapshot(); authenticated = false; resetEffects();
    assert.equal((await handler(request(method),context)).status,anonymousStatus);
    assert.equal(writes.length,0); assert.equal(serviceClients,0); assert.equal(snapshot(),before);
    for (const credential of ['Bearer legacy-jwt', 'Bearer malformed']) {
      assert.equal((await handler(request(method,{headers:{Authorization:credential}}),context)).status,anonymousStatus);
      assert.equal(writes.length,0);
    }
    authenticated = true;
    for (const headers of [{Origin:'https://evil.example'}, {'X-LingoPro-Request':''}, {'Sec-Fetch-Site':'cross-site'}, {Authorization:'Bearer lpext_synthetic'}]) {
      resetEffects(); const denied = await handler(request(method,{headers}),context);
      assert.equal(denied.status,403); assert.match(denied.headers.get('Cache-Control'),/no-store/);
      assert.equal(serviceClients,0); assert.equal(writes.length,0); assert.equal(snapshot(),before);
    }
    resetEffects(); const malformed = await handler(request(method,{headers:{Cookie:'__Host-lingopro-session=bad'}}),context);
    assert.equal(malformed.status,anonymousStatus); assert.equal(serviceClients,0); assert.equal(writes.length,0);
    for (const failure of ['outage','provider']) {
      outage = failure === 'outage'; providerError = failure === 'provider'; resetEffects();
      const unavailable = await handler(request(method),context);
      assert.equal(unavailable.status,503); assert.match(unavailable.headers.get('Cache-Control'),/no-store/);
      assert(!await unavailable.text().then(text => /synthetic|SQL|internal\/path/.test(text)));
      assert.equal(writes.length,0); assert.equal(snapshot(),before);
      outage = false; providerError = false;
    }
  }
  authenticated = true; role = 'student';
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  resetEffects(); assert.equal((await couponsRoute.POST(request('POST'))).status,503); assert.equal(writes.length,0);
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-public-key';
  for (const [handler, method] of handlers.slice(0,7)) {
    resetEffects(); assert.equal((await handler(request(method),context)).status,403);
    assert.equal(writes.length,0); assert(reads.every(read => read.table === 'profiles')); assert.equal(coupons.size,0);
  }
  // Server allowlist is explicit; missing config cannot grant a non-admin.
  process.env.ADMIN_EMAILS = user.email;
  assert.equal((await couponsRoute.GET(request('GET'))).status,200);
  delete process.env.ADMIN_EMAILS;
  profileError = true; resetEffects(); assert.equal((await couponsRoute.POST(request('POST'))).status,503); assert.equal(writes.length,0); profileError = false;
  role = 'admin';
  for (const body of [null, {}, {code:5}, {code:'   '}]) {
    resetEffects(); assert.equal((await couponsRoute.POST(request('POST',{body}))).status,400); assert.equal(writes.length,0);
  }
  const malformedJson = new Request(origin+'/api/fixture',{method:'POST',headers:request('POST').headers,body:'{'});
  resetEffects(); assert.equal((await couponsRoute.POST(malformedJson)).status,400); assert.equal(writes.length,0);
  assert.equal((await couponsRoute.DELETE(request('DELETE'))).status,400);
  resetEffects(); assert.equal((await couponsRoute.POST(request('POST',{body:{code:' safe ',discountPct:10}}))).status,200);
  assert.equal(coupons.get(target).code,'SAFE'); assert.equal(coupons.get(target).discount_pct,10); assert.equal(writes.length,1);
  resetEffects(); assert.equal((await validate.POST(request('POST',{body:{code:'SAFE'}}))).status,200); assert.equal(writes.length,0);
  assert.equal((await couponsRoute.GET(request('GET'))).status,200);
  assert.equal((await couponsRoute.DELETE(request('DELETE',{query:'?id='+target}))).status,200); assert.equal(coupons.size,0);
  dbError = true;
  const savedError = console.error; const logs = []; console.error = (...args) => logs.push(args.join(' '));
  try {
    const failed = await couponsRoute.GET(request('GET'));
    assert.equal(failed.status,500); assert(!/synthetic|internal\/path|SQL/.test(await failed.text())); assert.deepEqual(logs,['[Coupons] operation_failed']);
  } finally { console.error = savedError; dbError = false; }
  resetEffects(); assert.equal((await pilot.PATCH(request('PATCH',{body:{id:target,status:'contacted'}}))).status,200); assert.equal(writes.length,1);
  role = 'teacher'; resetEffects(); assert.equal((await challenges.POST(request('POST',{body:{name:'Fixture'}}))).status,200); assert.equal(writes.length,1);
  resetEffects(); assert.equal((await challenge.PATCH(request('PATCH',{body:{name:'Updated'}}),context)).status,200); assert.equal(writes.length,1);
  role = 'student'; resetEffects(); assert.equal((await joinChallenge.POST(request('POST'),context)).status,200);
  assert.equal(writes.length,2); assert(writes.every(write => write.payload.user_id === caller));
  resetEffects(); assert.equal((await dailyReading.POST(request('POST'))).status,200); assert.equal(writes.length,0);
  resetEffects(); assert.equal((await hub.DELETE(request('DELETE',{body:{user_id:target}}))).status,200);
  assert.equal(writes.length,1); assert.equal(writes[0].filters.user_id,caller); assert(presence.has(target)); assert(!presence.has(caller));
  resetEffects(); assert.equal((await pack.GET(request('GET'))).status,200); assert.equal(writes.length,0);
  resetEffects(); assert.equal((await retiredBilling.POST(request('POST'))).status,410); assert.equal((await retiredCampaign.POST(request('POST'))).status,410); assert.equal(writes.length,0);
  authenticated = false; role = 'teacher';
  for (const state of ['expired','revoked']) {
    extensionState = state; resetEffects();
    assert.equal((await challenges.POST(request('POST',{headers:{Authorization:'Bearer lpext_synthetic'}}))).status,401);
    assert.equal(writes.length,0);
  }
  extensionState = 'active'; resetEffects();
  assert.equal((await challenges.POST(request('POST',{headers:{Authorization:'Bearer lpext_synthetic'},body:{name:'Fixture'}}))).status,200);
  assert.equal(writes.filter(write => write.table === 'challenges').length,1);
  assert.equal((await couponsRoute.GET(request('GET',{headers:{Authorization:'Bearer lpext_synthetic'}}))).status,401,'extension credential cannot authorize web admin');
  const unexpected = new Error('non-session failure'); await assert.rejects(responses.withSessionErrors(async () => { throw unexpected; })(), error => error === unexpected);
  for (const response of [security.unauthorized(),security.forbidden()]) assert.match(response.headers.get('Cache-Control'),/no-store/);

  // D03: prevent reintroducing removed direct/locked/runtime auth libraries.
  const retired = ['@auth/supabase-adapter','@supabase/auth-helpers-nextjs','@supabase/ssr','next-auth'];
  const manifest = JSON.parse(read('package.json')); const lock = JSON.parse(read('package-lock.json'));
  for (const pkg of retired) {
    assert(!manifest.dependencies?.[pkg] && !manifest.devDependencies?.[pkg]);
    assert(!lock.packages[''].dependencies?.[pkg] && !lock.packages[''].devDependencies?.[pkg]);
    assert(!Object.keys(lock.packages).some(path => path.endsWith('node_modules/'+pkg)));
    assert(!Object.values(manifest.scripts).some(script => script.includes(pkg)));
  }
  function scan(dir) {
    for (const entry of readdirSync(join(root,dir),{withFileTypes:true})) {
      const path = dir+'/'+entry.name;
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') scan(path); continue; }
      if (!/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) continue;
      const ast = ts.createSourceFile(path,read(path),ts.ScriptTarget.Latest,true);
      if (path.startsWith('src/app/api/') && path.endsWith('/route.ts')) {
        assert(!/throw new Error\(['"]Unauthorized['"]\)/.test(ast.text),`${path}: auth denial must not become500`);
        assert(!/\.auth\.getUser\(/.test(ast.text),`${path}: provider identity must use shared server boundary`);
      }
      function visit(node) {
        if (path.startsWith('src/app/api/') && path.endsWith('/route.ts') && ts.isCallExpression(node) && ['getAuthUser','getWebUser'].includes(node.expression.getText(ast))) {
          let ancestor = node, guarded = false;
          while (ancestor.parent) {
            ancestor = ancestor.parent;
            if (ts.isTryStatement(ancestor) && ancestor.catchClause && /sessionErrorResponse|safeErrorResponse/.test(ancestor.catchClause.getText(ast))) guarded = true;
            if (ts.isFunctionDeclaration(ancestor)) {
              const exported = ancestor.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
              if (exported) assert(guarded,`${path}: ${ancestor.name?.text} must preserve auth failure semantics`);
              break;
            }
          }
        }
        if (ts.isStringLiteralLike(node) && (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent) || ts.isCallExpression(node.parent) || ts.isLiteralTypeNode(node.parent))) {
          assert(!retired.some(pkg => node.text === pkg || node.text.startsWith(pkg+'/')),`${path}: retired auth dependency reference`);
        }
        ts.forEachChild(node,visit);
      }
      visit(ast);
      assert(!ast.typeReferenceDirectives.some(ref => retired.some(pkg => ref.fileName === pkg || ref.fileName.startsWith(pkg+'/'))));
    }
  }
  for (const dir of ['src','scripts','deploy']) scan(dir);
  assert(manifest.dependencies['@supabase/supabase-js']);
  const facade = read('src/lib/supabase.ts'); assert(facade.includes('appAuth')); assert(!facade.includes('SUPABASE_SERVICE_ROLE_KEY'));
  // Hai annotation prebuilt cũ ngoài GET scope; không tắt rule hoặc chấp nhận diagnostic mới.
  const lintBaseline = JSON.parse(read('tests/security/phase3a-lint-baseline.json'));
  const lint = spawnSync(process.execPath,[join(root,'node_modules/eslint/bin/eslint.js'),...Object.keys(lintBaseline),'--format','json'],{cwd:root,encoding:'utf8',timeout:120000});
  assert([0,1].includes(lint.status),'ESLint execution failed');
  for (const report of JSON.parse(lint.stdout)) {
    const path = relative(root,report.filePath).split(sep).join('/');
    const actual = report.messages.map(message => [message.severity,message.ruleId,message.message,message.line,message.column]);
    assert.deepEqual(actual.map(entry => JSON.stringify(entry)).sort(),lintBaseline[path].map(entry => JSON.stringify(entry)).sort(),`${path}: lint regression`);
  }
  console.log('[P3A] Followup lint: hub0; pack exact2 pre-existing prebuilt annotations; zero new errors/warnings');
  console.log('[P3A] D02: 14 handler denial/outage/CSRF boundaries + state/role/legitimate paths + exported-handler AST guards PASS; D03: manifest/lock/runtime references PASS');
} finally {
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env,savedEnv); delete globalThis.__p3aStubs;
  assert(temp.startsWith(join(tmpdir(),'p3a-low-')));
  rmSync(temp,{recursive:true,force:true});
}
