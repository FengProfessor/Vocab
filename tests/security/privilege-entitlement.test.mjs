import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const paths = {
  billingCampaign: 'src/app/api/billing/claim-upgrade-gift/route.ts',
  campaign: 'src/app/api/campaign/claim-upgrade-gift/route.ts',
  teacher: 'src/app/api/teacher/students/add/route.ts',
  campaignClient: 'src/components/campaign/UpgradeGiftModal.tsx',
  teacherClient: 'src/components/teacher/StudentsPanel.tsx',
  schema: 'supabase/schema.sql',
};
const sources = Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [key, readFileSync(join(repoRoot, path), 'utf8')]),
);
const tempRoot = mkdtempSync(join(tmpdir(), 'privilege-entitlement-test-'));

const compile = (source, filename) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;

const responseJson = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
});

async function loadCampaignRoute(key) {
  const source = sources[key]
    .replace(/import \{ NextRequest, NextResponse \} from 'next\/server';/, 'const NextResponse = globalThis.__nextResponse;')
    .replace(/import \{ NextResponse \} from 'next\/server';/, 'const NextResponse = globalThis.__nextResponse;')
    .replace(
      /import \{ getAuthUser, unauthorized \} from '@\/lib\/api-security';/,
      'const { getAuthUser, unauthorized } = globalThis.__security;',
    );
  const modulePath = join(tempRoot, `${key}.mjs`);
  writeFileSync(modulePath, compile(source, paths[key]));
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}-${key}`);
}

function teacherService(effects, ownerId = 'teacher-a') {
  const enrollments = new Set();
  const service = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] } }),
        createUser: async () => {
          effects.authCreates += 1;
          return { data: { user: null }, error: new Error('unexpected createUser') };
        },
      },
    },
    from(table) {
      effects.tables.push(table);
      const filters = {};
      const query = {
        select() { return query; },
        eq(column, value) { filters[column] = value; return query; },
        ilike(column, value) { filters[column] = value; return query; },
        async maybeSingle() {
          if (table === 'classrooms') {
            return { data: { id: filters.id, name: 'Secure class', teacher_id: ownerId }, error: null };
          }
          if (table === 'profiles') {
            return {
              data: { id: 'student-b', email: filters.email, full_name: 'Student B', role: 'student' },
              error: null,
            };
          }
          throw new Error(`Unexpected maybeSingle on ${table}`);
        },
        async upsert(payload, options) {
          if (table === 'profiles') effects.profileUpserts.push(payload);
          if (table === 'enrollments') {
            effects.enrollmentUpserts.push(payload);
            enrollments.add(`${payload.student_id}:${payload.classroom_id}`);
            assert.equal(options?.onConflict, 'student_id,classroom_id');
          }
          return { error: null };
        },
      };
      return query;
    },
    enrollmentCount: () => enrollments.size,
  };
  return service;
}

async function loadTeacherRoute() {
  const source = sources.teacher
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = globalThis.__nextResponse;')
    .replace("import { createServiceClient } from '@/lib/supabase';", 'const createServiceClient = globalThis.__createServiceClient;')
    .replace(
      /import \{[\s\S]*?\} from '@\/lib\/api-security';/,
      'const { getAuthUser, unauthorized, forbidden, isValidString, safeErrorResponse } = globalThis.__security;',
    );
  const modulePath = join(tempRoot, 'teacher-route.mjs');
  writeFileSync(modulePath, compile(source, paths.teacher));
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

try {
  globalThis.__nextResponse = { json: responseJson };
  let authenticated = false;
  globalThis.__security = {
    getAuthUser: async () => authenticated ? { userId: 'teacher-a', email: 'teacher@example.test' } : null,
    unauthorized: () => responseJson({ error: 'Unauthorized' }, { status: 401 }),
    forbidden: (message) => responseJson({ error: message }, { status: 403 }),
    isValidString: (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max,
    safeErrorResponse: (error, fallback) => responseJson(
      { error: error instanceof Error ? fallback : String(error) },
      { status: 500 },
    ),
  };

  for (const key of ['billingCampaign', 'campaign']) {
    const source = sources[key];
    for (const forbidden of [
      'createServiceClient',
      '.from(',
      "plan: 'pro'",
      'plan_expires_at',
      'subscription_history',
      "searchParams.get('force')",
    ]) {
      assert(!source.includes(forbidden), `${paths[key]} retains privileged marker ${forbidden}`);
    }

    const { POST } = await loadCampaignRoute(key);
    authenticated = false;
    assert.equal((await POST(new Request('https://lingopro.online/claim'))).status, 401);

    authenticated = true;
    const tampered = new Request(
      'https://lingopro.online/claim?force=1&user_id=other-user&plan=pro&duration=3650',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'other-user',
          email: 'victim@example.test',
          plan: 'pro',
          duration: 3650,
          expires_at: '2099-01-01T00:00:00Z',
        }),
      },
    );
    assert.equal((await POST(tampered)).status, 410, `${paths[key]} must retire the expired campaign`);

    const concurrent = await Promise.all(
      Array.from({ length: 20 }, () => POST(new Request('https://lingopro.online/claim?force=1'))),
    );
    assert(concurrent.every((response) => response.status === 410));
  }

  assert(!sources.campaignClient.includes('fetch('), 'retired campaign client must not call an endpoint');
  assert(!sources.campaignClient.includes('claim-upgrade-gift'));

  for (const forbidden of [
    "plan: 'pro'",
    'plan_expires_at',
    "from('orders')",
    "from('subscription_history')",
    'teacher_grant',
    'period_months',
  ]) {
    assert(!sources.teacher.includes(forbidden), `teacher enrollment retains entitlement marker ${forbidden}`);
  }
  assert(!sources.teacherClient.includes('Tặng 1 năm Pro'));
  assert(!sources.teacherClient.includes('kích hoạt 1 năm Pro'));
  assert(/unique\s*\(\s*student_id\s*,\s*classroom_id\s*\)/i.test(sources.schema));
  assert(sources.teacher.includes("onConflict: 'student_id,classroom_id'"));

  const effects = {
    serviceClients: 0,
    authCreates: 0,
    tables: [],
    profileUpserts: [],
    enrollmentUpserts: [],
  };
  let service = teacherService(effects);
  globalThis.__createServiceClient = () => {
    effects.serviceClients += 1;
    return service;
  };
  const { POST: addStudent } = await loadTeacherRoute();
  const body = {
    classroomId: 'class-1',
    email: 'student-b@example.test',
    name: 'Student B',
    user_id: 'attacker-selected-user',
    target_user_id: 'victim-user',
    role: 'admin',
    plan: 'pro',
    duration: 3650,
    expires_at: '2099-01-01T00:00:00Z',
  };
  const request = () => new Request('https://lingopro.online/api/teacher/students/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  authenticated = false;
  assert.equal((await addStudent(request())).status, 401);
  assert.equal(effects.serviceClients, 0, 'anonymous rejection must happen before service-role use');

  authenticated = true;
  service = teacherService(effects, 'another-teacher');
  assert.equal((await addStudent(request())).status, 403);
  assert.equal(effects.profileUpserts.length, 0, 'ownership rejection must precede profile mutation');
  assert.equal(effects.enrollmentUpserts.length, 0, 'ownership rejection must precede enrollment mutation');

  service = teacherService(effects, 'teacher-a');
  const accepted = await addStudent(request());
  assert.equal(accepted.status, 200, 'classroom owner must retain the legitimate enrollment flow');
  assert.equal(effects.profileUpserts.length, 1);
  assert.deepEqual(
    Object.keys(effects.profileUpserts[0]).sort(),
    ['email', 'full_name', 'id', 'role'],
    'profile upsert must not contain plan, expiry, or client-selected identity fields',
  );
  assert.equal(effects.profileUpserts[0].id, 'student-b');
  assert.equal(effects.enrollmentUpserts[0].student_id, 'student-b');
  assert(!effects.tables.includes('orders'));
  assert(!effects.tables.includes('subscription_history'));

  const beforeConcurrentProfiles = effects.profileUpserts.length;
  const repeated = await Promise.all([addStudent(request()), addStudent(request()), addStudent(request())]);
  assert(repeated.every((response) => response.status === 200));
  assert.equal(service.enrollmentCount(), 1, 'concurrent/replayed enrollment must collapse to one DB identity');
  for (const payload of effects.profileUpserts.slice(beforeConcurrentProfiles)) {
    assert(!('plan' in payload));
    assert(!('plan_expires_at' in payload));
  }
  assert(!effects.tables.includes('orders'));
  assert(!effects.tables.includes('subscription_history'));

  console.log('PASS campaign claims are retired and teacher enrollment cannot grant Pro');
} finally {
  delete globalThis.__nextResponse;
  delete globalThis.__security;
  delete globalThis.__createServiceClient;
  rmSync(tempRoot, { recursive: true, force: true });
}
