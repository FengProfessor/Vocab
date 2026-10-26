import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from '@/shared/router/navigation';
import { GrammarApi } from '@/features/grammar/api';
import { VocabApi } from '@/features/vocab/api';
import { useGamification } from '@/hooks/useGamification';
import { authService } from '@/features/auth/session';
import type { UserGamification } from '@/lib/supabase';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import {
  readLastProfileCache,
  readLastGamificationCache,
} from '@/lib/dashboard-snapshot-cache';
import { useStudentContext, type ShellProfile } from '@/components/student/StudentProvider';

export const DEFAULT_GAMIFICATION: UserGamification = {
  user_id: '',
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  daily_goal: 30,
  today_xp: 0,
  today_date: null,
};

const GRAMMAR_DUE_CACHE_KEY = 'lingopro_grammar_due_cache_v1';
const GRAMMAR_DUE_TTL_MS = 60_000;

function readGrammarDueCache(userId?: string | null): { dueCount: number; fresh: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GRAMMAR_DUE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string; dueCount?: number; ts?: number };
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    if (typeof parsed.dueCount !== 'number') return null;
    const fresh = typeof parsed.ts === 'number' && Date.now() - parsed.ts < GRAMMAR_DUE_TTL_MS;
    return { dueCount: parsed.dueCount, fresh };
  } catch {
    return null;
  }
}

function writeGrammarDueCache(userId: string, dueCount: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      GRAMMAR_DUE_CACHE_KEY,
      JSON.stringify({ userId, dueCount, ts: Date.now() }),
    );
  } catch {
    // ignore storage quota errors
  }
}

export interface UseStudentShellDataOptions {
  requireAuth: boolean;
  immersive: boolean;
  propProfile?: ShellProfile | null;
  propGamification?: UserGamification;
  propReviewDueCount?: number;
  propNewCount?: number;
  propClassroomId?: string | null;
}

