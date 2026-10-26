import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authService,
  type AppSession,
  type AppUser,
} from '@/features/auth/session';
import {
  readLastProfileCache,
  readLastGamificationCache,
} from '@/lib/dashboard-snapshot-cache';
import { UserRole } from '@/types/enums/UserRole';

export interface AuthContextValue {
  session: AppSession | null;
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  streakDays: number;
  totalXp: number;
  signIn: (email: string, password: string) => ReturnType<typeof authService.signInWithPassword>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole | 'student' | 'teacher';
  }) => ReturnType<typeof authService.signUp>;
  signInWithGoogle: (options?: {
    redirectTo?: string;
    skipBrowserRedirect?: boolean;
  }) => ReturnType<typeof authService.signInWithOAuth>;
  signOut: () => ReturnType<typeof authService.signOut>;
  refreshSession: () => Promise<AppSession | null>;
  claimTeacherRole: () => ReturnType<typeof authService.claimTeacherRole>;
  claimOnboardingXp: () => ReturnType<typeof authService.claimOnboardingXp>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createInitialSessionFromCache(): AppSession | null {
  if (typeof window === 'undefined') return null;
  const cachedProfile = readLastProfileCache();
  if (!cachedProfile?.id) return null;
  const cachedGam = readLastGamificationCache();
  return {
    user: {
      id: cachedProfile.id,
      email: cachedProfile.email || '',
      user_metadata: {
        full_name: cachedProfile.full_name || 'Học viên',
        avatar_url: cachedProfile.avatar_url ?? undefined,
        role: cachedProfile.role || 'student',
        plan: cachedProfile.plan || 'free',
        total_xp: cachedGam?.total_xp ?? 0,
        current_streak: cachedGam?.current_streak ?? 0,
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AppSession | null>(() => createInitialSessionFromCache());
  const [isLoading, setIsLoading] = useState<boolean>(() => !createInitialSessionFromCache());

  useEffect(() => {
    let mounted = true;

    void authService.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    (email: string, password: string) => authService.signInWithPassword({ email, password }),
    [],
  );

  const signUp = useCallback(
    (input: {
      email: string;
      password: string;
      fullName: string;
      role?: UserRole | 'student' | 'teacher';
    }) => authService.signUp(input),
    [],
  );

  const signInWithGoogle = useCallback(
    (options?: { redirectTo?: string; skipBrowserRedirect?: boolean }) =>
      authService.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options?.redirectTo,
          skipBrowserRedirect: options?.skipBrowserRedirect,
          queryParams: { prompt: 'select_account' },
        },
      }),
    [],
  );

  const signOut = useCallback(() => authService.signOut(), []);

  const refreshSession = useCallback(async () => {
    const { data } = await authService.getSession({ force: true });
    return data.session;
  }, []);

  const claimTeacherRole = useCallback(() => authService.claimTeacherRole(), []);
  const claimOnboardingXp = useCallback(() => authService.claimOnboardingXp(), []);

  const value = useMemo<AuthContextValue>(() => {
    const cachedGam = readLastGamificationCache();
    const metaXp = Number(session?.user.user_metadata?.total_xp ?? cachedGam?.total_xp ?? 0);
    const metaStreak = Number(
      session?.user.user_metadata?.current_streak ?? cachedGam?.current_streak ?? 0,
    );

    return {
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user?.id),
      isLoading,
      streakDays: Number.isFinite(metaStreak) ? metaStreak : 0,
      totalXp: Number.isFinite(metaXp) ? metaXp : 0,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refreshSession,
      claimTeacherRole,
      claimOnboardingXp,
    };
  }, [
    session,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
    claimTeacherRole,
    claimOnboardingXp,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const FALLBACK_AUTH_CONTEXT: AuthContextValue = {
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  streakDays: 0,
  totalXp: 0,
  signIn: (email, password) => authService.signInWithPassword({ email, password }),
  signUp: (input) => authService.signUp(input),
  signInWithGoogle: (options) =>
    authService.signInWithOAuth({
      provider: 'google',
      options,
    }),
  signOut: () => authService.signOut(),
  refreshSession: async () => (await authService.getSession({ force: true })).data.session,
  claimTeacherRole: () => authService.claimTeacherRole(),
  claimOnboardingXp: () => authService.claimOnboardingXp(),
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? FALLBACK_AUTH_CONTEXT;
}

export function useSession(): { session: AppSession | null; isLoading: boolean } {
  const { session, isLoading } = useAuth();
  return { session, isLoading };
}
