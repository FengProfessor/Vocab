import { create } from 'zustand';
import { apiClient, SESSION_EXPIRED_EVENT } from '@/lib/apiClient';
import { AccountCache } from '@/lib/auth/AccountCache';
import { AuthProfileCache } from '@/lib/auth/AuthProfileCache';
import { AuthSessionChannel } from '@/lib/auth/AuthSessionChannel';
import { EnumParser } from '@/lib/enumParser';
import { AuthApi } from '@/lib/auth/AuthApi';
import { TokenStore } from '@/lib/auth/TokenStore';
import { AuthStoreState } from '@/stores/types/AuthStoreState';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerProfilePayload } from '@/types/auth/ServerProfilePayload';
import { AuthSessionDto } from '@/types/auth/AuthSessionDto';
import { UserProfileDto } from '@/types/auth/UserProfileDto';
import { AccountStatus } from '@/types/enums/AccountStatus';
import { AuthProviderType } from '@/types/enums/AuthProviderType';
import { CertLevel } from '@/types/enums/CertLevel';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';
import { UserRole } from '@/types/enums/UserRole';

/** Daily study target applied when the server profile has none yet. */
const DEFAULT_DAILY_TARGET_MINS = 30;

// Hydrate instantly from the profile-only cache (0ms perceived latency); the server cookie stays authoritative.
const initialSession: AuthSessionDto | null = AuthProfileCache.read();

/** Incremented whenever the identity changes so slower, older profile reads can never overwrite newer state. */
let generation = 0;

/** Shared in-flight verification so concurrent callers (StrictMode, focus, tabs) trigger a single request. */
let inFlightVerification: Promise<boolean> | null = null;

const sessionChannel = new AuthSessionChannel();

/**
 * Global Zustand store managing the cookie session. Behaviour is ported from the original appAuth client:
 * request de-duplication, generation-based invalidation, account-cache wipe on identity change,
 * cross-tab sync, focus re-validation, and offline-first session preservation.
 */
export const useAuthStore = create<AuthStoreState>((set, get) => {
  const clearSession = (): void => {
    AccountCache.clear();
    AuthProfileCache.clear();
    TokenStore.clear();
    set({ user: null, isAuthenticated: false, isCheckingSession: false, hasVerifiedServer: true });
  };

  return {
    user: initialSession?.user ?? null,
    isAuthenticated: Boolean(initialSession?.user),
    isCheckingSession: false,
    hasVerifiedServer: false,

    verifyServerSession: (): Promise<boolean> => {
      if (inFlightVerification) {
        return inFlightVerification;
      }

      const requestedGeneration = generation;
      set({ isCheckingSession: true });

      inFlightVerification = (async (): Promise<boolean> => {
        try {
          const response = await apiClient.get<ApiResponse<ServerProfilePayload>>('/auth/profile');
          if (requestedGeneration !== generation) {
            return get().isAuthenticated;
          }

          const payload = response.data?.data;
          if (!response.data?.success || !payload) {
            throw new Error('Empty profile payload');
          }

          const previousUser = get().user;
          if (previousUser && previousUser.id !== payload.id) {
            // Different account than the cached one: nothing of the previous identity may survive.
            AccountCache.clear();
          }

          const user: UserProfileDto = {
            id: payload.id,
            email: payload.email,
            fullName: payload.fullName || payload.email.split('@')[0],
            avatarUrl: payload.avatarUrl ?? null,
            role: EnumParser.parse(UserRole, payload.role, UserRole.Student),
            authProvider: previousUser?.authProvider ?? AuthProviderType.Email,
            accountStatus: AccountStatus.Active,
            targetCertLevel: previousUser?.id === payload.id
              ? previousUser.targetCertLevel
              : payload.targetCertLevel ?? CertLevel.B2,
            subscriptionPlan: EnumParser.parse(
              SubscriptionPlanType,
              payload.plan ?? payload.subscriptionPlan,
              SubscriptionPlanType.Free
            ),
            streakDays: payload.currentStreak ?? payload.streakDays ?? 0,
            totalXp: payload.totalXp ?? 0,
            learningGoal: payload.learningGoal ?? null,
            dailyTargetMins: payload.dailyTargetMins ?? DEFAULT_DAILY_TARGET_MINS,
          };

          AuthProfileCache.write({ user });
          set({ user, isAuthenticated: true, isCheckingSession: false, hasVerifiedServer: true });
          return true;
        } catch (error: unknown) {
          if (requestedGeneration !== generation) {
            return get().isAuthenticated;
          }

          const status = (error as { response?: { status?: number } })?.response?.status;

          // Offline-first: a network failure or 5xx must never sign the user out; keep the cached session.
          if (!status || status >= 500) {
            const cachedUser = get().user;
            set({
              isAuthenticated: Boolean(cachedUser),
              isCheckingSession: false,
              hasVerifiedServer: true,
            });
            return Boolean(cachedUser);
          }

          clearSession();
          return false;
        } finally {
          if (requestedGeneration === generation) {
            inFlightVerification = null;
          }
        }
      })();

      return inFlightVerification;
    },

    setTargetCertLevel: (targetCertLevel: CertLevel) =>
      set((state) => {
        if (!state.user) {
          return state;
        }
        const user: UserProfileDto = { ...state.user, targetCertLevel };
        AuthProfileCache.write({ user });
        return { user };
      }),

    completeLogin: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<boolean> => {
      // New identity: invalidate any older in-flight profile read, then verify with the fresh Bearer token.
      generation += 1;
      inFlightVerification = null;
      TokenStore.save(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      return get().verifyServerSession();
    },

    signOut: (): void => {
      // Revoke the Supabase session first (it needs the token), then drop local state and show the login page.
      void AuthApi.logout()
        .catch(() => undefined)
        .finally(() => {
          AccountCache.clear();
          AuthProfileCache.clear();
          TokenStore.clear();
          sessionChannel.notifyInvalidate();
          window.location.replace('/auth/login');
        });
    },
  };
});

if (typeof window !== 'undefined') {
  // Another tab signed in/out: drop caches and re-check this tab's cookie session.
  sessionChannel.onInvalidate(() => {
    generation += 1;
    inFlightVerification = null;
    AccountCache.clear();
    void useAuthStore.getState().verifyServerSession();
  });

  // Switching back to the tab only re-validates the session; it never discards in-flight data.
  window.addEventListener('focus', () => {
    if (useAuthStore.getState().hasVerifiedServer) {
      void useAuthStore.getState().verifyServerSession();
    }
  });

  // The refresh cookie was rejected by the server: re-validate, which routes the user back to /auth/login.
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    void useAuthStore.getState().verifyServerSession();
  });
}
