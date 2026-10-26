import type { AppAuthEvent, AppSession, AppUser } from '@/lib/app-session-types';
import { appConfig } from '@/config/appConfig';
import { TokenStore } from '@/lib/auth/TokenStore';
import { Pkce } from '@/lib/auth/Pkce';
import { UserRole } from '@/types/enums/UserRole';
import {
  readLastProfileCache,
  writeDashboardProfileCache,
  writeDashboardGamificationCache,
} from '@/lib/dashboard-snapshot-cache';

export type { AppSession, AppUser } from '@/lib/app-session-types';

type Listener = (event: AppAuthEvent, session: AppSession | null) => void | Promise<void>;
const listeners = new Set<Listener>();
let inFlight: Promise<{ data: { session: AppSession | null }; error: Error | null }> | null = null;
let current: AppSession | null = null;
let lastSessionFetchAt = 0;
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache window to prevent /auth/profile spam
let channel: BroadcastChannel | null = null;
let generation = 0;
let initialized = false;

const API_BASE = appConfig.apiBaseUrl;

/** Remove SDK credentials, preserving offline study/preferences. */
export function clearLegacyAuthStorage(): void {
  if (typeof window === 'undefined') return;
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) {
        if (key && /^sb-[a-z0-9-]+-auth-token.*$/i.test(key)) storage.removeItem(key);
      }
    } catch {
      /* Storage is never an authentication fallback. */
    }
  }
  TokenStore.captureFromUrlHash();
}

function clearAccountCache() {
  if (typeof window === 'undefined') return;
  TokenStore.clear();
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) {
        if (
          key &&
          /^(lp:(profile|gamification|teacher|word-summary|dashboard-words):|lp:last_user_id$|lp_ref_checked$|lp:upsell:paid_)/.test(
            key,
          )
        ) {
          storage.removeItem(key);
        }
      }
    } catch {
      /* Offline preferences are independent of authentication. */
    }
  }
}

export function authStateVersion(): number {
  return generation;
}

function invalidate() {
  generation++;
  inFlight = null;
  lastSessionFetchAt = 0;
}

function notify(event: AppAuthEvent, session: AppSession | null, broadcast = false) {
  if (current && current.user.id !== session?.user.id) invalidate();
  if (current?.user.id !== session?.user.id || event === 'SIGNED_OUT') {
    if (event === 'SIGNED_OUT') clearAccountCache();
  }
  current = session;
  for (const listener of listeners) {
    void Promise.resolve()
      .then(() => listener(event, session))
      .catch(() => {});
  }
  if (broadcast) channel?.postMessage({ type: 'invalidate' });
}

