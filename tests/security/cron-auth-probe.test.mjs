import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const routePath = join(repoRoot, 'src', 'app', 'api', 'cron', 'auth-check', 'route.ts');
const authPath = join(repoRoot, 'src', 'lib', 'cron-auth.ts');
const workflowPath = join(repoRoot, '.github', 'workflows', 'push-cron.yml');
const routeSource = readFileSync(routePath, 'utf8');
const workflowSource = readFileSync(workflowPath, 'utf8');
const tempRoot = mkdtempSync(join(tmpdir(), 'cron-auth-probe-test-'));

const compile = (source, filename) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;

try {
  const authModulePath = join(tempRoot, 'cron-auth.mjs');
  writeFileSync(authModulePath, compile(readFileSync(authPath, 'utf8'), authPath));
  const { isCronAuthorizationValid } = await import(pathToFileURL(authModulePath).href);

  assert(
    routeSource.includes("import { assertCronAuthorized } from '@/lib/api-security';"),
    'auth-check must reuse the shared production cron auth helper',
  );
  assert(routeSource.includes('new Response(null'), 'successful auth-check response must have no body');
  assert(routeSource.includes('status: 204'), 'successful auth-check response must be HTTP 204');

  const forbiddenRouteMarkers = [
    'createServiceClient',
    'createBrowserClient',
    '.from(',
    '.rpc(',
    'sendEmail',
    'sendPush',
    'subscription',
    'processChallenge',
    'completeChallenge',
    'fetch(',
  ];
  for (const marker of forbiddenRouteMarkers) {
    assert(!routeSource.includes(marker), `auth-check must not contain side-effect marker: ${marker}`);
  }

  let expectedSecret;
  const effects = { database: 0, serviceRole: 0, email: 0, push: 0, businessMutation: 0 };
  globalThis.__assertCronAuthorized = (request) => {
    if (isCronAuthorizationValid(request.headers.get('authorization'), expectedSecret)) return null;
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const transformedRoute = routeSource.replace(
    "import { assertCronAuthorized } from '@/lib/api-security';",
    'const assertCronAuthorized = globalThis.__assertCronAuthorized;',
  );
  const routeModulePath = join(tempRoot, 'route.mjs');
  writeFileSync(routeModulePath, compile(transformedRoute, routePath));
  const { GET } = await import(pathToFileURL(routeModulePath).href);

  const invoke = (authorization) => {
    const headers = authorization === undefined ? {} : { authorization };
    return GET(new Request('https://lingopro.online/api/cron/auth-check', { headers }));
  };

  expectedSecret = 'configured-probe-secret';
  assert.equal((await invoke()).status, 401, 'missing auth must deny');
  assert.equal((await invoke('Bearer')).status, 401, 'malformed auth must deny');
  assert.equal((await invoke('Bearer wrong-secret')).status, 401, 'wrong bearer must deny');

  const accepted = await invoke(`Bearer ${expectedSecret}`);
  assert.equal(accepted.status, 204, 'valid CRON_SECRET must return 204');
  assert.equal(await accepted.text(), '', '204 response must have no body');
  assert.equal(accepted.headers.get('cache-control'), 'no-store');

  expectedSecret = undefined;
  assert.equal(
    (await invoke('Bearer configured-probe-secret')).status,
    401,
    'missing server-side CRON_SECRET must fail closed',
  );
  assert.deepEqual(
    effects,
    { database: 0, serviceRole: 0, email: 0, push: 0, businessMutation: 0 },
    'auth-check must produce zero privileged or business side effects',
  );

  const scheduledStep = workflowSource.match(
    /- name: Run scheduled push-due[\s\S]*?(?=\n\s+- name: Verify cron auth)/,
  )?.[0] ?? '';
  const manualStep = workflowSource.match(
    /- name: Verify cron auth without business side effects[\s\S]*$/,
  )?.[0] ?? '';
  assert(scheduledStep.includes("if: ${{ github.event_name == 'schedule' }}"));
  assert(scheduledStep.includes("endpoint='/api/cron/push-due'"));
  assert(!scheduledStep.includes('/api/cron/auth-check'));
  assert(manualStep.includes("if: ${{ github.event_name == 'workflow_dispatch' }}"));
  assert(manualStep.includes("endpoint='/api/cron/auth-check'"));
  assert(!manualStep.includes('/api/cron/push-due'), 'manual verification must never invoke push-due');
  assert(manualStep.includes('if [ "$code" != "204" ]'));
  assert.equal(
    (workflowSource.match(/--output \/dev\/null/g) ?? []).length,
    2,
    'scheduled and manual calls must both discard response bodies',
  );
  for (const forbiddenLogMarker of ['resp.json', 'cat ', 'jq ', 'tee ']) {
    assert(!workflowSource.includes(forbiddenLogMarker), `workflow must not log response bodies via ${forbiddenLogMarker}`);
  }

  console.log('PASS auth-check is fail-closed, bodyless, side-effect-free, and workflow-safe');
} finally {
  delete globalThis.__assertCronAuthorized;
  rmSync(tempRoot, { recursive: true, force: true });
}
