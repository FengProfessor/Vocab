import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const paths = {
  redirect: 'src/lib/internal-redirect.ts',
  authPage: 'src/app/auth/page.tsx',
  callback: 'src/app/auth/complete/page.tsx',
  upload: 'src/app/api/speaking/upload-audio/route.ts',
  register: 'src/app/api/auth/register/route.ts',
  security: 'src/lib/api-security.ts',
  adminStats: 'src/app/api/admin/stats/route.ts',
};
const sources = Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [key, readFileSync(join(repoRoot, path), 'utf8')]),
);
const tempRoot = mkdtempSync(join(tmpdir(), 'phase1c-security-test-'));
const oldServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalAdminEmails = process.env.ADMIN_EMAILS;

const compile = (source, filename) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;

const responseJson = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
});

async function loadModule(name, source) {
  const modulePath = join(tempRoot, `${name}-${Date.now()}-${Math.random()}.mjs`);
  source = source.replace(/import \{ (?:PRIVATE_SESSION_HEADERS, )?sessionErrorResponse \} from '@\/lib\/session-response';/, 'const PRIVATE_SESSION_HEADERS = {}; const sessionErrorResponse = () => null;');
  writeFileSync(modulePath, compile(source, paths[name]));
  return import(pathToFileURL(modulePath).href);
}

