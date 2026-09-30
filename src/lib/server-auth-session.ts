import { createClient, type Session, type User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';
import type { AppSession, AppUser } from '@/lib/app-session-types';
import {
  acquireSessionLease, createSessionVault, readSessionVault, releaseSessionLease,
  replaceSessionVault, revokeSessionVault, SessionStoreUnavailableError,
  SESSION_LIFETIME_MS, type SessionVault,
} from '@/lib/server-session-store';

export { SessionStoreUnavailableError };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_RE = /^[A-Za-z0-9_-]{43}$/;

export class SessionRequestError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 403 ? 'Forbidden' : 'Unauthorized');
    this.name = 'SessionRequestError';
  }
}

export function sessionCookieName() {
  return process.env.NODE_ENV === 'production' ? '__Host-lingopro-session' : 'lingopro-session-dev';
}
export function flowCookieName() {
  return process.env.NODE_ENV === 'production' ? '__Host-lingopro-auth-flow' : 'lingopro-auth-flow-dev';
}

/** Duplicate cookie names are ambiguous; never guess which identity was intended. */
export function requestCookie(req: Request, name: string): string | null {
  const values = (req.headers.get('cookie') ?? '').split(';')
    .map(value => value.trim()).filter(value => value.startsWith(`${name}=`));
  if (values.length !== 1) return null;
  const value = values[0].slice(name.length + 1);
  return KEY_RE.test(value) ? value : null;
}

export function cookieHeader(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAge))}` +
    (process.env.NODE_ENV === 'production' ? '; Secure' : '');
}

export function appOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://lingopro.online' : 'http://localhost:3000');
  try {
    const allowed = new URL(configured).origin;
    const production = process.env.NODE_ENV === 'production';
    const requestUrl = new URL(req.url);
    const host = req.headers.get('host');
    // Next standalone có thể dùng hostname nội bộ trong req.url. Chỉ nhận public
    // Host thuộc allowlist; không tin X-Forwarded-Host hoặc nới CSRF theo proxy.
    if (production && host !== null && !/^[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(host)) {
      throw new SessionRequestError(403);
    }
    const actual = production && host !== null ? new URL(`https://${host}`).origin : requestUrl.origin;
    const origins = production
      ? [allowed, 'https://lingopro.online', 'https://www.lingopro.online'] : [allowed];
    if (!origins.includes(actual) || (production && requestUrl.protocol !== 'https:')) {
      throw new SessionRequestError(403);
    }
    return actual;
  } catch {
    throw new SessionRequestError(403);
  }
}

/** CSRF applies to login and every cookie-auth request, including legacy mutating GETs. */
export function assertAppRequest(req: Request, requireOrigin = true): void {
  if (req.headers.has('authorization')) throw new SessionRequestError(403);
  const expected = appOrigin(req);
  const origin = req.headers.get('origin');
  if ((requireOrigin && origin !== expected) || (origin !== null && origin !== expected) ||
      req.headers.get('x-lingopro-request') !== '1') throw new SessionRequestError(403);
  const site = req.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin') throw new SessionRequestError(403);
}

/** Server public Auth client. Custom PKCE storage only holds a verifier in this request. */
export function serverAuthClient(verifier?: string) {
  if (typeof window !== 'undefined') throw new SessionStoreUnavailableError();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new SessionStoreUnavailableError();
  let storedVerifier = verifier ?? null;
  const storage = {
    getItem: (name: string) => name.endsWith('-code-verifier') ? storedVerifier : null,
    setItem: (name: string, value: string) => { if (name.endsWith('-code-verifier')) storedVerifier = value; },
    removeItem: (name: string) => { if (name.endsWith('-code-verifier')) storedVerifier = null; },
  };
  const client = createClient(url, key, {
    auth: {
      flowType: 'pkce', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
      storage, storageKey: 'lingopro-server-auth',
    },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000), cache: 'no-store' }) },
  });
  return { client, verifier: () => storedVerifier };
}

/** Read provider session_id only after Auth has verified the JWT/user. */
function providerSessionId(accessToken: string): string {
  try {
    const claims: unknown = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
    if (claims && typeof claims === 'object' && 'session_id' in claims &&
        typeof claims.session_id === 'string' && UUID_RE.test(claims.session_id)) return claims.session_id;
  } catch { /* Fail closed without logging JWT. */ }
  throw new SessionRequestError(401);
}

async function verifiedProviderUser(vault: Pick<SessionVault, 'accessToken' | 'userId' | 'providerSessionId'>): Promise<User> {
  const { data, error } = await serverAuthClient().client.auth.getUser(vault.accessToken);
  if (error) {
    if (error.status === 401 || error.status === 403 || error.status === 400) throw new SessionRequestError(401);
    throw new SessionStoreUnavailableError();
  }
  if (!data.user || data.user.id !== vault.userId || !data.user.email_confirmed_at ||
      providerSessionId(vault.accessToken) !== vault.providerSessionId) throw new SessionRequestError(401);
  const { data: active, error: stateError } = await createServiceClient().rpc('is_app_auth_session_active', {
    p_session_id: vault.providerSessionId, p_user_id: vault.userId,
  });
  if (stateError || typeof active !== 'boolean') throw new SessionStoreUnavailableError();
  if (!active) throw new SessionRequestError(401);
  return data.user;
}

