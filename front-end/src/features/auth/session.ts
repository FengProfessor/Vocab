import type { AppAuthEvent, AppSession, AppUser } from '@/lib/app-session-types';
import { SESSION_EXPIRED_EVENT, refreshAccessToken } from '@/lib/apiClient';
import { Pkce } from '@/lib/auth/Pkce';
import { UserRole } from '@/types/enums/UserRole';
import {
  readLastProfileCache,
  writeDashboardProfileCache,
  writeDashboardGamificationCache,
  clearDashboardSnapshotCache,
} from '@/lib/dashboard-snapshot-cache';
import { AuthApi, type DotNetAuthTokensDto } from '@/features/auth/api';
import { describeError } from '@/features/auth/errors';
import { TokenStore } from '@/features/auth/tokenStore';

export type { AppAuthEvent, AppSession, AppUser } from '@/lib/app-session-types';
export type { DotNetAuthTokensDto } from '@/features/auth/api';

type Listener = (event: AppAuthEvent, session: AppSession | null) => void | Promise<void>;

const listeners = new Set<Listener>();
let inFlight: Promise<{ data: { session: AppSession | null }; error: Error | null }> | null = null;
let current: AppSession | null = null;
let lastSessionFetchAt = 0;
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;
let channel: BroadcastChannel | null = null;
let generation = 0;
let initialized = false;

/** Removes legacy SDK credentials while preserving offline study decks and user preferences. */
export function clearLegacyAuthStorage(): void {
  TokenStore.captureFromUrlHash();
}

function clearAccountCache(): void {
  if (typeof window === 'undefined') return;
  TokenStore.clear();
  clearDashboardSnapshotCache();
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) {
        if (
          key &&
          /^(lp:(profile|gamification|teacher|word-summary|dashboard-words):|lp:last_user_id$|lp_ref_checked$|lp:upsell:paid_|lingopro\.auth\.)/.test(
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

function invalidate(): void {
  generation++;
  inFlight = null;
  lastSessionFetchAt = 0;
}

function notify(event: AppAuthEvent, session: AppSession | null, broadcast = false): void {
  if (current && current.user.id !== session?.user.id) {
    invalidate();
  }
  if (current?.user.id !== session?.user.id || event === 'SIGNED_OUT') {
    if (event === 'SIGNED_OUT') {
      clearAccountCache();
    }
  }
  current = session;
  for (const listener of listeners) {
    void Promise.resolve()
      .then(() => listener(event, session))
      .catch(() => {});
  }
  if (broadcast) {
    channel?.postMessage({ type: 'invalidate' });
  }
}

function hydrateSessionFromLocalCacheIfAvailable(): void {
  if (current || typeof window === 'undefined') return;
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
  if (TokenStore.getAccessToken()) {
    lastSessionFetchAt = Date.now();
  }
}

function initialize(): void {
  if (typeof window === 'undefined') return;
  clearLegacyAuthStorage();
  hydrateSessionFromLocalCacheIfAvailable();
  if (initialized) return;
  initialized = true;
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('lingopro-app-auth');
    channel.onmessage = () => {
      invalidate();
      void authService.getSession({ force: true });
    };
  }
  window.addEventListener('focus', () => {
    if (Date.now() - lastSessionFetchAt >= SESSION_CACHE_TTL_MS) {
      void authService.getSession();
    }
  });
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    invalidate();
    notify('SIGNED_OUT', null, false);
  });
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
        total_xp: dto.totalXp ?? 0,
        current_streak: dto.currentStreak ?? 0,
        longest_streak: dto.longestStreak ?? 0,
        daily_target_mins: dto.dailyTargetMins ?? 10,
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
    TokenStore.save(dto.accessToken, null, dto.expiresIn || 3600);
  }
  const session = buildSessionFromDto(dto);
  if (session) {
    invalidate();
    lastSessionFetchAt = Date.now();
    notify('SIGNED_IN', session, true);
  }
  return session;
}

async function fetchProfileSession(): Promise<{
  responseOk: boolean;
  status: number;
  session: AppSession | null;
}> {
  try {
    const dto = await AuthApi.getProfile();
    const session = buildSessionFromDto(dto);
    return {
      responseOk: Boolean(session),
      status: session ? 200 : 401,
      session,
    };
  } catch (error: unknown) {
    const errObj = error as {
      response?: { status?: number };
      config?: { _retry?: boolean };
    };
    const status = errObj?.response?.status;

    if (status === 401 && !errObj?.config?._retry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const dto = await AuthApi.getProfile();
        const session = buildSessionFromDto(dto);
        return {
          responseOk: Boolean(session),
          status: session ? 200 : 401,
          session,
        };
      }
      return { responseOk: false, status: 401, session: null };
    }

    if (status === 401 || status === 403) {
      return { responseOk: false, status, session: null };
    }

    // Network failure or 5xx: surface as transient failure so Offline-First preserves cached session.
    return { responseOk: false, status: status ?? 0, session: null };
  }
}

