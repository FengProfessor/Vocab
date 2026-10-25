import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/** This module must never enter a browser import graph. */
function assertServer() {
  if (typeof window !== 'undefined') throw new SessionStoreUnavailableError();
}

export class SessionStoreUnavailableError extends Error {
  constructor() {
    super('Authentication temporarily unavailable');
    this.name = 'SessionStoreUnavailableError';
  }
}

export const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const FLOW_LIFETIME_MS = 10 * 60 * 1000;
export const SESSION_LEASE_MS = 20_000;
const ID_RE = /^[A-Za-z0-9_-]{43}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server-only vault. User/profile data is obtained from authoritative Auth separately. */
export interface SessionVault {
  /** Missing only on pre-recovery legacy vaults. Never supplied by a browser. */
  generation?: string;
  userId: string;
  providerSessionId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  createdAt: number;
  expiresAt: number;
}

export interface AuthFlow {
  verifier: string;
  next: string;
  kind: 'oauth' | 'signup';
  createdAt: number;
}

function config() {
  assertServer();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = process.env.AUTH_SESSION_ENCRYPTION_KEY;
  if (!url || !/^https:\/\/[A-Za-z0-9-]+\.upstash\.io\/?$/.test(url) || !token ||
      !key || !/^[0-9a-f]{64}$/i.test(key)) throw new SessionStoreUnavailableError();
  return { url: url.replace(/\/$/, ''), token, key: Buffer.from(key, 'hex') };
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const { url, token } = config();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (!response.ok) throw new SessionStoreUnavailableError();
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || 'error' in body || !('result' in body)) {
      throw new SessionStoreUnavailableError();
    }
    return body.result;
  } catch {
    // Không log provider error: có thể chứa credential, endpoint hoặc vault.
    throw new SessionStoreUnavailableError();
  }
}

function storeKey(kind: 'session' | 'flow' | 'recovery-flow' | 'recovery', id: string): string | null {
  return ID_RE.test(id) ? `auth:${kind}:${createHash('sha256').update(id).digest('hex')}` : null;
}

function encrypt(value: SessionVault | AuthFlow | RecoveryRecord, keyName: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', config().key, iv);
  // Bind ciphertext với namespace và ID hash; không chuyển vault giữa hai key được.
  cipher.setAAD(Buffer.from(keyName));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

function decrypt(value: unknown, keyName: string): unknown {
  if (typeof value !== 'string' || value.length < 40 || value.length > 32_000 ||
      !/^[A-Za-z0-9_-]+$/.test(value)) throw new SessionStoreUnavailableError();
  try {
    const data = Buffer.from(value, 'base64url');
    const cipher = createDecipheriv('aes-256-gcm', config().key, data.subarray(0, 12));
    cipher.setAAD(Buffer.from(keyName));
    cipher.setAuthTag(data.subarray(12, 28));
    return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8'));
  } catch {
    throw new SessionStoreUnavailableError();
  }
}

function isVault(value: unknown): value is SessionVault {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SessionVault>;
  return typeof item.userId === 'string' && UUID_RE.test(item.userId) &&
    (item.generation === undefined || ID_RE.test(item.generation)) &&
    typeof item.providerSessionId === 'string' && UUID_RE.test(item.providerSessionId) &&
    typeof item.accessToken === 'string' && item.accessToken.length > 0 && item.accessToken.length <= 16_000 &&
    typeof item.refreshToken === 'string' && item.refreshToken.length > 0 && item.refreshToken.length <= 4000 &&
    Number.isSafeInteger(item.tokenExpiresAt) && Number.isSafeInteger(item.createdAt) &&
    Number.isSafeInteger(item.expiresAt) && item.expiresAt! > item.createdAt! &&
    item.expiresAt! - item.createdAt! <= SESSION_LIFETIME_MS;
}

export async function createSessionVault(
  input: Omit<SessionVault, 'createdAt' | 'expiresAt'>,
): Promise<string> {
  const now = Date.now();
  const generation = await userGeneration(input.userId);
  await assertResetNotPending(input.userId);
  const vault = { ...input, generation: generation ?? undefined, createdAt: now, expiresAt: now + SESSION_LIFETIME_MS };
  if (!isVault(vault)) throw new SessionStoreUnavailableError();
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomBytes(32).toString('base64url');
    const key = storeKey('session', id)!;
    const result = await redis(['SET', key, encrypt(vault, key), 'NX', 'PX', SESSION_LIFETIME_MS]);
    if (result === 'OK') {
      // Fence thay trong lúc tạo vault: xóa session vừa tạo, không trả cookie cũ.
      if (await userGeneration(input.userId) !== generation) {
        await revokeSessionVault(id);
        throw new SessionStoreUnavailableError();
      }
      await assertResetNotPending(input.userId);
      return id;
    }
    if (result !== null) throw new SessionStoreUnavailableError();
  }
  throw new SessionStoreUnavailableError();
}

