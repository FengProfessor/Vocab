import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const authSourcePath = join(repoRoot, 'src', 'lib', 'cron-auth.ts');
const apiSecurityPath = join(repoRoot, 'src', 'lib', 'api-security.ts');
const tempRoot = mkdtempSync(join(tmpdir(), 'cron-auth-test-'));
const compiledPath = join(tempRoot, 'cron-auth.mjs');

const compiled = ts.transpileModule(readFileSync(authSourcePath, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: authSourcePath,
});
writeFileSync(compiledPath, compiled.outputText);

try {
  const { isCronAuthorizationValid } = await import(pathToFileURL(compiledPath).href);
  const configuredSecret = 'configured-cron-secret-for-tests';
  const legacyMarker = 'synthetic-legacy-bypass-marker';

  assert.equal(isCronAuthorizationValid(null, configuredSecret), false, 'missing header must deny');
  assert.equal(isCronAuthorizationValid('Basic abc', configuredSecret), false, 'wrong scheme must deny');
  assert.equal(isCronAuthorizationValid('Bearer', configuredSecret), false, 'missing bearer token must deny');
  assert.equal(isCronAuthorizationValid('Bearer  value', configuredSecret), false, 'malformed spacing must deny');
  assert.equal(isCronAuthorizationValid(`Bearer ${configuredSecret} extra`, configuredSecret), false, 'extra token data must deny');
  assert.equal(isCronAuthorizationValid('Bearer wrong-secret', configuredSecret), false, 'wrong bearer must deny');
  assert.equal(isCronAuthorizationValid(`Bearer ${legacyMarker}`, configuredSecret), false, 'legacy marker must deny');
  assert.equal(isCronAuthorizationValid(`Bearer ${configuredSecret}`, undefined), false, 'missing CRON_SECRET must deny');
  assert.equal(isCronAuthorizationValid(`Bearer ${configuredSecret}`, ''), false, 'empty CRON_SECRET must deny');
  assert.equal(isCronAuthorizationValid(`Bearer ${configuredSecret}`, configuredSecret), true, 'configured secret must pass');

  const effects = { handler: 0, database: 0, email: 0, push: 0, subscription: 0 };
  const invoke = (header, expectedSecret) => {
    if (!isCronAuthorizationValid(header, expectedSecret)) return 401;
    effects.handler += 1;
    effects.database += 1;
    effects.email += 1;
    effects.push += 1;
    effects.subscription += 1;
    return 200;
  };

  const rejectedHeaders = [null, 'Basic abc', 'Bearer wrong-secret', `Bearer ${legacyMarker}`];
  for (const header of rejectedHeaders) assert.equal(invoke(header, configuredSecret), 401);
  assert.deepEqual(
    effects,
    { handler: 0, database: 0, email: 0, push: 0, subscription: 0 },
    'rejected auth must have zero privileged side effects',
  );

  assert.equal(invoke(`Bearer ${configuredSecret}`, configuredSecret), 200);
  assert.deepEqual(
    effects,
    { handler: 1, database: 1, email: 1, push: 1, subscription: 1 },
    'valid auth must reach the handler exactly once',
  );

  const routeContracts = [
    {
      path: 'src/app/api/cron/check-expired/route.ts',
      sideEffects: ['createServiceClient()', ".from('profiles')"],
    },
    {
      path: 'src/app/api/cron/email-due/route.ts',
      sideEffects: ['createServiceClient()', 'sendEmail('],
    },
    {
      path: 'src/app/api/cron/push-due/route.ts',
      sideEffects: ['createServiceClient()', 'sendPushNotificationToUser('],
    },
    {
      path: 'src/app/api/challenges/check-daily/route.ts',
      sideEffects: ['createServiceClient()', 'processChallengeDayEnd('],
    },
  ];

  for (const contract of routeContracts) {
    const source = readFileSync(join(repoRoot, contract.path), 'utf8');
    const authIndex = source.indexOf('assertCronAuthorized(req)');
    const denyReturnIndex = source.indexOf('if (denied) return denied', authIndex);
    assert.notEqual(authIndex, -1, `${contract.path} must use shared cron auth`);
    assert.notEqual(denyReturnIndex, -1, `${contract.path} must return before side effects when denied`);
    assert(!source.includes("headers.get('CRON_SECRET')"), `${contract.path} must not accept a custom secret header`);
    for (const marker of contract.sideEffects) {
      const sideEffectIndex = source.indexOf(marker, denyReturnIndex);
      assert.notEqual(sideEffectIndex, -1, `${contract.path} missing expected operation ${marker}`);
      assert(denyReturnIndex < sideEffectIndex, `${contract.path} performs ${marker} before cron authorization`);
    }
  }

  const apiSecurity = readFileSync(apiSecurityPath, 'utf8');
  const cronFunction = apiSecurity.match(/export function assertCronAuthorized[\s\S]*?\n}\n/)?.[0] ?? '';
  assert(cronFunction.includes('process.env.CRON_SECRET'), 'cron helper must read only server-side CRON_SECRET');
  assert(cronFunction.includes('isCronAuthorizationValid'), 'cron helper must use the strict matcher');
  assert(!/bypass|fallback/i.test(cronFunction), 'cron helper must not retain bypass/fallback logic');
  assert(!/const\s+\w*(?:secret|token)\w*\s*=\s*['"][^'"]+['"]/i.test(cronFunction), 'cron helper must not contain a hard-coded secret');

  const tracked = execFileSync('git', ['ls-files', 'src'], { cwd: repoRoot, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
  for (const relativePath of tracked) {
    const source = readFileSync(join(repoRoot, relativePath), 'utf8');
    assert(!/Bearer [A-Za-z0-9_-]{20,}/.test(source), `${relativePath} contains a hard-coded bearer value`);
    assert(!/console\.(?:log|warn|error)\([^\n]*(?:authorization|CRON_SECRET)/i.test(source), `${relativePath} logs cron authorization material`);
    assert(!source.includes('NEXT_PUBLIC_CRON_SECRET'), `${relativePath} exposes CRON_SECRET to the client`);
    const header = source.split(/\r?\n/).slice(0, 8).join('\n');
    if (/['"]use client['"]/.test(header)) {
      assert(!source.includes('@/lib/api-security'), `${relativePath} imports the server auth module from a client module`);
      assert(!source.includes('@/lib/cron-auth'), `${relativePath} imports cron auth from a client module`);
      assert(!source.includes('process.env.CRON_SECRET'), `${relativePath} reads CRON_SECRET from a client module`);
    }
  }

  console.log('PASS cron auth denies invalid inputs, gates side effects, and has no source bypass');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
