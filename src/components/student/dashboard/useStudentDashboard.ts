'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase, type Profile, type UserGamification } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { useGamification } from '@/hooks/useGamification';
import { resolveDisplayStreak } from '@/lib/gamification';
import { getEffectivePlan } from '@/lib/entitlement';
import { STAMPEDE_MODE } from '@/lib/stampede';
import type { MascotMood } from '@/components/gamification/Mascot';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import {
  fetchProfileOnce,
  fetchWordSummaryOnce,
  useStudentContext,
} from '@/components/student/StudentProvider';
import {
  clearDashboardSnapshotCache,
  readLastChallengeWidgetCache,
  readLastDashboardSecondaryCache,
  readLastGamificationCache,
  readLastProfileCache,
  writeChallengeWidgetCache,
  writeDashboardProfileCache,
  writeDashboardSecondaryCache,
} from '@/lib/dashboard-snapshot-cache';
import {
  readLastWordSummaryCache,
  readWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import {
  READING_TOTAL_ARTICLES,
  type ActiveVocabPack,
  type ChallengeWidgetData,
  type DashboardStatsPayload,
  type EnrolledClassroom,
  type ReadingProgress,
} from './types';
import { useListeningStats } from './useListeningStats';
import { useMilestoneDetection } from './useMilestoneDetection';

const emptySubscribe = () => () => {};

const DEFAULT_GAMIFICATION: UserGamification = {
  user_id: '',
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  daily_goal: 30,
  today_xp: 0,
  today_date: null,
};

const DEFAULT_READING_PROGRESS: ReadingProgress = {
  completedCount: 0,
  inProgressCount: 0,
  totalReadCount: 0,
  totalArticles: READING_TOTAL_ARTICLES,
};

function readInitialClassScope(): string {
  if (typeof window === 'undefined') return '__personal__';
  try {
    return new URLSearchParams(window.location.search).get('class')?.trim() || '__personal__';
  } catch {
    return '__personal__';
  }
}

function readInitialJoinClassParam(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('joinClass');
  } catch {
    return null;
  }
}

function scopeParamFor(scope: string): string {
  return scope && scope !== '__personal__'
    ? `&classroomId=${encodeURIComponent(scope)}`
    : '';
}

interface SummaryCountsInput {
  total?: number;
  newCount?: number;
  reviewDueCount?: number;
  dueCount?: number;
  classroomId?: string | null;
  levelCounts?: number[];
}

interface ConsolidatedDashboardResponse {
  success?: boolean;
  stats?: DashboardStatsPayload;
  readingProgress?: ReadingProgress;
  vocabPacks?: ActiveVocabPack[];
  classrooms?: EnrolledClassroom[];
  challengeWidget?: ChallengeWidgetData | null;
}