export interface StoredSession {
  vault: SessionVault;
  /** Compare-and-set value, never returned to a browser. */
  revision: string;
}

export async function readSessionVault(id: string): Promise<StoredSession | null> {
  assertServer();
  const key = storeKey('session', id);
  if (!key) return null;
  const raw = await redis(['GET', key]);
  if (raw === null) return null;
  const vault = decrypt(raw, key);
  if (!isVault(vault)) throw new SessionStoreUnavailableError();
  if (vault.expiresAt <= Date.now()) {
    await revokeSessionVault(id);
    return null;
  }
  if ((vault.generation ?? null) !== await userGeneration(vault.userId)) {
    await revokeSessionVault(id);
    return null;
  }
  return { vault, revision: raw as string };
}

export async function revokeSessionVault(id: string): Promise<void> {
  assertServer();
  const key = storeKey('session', id);
  if (!key) return;
  const result = await redis(['DEL', key]);
  if (result !== 0 && result !== 1) throw new SessionStoreUnavailableError();
}

export async function acquireSessionLease(id: string): Promise<string | null> {
  const key = storeKey('session', id);
  if (!key) return null;
  const owner = randomBytes(32).toString('base64url');
  const result = await redis(['SET', `${key}:lease`, owner, 'NX', 'PX', SESSION_LEASE_MS]);
  if (result === null) return null;
  if (result !== 'OK') throw new SessionStoreUnavailableError();
  return owner;
}

export const RELEASE_SESSION_LEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

export async function releaseSessionLease(id: string, owner: string): Promise<void> {
  const key = storeKey('session', id);
  if (!key || !ID_RE.test(owner)) return;
  const result = await redis(['EVAL', RELEASE_SESSION_LEASE, 1, `${key}:lease`, owner]);
  if (result !== 0 && result !== 1) throw new SessionStoreUnavailableError();
}

export const REPLACE_SESSION_VAULT = `
if redis.call('GET', KEYS[2]) ~= ARGV[4] then return 0 end
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if (redis.call('GET', KEYS[3]) or '') ~= ARGV[5] then return 0 end
local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then return 0 end
local remaining = math.min(ttl, tonumber(ARGV[3]))
if remaining <= 0 then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'PX', remaining)
return 1
`;

/** Refresh CAS cannot resurrect a logged-out session or extend its absolute lifetime. */
export async function replaceSessionVault(
  id: string, old: StoredSession, owner: string,
  tokens: Pick<SessionVault, 'accessToken' | 'refreshToken' | 'tokenExpiresAt'>,
): Promise<boolean> {
  const key = storeKey('session', id);
  if (!key || !ID_RE.test(owner)) return false;
  const vault = { ...old.vault, ...tokens };
  const ttl = vault.expiresAt - Date.now();
  if (ttl <= 0) return false;
  if (!isVault(vault)) throw new SessionStoreUnavailableError();
  const result = await redis(['EVAL', REPLACE_SESSION_VAULT, 3, key, `${key}:lease`,
    userKey(vault.userId, 'generation'), old.revision, encrypt(vault, key), ttl, owner, vault.generation ?? '']);
  if (result !== 0 && result !== 1) throw new SessionStoreUnavailableError();
  return result === 1;
}

export async function createAuthFlow(flow: Omit<AuthFlow, 'createdAt'>): Promise<string> {
  if (!flow.verifier || flow.verifier.length > 1000 || flow.next.length > 2000 ||
      !['oauth', 'signup'].includes(flow.kind)) throw new SessionStoreUnavailableError();
  const id = randomBytes(32).toString('base64url');
  const key = storeKey('flow', id)!;
  const result = await redis(['SET', key, encrypt({ ...flow, createdAt: Date.now() }, key),
    'NX', 'PX', FLOW_LIFETIME_MS]);
  if (result !== 'OK') throw new SessionStoreUnavailableError();
  return id;
}

/** One-time consumption; verifier never leaves the server. */
export async function consumeAuthFlow(id: string): Promise<AuthFlow | null> {
  const key = storeKey('flow', id);
  if (!key) return null;
  const raw = await redis(['GETDEL', key]);
  if (raw === null) return null;
  const value = decrypt(raw, key);
  if (!value || typeof value !== 'object') throw new SessionStoreUnavailableError();
  const flow = value as Partial<AuthFlow>;
  if (typeof flow.verifier !== 'string' || !flow.verifier || flow.verifier.length > 1000 ||
      typeof flow.next !== 'string' || flow.next.length > 2000 ||
      !['oauth', 'signup'].includes(flow.kind ?? '') || !Number.isSafeInteger(flow.createdAt)) {
    throw new SessionStoreUnavailableError();
  }
  if (flow.createdAt! > Date.now() || flow.createdAt! + FLOW_LIFETIME_MS <= Date.now()) return null;
  return flow as AuthFlow;
}