function formRequest(fields, token = 'valid-token') {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new Request('https://lingopro.online/api/speaking/upload-audio', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

try {
  globalThis.__nextResponse = { json: responseJson };
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

  const redirectModule = await loadModule('redirect', sources.redirect);
  const safe = redirectModule.safeInternalRedirect;
  for (const accepted of ['/', '/student', '/student?tab=due', '/auth?next=%2Fstudent%3Ftab%3Ddue']) {
    assert.equal(safe(accepted, '/fallback'), accepted, `expected safe redirect: ${accepted}`);
  }
  for (const rejected of [
    'https://evil.example',
    'http://evil.example',
    '//evil.example',
    '/\\evil.example',
    '%2F%2Fevil.example',
    '%252F%252Fevil.example',
    '/%5Cevil.example',
    '/auth?next=https%3A%2F%2Fevil.example',
    '/auth?returnTo=%252F%252Fevil.example',
    'https://user:pass@evil.example',
    '/student%ZZ',
    '/student\nnext',
  ]) {
    assert.equal(safe(rejected, '/fallback'), '/fallback', `expected rejected redirect: ${rejected}`);
  }
  for (const sourceName of ['authPage', 'callback']) {
    assert(sources[sourceName].includes("from '@/lib/internal-redirect'"));
    assert(sources[sourceName].includes('safeInternalRedirect('));
    assert(!sources[sourceName].includes("startsWith('/') && !"));
  }
  assert(sources.authPage.includes('safeInternalRedirect(redirectToParam'));
  assert(sources.callback.includes('safeInternalRedirect(customRedirect, fallbackTarget)'));

  const uploadEffects = { serviceClients: 0, uploads: [] };
  let authenticated = false;
  globalThis.__security = {
    getAuthUser: async () => authenticated
      ? { userId: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' }
      : null,
  };
  globalThis.__createServiceClient = () => {
    uploadEffects.serviceClients += 1;
    return {
      storage: {
        from(bucket) {
          return {
            async upload(path, _buffer, options) {
              uploadEffects.uploads.push({ bucket, path, options });
              return { error: null };
            },
            getPublicUrl(path) {
              return { data: { publicUrl: `https://storage.example/${path}` } };
            },
          };
        },
      },
    };
  };
  const uploadSource = sources.upload
    .replace("import { NextRequest, NextResponse } from 'next/server';", 'const NextResponse = globalThis.__nextResponse;')
    .replace("import { createServiceClient } from '@/lib/supabase-server';", 'const createServiceClient = globalThis.__createServiceClient;')
    .replace("import { getAuthUser } from '@/lib/api-security';", 'const { getAuthUser } = globalThis.__security;');
  const { POST: uploadAudio } = await loadModule('upload', uploadSource);
  const audio = () => new Blob(['secure-audio'], { type: 'audio/webm' });

  assert.equal((await uploadAudio(formRequest({ audio: audio() }, ''))).status, 401);
  assert.equal(uploadEffects.serviceClients, 0, 'anonymous request must not create service client');
  assert.equal(uploadEffects.uploads.length, 0, 'anonymous request must not mutate storage');

  authenticated = true;
  const traversal = await uploadAudio(formRequest({ audio: audio(), stageId: '../victim', promptId: 'p1' }));
  assert.equal(traversal.status, 400);
  assert.equal(uploadEffects.serviceClients, 0, 'invalid path must fail before service client');

  assert.equal((await uploadAudio(formRequest({ audio: new Blob(['x'], { type: 'text/plain' }) }))).status, 415);
  assert.equal((await uploadAudio(formRequest({
    audio: new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'audio/webm' }),
  }))).status, 413);

  const uploadRequests = Array.from({ length: 8 }, () => uploadAudio(formRequest({
    audio: audio(),
    stageId: 'stage-1',
    promptId: 'prompt_1',
    userId: 'attacker-selected-user',
    bucket: 'victim-bucket',
    storagePath: '../victim/object',
  })));
  const uploadResponses = await Promise.all(uploadRequests);
  assert(uploadResponses.every((response) => response.status === 200));
  assert.equal(uploadEffects.uploads.length, 8);
  const uploadPaths = new Set(uploadEffects.uploads.map((entry) => entry.path));
  assert.equal(uploadPaths.size, 8, 'concurrent uploads need unique object paths');
  for (const entry of uploadEffects.uploads) {
    assert.equal(entry.bucket, 'speaking-recordings');
    assert(entry.path.startsWith('recordings/11111111-1111-4111-8111-111111111111/stage-1/prompt_1/'));
    assert(!entry.path.includes('attacker-selected-user'));
    assert.equal(entry.options.upsert, false);
  }

  const registerEffects = { signups: [], serviceClients: 0, deletions: [] };
  let signupResult = {
    data: { user: { id: 'new-user', email_confirmed_at: null }, session: null },
    error: null,
  };
  globalThis.__createPublicAuthClient = () => ({
    auth: {
      async signUp(payload) {
        registerEffects.signups.push(payload);
        return signupResult;
      },
    },
  });
  globalThis.__createServiceClient = () => {
    registerEffects.serviceClients += 1;
    return {
      auth: {
        admin: {
          async deleteUser(id) {
            registerEffects.deletions.push(id);
            return { error: null };
          },
        },
      },
    };
  };
  globalThis.__registerSecurity = {
    checkRateLimitAsync: async () => ({ allowed: true }),
    getClientIp: () => 'test-ip',
    rateLimitUnavailableResponse: () => null,
  };
  const registerSource = sources.register
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = globalThis.__nextResponse;')
    .replace(/import \{[^}]+\} from '@\/lib\/server-auth-session';/, `const assertAppRequest = () => {}; const appOrigin = req => new URL(req.url).origin; const cookieHeader = () => 'test-flow'; const flowCookieName = () => 'test-flow'; const serverAuthClient = () => ({ client: globalThis.__createPublicAuthClient(), verifier: () => 'test-verifier' });`)
    .replace(/import \{[^}]+\} from '@\/lib\/server-session-store';/, "const createAuthFlow = async () => 'test-flow'; const FLOW_LIFETIME_MS = 600000;")
    .replace(/import \{[^}]+\} from '@\/lib\/session-response';/, 'const PRIVATE_SESSION_HEADERS = {}; const sessionErrorResponse = () => null;')
    .replace("import { createServiceClient } from '@/lib/supabase-server';", 'const createServiceClient = globalThis.__createServiceClient;')
    .replace(
      /import \{ ([^}]+) \} from '@\/lib\/api-security';/,
      (_, names) => `const { ${names} } = globalThis.__registerSecurity;`,
    );
  const { POST: register } = await loadModule('register', registerSource);
  const registration = (body) => new Request('https://lingopro.online/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const registered = await register(registration({
    email: ' New@Example.Test ',
    password: 'password123',
    fullName: 'New User',
    role: 'admin',
    plan: 'pro',
    email_confirm: true,
  }));
  assert.equal(registered.status, 200);
  assert.deepEqual(await registered.json(), { success: true, verificationRequired: true });
  assert.equal(registerEffects.serviceClients, 0, 'normal registration must not use service role');
  assert.equal(registerEffects.signups[0].email, 'new@example.test');
  assert.equal(registerEffects.signups[0].options.data.role, 'student');
  assert(!('email_confirm' in registerEffects.signups[0]));
  assert(!('plan' in registerEffects.signups[0].options.data));
  assert(!('admin' in registerEffects.signups[0].options.data));

  const duplicate = await register(registration({
    email: 'new@example.test', password: 'password123', fullName: 'New User',
  }));
  assert.equal(duplicate.status, 200, 'duplicate-safe Supabase response remains generic');

  const beforeInvalid = registerEffects.signups.length;
  assert.equal((await register(registration({ email: 'bad', password: 'password123' }))).status, 400);
  assert.equal(registerEffects.signups.length, beforeInvalid);

  signupResult = {
    data: { user: { id: 'auto-confirmed-user', email_confirmed_at: '2026-01-01T00:00:00Z' }, session: { access_token: 'x' } },
    error: null,
  };
  const autoConfirmed = await register(registration({
    email: 'misconfigured@example.test', password: 'password123', fullName: 'Misconfigured',
  }));
  assert.equal(autoConfirmed.status, 503);
  assert.deepEqual(registerEffects.deletions, ['auto-confirmed-user']);
  assert.equal(registerEffects.serviceClients, 1, 'service role is limited to fail-closed cleanup');
  assert(!sources.register.includes('admin.createUser'));
  assert(!sources.register.includes('email_confirm: true'));
  assert(!sources.authPage.includes('Đăng nhập ngay — không chờ confirm email'));
  assert(!sources.authPage.includes('role,\n            website'));

  const distributedModulePath = join(tempRoot, 'distributed-rate-limit.mjs');
  writeFileSync(distributedModulePath, compile(
    readFileSync(join(repoRoot, 'src/lib/distributed-rate-limit.ts'), 'utf8'),
    'src/lib/distributed-rate-limit.ts',
  ));
  const securitySource = sources.security
    .replace(/import \{[^}]+\} from '@\/lib\/server-auth-session';/, "const getWebUser = async () => ({data:{user:null}}); const sessionCookieName = () => '__Host-lingopro-session';")
    .replaceAll("'@/lib/distributed-rate-limit'", JSON.stringify(pathToFileURL(distributedModulePath).href))
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = globalThis.__nextResponse;')
    .replace("import { createServiceClient } from '@/lib/supabase-server';", 'const createServiceClient = globalThis.__createServiceClient;')
    .replace("import { cacheGet, cacheSet } from '@/lib/ttl-cache';", 'const cacheGet = () => undefined; const cacheSet = () => undefined;')
    .replace("import { isCronAuthorizationValid } from '@/lib/cron-auth';", 'const isCronAuthorizationValid = () => false;');
  const securityModule = await loadModule('security', securitySource);
  const oldAdminEmails = process.env.ADMIN_EMAILS;
  try {
    delete process.env.ADMIN_EMAILS;
    assert.deepEqual(securityModule.getAdminEmails(), []);
    process.env.ADMIN_EMAILS = '  ADMIN@Example.Test, admin@example.test, second@example.test ';
    assert.deepEqual(securityModule.getAdminEmails(), ['admin@example.test', 'second@example.test']);
    process.env.ADMIN_EMAILS = ' , ';
    assert.deepEqual(securityModule.getAdminEmails(), []);
  } finally {
    if (oldAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = oldAdminEmails;
  }
  assert(!sources.security.includes('DEFAULT_ADMIN_EMAILS'));
  assert(!sources.security.includes('taphong2002@gmail.com'));

  let adminAuth = null;
  let adminProfile = null;
  let adminServiceClients = 0;
  globalThis.__adminSecurity = {
    getAuthUser: async () => adminAuth,
    unauthorized: () => responseJson({ error: 'Unauthorized' }, { status: 401 }),
    safeErrorResponse: () => responseJson({ error: 'Internal Server Error' }, { status: 500 }),
    getAdminEmails: () => securityModule.getAdminEmails(),
  };
  globalThis.__adminSupabase = {
    createServiceClient: () => {
      adminServiceClients += 1;
      return {
        from(table) {
          assert.equal(table, 'profiles');
          const query = {
            select() { return query; },
            eq() { return query; },
            async maybeSingle() { return { data: adminProfile, error: null }; },
            async order() { return { data: [], error: null }; },
          };
          return query;
        },
      };
    },
    fetchAllRows: async () => [],
  };
  const adminStatsSource = sources.adminStats
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = globalThis.__nextResponse;')
    .replace("import { fetchAllRows } from '@/lib/supabase';", 'const { fetchAllRows } = globalThis.__adminSupabase;')
    .replace("import { createServiceClient } from '@/lib/supabase-server';", 'const { createServiceClient } = globalThis.__adminSupabase;')
    .replace(
      "import { getAuthUser, unauthorized, safeErrorResponse, getAdminEmails } from '@/lib/api-security';",
      'const { getAuthUser, unauthorized, safeErrorResponse, getAdminEmails } = globalThis.__adminSecurity;',
    );
  const { GET: getAdminStats } = await loadModule('adminStats', adminStatsSource);
  delete process.env.ADMIN_EMAILS;
  assert.equal((await getAdminStats(new Request('https://lingopro.online/api/admin/stats'))).status, 401);
  assert.equal(adminServiceClients, 0, 'anonymous admin request must fail before service role');

  adminAuth = { userId: 'normal-user', email: 'taphong2002@gmail.com' };
  adminProfile = { email: 'taphong2002@gmail.com', role: 'student' };
  const forged = new Request('https://lingopro.online/api/admin/stats?email=admin@example.test', {
    headers: { 'x-admin-email': 'admin@example.test', 'x-user-role': 'admin' },
  });
  assert.equal((await getAdminStats(forged)).status, 403, 'legacy email and forged headers must fail closed');

  process.env.ADMIN_EMAILS = ' configured@example.test ';
  adminAuth = { userId: 'configured-user', email: 'configured@example.test' };
  adminProfile = { email: 'configured@example.test', role: 'student' };
  assert.equal((await getAdminStats(new Request('https://lingopro.online/api/admin/stats'))).status, 200);

  console.log('PASS Phase 1C auth, upload, registration, and admin boundaries');
} finally {
  delete globalThis.__nextResponse;
  delete globalThis.__security;
  delete globalThis.__registerSecurity;
  delete globalThis.__createPublicAuthClient;
  delete globalThis.__createServiceClient;
  delete globalThis.__adminSecurity;
  delete globalThis.__adminSupabase;
  if (oldServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = oldServiceRoleKey;
  if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = originalAdminEmails;
  rmSync(tempRoot, { recursive: true, force: true });
}
