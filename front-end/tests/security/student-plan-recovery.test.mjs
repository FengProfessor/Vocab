import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'student-plan-'));
const previousWindow = globalThis.window;
const previousSessionStorage = globalThis.sessionStorage;
const stubs = {};
globalThis.__studentPlanStubs = stubs;
let serial = 0;
async function load(path) {
  let source = readFileSync(join(root, path), 'utf8');
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements.filter(ts.isImportDeclaration).reverse()) {
    if (node.importClause?.isTypeOnly) continue;
    const spec = node.moduleSpecifier.text;
    assert(stubs[spec], `Missing isolated dependency: ${spec}`);
    const names = node.importClause.namedBindings.elements.filter(n => !n.isTypeOnly)
      .map(n => n.propertyName ? `${n.propertyName.text}: ${n.name.text}` : n.name.text);
    source = source.slice(0, node.getStart(ast)) +
      `const { ${names.join(', ')} } = globalThis.__studentPlanStubs[${JSON.stringify(spec)}];` + source.slice(node.end);
  }
  const output = join(temp, `${serial++}.mjs`);
  writeFileSync(output, ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React,
  } }).outputText);
  return import(pathToFileURL(output).href);
}

const storage = new Map();
const events = new Map();
globalThis.window = {
  addEventListener: (name, callback) => {
    if (!events.has(name)) events.set(name, new Set());
    events.get(name).add(callback);
  },
  removeEventListener: (name, callback) => events.get(name)?.delete(callback),
};
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
const emit = name => { for (const callback of events.get(name) ?? []) callback(); };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
let states = [], cursor = 0, effects = [], mounted = false;
stubs.react = {
  createContext: () => ({}), useContext: () => null,
  useState: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
    return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  },
  useEffect: effect => { if (!mounted) effects.push(effect); },
  useCallback: value => value, useMemo: callback => callback(),
};
let generation = 0, session = { user: { id: 'student-a' } }, sessionError = null;
let profile = { id: 'student-a', plan: 'pro', plan_expires_at: null };
let profileError = null, finishProfile = null, deferProfile = false, queries = 0;
const authListeners = new Set();
stubs['@/lib/supabase'] = { supabase: {
  auth: {
    getSession: async () => ({ data: { session }, error: sessionError }),
    onAuthStateChange: callback => {
      authListeners.add(callback);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    },
  },
  from: () => ({ select: () => ({ eq: () => ({ single: async () => {
    queries++;
    if (deferProfile) return new Promise(resolve => { finishProfile = resolve; });
    return { data: profileError ? null : profile, error: profileError };
  } }) }) }),
} };
stubs['@/lib/app-auth-client'] = { authStateVersion: () => generation };
stubs['@/lib/gamification'] = { effectiveCurrentStreak: value => value };
stubs['@/lib/auth-fetch'] = { authFetch: async () => { throw new Error('Unexpected business API call'); } };
stubs['@/lib/word-summary-cache'] = {
  readWordSummaryCache: () => null, readLastWordSummaryCache: () => null,
  writeWordSummaryCache: () => {}, WORD_SUMMARY_EVENTS: {},
};
stubs['@/lib/upsell'] = { rememberPaidState: () => {} };
stubs['@/lib/dashboard-snapshot-cache'] = {
  readProfileCache: () => null,
  readGamificationCache: () => null,
  readDashboardWordsCache: () => null,
  readLastProfileCache: () => null,
  readLastGamificationCache: () => null,
  readLastDashboardWordsCache: () => null,
  writeDashboardProfileCache: () => {},
  writeDashboardGamificationCache: () => {},
  writeDashboardWordsCache: () => {},
  writeDashboardSnapshot: () => {},
  clearDashboardSnapshotCache: () => {},
};
const authEvent = (event, nextSession) => {
  session = nextSession;
  generation++;
  for (const listener of authListeners) listener(event, session);
};

try {
  stubs['@/lib/entitlement'] = await load('src/lib/entitlement.ts');
  const provider = await load('src/components/student/StudentProvider.tsx');
  stubs['@/components/student/StudentProvider'] = provider;
  const { usePlan } = await load('src/hooks/usePlan.ts');
  const render = () => { cursor = 0; return usePlan(); };
  render(); mounted = true;
  const cleanup = effects.map(effect => effect());
  await tick();
  assert.equal(render().plan, 'pro');
  assert.equal(render().loading, false);
  assert.equal(queries, 1);

  profileError = new Error('Transient profile outage');
  emit('lingopro-plan-changed'); await tick();
  assert.equal(render().plan, 'pro', 'failed profile read must not downgrade Pro');
  sessionError = new Error('Temporary authentication outage');
  emit('focus'); await tick();
  assert.equal(render().plan, 'pro', 'failed session read must preserve the current plan');
  sessionError = null; profileError = null;
  profile = { id: 'student-a', plan: 'premium', plan_expires_at: '2999-01-01T00:00:00Z' };
  emit('online'); await tick();
  assert.equal(render().plan, 'premium', 'online recovery must revalidate the authoritative plan');
  profile = { id: 'student-a', plan: 'pro', plan_expires_at: '2000-01-01T00:00:00Z' };
  emit('focus'); await tick();
  assert.equal(render().plan, 'free', 'confirmed expiry must still remove paid access');

  deferProfile = true;
  const cachedBeforeLogout = provider.getStoredProfile('student-a');
  emit('lingopro-plan-changed'); await tick();
  authEvent('SIGNED_OUT', null);
  finishProfile({ data: { id: 'student-a', plan: 'pro', plan_expires_at: null }, error: null });
  await tick();
  assert.equal(render().plan, 'free', 'pending Pro read must not survive logout');
  assert.deepEqual(provider.getStoredProfile('student-a'), cachedBeforeLogout, 'stale result must not repopulate the account cache');

  deferProfile = false; profileError = new Error('New account profile unavailable');
  authEvent('SIGNED_IN', { user: { id: 'student-b' } }); await tick();
  assert.equal(render().plan, 'free', 'another account must never inherit paid state');
  assert.equal(render().loading, true, 'unknown profile must remain pending instead of confirming Free');
  profileError = null; profile = { id: 'student-b', plan: 'pro', plan_expires_at: null };
  emit('focus'); await tick();
  assert.equal(render().plan, 'pro');

  deferProfile = true;
  const previousRead = provider.fetchProfileOnce('student-b');
  const finishPreviousRead = finishProfile;
  authEvent('SIGNED_OUT', null);
  authEvent('SIGNED_IN', { user: { id: 'student-b' } }); await tick();
  const finishNewRead = finishProfile;
  assert.notEqual(finishNewRead, finishPreviousRead, 'new login must not reuse the previous login profile request');
  finishPreviousRead({ data: { id: 'student-b', plan: 'free', plan_expires_at: null }, error: null });
  assert.equal(await previousRead, null);
  finishNewRead({ data: { id: 'student-b', plan: 'pro', plan_expires_at: null }, error: null });
  await tick();
  assert.equal(render().plan, 'pro', 'same-account re-login must apply the new session profile');
  cleanup.forEach(dispose => dispose?.());
  assert.equal(authListeners.size, 0);
  assert([...events.values()].every(callbacks => callbacks.size === 0));
  console.log('[Plan] Actual usePlan/provider: Pro preservation, outage recovery, expiry, logout race, cache/account isolation PASS');
} finally {
  if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  if (previousSessionStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = previousSessionStorage;
  delete globalThis.__studentPlanStubs;
  for (const file of readdirSync(temp)) unlinkSync(join(temp, file));
  rmdirSync(temp);
}