export function fetchSessionOnce(): Promise<AppSession | null> {
  return authService
    .getSession()
    .then((res) => res.data.session)
    .catch(() => current);
}

/**
 * Resets internal module state between unit tests.
 */
export function resetAuthSessionForTests(): void {
  listeners.clear();
  inFlight = null;
  current = null;
  lastSessionFetchAt = 0;
  generation = 0;
  TokenStore.clear();
}

export const authService = {
  getSessionSync(): AppSession | null {
    initialize();
    return current;
  },

  async getSession(options?: {
    force?: boolean;
  }): Promise<{ data: { session: AppSession | null }; error: Error | null }> {
    initialize();

    const now = Date.now();
    if (
      !options?.force &&
      current !== null &&
      lastSessionFetchAt > 0 &&
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
          if (requestedGeneration !== generation) {
            return { data: { session: current }, error: null };
          }
          // Offline-First Rule (GEMINI.md §4): never clear cache or emit SIGNED_OUT on network failure or 5xx.
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
          if (requestedGeneration !== generation) {
            return { data: { session: current }, error: null };
          }
          return {
            data: { session: current },
            error: new Error('Authentication temporarily unavailable'),
          };
        } finally {
          if (requestedGeneration === generation) {
            inFlight = null;
          }
        }
      })();
    }
    return inFlight;
  },

  async getUser(): Promise<{ data: { user: AppUser | null }; error: Error | null }> {
    const result = await authService.getSession();
    return { data: { user: result.data.session?.user ?? null }, error: result.error };
  },

  onAuthStateChange(listener: Listener) {
    initialize();
    listeners.add(listener);
    if (current !== null && lastSessionFetchAt > 0 && Date.now() - lastSessionFetchAt < SESSION_CACHE_TTL_MS) {
      void Promise.resolve().then(() => {
        if (listeners.has(listener)) void listener('INITIAL_SESSION', current);
      });
    } else {
      void authService.getSession().then(({ data, error }) => {
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
      const tokens = await AuthApi.login(credentials.email, credentials.password);
      const session = hydrateSessionFromAuthTokens(tokens);
      if (!session) {
        return {
          data: { session: null, user: null },
          error: new Error('Không xác thực được phiên đăng nhập.'),
        };
      }
      lastSessionFetchAt = Date.now();
      return { data: { session, user: session.user }, error: null };
    } catch (error) {
      return {
        data: { session: null, user: null },
        error: new Error(describeError(error)),
      };
    }
  },

  async signUp(input: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole | 'student' | 'teacher';
  }) {
    initialize();
    try {
      const tokens = await AuthApi.register(
        input.email,
        input.password,
        input.fullName,
        input.role ?? 'student',
      );
      const session = tokens.accessToken ? hydrateSessionFromAuthTokens(tokens) : null;
      return {
        data: {
          session,
          user: session?.user ?? null,
          needsEmailConfirmation: !tokens.accessToken,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: { session: null, user: null, needsEmailConfirmation: false },
        error: new Error(describeError(error)),
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

      const redirectUri = options.options?.redirectTo || `${window.location.origin}/auth/callback`;
      const authUrl = await AuthApi.getGoogleAuthorizationUrl(redirectUri, challenge);
      if (!authUrl) throw new Error('OAuth unavailable');
      if (!options.options?.skipBrowserRedirect) {
        window.location.assign(authUrl);
      }
      return { data: { url: authUrl }, error: null };
    } catch {
      return { data: { url: null }, error: new Error('Không mở được Google đăng nhập.') };
    }
  },

  async signOut() {
    initialize();
    try {
      await AuthApi.logout().catch(() => undefined);
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
      const fullName =
        typeof attributes.data?.full_name === 'string'
          ? attributes.data.full_name
          : (current?.user.user_metadata?.full_name as string | undefined) || 'Học viên';
      const learningGoal =
        typeof attributes.data?.learning_goal === 'string'
          ? attributes.data.learning_goal
          : 'General';
      const dailyTargetMins = Number(attributes.data?.daily_goal || 10);

      await AuthApi.updateOnboarding({
        fullName,
        learningGoal,
        dailyTargetMins,
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

  async claimTeacherRole() {
    try {
      const dto = await AuthApi.claimTeacherRole();
      const session = buildSessionFromDto(dto);
      if (session) {
        lastSessionFetchAt = Date.now();
        notify('USER_UPDATED', session, true);
      }
      return { data: dto, error: null };
    } catch (error) {
      return { data: null, error: new Error(describeError(error)) };
    }
  },

  async claimOnboardingXp() {
    try {
      const awarded = await AuthApi.claimOnboardingXp();
      return { data: awarded, error: null };
    } catch (error) {
      return { data: false, error: new Error(describeError(error)) };
    }
  },
};

export const appAuth = authService;

initialize();