function hydrateSessionFromLocalCacheIfAvailable(): void {
  if (current || typeof window === 'undefined') return;
  const accessToken = TokenStore.getAccessToken();
  if (!accessToken) return;
  const cachedProfile = readLastProfileCache();
  if (!cachedProfile?.id) return;
  current = {
    user: {
      id: cachedProfile.id,
      email: cachedProfile.email || '',
      user_metadata: {
        full_name: cachedProfile.full_name || 'Học viên',
        avatar_url: cachedProfile.avatar_url ?? undefined,
        role: cachedProfile.role || 'student',
        plan: cachedProfile.plan || 'free',
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  lastSessionFetchAt = Date.now();
}

function initialize() {
  if (typeof window === 'undefined') return;
  clearLegacyAuthStorage();
  hydrateSessionFromLocalCacheIfAvailable();
  if (initialized) return;
  initialized = true;
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('lingopro-app-auth');
    channel.onmessage = () => {
      invalidate();
      void appAuth.getSession();
    };
  }
  window.addEventListener('focus', () => {
    if (Date.now() - lastSessionFetchAt >= SESSION_CACHE_TTL_MS) {
      void appAuth.getSession();
    }
  });
}

export interface DotNetAuthTokensDto {
  userId?: string;
  id?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  role?: string | number;
  plan?: string | number;
  planExpiresAt?: string | null;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  totalXp?: number;
  currentStreak?: number;
  longestStreak?: number;
  dailyTargetMins?: number;
}

export function buildSessionFromDto(dto: DotNetAuthTokensDto): AppSession | null {
  const uid = dto.userId || dto.id;
  if (!uid) return null;
  const roleStr = String(dto.role ?? 'student').toLowerCase() === 'teacher' ? 'teacher' : 'student';
  const planRaw = String(dto.plan ?? 'free').toLowerCase();
  const planStr = planRaw === 'premium' ? 'premium' : planRaw === 'pro' ? 'pro' : 'free';

  const session: AppSession = {
    user: {
      id: String(uid),
      email: dto.email || '',
      user_metadata: {
        full_name: dto.fullName || dto.email?.split('@')[0] || 'Học viên',
        avatar_url: dto.avatarUrl ?? undefined,
        role: roleStr,
        plan: planStr,
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + (dto.expiresIn || 3600),
  };

  try {
    writeDashboardProfileCache(String(uid), {
      id: String(uid),
      email: dto.email || '',
      full_name: dto.fullName || dto.email?.split('@')[0] || 'Học viên',
      avatar_url: dto.avatarUrl ?? undefined,
      role: roleStr,
      plan: planStr,
      plan_expires_at: dto.planExpiresAt ?? null,
      daily_goal: dto.dailyTargetMins || 10,
      created_at: new Date().toISOString(),
    });
    if (typeof dto.totalXp === 'number' || typeof dto.currentStreak === 'number') {
      writeDashboardGamificationCache(String(uid), {
        user_id: String(uid),
        total_xp: dto.totalXp ?? 0,
        current_streak: dto.currentStreak ?? 0,
        longest_streak: dto.longestStreak ?? 0,
        last_active_date: null,
        daily_goal: dto.dailyTargetMins || 10,
        today_xp: 0,
        today_date: null,
      });
    }
  } catch {
    /* ignore cache errors */
  }

  return session;
}

export function hydrateSessionFromAuthTokens(dto: DotNetAuthTokensDto): AppSession | null {
  if (dto.accessToken) {
    TokenStore.save(dto.accessToken, dto.refreshToken || null, dto.expiresIn || 3600);
  }
  const session = buildSessionFromDto(dto);
  if (session) {
    invalidate();
    lastSessionFetchAt = Date.now();
    notify('SIGNED_IN', session, true);
  }
  return session;
}

async function fetchProfileSession(): Promise<{ responseOk: boolean; status: number; session: AppSession | null }> {
  const headers: Record<string, string> = {
    'X-LingoPro-Request': '1',
    Accept: 'application/json',
  };
  const accessToken = TokenStore.getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
  });

  if (res.status === 401) {
    const refreshToken = TokenStore.getRefreshToken();
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-LingoPro-Request': '1',
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    }).catch(() => null);

    if (refreshRes && refreshRes.ok) {
      const refreshJson = (await refreshRes.json().catch(() => null)) as {
        data?: DotNetAuthTokensDto;
      } | null;
      if (refreshJson?.data?.accessToken) {
        TokenStore.save(
          refreshJson.data.accessToken,
          refreshJson.data.refreshToken || null,
          refreshJson.data.expiresIn || 3600,
        );
        headers['Authorization'] = `Bearer ${refreshJson.data.accessToken}`;
        res = await fetch(`${API_BASE}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers,
        });
      }
    }
  }

  if (!res.ok) {
    return { responseOk: false, status: res.status, session: null };
  }

  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: DotNetAuthTokensDto;
    session?: AppSession | null;
  } | null;

  if (body?.session) {
    return { responseOk: true, status: res.status, session: body.session };
  }
  if (body?.data) {
    return { responseOk: true, status: res.status, session: buildSessionFromDto(body.data) };
  }
  return { responseOk: false, status: res.status, session: null };
}

export const appAuth = {
  async getSession(options?: { force?: boolean }): Promise<{ data: { session: AppSession | null }; error: Error | null }> {
    initialize();

    const now = Date.now();
    if (
      !options?.force &&
      current !== null &&
      now - lastSessionFetchAt < SESSION_CACHE_TTL_MS &&
      (!current.expires_at || current.expires_at * 1000 > now)
    ) {
      return { data: { session: current }, error: null };
    }

    if (!inFlight) {
      const requestedGeneration = generation;
      inFlight = (async () => {
        try {
          const { responseOk, status, session } = await fetchProfileSession();
          if (requestedGeneration !== generation) return { data: { session: current }, error: null };
          if (!responseOk && status !== 401 && status !== 403) {
            return {
              data: { session: current },
              error: new Error('Authentication temporarily unavailable'),
            };
          }
          lastSessionFetchAt = Date.now();
          if (current?.user.id !== session?.user.id) {
            notify(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
          } else {
            current = session;
          }
          return { data: { session }, error: null };
        } catch {
          if (requestedGeneration !== generation) return { data: { session: current }, error: null };
          // Offline-First Rule: Do NOT notify SIGNED_OUT during temporary network failures
          return {
            data: { session: current },
            error: new Error('Authentication temporarily unavailable'),
          };
        } finally {
          if (requestedGeneration === generation) inFlight = null;
        }
      })();
    }
    return inFlight;
  },
  async getUser() {
    const result = await appAuth.getSession();
    return { data: { user: result.data.session?.user ?? null }, error: result.error };
  },
  onAuthStateChange(listener: Listener) {
    initialize();
    listeners.add(listener);
    if (current !== null && Date.now() - lastSessionFetchAt < SESSION_CACHE_TTL_MS) {
      void Promise.resolve().then(() => {
        if (listeners.has(listener)) void listener('INITIAL_SESSION', current);
      });
    } else {
      void appAuth.getSession().then(({ data, error }) => {
        if (listeners.has(listener) && !error) void listener('INITIAL_SESSION', data.session);
      });
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(listener);
          },
        },
      },
    };
  },
  async signInWithPassword(credentials: { email: string; password: string }) {
    initialize();
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-LingoPro-Request': '1',
        },
        body: JSON.stringify(credentials),
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: DotNetAuthTokensDto;
        session?: AppSession;
        error?: string;
      } | null;

      if (!response.ok || (!payload?.data && !payload?.session)) {
        return {
          data: { session: null, user: null },
          error: new Error(payload?.message || payload?.error || 'Sai email hoặc mật khẩu.'),
        };
      }

      const session = payload.session
        ? payload.session
        : hydrateSessionFromAuthTokens(payload.data!);

      if (!session) {
        return {
          data: { session: null, user: null },
          error: new Error('Không xác thực được phiên đăng nhập.'),
        };
      }
      lastSessionFetchAt = Date.now();
      return { data: { session, user: session.user }, error: null };
    } catch {
      return {
        data: { session: null, user: null },
        error: new Error('Authentication temporarily unavailable'),
      };
    }
  },
  async signInWithOAuth(options: {
    provider: string;
    options?: {
      redirectTo?: string;
      skipBrowserRedirect?: boolean;
      queryParams?: Record<string, string>;
    };
  }) {
    initialize();
    try {
      if (options.provider !== 'google') {
        throw new Error('Invalid OAuth configuration');
      }
      const { verifier, challenge } = await Pkce.create();
      const roleStr = sessionStorage.getItem('lingopro_oauth_role') || 'student';
      Pkce.begin(
        verifier,
        roleStr.toLowerCase() === 'teacher' ? UserRole.Teacher : UserRole.Student,
        '/student',
      );
      sessionStorage.setItem('lp:oauth:pkce_verifier', verifier);

      const redirectUri = `${window.location.origin}/auth/callback`;
      const qs = new URLSearchParams({
        redirectUri,
        codeChallenge: challenge,
      });
      const response = await fetch(`${API_BASE}/auth/google-url?${qs.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-LingoPro-Request': '1' },
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { authorizationUrl?: string };
        url?: string;
      } | null;
      const authUrl = payload?.data?.authorizationUrl || payload?.url;
      if (!authUrl) throw new Error('OAuth unavailable');
      if (!options.options?.skipBrowserRedirect) window.location.assign(authUrl);
      return { data: { url: authUrl }, error: null };
    } catch {
      return { data: { url: null }, error: new Error('Không mở được Google đăng nhập.') };
    }
  },
  async signOut() {
    initialize();
    try {
      const headers: Record<string, string> = { 'X-LingoPro-Request': '1' };
      const token = TokenStore.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      }).catch(() => null);
      clearLegacyAuthStorage();
      invalidate();
      notify('SIGNED_OUT', null, true);
      return { error: null };
    } catch {
      return { error: new Error('Không đăng xuất được. Thử lại khi kết nối ổn định.') };
    }
  },
  passwordRecoveryCompleted() {
    initialize();
    clearLegacyAuthStorage();
    invalidate();
    notify('SIGNED_OUT', null, true);
  },
  async updateUser(attributes: { data: Record<string, unknown> }) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-LingoPro-Request': '1',
      };
      const token = TokenStore.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${API_BASE}/auth/onboarding`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          learningGoal: attributes.data?.learning_goal || 'General',
          dailyTargetMins: Number(attributes.data?.daily_goal || 10),
          targetCertLevel: attributes.data?.target_level || 'B1',
        }),
      }).catch(() => null);

      const updatedUser: AppUser = current
        ? {
            ...current.user,
            user_metadata: {
              ...current.user.user_metadata,
              ...attributes.data,
            },
          }
        : {
            id: '',
            user_metadata: attributes.data,
          };
      if (current) {
        lastSessionFetchAt = Date.now();
        notify('USER_UPDATED', { ...current, user: updatedUser }, true);
      }
      return { data: { user: updatedUser }, error: null };
    } catch {
      return { data: { user: null }, error: new Error('Không cập nhật được thông tin.') };
    }
  },
};
initialize();