const PUBLIC_METADATA = new Set(['full_name', 'name', 'avatar_url', 'picture', 'role',
  'lingopro_onboarding_completed', 'lingopro_onboarding_version', 'force_onboarding', 'referral_source']);
export function publicAppUser(user: User): AppUser {
  return { id: user.id, email: user.email, user_metadata: Object.fromEntries(
    Object.entries(user.user_metadata ?? {}).filter(([key, value]) => PUBLIC_METADATA.has(key) &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)),
  ) };
}

export interface VerifiedAppSession {
  id: string;
  vault: SessionVault;
  user: User;
  publicSession: AppSession;
}

export async function createVerifiedAppSession(req: Request, session: Session): Promise<{
  publicSession: AppSession; setCookie: string;
}> {
  if (!session.user?.email_confirmed_at || !session.expires_at) throw new SessionRequestError(401);
  const input = {
    userId: session.user.id, providerSessionId: providerSessionId(session.access_token),
    accessToken: session.access_token, refreshToken: session.refresh_token,
    tokenExpiresAt: session.expires_at * 1000,
  };
  const user = await verifiedProviderUser(input);
  // Old browser session không được giữ sau authentication boundary mới.
  const previous = requestCookie(req, sessionCookieName());
  if (previous) await revokeSessionVault(previous);
  const id = await createSessionVault(input);
  return {
    publicSession: { user: publicAppUser(user), expires_at: Math.floor((Date.now() + SESSION_LIFETIME_MS) / 1000) },
    setCookie: cookieHeader(sessionCookieName(), id, SESSION_LIFETIME_MS / 1000),
  };
}

export async function verifiedAppSession(req: Request): Promise<VerifiedAppSession | null> {
  assertAppRequest(req, !['GET', 'HEAD'].includes(req.method));
  const id = requestCookie(req, sessionCookieName());
  if (!id) return null;
  try {
    let stored = await readSessionVault(id);
    if (!stored) return null;
    if (stored.vault.tokenExpiresAt <= Date.now() + 60_000) {
      const owner = await acquireSessionLease(id);
      if (owner) {
        try {
          // Re-read after lock: another refresher may already have rotated credentials.
          stored = await readSessionVault(id);
          if (!stored) return null;
          if (stored.vault.tokenExpiresAt <= Date.now() + 60_000) {
            const { data, error } = await serverAuthClient().client.auth.refreshSession({
              refresh_token: stored.vault.refreshToken,
            });
            if (error || !data.session?.expires_at) {
              if (error && (error.status === 400 || error.status === 401 || error.status === 403)) {
                await revokeSessionVault(id); return null;
              }
              throw new SessionStoreUnavailableError();
            }
            const next = {
              ...stored.vault, accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token, tokenExpiresAt: data.session.expires_at * 1000,
            };
            await verifiedProviderUser(next);
            if (!await replaceSessionVault(id, stored, owner, next)) return null;
          }
        } finally {
          await releaseSessionLease(id, owner);
        }
      } else {
        // Bounded wait; never retry a mutation automatically or fall back to an old bearer.
        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const next = await readSessionVault(id);
          if (!next) return null;
          if (next.vault.tokenExpiresAt > Date.now() + 60_000) { stored = next; break; }
        }
        if (stored.vault.tokenExpiresAt <= Date.now() + 60_000) throw new SessionStoreUnavailableError();
      }
      stored = await readSessionVault(id);
      if (!stored) return null;
    }
    const user = await verifiedProviderUser(stored.vault);
    // Concurrent logout while provider requests were pending must also be denied.
    if (!await readSessionVault(id)) return null;
    return { id, vault: stored.vault, user,
      publicSession: { user: publicAppUser(user), expires_at: Math.floor(stored.vault.expiresAt / 1000) } };
  } catch (error) {
    if (error instanceof SessionRequestError && error.status === 401) {
      await revokeSessionVault(id);
      return null;
    }
    if (error instanceof SessionStoreUnavailableError || error instanceof SessionRequestError) throw error;
    throw new SessionStoreUnavailableError();
  }
}

/** Browser-only API identity; legacy bearer/extension credentials cannot mint a web session. */
export async function getWebUser(req: Request) {
  const hasCookie = (req.headers.get('cookie') ?? '').split(';')
    .some(value => value.trim().startsWith(`${sessionCookieName()}=`));
  if (!hasCookie) return { data: { user: null }, error: null };
  const session = await verifiedAppSession(req);
  return { data: { user: session?.user ?? null }, error: null };
}

export async function logoutAppSession(req: Request): Promise<string> {
  assertAppRequest(req);
  const id = requestCookie(req, sessionCookieName());
  if (id) {
    const session = await readSessionVault(id);
    await revokeSessionVault(id);
    if (session) {
      const { error } = await createServiceClient().auth.admin.signOut(session.vault.accessToken, 'local');
      if (error && error.status !== 401 && error.status !== 403) throw new SessionStoreUnavailableError();
    }
  }
  return cookieHeader(sessionCookieName(), '', 0);
}