function userKey(userId: string, suffix: 'generation' | 'reset-lock'): string {
  if (!UUID_RE.test(userId)) throw new SessionStoreUnavailableError();
  return `auth:user:${createHash('sha256').update(userId).digest('hex')}:${suffix}`;
}

async function userGeneration(userId: string): Promise<string | null> {
  const value = await redis(['GET', userKey(userId, 'generation')]);
  if (value !== null && (typeof value !== 'string' || !ID_RE.test(value))) throw new SessionStoreUnavailableError();
  return value as string | null;
}

async function assertResetNotPending(userId: string): Promise<void> {
  if (await redis(['GET', userKey(userId, 'reset-lock')]) !== null) throw new SessionStoreUnavailableError();
}

export const BEGIN_PASSWORD_RESET = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
redis.call('SET', KEYS[2], ARGV[1], 'PX', 60000)
redis.call('SET', KEYS[1], ARGV[1])
return 1
`;

/** Persistent generation tombstone invalidates legacy/current vaults before provider mutation. */
export async function beginPasswordReset(userId: string): Promise<string | null> {
  const owner = randomBytes(32).toString('base64url');
  const result = await redis(['EVAL', BEGIN_PASSWORD_RESET, 2,
    userKey(userId, 'generation'), userKey(userId, 'reset-lock'), owner]);
  if (result !== 0 && result !== 1) throw new SessionStoreUnavailableError();
  return result === 1 ? owner : null;
}

export async function endPasswordReset(userId: string, owner: string): Promise<void> {
  if (!ID_RE.test(owner)) throw new SessionStoreUnavailableError();
  const result = await redis(['EVAL', RELEASE_SESSION_LEASE, 1, userKey(userId, 'reset-lock'), owner]);
  if (result !== 0 && result !== 1) throw new SessionStoreUnavailableError();
}

export interface RecoveryRecord {
  purpose: 'password-recovery';
  phase: 'pkce' | 'password';
  verifier?: string;
  vault?: SessionVault;
  createdAt: number;
  expiresAt: number;
}

function isRecovery(value: unknown, phase: RecoveryRecord['phase']): value is RecoveryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<RecoveryRecord>;
  return record.purpose === 'password-recovery' && record.phase === phase &&
    Number.isSafeInteger(record.createdAt) && Number.isSafeInteger(record.expiresAt) &&
    record.createdAt! <= Date.now() && record.expiresAt! > Date.now() &&
    record.expiresAt! > record.createdAt! && record.expiresAt! - record.createdAt! <= FLOW_LIFETIME_MS &&
    (phase === 'pkce' ? typeof record.verifier === 'string' && record.verifier.length <= 1000 &&
      /^"[A-Za-z0-9._~-]+\/recovery"$/.test(record.verifier) : isVault(record.vault) &&
      record.vault.expiresAt > Date.now() && record.vault.tokenExpiresAt > Date.now());
}

export async function createRecoveryRecord(input: Pick<RecoveryRecord, 'phase' | 'verifier' | 'vault'>): Promise<string> {
  const now = Date.now();
  const record: RecoveryRecord = { ...input, purpose: 'password-recovery',
    createdAt: now, expiresAt: input.phase === 'password' && input.vault ?
      Math.min(now + FLOW_LIFETIME_MS, input.vault.expiresAt, input.vault.tokenExpiresAt) : now + FLOW_LIFETIME_MS };
  if (!isRecovery(record, input.phase)) throw new SessionStoreUnavailableError();
  const id = randomBytes(32).toString('base64url');
  const key = storeKey(input.phase === 'pkce' ? 'recovery-flow' : 'recovery', id)!;
  if (await redis(['SET', key, encrypt(record, key), 'NX', 'PX', FLOW_LIFETIME_MS]) !== 'OK') {
    throw new SessionStoreUnavailableError();
  }
  return id;
}

export async function recoveryRecord(id: string, phase: RecoveryRecord['phase'], consume = false): Promise<RecoveryRecord | null> {
  const key = storeKey(phase === 'pkce' ? 'recovery-flow' : 'recovery', id);
  if (!key) return null;
  const raw = await redis([consume ? 'GETDEL' : 'GET', key]);
  if (raw === null) return null;
  const record = decrypt(raw, key);
  return isRecovery(record, phase) ? record : null;
}