export function useStudentShellData({
  requireAuth,
  immersive,
  propProfile,
  propGamification,
  propReviewDueCount,
  propNewCount,
  propClassroomId,
}: UseStudentShellDataOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const context = useStudentContext();

  const [internalProfile, setInternalProfile] = useState<ShellProfile | null>(() => {
    if (propProfile || context?.profile) return null;
    return readLastProfileCache();
  });
  const [profileEmail, setProfileEmail] = useState<string>(() => {
    const cached = propProfile ?? context?.profile ?? readLastProfileCache();
    return cached?.email ?? '';
  });
  const [isTeacherUser, setIsTeacherUser] = useState<boolean>(() => {
    const cached = propProfile ?? context?.profile ?? readLastProfileCache();
    return cached?.role === 'teacher';
  });
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState<number>(() => {
    if (context?.wordSummary) return context.wordSummary.reviewDueCount;
    const cached = readLastWordSummaryCache();
    return cached?.reviewDueCount ?? 0;
  });
  const [newCount, setNewCount] = useState<number>(() => {
    if (context?.wordSummary) return context.wordSummary.newCount;
    const cached = readLastWordSummaryCache();
    return cached?.newCount ?? 0;
  });
  const [grammarDue, setGrammarDue] = useState<number>(() => readGrammarDueCache()?.dueCount ?? 0);
  const [, setIsBootstrapping] = useState<boolean>(() => {
    const active = propProfile ?? context?.profile ?? readLastProfileCache();
    return !active;
  });
  const [embedMode, setEmbedMode] = useState(false);

  const { data: fallbackGamification } = useGamification(
    context ? null : (internalProfile?.id ?? null),
  );

  const cachedGamification = useMemo(() => {
    if (propGamification || (context?.gamification && context.gamification.total_xp > 0)) {
      return null;
    }
    return readLastGamificationCache();
  }, [propGamification, context?.gamification]);

  const effectiveProfile = propProfile ?? context?.profile ?? internalProfile;
  const effectiveGamification =
    propGamification ??
    (context?.gamification && (context.gamification.total_xp > 0 || !cachedGamification)
      ? context.gamification
      : (cachedGamification ?? fallbackGamification ?? DEFAULT_GAMIFICATION));
  const effectiveIsTeacher = context
    ? context.isTeacherUser
    : (effectiveProfile?.role === 'teacher' || isTeacherUser);
  const effectiveClassroomId =
    propClassroomId ?? context?.wordSummary.classroomId ?? classroomId;
  const effectiveReviewDueCount =
    propReviewDueCount ?? context?.wordSummary.reviewDueCount ?? reviewDueCount;
  const effectiveNewCount =
    propNewCount ?? context?.wordSummary.newCount ?? newCount;
  const effectiveImmersive = immersive || embedMode;

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      setEmbedMode(
        q.get('embed') === '1' ||
          q.get('embed') === 'true' ||
          q.get('from') === 'hub' ||
          q.get('from') === 'lingotown-embed',
      );
    } catch {
      setEmbedMode(false);
    }
  }, [pathname]);

  useEffect(() => {
    let isCancelled = false;

    const loadShellData = async () => {
      try {
        if (effectiveProfile) {
          setIsBootstrapping(false);
        }
        if (context) {
          const result = context.session ? null : await authService.getSession();
          if (result?.error) return;
          const session = context.session ?? result?.data.session;
          if (isCancelled) return;
          if (!session?.user) {
            if (requireAuth) {
              router.replace('/auth');
            }
            return;
          }

          setProfileEmail(session.user.email ?? '');

          const cachedGrammar = readGrammarDueCache(session.user.id);
          if (cachedGrammar && !isCancelled) {
            setGrammarDue(cachedGrammar.dueCount);
            if (cachedGrammar.fresh) {
              return;
            }
          }

          const authHeaders = { 'X-LingoPro-Request': '1' };
          const grammarResponse = await GrammarApi.getProgress('/api/grammar/progress?summary=1', { headers: authHeaders })
            .then((response) => response.json())
            .catch(() => null);

          if (!isCancelled && grammarResponse?.success) {
            const nextGrammarDue = Number(grammarResponse.dueCount ?? 0);
            setGrammarDue(nextGrammarDue);
            writeGrammarDueCache(session.user.id, nextGrammarDue);
          }
          return;
        }

        const { data: { session }, error } = await authService.getSession();
        if (error) return;
        if (isCancelled) return;
        if (!session?.user) {
          if (requireAuth) {
            router.replace('/auth');
          }
          return;
        }

        setProfileEmail(session.user.email ?? '');

        const cached = readWordSummaryCache(session.user.id);
        if (cached && !isCancelled) {
          setReviewDueCount(cached.reviewDueCount);
          setNewCount(cached.newCount ?? 0);
          if (cached.classroomId) setClassroomId(cached.classroomId);
        }
        const cachedGrammar = readGrammarDueCache(session.user.id);
        if (cachedGrammar && !isCancelled) {
          setGrammarDue(cachedGrammar.dueCount);
        }

        const cachedProfile = readLastProfileCache();
        if (cachedProfile && cachedProfile.id === session.user.id && !isCancelled) {
          setInternalProfile(cachedProfile);
          setIsTeacherUser(cachedProfile.role === 'teacher');
        }

        const authHeaders = { 'X-LingoPro-Request': '1' };
        const [wordsResponse, grammarResponse] = await Promise.all([
          cached
            ? Promise.resolve(null)
            : VocabApi.getWords('/api/words?summary=1', { headers: authHeaders })
                .then((response) => response.json())
                .catch(() => null),
          cachedGrammar?.fresh
            ? Promise.resolve(null)
            : GrammarApi.getProgress('/api/grammar/progress?summary=1', { headers: authHeaders })
                .then((response) => response.json())
                .catch(() => null),
        ]);

        if (isCancelled) return;

        if (!cachedProfile || cachedProfile.id !== session.user.id) {
          const fallbackProfile: ShellProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name:
              (session.user.user_metadata?.full_name as string) ||
              session.user.email?.split('@')[0] ||
              'Học viên',
            avatar_url: (session.user.user_metadata?.avatar_url as string) || undefined,
            role: (session.user.user_metadata?.role as 'teacher' | 'student') || 'student',
            plan: (session.user.user_metadata?.plan as 'free' | 'pro' | 'premium') || 'free',
            created_at: new Date().toISOString(),
          };
          setInternalProfile(fallbackProfile);
          setIsTeacherUser(fallbackProfile.role === 'teacher');
        }

        if (wordsResponse?.success) {
          const nextReview = Number(wordsResponse.reviewDueCount ?? 0);
          const nextNew = Number(wordsResponse.newCount ?? 0);
          setClassroomId(wordsResponse.classroomId ?? null);
          setReviewDueCount(nextReview);
          setNewCount(nextNew);
          writeWordSummaryCache(session.user.id, {
            total: Number(wordsResponse.total ?? 0),
            newCount: nextNew,
            reviewDueCount: nextReview,
            dueCount: Number(wordsResponse.dueCount ?? 0),
            classroomId: wordsResponse.classroomId ?? null,
            levelCounts: Array.isArray(wordsResponse.levelCounts)
              ? wordsResponse.levelCounts.map((n: unknown) => Number(n) || 0)
              : undefined,
          });
        }

        if (grammarResponse?.success) {
          const nextGrammarDue = Number(grammarResponse.dueCount ?? 0);
          setGrammarDue(nextGrammarDue);
          writeGrammarDueCache(session.user.id, nextGrammarDue);
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void loadShellData();

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (isCancelled) return;
      if (event === 'SIGNED_OUT') {
        setInternalProfile(null);
        setProfileEmail('');
        if (requireAuth) {
          router.replace('/auth');
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setProfileEmail(session.user.email ?? '');
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [router, requireAuth, context, effectiveProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('lp:routes_prefetched') === '1') return;
    } catch {}

    const runRouteWarmup = async () => {
      try {
        const { getNetworkPolicy } = await import('@/lib/offline/network-policy');
        if (!getNetworkPolicy().canPrefetchRoutes) return;
        sessionStorage.setItem('lp:routes_prefetched', '1');
        const primaryRoutes = [
          '/student',
          '/library',
          '/journey',
          '/grammar',
          '/dictionary',
          '/student/profile',
          '/flashcard?mode=learn',
          '/review/session?mode=mixed',
          '/practice/daily-reading',
        ];
        for (const r of primaryRoutes) {
          try {
            router.prefetch(r);
          } catch {}
        }
      } catch {}
    };

    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const id = ric(() => { void runRouteWarmup(); }, { timeout: 3500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(() => { void runRouteWarmup(); }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    router.replace('/auth');
  };

  return {
    pathname,
    effectiveProfile,
    effectiveGamification,
    effectiveIsTeacher,
    effectiveClassroomId,
    effectiveReviewDueCount,
    effectiveNewCount,
    effectiveImmersive,
    grammarDue,
    profileEmail,
    handleSignOut,
  };
}
