import type { AppAuthEvent, AppSession, AppUser } from '@/lib/app-session-types';
export type { AppSession, AppUser } from '@/lib/app-session-types';
type Listener = (event: AppAuthEvent, session: AppSession | null) => void | Promise<void>;
const listeners = new Set<Listener>();
let inFlight: Promise<{ data: { session: AppSession | null }; error: Error | null }> | null = null;
let current: AppSession | null = null;
let channel: BroadcastChannel | null = null;
let generation = 0;
let initialized = false;

/** Remove SDK credentials, preserving offline study/preferences. */
export function clearLegacyAuthStorage(): void {
  if (typeof window === 'undefined') return;
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) if (key && /^sb-[a-z0-9-]+-auth-token.*$/i.test(key)) storage.removeItem(key);
    } catch { /* Storage is never an authentication fallback. */ }
  }
  if (/(?:access_token|refresh_token|provider_token)=/.test(window.location.hash)) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function clearAccountCache() {
  if (typeof window === 'undefined') return;
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) if (key && /^(lp:(profile|gamification|teacher|word-summary):|lp:last_user_id$|lp_ref_checked$|lp:upsell:paid_)/.test(key)) storage.removeItem(key);
    } catch { /* Offline preferences are independent of authentication. */ }
  }
}

export function authStateVersion(): number { return generation; }

function invalidate() { generation++; inFlight = null; }

function notify(event: AppAuthEvent, session: AppSession | null, broadcast = false) {
  if (current?.user.id !== session?.user.id || event === 'SIGNED_OUT') clearAccountCache();
  current = session;
  for (const listener of listeners) void Promise.resolve().then(() => listener(event, session)).catch(() => {});
  if (broadcast) channel?.postMessage({ type: 'invalidate' });
}
function initialize() {
  if (typeof window === 'undefined') return;
  clearLegacyAuthStorage();
  if (initialized) return;
  initialized = true;
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('lingopro-app-auth');
    channel.onmessage = () => { invalidate(); clearAccountCache(); void appAuth.getSession(); };
  }
  window.addEventListener('focus', () => { invalidate(); void appAuth.getSession(); });
}
type Payload = { session?: AppSession | null; user?: AppUser; url?: string; error?: string };
async function call(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store',
    headers: { 'X-LingoPro-Request': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const payload = await response.json() as Payload;
  if (!response.ok && response.status !== 401) throw new Error('Authentication temporarily unavailable');
  return { response, payload };
}

export const appAuth = {
  async getSession(): Promise<{ data: { session: AppSession | null }; error: Error | null }> {
    initialize();
    if (!inFlight) {
      const requestedGeneration = generation;
      inFlight = (async () => {
      try {
        const { response, payload } = await call('/api/auth/session');
        if (requestedGeneration !== generation) return { data: { session: current }, error: null };
        const session = response.ok ? payload.session ?? null : null;
        if (current?.user.id !== session?.user.id) notify(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        else current = session;
        return { data: { session }, error: null };
      } catch {
        if (requestedGeneration !== generation) return { data: { session: current }, error: null };
        // Do NOT notify SIGNED_OUT, preserve the cached session during temporary network failures
        return { data: { session: current }, error: new Error('Authentication temporarily unavailable') };
      } finally { if (requestedGeneration === generation) inFlight = null; }
    })();
    }
    return inFlight;
  },
  async getUser() {
    const result = await appAuth.getSession();
    return { data: { user: result.data.session?.user ?? null }, error: result.error };
  },
  onAuthStateChange(listener: Listener) {
    initialize(); listeners.add(listener);
    void appAuth.getSession().then(({ data }) => {
      if (listeners.has(listener)) void listener('INITIAL_SESSION', data.session);
    });
    return { data: { subscription: { unsubscribe: () => { listeners.delete(listener); } } } };
  },
  async signInWithPassword(credentials: { email: string; password: string }) {
    initialize();
    try {
      const { response, payload } = await call('/api/auth/login', 'POST', credentials);
      if (!response.ok || !payload.session) return {
        data: { session: null, user: null }, error: new Error(payload.error || 'Unauthorized'),
      };
      invalidate(); notify('SIGNED_IN', payload.session, true);
      return { data: { session: payload.session, user: payload.session.user }, error: null };
    } catch {
      return { data: { session: null, user: null }, error: new Error('Authentication temporarily unavailable') };
    }
  },
  async signInWithOAuth(options: { provider: string; options?: {
    redirectTo?: string; skipBrowserRedirect?: boolean; queryParams?: Record<string, string>;
  } }) {
    initialize();
    try {
      if (options.provider !== 'google' || (options.options?.redirectTo &&
          options.options.redirectTo !== `${window.location.origin}/auth/callback`)) throw new Error('Invalid OAuth configuration');
      const { payload } = await call('/api/auth/oauth', 'POST');
      if (!payload.url) throw new Error('OAuth unavailable');
      if (!options.options?.skipBrowserRedirect) window.location.assign(payload.url);
      return { data: { url: payload.url }, error: null };
    } catch {
      return { data: { url: null }, error: new Error('Không mở được Google đăng nhập.') };
    }
  },
  async signOut() {
    initialize();
    try {
      const { response } = await call('/api/auth/logout', 'POST');
      if (!response.ok) throw new Error('Logout unavailable');
      clearLegacyAuthStorage(); invalidate(); notify('SIGNED_OUT', null, true);
      return { error: null };
    } catch { return { error: new Error('Không đăng xuất được. Thử lại khi kết nối ổn định.') }; }
  },
  /** Reset endpoint already revoked sessions/cleared cookies; discard pending reads and cached identity. */
  passwordRecoveryCompleted() {
    initialize(); clearLegacyAuthStorage(); invalidate(); notify('SIGNED_OUT', null, true);
  },
  async updateUser(attributes: { data: Record<string, unknown> }) {
    try {
      const { response, payload } = await call('/api/auth/user', 'PATCH', attributes);
      if (!response.ok || !payload.user) throw new Error('Metadata update unavailable');
      notify('USER_UPDATED', current ? { ...current, user: payload.user } : null, true);
      return { data: { user: payload.user }, error: null };
    } catch { return { data: { user: null }, error: new Error('Không cập nhật được thông tin.') }; }
  },
};
initialize();
