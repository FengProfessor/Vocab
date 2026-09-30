import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(join(repoRoot, path), 'utf8');
const tempRoot = mkdtempSync(join(tmpdir(), 'phase2a-security-test-'));

const compile = (source, filename) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;

async function loadModule(name, source, filename) {
  const modulePath = join(tempRoot, `${name}-${Date.now()}-${Math.random()}.mjs`);
  source = source.replace(/import \{ sessionErrorResponse \} from '@\/lib\/session-response';/, 'const sessionErrorResponse = () => null;');
  writeFileSync(modulePath, compile(source, filename));
  return import(pathToFileURL(modulePath).href);
}

const responseJson = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
});

const originalEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  allowTestRoutes: process.env.ALLOW_TEST_ROUTES,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
};
const originalFetch = globalThis.fetch;

try {
  const sharedSource = read('src/lib/supabase.ts');
  const serverSource = read('src/lib/supabase-server.ts');
  assert(!sharedSource.includes('createServiceClient'), 'browser Supabase module must not export service client');
  assert(!sharedSource.includes('SUPABASE_SERVICE_ROLE_KEY'), 'browser Supabase module must not reference service-role secret');
  assert(serverSource.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert(!serverSource.includes('supabaseAnonKey'));
  assert(!serverSource.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

  const createCalls = [];
  globalThis.__phase2aCreateClient = (...args) => {
    createCalls.push(args);
    return { marker: 'service-client' };
  };
  const transformedServer = serverSource.replace(
    "import { createClient } from '@supabase/supabase-js';",
    'const createClient = globalThis.__phase2aCreateClient;',
  );
  const { createServiceClient } = await loadModule(
    'supabase-server',
    transformedServer,
    'src/lib/supabase-server.ts',
  );

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(() => createServiceClient(), /Missing required server-side Supabase configuration/);
  globalThis.window = {};
  assert.throws(() => createServiceClient(), /server-only/);
  delete globalThis.window;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.example.test';
  assert.throws(() => createServiceClient(), /Missing required server-side Supabase configuration/);
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
  assert.deepEqual(createServiceClient(), { marker: 'service-client' });
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0][0], 'https://project.example.test');
  assert.equal(createCalls[0][1], 'service-role-test-key');
  assert.equal(createCalls[0][2].auth.persistSession, false);

  const sourceFiles = [];
  const collect = async (dir) => {
    const { readdir } = await import('node:fs/promises');
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (/\.(?:ts|tsx)$/.test(entry.name)) sourceFiles.push(path);
    }
  };
  await collect(join(repoRoot, 'src'));
  for (const path of sourceFiles) {
    const source = readFileSync(path, 'utf8');
    for (const line of source.split(/\r?\n/).filter((value) => value.includes('createServiceClient') && value.includes('from '))) {
      assert(line.includes('supabase-server'), `${path} must import service client from the server module`);
    }
    if (/^['"]use client['"];?/m.test(source)) {
      assert(!source.includes('@/lib/supabase-server'), `${path} must not import server Supabase client`);
    }
  }

  const notifySource = read('src/app/api/test/notify/route.ts');
  const effects = { authCalls: 0, serviceClients: 0, profileReads: [], sends: 0 };
  let auth = null;
  let callerProfile = null;
  let targetProfile = null;
  globalThis.__phase2aNextResponse = { json: responseJson };
  globalThis.__phase2aSecurity = {
    getAuthUser: async () => {
      effects.authCalls += 1;
      return auth;
    },
    getAdminEmails: () => ['allowlisted@example.test'],
    unauthorized: () => responseJson({ success: false, error: 'Unauthorized' }, { status: 401 }),
    forbidden: (message) => responseJson({ success: false, error: message }, { status: 403 }),
  };
  globalThis.__phase2aServiceClient = () => {
    effects.serviceClients += 1;
    return {
      from(table) {
        assert.equal(table, 'profiles');
        let selected = '';
        let id = '';
        const query = {
          select(value) { selected = value; return query; },
          eq(column, value) { assert.equal(column, 'id'); id = value; return query; },
          async maybeSingle() {
            effects.profileReads.push({ selected, id, kind: 'caller' });
            return { data: callerProfile, error: null };
          },
          async single() {
            effects.profileReads.push({ selected, id, kind: 'target' });
            return { data: targetProfile, error: targetProfile ? null : new Error('missing') };
          },
        };
        return query;
      },
    };
  };
  globalThis.fetch = async (_url, options) => {
    effects.sends += 1;
    assert.equal(options.method, 'POST');
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const transformedNotify = notifySource
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = globalThis.__phase2aNextResponse;')
    .replace("import { createServiceClient } from '@/lib/supabase-server';", 'const createServiceClient = globalThis.__phase2aServiceClient;')
    .replace(
      "import { getAdminEmails, getAuthUser, forbidden, unauthorized } from '@/lib/api-security';",
      'const { getAdminEmails, getAuthUser, forbidden, unauthorized } = globalThis.__phase2aSecurity;',
    );
  const notify = await loadModule('test-notify', transformedNotify, 'src/app/api/test/notify/route.ts');
  const validTarget = '11111111-1111-4111-8111-111111111111';
  const request = (body = { userId: validTarget }) => new Request('https://lingopro.online/api/test/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
    body: JSON.stringify(body),
  });

  delete process.env.ALLOW_TEST_ROUTES;
  assert.equal((await notify.POST(request())).status, 404);
  assert.equal(effects.authCalls, 0);
  assert.equal(effects.serviceClients, 0);

  process.env.ALLOW_TEST_ROUTES = 'true';
  assert.equal((await notify.POST(request())).status, 401);
  assert.equal(effects.serviceClients, 0, 'anonymous caller must not create business service client');

  auth = { userId: 'normal-user', email: 'normal@example.test' };
  callerProfile = { role: 'student', email: 'normal@example.test' };
  assert.equal((await notify.POST(request())).status, 403);
  assert.equal(effects.sends, 0);
  assert.equal(effects.profileReads.filter((entry) => entry.kind === 'target').length, 0);

  auth = { userId: 'admin-user', email: 'admin@example.test' };
  callerProfile = { role: 'admin', email: 'admin@example.test' };
  assert.equal((await notify.POST(request({ userId: '../victim' }))).status, 400);
  assert.equal(effects.sends, 0);

  targetProfile = null;
  const missingTarget = await notify.POST(request());
  assert.equal(missingTarget.status, 404);
  assert.deepEqual(await missingTarget.json(), { success: false, error: 'Notification target unavailable' });
  assert.equal(effects.sends, 0);

  process.env.TELEGRAM_BOT_TOKEN = 'telegram-test-token';
  targetProfile = { telegram_id: 'private-chat-id', full_name: 'Private Name' };
  const sent = await notify.POST(request());
  assert.equal(sent.status, 200);
  assert.deepEqual(await sent.json(), { success: true });
  assert.equal(effects.sends, 1);
  assert.equal((await notify.GET()).status, 405);
  assert(!notifySource.includes('telegram_response'));
  assert(!notifySource.includes('telegram_id: p.telegram_id'));
  assert(!notifySource.includes('profile: p'));

  const leakChecks = new Map([
    ['src/lib/ai-router.ts', ['keyEntry.key.slice(', 'key fail ...']],
    ['src/lib/gemini-multi.ts', ['entry.key.slice(', 'key=...']],
    ['src/lib/notifications.ts', ['userId.slice(', 'failed for user ${userId}']],
    ['scripts/apply-fcm-token-unique.ts', ['token.slice(0']],
    ['scripts/broadcast-fcm.ts', ['token=${', 'fcm_token.slice(', 'chunk[idx].slice(']],
    ['scripts/onboard_students_tonight.ts', ['temp password: ${tempPassword}']],
    ['scripts/push-zhipu-vercel.mjs', ["'prefix', key.slice("]],
    ['scripts/seed_toeic_demo.ts', ['Demo@1234', 'TEACHER.password']],
    ['scripts/test-gemini-image.ts', ['const masked =', '${masked}']],
  ]);
  for (const [path, forbiddenMarkers] of leakChecks) {
    const source = read(path);
    for (const marker of forbiddenMarkers) {
      assert(!source.includes(marker), `${path} must not log or hard-code credential marker: ${marker}`);
    }
  }

  console.log('PASS Phase 2A service client, test notify, and credential logging boundaries');
} finally {
  if (originalEnv.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.url;
  if (originalEnv.serviceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.serviceKey;
  if (originalEnv.allowTestRoutes === undefined) delete process.env.ALLOW_TEST_ROUTES;
  else process.env.ALLOW_TEST_ROUTES = originalEnv.allowTestRoutes;
  if (originalEnv.telegramToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = originalEnv.telegramToken;
  globalThis.fetch = originalFetch;
  delete globalThis.__phase2aCreateClient;
  delete globalThis.__phase2aNextResponse;
  delete globalThis.__phase2aSecurity;
  delete globalThis.__phase2aServiceClient;
  delete globalThis.window;
  rmSync(tempRoot, { recursive: true, force: true });
}