export function useStudentDashboard() {
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const studentCtx = useStudentContext();

  const initialSecondary = useMemo(() => readLastDashboardSecondaryCache(), []);
  const initialGamification = useMemo(
    () => studentCtx?.gamification ?? readLastGamificationCache(),
    [studentCtx?.gamification],
  );

  const [currentClassScope, setCurrentClassScope] = useState<string>(() => readInitialClassScope());
  const currentClassScopeRef = useRef<string>(currentClassScope);
  const isInitialPersonal = currentClassScope === '__personal__';

  const [localProfile, setLocalProfile] = useState<Profile | null>(
    () => studentCtx?.profile ?? readLastProfileCache(),
  );
  const rawProfile = studentCtx?.profile ?? localProfile;
  const profile = isHydrated ? rawProfile : null;
  const profileId = rawProfile?.id;

  const [classroomId, setClassroomId] = useState<string | null>(() =>
    isInitialPersonal ? (studentCtx?.wordSummary.classroomId ?? null) : currentClassScope,
  );
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<EnrolledClassroom[]>(
    () => (initialSecondary?.classrooms as EnrolledClassroom[] | undefined) ?? [],
  );

  const [dailyActivity, setDailyActivity] = useState<Array<{ date: string; count: number }>>(
    () => initialSecondary?.dailyActivity ?? [],
  );
  const [todayWords, setTodayWords] = useState(() => initialSecondary?.todayWords ?? 0);
  const [todayNewWords, setTodayNewWords] = useState(() => initialSecondary?.todayNewWords ?? 0);
  const [todayReviewWords, setTodayReviewWords] = useState(
    () => initialSecondary?.todayReviewWords ?? 0,
  );
  const [vocabPacks, setVocabPacks] = useState<ActiveVocabPack[]>(
    () => (initialSecondary?.vocabPacks as ActiveVocabPack[] | undefined) ?? [],
  );
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>(() => {
    if (initialSecondary?.readingProgress) {
      return {
        completedCount: initialSecondary.readingProgress.completedCount ?? 0,
        inProgressCount: initialSecondary.readingProgress.inProgressCount ?? 0,
        totalReadCount: initialSecondary.readingProgress.totalReadCount ?? 0,
        totalArticles: initialSecondary.readingProgress.totalArticles ?? READING_TOTAL_ARTICLES,
      };
    }
    return DEFAULT_READING_PROGRESS;
  });

  const [challengeWidget, setChallengeWidget] = useState<ChallengeWidgetData | null>(() =>
    readLastChallengeWidgetCache<ChallengeWidgetData>(readLastProfileCache()?.id),
  );
  const [dashboardSecondarySettled, setDashboardSecondarySettled] = useState(false);

  const listeningStats = useListeningStats();

  // Join classroom modal (lazy init from ?joinClass=..., rendered only after hydration)
  const [initialJoinParam] = useState<string | null>(() => readInitialJoinClassParam());
  const [joinModalOpenState, setJoinModalOpenState] = useState<boolean>(() =>
    Boolean(initialJoinParam),
  );
  const [joinCode, setJoinCode] = useState<string>(() =>
    initialJoinParam && initialJoinParam !== '1' ? initialJoinParam.toUpperCase() : '',
  );
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const isJoinModalOpen = isHydrated ? joinModalOpenState : false;

  // Action Selection Modal
  const [actionModalType, setActionModalType] = useState<ActionSelectionType | null>(null);

  // Summary counts (never flash personal counts on cold ?class=<id>)
  const initialSummary = isInitialPersonal
    ? (studentCtx?.wordSummary?.total ?? 0) > 0
      ? studentCtx!.wordSummary
      : readLastWordSummaryCache()
    : null;

  const [localTotalWords, setLocalTotalWords] = useState<number>(() => initialSummary?.total ?? 0);
  const [localNewCount, setLocalNewCount] = useState<number>(() => initialSummary?.newCount ?? 0);
  const [localReviewDueCount, setLocalReviewDueCount] = useState<number>(
    () => initialSummary?.reviewDueCount ?? 0,
  );
  const [localLevelCounts, setLocalLevelCounts] = useState<number[]>(() => {
    if (Array.isArray(initialSummary?.levelCounts) && initialSummary.levelCounts.length === 6) {
      return initialSummary.levelCounts.map((n) => Number(n) || 0);
    }
    return [0, 0, 0, 0, 0, 0];
  });
  const [localCountsReady, setLocalCountsReady] = useState<boolean>(() => Boolean(initialSummary));

  // Derive personal summary from StudentProvider context without useEffect setState
  const ctxWordSummary = studentCtx?.wordSummary;
  const ctxSummaryHasData = Boolean(
    ctxWordSummary &&
      (ctxWordSummary.total > 0 ||
        ctxWordSummary.reviewDueCount > 0 ||
        ctxWordSummary.newCount > 0 ||
        ctxWordSummary.dueCount > 0),
  );
  const useCtxSummary = currentClassScope === '__personal__' && ctxSummaryHasData;

  const resolvedTotalWords = useCtxSummary ? ctxWordSummary!.total : localTotalWords;
  const resolvedNewCount = useCtxSummary ? ctxWordSummary!.newCount : localNewCount;
  const resolvedReviewDueCount = useCtxSummary
    ? ctxWordSummary!.reviewDueCount
    : localReviewDueCount;
  const resolvedLevelCounts = useMemo(() => {
    if (
      useCtxSummary &&
      Array.isArray(ctxWordSummary?.levelCounts) &&
      ctxWordSummary.levelCounts.length === 6 &&
      ctxWordSummary.levelCounts.some((n) => n > 0)
    ) {
      return ctxWordSummary.levelCounts.map((n) => Number(n) || 0);
    }
    return localLevelCounts;
  }, [useCtxSummary, ctxWordSummary, localLevelCounts]);
  const resolvedCountsReady =
    useCtxSummary ||
    localCountsReady ||
    Boolean(currentClassScope === '__personal__' && studentCtx && !studentCtx.isLoading);

  const totalWords = isHydrated ? resolvedTotalWords : 0;
  const newCount = isHydrated ? resolvedNewCount : 0;
  const reviewDueCount = isHydrated ? resolvedReviewDueCount : 0;
  const levelCounts = useMemo(
    () => (isHydrated ? resolvedLevelCounts : [0, 0, 0, 0, 0, 0]),
    [isHydrated, resolvedLevelCounts],
  );
  const countsReady = isHydrated ? resolvedCountsReady : false;

  const levelCountsRef = useRef<number[]>(resolvedLevelCounts);
  useEffect(() => {
    levelCountsRef.current = resolvedLevelCounts;
  }, [resolvedLevelCounts]);

  const totalWordsRef = useRef<number>(resolvedTotalWords);
  useEffect(() => {
    totalWordsRef.current = resolvedTotalWords;
  }, [resolvedTotalWords]);

  const {
    data: fallbackGamification,
    refresh: fallbackRefreshGamification,
    loading: fallbackGamificationLoading,
  } = useGamification(studentCtx ? null : (profileId ?? null));

  const rawGamification = studentCtx
    ? studentCtx.gamification
    : (fallbackGamification ?? initialGamification ?? DEFAULT_GAMIFICATION);
  const gamification = isHydrated ? rawGamification : DEFAULT_GAMIFICATION;
  const refreshGamification = studentCtx
    ? studentCtx.refreshGamification
    : fallbackRefreshGamification;
  const gamificationLoading = studentCtx
    ? studentCtx.isLoading
    : fallbackGamificationLoading;

  const [serverStudyStreak, setServerStudyStreak] = useState<number | null>(() =>
    typeof initialSecondary?.studyStreak === 'number' ? initialSecondary.studyStreak : null,
  );
  const resolvedStudyStreak =
    serverStudyStreak !== null
      ? serverStudyStreak
      : resolveDisplayStreak({
          currentStreak: rawGamification.current_streak,
          lastActiveDate: rawGamification.last_active_date,
          dailyActivity: dailyActivity.length > 0 ? dailyActivity : null,
        });
  const studyStreak = isHydrated ? resolvedStudyStreak : 0;

  const applySummaryCounts = useCallback(
    (userId: string, data: SummaryCountsInput, targetScope?: string) => {
      if (targetScope !== undefined && targetScope !== currentClassScopeRef.current) return;
      const hasTotal = typeof data.total === 'number';
      const hasNew = typeof data.newCount === 'number';
      const hasReview = typeof data.reviewDueCount === 'number';
      if (hasTotal) setLocalTotalWords(data.total!);
      if (hasNew) setLocalNewCount(data.newCount!);
      if (hasReview) setLocalReviewDueCount(data.reviewDueCount!);

      let parsedLevels: number[] | undefined;
      if (Array.isArray(data.levelCounts) && data.levelCounts.length === 6) {
        const next = data.levelCounts.map((n) => Number(n) || 0);
        if (next.some((n) => n > 0)) {
          parsedLevels = next;
          setLocalLevelCounts(next);
        }
      }
      if (data.classroomId !== undefined) setClassroomId(data.classroomId ?? null);
      setLocalCountsReady(true);

      const scope = targetScope !== undefined ? targetScope : currentClassScopeRef.current;
      if ((!scope || scope === '__personal__') && hasTotal) {
        const total = data.total!;
        const nextNew = data.newCount ?? 0;
        const nextReview = data.reviewDueCount ?? 0;
        writeWordSummaryCache(userId, {
          total,
          newCount: nextNew,
          reviewDueCount: nextReview,
          dueCount: data.dueCount,
          classroomId: data.classroomId ?? null,
          levelCounts: parsedLevels,
        });
        studentCtx?.updateWordSummary({
          total,
          newCount: nextNew,
          reviewDueCount: nextReview,
          dueCount: data.dueCount,
          classroomId: data.classroomId ?? null,
          levelCounts: parsedLevels,
        });
      }
    },
    [studentCtx],
  );

  const secondaryLoadedRef = useRef<boolean>(false);
  const loadSecondaryDashboard = useCallback(async (userId: string, scope: string) => {
    const query =
      scope && scope !== '__personal__'
        ? `?classroomId=${encodeURIComponent(scope)}`
        : '';
    try {
      const res = await authFetch(`/api/student/dashboard${query}`, {});
      if (!res.ok) {
        // 503 / 500: preserve existing SWR cache & never redirect
        return;
      }
      const json = (await res.json()) as ConsolidatedDashboardResponse;
      if (!json?.success) return;

      const stats = json.stats;
      const activity = Array.isArray(stats?.dailyActivity) ? stats.dailyActivity : [];
      if (stats) {
        setDailyActivity(activity);
        if (typeof stats.studyStreak === 'number') {
          setServerStudyStreak(stats.studyStreak);
        }
        const totalToday =
          typeof stats.todayWords === 'number'
            ? stats.todayWords
            : typeof stats.todayKey === 'string'
              ? (activity.find((a) => a.date === stats.todayKey)?.count ?? 0)
              : 0;
        setTodayWords(totalToday);
        if (typeof stats.todayNewWords === 'number') setTodayNewWords(stats.todayNewWords);
        if (typeof stats.todayReviewWords === 'number') setTodayReviewWords(stats.todayReviewWords);
      }

      if (json.readingProgress) {
        setReadingProgress({
          completedCount: json.readingProgress.completedCount ?? 0,
          inProgressCount: json.readingProgress.inProgressCount ?? 0,
          totalReadCount: json.readingProgress.totalReadCount ?? 0,
          totalArticles: json.readingProgress.totalArticles ?? READING_TOTAL_ARTICLES,
        });
      }

      if (Array.isArray(json.vocabPacks)) {
        setVocabPacks(json.vocabPacks);
      }

      if (Array.isArray(json.classrooms)) {
        setEnrolledClassrooms(json.classrooms);
      }

      if (json.challengeWidget !== undefined) {
        setChallengeWidget(json.challengeWidget ?? null);
        if (json.challengeWidget) {
          writeChallengeWidgetCache(userId, json.challengeWidget);
        }
      }

      writeDashboardSecondaryCache(userId, {
        ...(stats
          ? {
              dailyActivity: activity,
              todayWords: stats.todayWords,
              todayNewWords: stats.todayNewWords,
              todayReviewWords: stats.todayReviewWords,
              studyStreak: stats.studyStreak,
            }
          : {}),
        ...(json.readingProgress ? { readingProgress: json.readingProgress } : {}),
        ...(Array.isArray(json.vocabPacks) ? { vocabPacks: json.vocabPacks } : {}),
        ...(Array.isArray(json.classrooms) ? { classrooms: json.classrooms } : {}),
      });
    } catch {
      // Preserve SWR cache on offline/network error
    } finally {
      setDashboardSecondarySettled(true);
    }
  }, []);

  const profileRef = useRef(rawProfile);
  useEffect(() => {
    profileRef.current = rawProfile;
  }, [rawProfile]);

  const loadData = useCallback(
    async (userId: string, targetScope?: string, includeSecondary = false) => {
      const scope = targetScope !== undefined ? targetScope : currentClassScopeRef.current;
      const scopeParam = scopeParamFor(scope);
      const isInitialPersonalBoot =
        includeSecondary && Boolean(studentCtx) && (!scope || scope === '__personal__');

      try {
        const existingProfile = studentCtx?.profile || profileRef.current;
        const profPromise: Promise<Profile | null> =
          existingProfile || isInitialPersonalBoot
            ? Promise.resolve(existingProfile ?? null)
            : fetchProfileOnce(userId);

        // On initial personal boot inside StudentProvider, StudentProvider already calls fetchWordSummaryOnce once
        const summaryPromise = isInitialPersonalBoot
          ? Promise.resolve(null)
          : !scope || scope === '__personal__'
            ? fetchWordSummaryOnce(userId).then((sum) => {
                if (sum && scope === currentClassScopeRef.current) {
                  applySummaryCounts(userId, sum, scope);
                }
                return sum;
              })
            : authFetch(`/api/words?summary=1&levels=1${scopeParam}`, {})
                .then((r) => r.json())
                .then((sum: SummaryCountsInput & { success?: boolean }) => {
                  if (sum?.success && scope === currentClassScopeRef.current) {
                    applySummaryCounts(userId, sum, scope);
                  }
                  return sum;
                })
                .catch(() => null);

        const secondaryPromise =
          includeSecondary && !secondaryLoadedRef.current
            ? (() => {
                secondaryLoadedRef.current = true;
                return loadSecondaryDashboard(userId, scope);
              })()
            : Promise.resolve();

        const [freshProfile] = await Promise.all([
          profPromise,
          summaryPromise,
          secondaryPromise,
        ]);

        if (freshProfile) {
          setLocalProfile(freshProfile);
          writeDashboardProfileCache(userId, freshProfile);
        }

        // Level fallback only if user has words (> 0) and levelCounts are all 0 (scoped only; personal summary already includes levels=1)
        if (
          !isInitialPersonalBoot &&
          scope === currentClassScopeRef.current &&
          totalWordsRef.current > 0 &&
          !levelCountsRef.current.some((n) => n > 0)
        ) {
          const fallbackTimer = () => {
            if (
              scope !== currentClassScopeRef.current ||
              totalWordsRef.current === 0 ||
              levelCountsRef.current.some((n) => n > 0)
            ) {
              return;
            }
            void authFetch(`/api/words?summary=1&levels=1${scopeParam}`, {})
              .then((r) => r.json())
              .then((sum: SummaryCountsInput & { success?: boolean }) => {
                if (sum?.success && scope === currentClassScopeRef.current) {
                  applySummaryCounts(userId, sum, scope);
                }
              })
              .catch(() => {});
          };
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(fallbackTimer, { timeout: 2500 });
          } else {
            setTimeout(fallbackTimer, 1000);
          }
        }
      } catch (err: unknown) {
        console.error(
          'Load Dashboard error:',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    },
    [applySummaryCounts, loadSecondaryDashboard, studentCtx],
  );

  const lastSummarySyncAtRef = useRef<number>(Date.now());
  const refreshSummary = useCallback(
    async (userId: string) => {
      try {
        lastSummarySyncAtRef.current = Date.now();
        const scope = currentClassScopeRef.current;
        const scopeParam = scopeParamFor(scope);
        const res = await authFetch(`/api/words?summary=1${scopeParam}`, {});
        const data = (await res.json()) as SummaryCountsInput & { success?: boolean };
        if (data.success && scope === currentClassScopeRef.current) {
          applySummaryCounts(userId, data, scope);
        }
      } catch {
        // silent fail
      }
    },
    [applySummaryCounts],
  );

  // Periodic summary refresh when STAMPEDE_MODE is disabled, plus throttled tab-return sync
  useEffect(() => {
    if (!profileId) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastSummarySyncAtRef.current < 45_000) return;
      void refreshSummary(profileId);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let intervalId: number | null = null;
    if (!STAMPEDE_MODE) {
      intervalId = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        void refreshSummary(profileId);
      }, 60_000);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [profileId, refreshSummary]);

  const loadStartedRef = useRef(false);
  const loadDataRef = useRef(loadData);
  const routerRef = useRef(router);
  const initialStudentSummaryRef = useRef(studentCtx?.wordSummary);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    initialStudentSummaryRef.current = studentCtx?.wordSummary;
  }, [studentCtx?.wordSummary]);

  useEffect(() => {
    const initialScope = currentClassScopeRef.current;

    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        return;
      }

      if (session?.user) {
        if (initialScope === '__personal__') {
          const ctxSum = initialStudentSummaryRef.current;
          const cached =
            (ctxSum?.total ?? 0) > 0
              ? ctxSum
              : readWordSummaryCache(session.user.id);
          if (cached) {
            setLocalTotalWords(cached.total);
            setLocalNewCount(cached.newCount);
            setLocalReviewDueCount(cached.reviewDueCount);
            if (
              Array.isArray(cached.levelCounts) &&
              cached.levelCounts.length === 6 &&
              cached.levelCounts.some((n) => n > 0)
            ) {
              setLocalLevelCounts(cached.levelCounts.map((n) => Number(n) || 0));
            }
            if (cached.classroomId) setClassroomId(cached.classroomId);
            setLocalCountsReady(true);
          }
        }

        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          void loadDataRef.current(session.user.id, initialScope, true);
        }
      } else {
        clearDashboardSnapshotCache();
        const redirectPath =
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/student';
        routerRef.current.replace(`/auth?redirectTo=${encodeURIComponent(redirectPath)}`);
      }
    };
    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          void loadDataRef.current(session.user.id, currentClassScopeRef.current, true);
        }
      } else if (event === 'SIGNED_OUT') {
        loadStartedRef.current = false;
        routerRef.current.replace('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Strip ?joinClass=... from URL without touching state
  useEffect(() => {
    if (!initialJoinParam || typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('joinClass')) {
        url.searchParams.delete('joinClass');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, [initialJoinParam]);

  const handleSwitchScope = useCallback(
    (newScope: string) => {
      if (newScope === currentClassScopeRef.current) return;
      currentClassScopeRef.current = newScope;
      setCurrentClassScope(newScope);
      setClassroomId(newScope && newScope !== '__personal__' ? newScope : null);
      setLocalCountsReady(false);
      const resetLevels = [0, 0, 0, 0, 0, 0];
      levelCountsRef.current = resetLevels;
      setLocalLevelCounts(resetLevels);

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (newScope && newScope !== '__personal__') {
          url.searchParams.set('class', newScope);
        } else {
          url.searchParams.delete('class');
        }
        window.history.replaceState({}, '', url.toString());
      }

      if (profileId) {
        void loadData(profileId, newScope, false);
      }
    },
    [loadData, profileId],
  );

  const handleJoinClassroom = useCallback(async () => {
    if (!joinCode.trim() || isJoining) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      interface JoinResponse {
        success: boolean;
        data?: { id: string; name: string; teacher_id: string; enrollment_count: number | null };
        error?: string;
      }
      const res = await authFetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      });
      const result: JoinResponse = await res.json();
      if (!res.ok || !result.success) {
        const msg =
          res.status === 404
            ? 'Không tìm thấy lớp học. Kiểm tra lại mã.'
            : res.status === 409
              ? 'Bạn đã tham gia lớp học này rồi.'
              : (result.error ?? 'Đã có lỗi xảy ra.');
        setJoinError(msg);
        return;
      }
      toast.success(`Đã tham gia lớp ${result.data?.name ?? ''}!`);
      if (result.data) {
        setClassroomId(result.data.id);
        if (profileId) {
          void loadSecondaryDashboard(profileId, result.data.id);
        }
        handleSwitchScope(result.data.id);
      }
      setJoinModalOpenState(false);
      setJoinCode('');
    } catch {
      setJoinError('Kết nối thất bại, vui lòng thử lại.');
    } finally {
      setIsJoining(false);
    }
  }, [handleSwitchScope, isJoining, joinCode, loadSecondaryDashboard, profileId]);

  const handleMilestoneClaimed = useCallback(() => {
    void refreshGamification();
    if (!profileId) return;
    void supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, plan, plan_expires_at, daily_goal, created_at')
      .eq('id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLocalProfile(data as Profile);
          writeDashboardProfileCache(profileId, data as Profile);
          void studentCtx?.refreshProfile();
        }
      });
  }, [profileId, refreshGamification, studentCtx]);

  const masteredCount = useMemo(
    () => (levelCounts[4] || 0) + (levelCounts[5] || 0),
    [levelCounts],
  );

  const { milestonePopup, setMilestonePopup } = useMilestoneDetection({
    profileId,
    gamification,
    gamificationLoading,
    countsReady,
    dashboardSecondarySettled,
    studyStreak,
    masteredCount,
  });

  const activeClassroom = useMemo(() => {
    if (!isHydrated || !currentClassScope || currentClassScope === '__personal__') return null;
    return enrolledClassrooms.find((c) => c.id === currentClassScope) || null;
  }, [isHydrated, currentClassScope, enrolledClassrooms]);

  const inProgressPacks = useMemo(() => {
    if (!isHydrated) return [];
    return vocabPacks
      .filter(
        (p) => p.status === 'in_progress' && Array.isArray(p.words) && p.words.length > 0,
      )
      .slice(0, 3);
  }, [isHydrated, vocabPacks]);

  const greeting = useMemo(() => {
    if (!isHydrated) return 'Chào bạn';
    const hour = new Date().getHours();
    if (hour < 12) return 'Buổi sáng tốt lành';
    if (hour < 18) return 'Buổi chiều làm việc tốt';
    return 'Buổi tối vui vẻ';
  }, [isHydrated]);

  const mascotMood: MascotMood =
    reviewDueCount > 0 ? 'thinking' : newCount > 0 ? 'happy' : 'cheer';
  const dailyWordGoal = profile?.daily_goal ?? 10;
  const isFreePlan = Boolean(
    profile && getEffectivePlan(profile.plan, profile.plan_expires_at) === 'free',
  );

  return {
    profile,
    gamification,
    classroomId: isHydrated ? classroomId : null,
    currentClassScope: isHydrated ? currentClassScope : '__personal__',
    enrolledClassrooms: isHydrated ? enrolledClassrooms : [],
    activeClassroom,
    dailyActivity: isHydrated ? dailyActivity : [],
    todayWords: isHydrated ? todayWords : 0,
    todayNewWords: isHydrated ? todayNewWords : 0,
    todayReviewWords: isHydrated ? todayReviewWords : 0,
    studyStreak,
    readingProgress: isHydrated ? readingProgress : DEFAULT_READING_PROGRESS,
    listeningStats,
    inProgressPacks,
    challengeWidget: isHydrated ? challengeWidget : null,
    dashboardSecondarySettled: isHydrated ? dashboardSecondarySettled : false,
    totalWords,
    newCount,
    reviewDueCount,
    levelCounts,
    countsReady,
    masteredCount,
    dailyWordGoal,
    isFreePlan,
    greeting,
    mascotMood,
    actionModalType,
    setActionModalType,
    milestonePopup,
    setMilestonePopup,
    isJoinModalOpen,
    setIsJoinModalOpen: setJoinModalOpenState,
    joinCode,
    setJoinCode,
    isJoining,
    joinError,
    setJoinError,
    handleSwitchScope,
    handleJoinClassroom,
    handleMilestoneClaimed,
  };
}
