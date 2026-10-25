import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';
import ts from 'typescript';

const root = fileURLToPath(new URL('../..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'p2c-store-'));
const modulePath = join(temp, 'store.mjs');
const oldEnv = { ...process.env };
const oldFetch = globalThis.fetch;
const source = readFileSync(join(root, 'src/lib/server-session-store.ts'), 'utf8');
writeFileSync(modulePath, ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText);
const port = Number(process.env.P2C_REDIS_TEST_PORT || 0);
if (process.env.CI && !port) throw new Error('CI must run session tests against isolated real Redis');

function parse(buffer, offset = 0) {
  const end = buffer.indexOf('\r\n', offset);
  if (end < 0) return null;
  const type = String.fromCharCode(buffer[offset]), value = buffer.toString('utf8', offset + 1, end);
  const next = end + 2;
  if (type === '-') throw new Error('Isolated Redis test command failed');
  if (type === '+') return { value, next };
  if (type === ':') return { value: Number(value), next };
  if (type === '$') {
    const length = Number(value);
    if (length === -1) return { value: null, next };
    if (buffer.length < next + length + 2) return null;
    return { value: buffer.toString('utf8', next, next + length), next: next + length + 2 };
  }
  throw new Error('Unexpected isolated Redis response');
}
function realRedis(args) {
  return new Promise((resolveResult, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    let buffer = Buffer.alloc(0);
    socket.setTimeout(3000, () => { socket.destroy(); reject(new Error('Isolated Redis timeout')); });
    socket.on('error', reject);
    socket.on('connect', () => socket.write(`*${args.length}\r\n` + args.map(arg => {
      const value = String(arg); return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
    }).join('')));
    socket.on('data', data => {
      buffer = Buffer.concat([buffer, data]);
      try { const result = parse(buffer); if (result) { socket.end(); resolveResult(result.value); } }
      catch (error) { socket.destroy(); reject(error); }
    });
  });
}
// Local transport fake only checks encryption/validation/basic lifecycle. Lua races require real CI Redis.
const memory = new Map();
async function memoryRedis([command, key, value, ...args]) {
  const record = memory.get(key);
  if (record && record.until <= Date.now()) memory.delete(key);
  if (command === 'SET') {
    if (args.includes('NX') && memory.has(key)) return null;
    memory.set(key, { value, until: Date.now() + Number(args[args.indexOf('PX') + 1]) }); return 'OK';
  }
  if (command === 'GET') return memory.get(key)?.value ?? null;
  if (command === 'GETDEL') { const result = memory.get(key)?.value ?? null; memory.delete(key); return result; }
  if (command === 'DEL') return Number(memory.delete(key));
  if (command === 'PTTL') return memory.has(key) ? memory.get(key).until - Date.now() : -2;
  throw new Error('Local fake must not interpret the production Lua scripts');
}
const command = port ? realRedis : memoryRedis;
const ids = [];
const keyFor = id => `auth:session:${createHash('sha256').update(id).digest('hex')}`;
try {
  process.env.UPSTASH_REDIS_REST_URL = 'https://isolated-session-test.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'synthetic-test-token';
  process.env.AUTH_SESSION_ENCRYPTION_KEY = randomBytes(32).toString('hex');
  globalThis.fetch = async (input, init) => {
    assert.equal(input, process.env.UPSTASH_REDIS_REST_URL);
    assert.equal(init.cache, 'no-store');
    const result = await command(JSON.parse(init.body));
    return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } });
  };
  const store = await import(pathToFileURL(modulePath).href);
  const input = { userId: '11111111-1111-4111-8111-111111111111',
    providerSessionId: '22222222-2222-4222-8222-222222222222', accessToken: 'synthetic-access-secret',
    refreshToken: 'synthetic-refresh-secret', tokenExpiresAt: Date.now() + 3600000 };
  const first = await store.createSessionVault(input); ids.push(first);
  const second = await store.createSessionVault(input); ids.push(second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/); assert.notEqual(first, second);
  const raw = await command(['GET', keyFor(first)]);
  assert(!raw.includes(input.accessToken) && !raw.includes(input.refreshToken) && !raw.includes(input.userId));
  assert(!keyFor(first).includes(first));
  const read = await store.readSessionVault(first);
  assert.deepEqual(read.vault.accessToken, input.accessToken);
  assert.equal(read.vault.expiresAt - read.vault.createdAt, store.SESSION_LIFETIME_MS);
  const ttl = await command(['PTTL', keyFor(first)]);
  assert(ttl > 0 && ttl <= store.SESSION_LIFETIME_MS);
  assert.equal(await store.readSessionVault('../invalid-id'), null);
  assert.equal(await store.readSessionVault(randomBytes(32).toString('base64url')), null);
  // Authenticated encryption binds data to the key: copying encrypted records cannot change identity.
  await command(['SET', keyFor(second), raw, 'PX', 60000]);
  await assert.rejects(store.readSessionVault(second), store.SessionStoreUnavailableError);
  const flow = await store.createAuthFlow({ verifier: 'synthetic-pkce-verifier', next: '/student', kind: 'oauth' });
  assert.equal((await store.consumeAuthFlow(flow)).verifier, 'synthetic-pkce-verifier');
  assert.equal(await store.consumeAuthFlow(flow), null);
  const recoveryFlow = await store.createRecoveryRecord({ phase: 'pkce', verifier: JSON.stringify('synthetic-pkce-verifier/recovery') });
  assert.equal(await store.recoveryRecord(recoveryFlow, 'password'), null);
  assert.equal((await store.recoveryRecord(recoveryFlow, 'pkce', true)).phase, 'pkce');
  assert.equal(await store.recoveryRecord(recoveryFlow, 'pkce', true), null);
  const now = Date.now();
  const context = await store.createRecoveryRecord({ phase: 'password', vault: { ...input, createdAt: now, expiresAt: now + 600000 } });
  const contextKey = `auth:recovery:${createHash('sha256').update(context).digest('hex')}`;
  const contextRaw = await command(['GET', contextKey]);
  assert(!contextRaw.includes(input.accessToken) && !contextRaw.includes(input.refreshToken));
  assert((await command(['PTTL', contextKey])) <= 600000);
  const claims = await Promise.all(Array.from({ length: 20 }, () => store.recoveryRecord(context, 'password', true)));
  assert.equal(claims.filter(Boolean).length, 1);
  assert.equal(await store.recoveryRecord(context, 'password'), null);
  const expiredContext = await store.createRecoveryRecord({ phase: 'password', vault: { ...input, createdAt: now, expiresAt: now + 600000 } });
  const savedNow = Date.now;
  try {
    Date.now = () => now + 600001;
    assert.equal(await store.recoveryRecord(expiredContext, 'password', true), null);
  } finally { Date.now = savedNow; }
  await store.revokeSessionVault(first);
  assert.equal(await store.readSessionVault(first), null);
  assert.equal(await store.readSessionVault(second).catch(() => null), null);

  if (port) {
    // Lua thật: reset fence giữ legacy compatibility và không resurrect qua refresh CAS.
    const userGenerationKey = `auth:user:${createHash('sha256').update(input.userId).digest('hex')}:generation`;
    const resetLockKey = userGenerationKey.replace(':generation', ':reset-lock');
    const old = await store.createSessionVault(input); ids.push(old);
    const oldRead = await store.readSessionVault(old);
    const oldLease = await store.acquireSessionLease(old);
    const owners = await Promise.all(Array.from({ length: 20 }, () => store.beginPasswordReset(input.userId)));
    assert.equal(owners.filter(Boolean).length, 1);
    assert.equal(await store.replaceSessionVault(old, oldRead, oldLease, input), false,
      'reset fence must reject refresh before any lazy deletion/read');
    assert.equal(await store.readSessionVault(old), null);
    assert.equal(await store.replaceSessionVault(old, oldRead, oldLease, input), false);
    await assert.rejects(store.createSessionVault(input), store.SessionStoreUnavailableError);
    await store.endPasswordReset(input.userId, randomBytes(32).toString('base64url'));
    assert.equal(await store.beginPasswordReset(input.userId), null);
    await store.endPasswordReset(input.userId, owners.find(Boolean));
    const fresh = await store.createSessionVault(input); ids.push(fresh);
    assert.equal((await store.readSessionVault(fresh)).vault.generation, owners.find(Boolean));
    assert.equal(await command(['PTTL', userGenerationKey]), -1);
    await command(['DEL', userGenerationKey, resetLockKey]);
    console.log('[P3B] Real Redis global generation/replay/creation gate/refresh CAS/concurrent reset PASS');
    const id = await store.createSessionVault(input); ids.push(id);
    const before = await store.readSessionVault(id);
    const leases = await Promise.all(Array.from({ length: 30 }, () => store.acquireSessionLease(id)));
    assert.equal(leases.filter(Boolean).length, 1);
    const owner = leases.find(Boolean);
    assert.equal(await store.replaceSessionVault(id, before, randomBytes(32).toString('base64url'), input), false);
    const results = await Promise.all(Array.from({ length: 20 }, () => store.replaceSessionVault(id, before, owner, {
      ...input, accessToken: 'rotated-synthetic-access', refreshToken: 'rotated-synthetic-refresh',
    })));
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await store.readSessionVault(id)).vault.expiresAt, before.vault.expiresAt);
    await store.releaseSessionLease(id, randomBytes(32).toString('base64url'));
    assert.equal(await store.acquireSessionLease(id), null);
    await store.releaseSessionLease(id, owner);
    const nextOwner = await store.acquireSessionLease(id);
    const nextRead = await store.readSessionVault(id);
    await store.revokeSessionVault(id);
    assert.equal(await store.replaceSessionVault(id, nextRead, nextOwner, input), false);
    assert.equal(await store.readSessionVault(id), null);
    await store.releaseSessionLease(id, nextOwner);
    const expiring = await store.createSessionVault(input); ids.push(expiring);
    await command(['PEXPIRE', keyFor(expiring), 1]);
    await new Promise(resolveResult => setTimeout(resolveResult, 10));
    assert.equal(await store.readSessionVault(expiring), null);
    console.log('[P2C] Real Redis lease/CAS race/expiry/logout-resurrection tests PASS');
  } else console.log('[P2C] Real Redis race/expiry tests DEFERRED to mandatory clean CI');

  const previousKey = process.env.AUTH_SESSION_ENCRYPTION_KEY;
  process.env.AUTH_SESSION_ENCRYPTION_KEY = 'invalid';
  await assert.rejects(store.createSessionVault(input), store.SessionStoreUnavailableError);
  process.env.AUTH_SESSION_ENCRYPTION_KEY = previousKey;
  globalThis.fetch = async () => { throw new Error('synthetic provider failure containing secret'); };
  await assert.rejects(store.createSessionVault(input), error => error instanceof store.SessionStoreUnavailableError &&
    !error.message.includes('secret'));
  console.log('[P2C] Encryption/key binding/one-time flow/basic lifecycle/outage tests PASS');
} finally {
  for (const id of ids) await command(['DEL', keyFor(id)]).catch(() => {});
  globalThis.fetch = oldFetch;
  process.env = oldEnv;
  assert(resolve(modulePath).startsWith(resolve(temp) + '/') || resolve(modulePath).startsWith(resolve(temp) + '\\'));
  unlinkSync(modulePath); rmdirSync(temp);
}
