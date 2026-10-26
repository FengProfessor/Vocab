import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { ClassroomApi } from '@/features/classroom/api';
import { VocabApi } from '@/features/vocab/api';
import { ReadingApi } from '@/features/reading/api';
import { AuthApi } from '@/features/auth/api';
import { authService } from '@/features/auth/session';
import type { Profile, Word } from '@/lib/supabase';
import { useRouter } from '@/shared/router/navigation';
import { useGamification } from '@/hooks/useGamification';
import {
  dateKeyInTimeZone,
  earnedBadges,
  resolveDisplayStreak,
  xpToLevel,
} from '@/lib/gamification';
import { STREAK_MILESTONES } from '@/lib/encouragement';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import {
  readLastProfileCache,
  readLastGamificationCache,
  readLastDashboardWordsCache,
  readLastDashboardSecondaryCache,
  writeDashboardProfileCache,
  writeDashboardWordsCache,
  writeDashboardSecondaryCache,
  readLastDailyReadingCache,
  writeDailyReadingCache,
} from '@/lib/dashboard-snapshot-cache';
import { getAllVideoWatchProgress } from '@/lib/listening-recommendation';
import { useStudentContext, fetchWordSummaryOnce } from '@/components/student/StudentProvider';

const STAMPEDE_MODE = true;
const WORDS_PAGE_SIZE = 20;

export interface DailyReadingStatus {
  hasNew: boolean;
  title: string;
  wordCount: number;
  completedCount: number;
  totalCount: number;
}

export interface ActiveVocabPack {
  pack_id: string;
  topic_title: string;
  pack_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  word_count: number;
  reviewed_count: number;
  words: Array<{ word_id: string; position: number }>;
}

export interface EnrolledClassroom {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  joined_at: string | null;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SkillScoresSummary {
  vocabScore: number;
  grammarScore: number;
  reflexScore: number;
  readingScore: number;
  listeningScore: number;
}

export interface WeakWordSummary {
  word: string;
  meaning: string;
  level: number;
  stability: number;
}

export type WordStatusFilter = 'all' | 'new' | 'due' | 'learned' | 'mastered';

export function useIsDesktop(breakpoint = 768): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches : false),
    () => false,
  );
}

export function useStudentDashboard() {
  const isDesktop = useIsDesktop();
  const studentCtx = useStudentContext();
  const [profile, setProfile] = useState<Profile | null>(() => studentCtx?.profile ?? readLastProfileCache());
  const initialWords = readLastDashboardWordsCache();
  const initialSecondary = readLastDashboardSecondaryCache();
  const [words, setWords] = useState<Word[]>(() => initialWords ?? []);
  const [classroomId, setClassroomId] = useState<string | null>(studentCtx?.wordSummary.classroomId ?? null);
  const [currentClassScope, setCurrentClassScope] = useState<string>('__personal__');
  const currentClassScopeRef = useRef<string>('__personal__');
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<EnrolledClassroom[]>([]);
  const [, setIsLoading] = useState(false);
  const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>(
    () => initialSecondary?.dailyActivity ?? [],
  );
  const [todayWords, setTodayWords] = useState(() => initialSecondary?.todayWords ?? 0);
  const [todayNewWords, setTodayNewWords] = useState(() => initialSecondary?.todayNewWords ?? 0);
  const [, setTodayReviewWords] = useState(() => initialSecondary?.todayReviewWords ?? 0);
  const [countdown, setCountdown] = useState<string>('');
  const [vocabPacks, setVocabPacks] = useState<ActiveVocabPack[]>(
    () => (initialSecondary?.vocabPacks as ActiveVocabPack[] | undefined) ?? [],
  );
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [dailyReadingStatus, setDailyReadingStatus] = useState<DailyReadingStatus>(() => {
    if (initialSecondary?.dailyReadingStatus) {
      return initialSecondary.dailyReadingStatus;
    }
    const dr = readLastDailyReadingCache();
    if (dr && Array.isArray(dr.exercises)) {
      const exs = dr.exercises as Array<{
        title?: string;
        sourceWords?: unknown[];
        completion?: { completedAt?: string } | null;
      }>;
      const totalCount = exs.length;
      const completedCount = exs.filter((e) => Boolean(e.completion?.completedAt)).length;
      const unfinished = exs.find((e) => !e.completion?.completedAt);
      return {
        hasNew: Boolean(dr.hasNew && unfinished),
        title: unfinished?.title || 'Bài đọc hàng ngày',
        wordCount: unfinished?.sourceWords?.length || 0,
        completedCount,
        totalCount,
      };
    }
    return {
      hasNew: false,
      title: '',
      wordCount: 0,
      completedCount: 0,
      totalCount: 0,
    };
  });
  const [listeningStats, setListeningStats] = useState<{
    completedCount: number;
    inProgressPercent: number;
    totalCompleted: number;
  }>({ completedCount: 0, inProgressPercent: 0, totalCompleted: 0 });

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [actionModalType, setActionModalType] = useState<ActionSelectionType | null>(null);

  const [totalWords, setTotalWords] = useState(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    return cached?.total ?? 0;
  });
  const [newCount, setNewCount] = useState(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    return cached?.newCount ?? 0;
  });
  const [reviewDueCount, setReviewDueCount] = useState(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    return cached?.reviewDueCount ?? 0;
  });
  const [levelCounts, setLevelCounts] = useState<number[]>(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    if (Array.isArray(cached?.levelCounts) && cached.levelCounts.length === 6) {
      return cached.levelCounts.map((n) => Number(n) || 0);
    }
    return [0, 0, 0, 0, 0, 0];
  });
  const levelCountsRef = useRef<number[]>(levelCounts);
  useEffect(() => {
    levelCountsRef.current = levelCounts;
  }, [levelCounts]);

  const [countsReady, setCountsReady] = useState(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    return Boolean(cached);
  });
  const [wordsLoading, setWordsLoading] = useState(() => !initialWords || initialWords.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [wordsOffset, setWordsOffset] = useState(() => initialWords?.length ?? 0);
  const [avgStabilityDays, setAvgStabilityDays] = useState<number | null>(null);
  const [retentionRate, setRetentionRate] = useState<number | null>(null);
  const [grammarDueCount, setGrammarDueCount] = useState<number>(0);
  const [skillScores, setSkillScores] = useState<SkillScoresSummary | null>(null);
  const [quizTrend, setQuizTrend] = useState<
    { score: number; max_score: number; completed_at: string; quiz_type: string }[]
  >([]);
  const [serverWeakWords, setServerWeakWords] = useState<WeakWordSummary[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WordStatusFilter>('all');
  const [sortBy] = useState<'newest' | 'oldest' | 'az' | 'hardest'>('newest');
  const router = useRouter();
  const initialGamification = studentCtx?.gamification ?? readLastGamificationCache();
  const {
    data: fallbackGamification,
    refresh: fallbackRefreshGamification,
    loading: fallbackGamificationLoading,
  } = useGamification(studentCtx ? null : (profile?.id ?? null));

  const gamification = studentCtx
    ? studentCtx.gamification
    : (fallbackGamification ??
      initialGamification ?? {
        user_id: '',
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        daily_goal: 30,
        today_xp: 0,
        today_date: null,
      });
  const refreshGamification = studentCtx ? studentCtx.refreshGamification : fallbackRefreshGamification;
  const gamificationLoading = studentCtx ? studentCtx.isLoading : fallbackGamificationLoading;

  const [studyStreak, setStudyStreak] = useState(() => {
    if (typeof initialSecondary?.studyStreak === 'number' && initialSecondary.studyStreak > 0) {
      return initialSecondary.studyStreak;
    }
    return resolveDisplayStreak({
      currentStreak: initialGamification?.current_streak,
      lastActiveDate: initialGamification?.last_active_date,
      dailyActivity:
        initialSecondary?.dailyActivity && initialSecondary.dailyActivity.length > 0
          ? initialSecondary.dailyActivity
          : null,
    });
  });

  useEffect(() => {
    if (studentCtx?.profile && !profile) {
      setProfile(studentCtx.profile);
    }
  }, [studentCtx?.profile, profile]);

  useEffect(() => {
    if (studentCtx?.wordSummary) {
      const ws = studentCtx.wordSummary;
      if (ws.total > 0 || ws.reviewDueCount > 0 || ws.newCount > 0 || ws.dueCount > 0) {
        setTotalWords(ws.total);
        setNewCount(ws.newCount);
        setReviewDueCount(ws.reviewDueCount);
        if (Array.isArray(ws.levelCounts) && ws.levelCounts.length === 6 && ws.levelCounts.some((n) => n > 0)) {
          setLevelCounts(ws.levelCounts.map((n) => Number(n) || 0));
        }
        setCountsReady(true);
      }
    }
  }, [studentCtx?.wordSummary]);

  const [milestonePopup, setMilestonePopup] = useState<MilestonePopupPayload | null>(null);
  const prevSnapshotRef = useRef<{ level: number; badgeIds: string[]; streak: number } | null>(null);
  const loadStartedRef = useRef(false);

  const fetchClassrooms = async (): Promise<EnrolledClassroom[]> => {
    try {
      const res = await ClassroomApi.getClassrooms();
      const json = await res.json();
      if (json.success && Array.isArray(json.classrooms)) {
        setEnrolledClassrooms(json.classrooms);
        return json.classrooms as EnrolledClassroom[];
      }
    } catch (e) {
      console.error('[Student] Failed to fetch classrooms:', e);
    }
    return [];
  };

  const applySummaryCounts = (
    userId: string,
    data: {
      total?: number;
      newCount?: number;
      reviewDueCount?: number;
      dueCount?: number;
      classroomId?: string | null;
      levelCounts?: number[];
    },
    targetScope?: string,
  ) => {
    const hasTotal = typeof data.total === 'number';
    const hasNew = typeof data.newCount === 'number';
    const hasReview = typeof data.reviewDueCount === 'number';
    if (hasTotal) setTotalWords(data.total!);
    if (hasNew) setNewCount(data.newCount!);
    if (hasReview) setReviewDueCount(data.reviewDueCount!);
    let parsedLevels: number[] | undefined;
    if (Array.isArray(data.levelCounts) && data.levelCounts.length === 6) {
      const next = data.levelCounts.map((n) => Number(n) || 0);
      parsedLevels = next;
      setLevelCounts(next);
    }
    const rawData = data as Record<string, unknown>;
    if (typeof rawData.avgStabilityDays === 'number') {
      setAvgStabilityDays(rawData.avgStabilityDays);
    }
    if (typeof rawData.retentionRatePercent === 'number') {
      setRetentionRate(rawData.retentionRatePercent);
    }
    if (typeof rawData.grammarDueCount === 'number') {
      setGrammarDueCount(rawData.grammarDueCount);
    }
    if (rawData.skillScores && typeof rawData.skillScores === 'object') {
      const scores = rawData.skillScores as Record<string, unknown>;
      setSkillScores({
        vocabScore: Number(scores.vocabScore ?? 0),
        grammarScore: Number(scores.grammarScore ?? 0),
        reflexScore: Number(scores.reflexScore ?? 0),
        readingScore: Number(scores.readingScore ?? 0),
        listeningScore: Number(scores.listeningScore ?? 0),
      });
    }
    if (Array.isArray(rawData.weakWords)) {
      setServerWeakWords(
        rawData.weakWords.map((item) => {
          const w = (item ?? {}) as Record<string, unknown>;
          return {
            word: String(w.word || ''),
            meaning: String(w.translation || w.meaning || ''),
            level: Number(w.level ?? 1),
            stability: Number(Number(w.stability ?? 0).toFixed(1)),
          };
        }),
      );
    }
    if (data.classroomId) setClassroomId(data.classroomId);
    setCountsReady(true);

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
  };

  const loadActivityStats = (userId?: string) => {
    const uid = userId || profile?.id;
    void VocabApi.getStudentStats()
      .then((r) => r.json())
      .then((st) => {
        if (!st?.success) return;
        const payload = (st.data || st) as Record<string, unknown>;
        const activity: { date: string; count: number }[] = Array.isArray(payload.dailyActivity)
          ? (payload.dailyActivity as { date: string; count: number }[])
          : [];
        setDailyActivity(activity);
        if (typeof payload.studyStreak === 'number') {
          setStudyStreak(payload.studyStreak);
        }
        const totalToday =
          typeof payload.todayWords === 'number'
            ? payload.todayWords
            : typeof payload.todayKey === 'string'
              ? (activity.find((a) => a.date === payload.todayKey)?.count ?? 0)
              : 0;
        setTodayWords(totalToday);
        const nextTodayNew = typeof payload.todayNewWords === 'number' ? payload.todayNewWords : undefined;
        const nextTodayReview = typeof payload.todayReviewWords === 'number' ? payload.todayReviewWords : undefined;
        if (nextTodayNew !== undefined) {
          setTodayNewWords(nextTodayNew);
        }
        if (nextTodayReview !== undefined) {
          setTodayReviewWords(nextTodayReview);
        }
        if (typeof payload.avgStability === 'number') {
          setAvgStabilityDays(payload.avgStability);
        }
        if (typeof payload.retentionRate === 'number') {
          setRetentionRate(payload.retentionRate);
        }
        if (typeof payload.grammarDueCount === 'number') {
          setGrammarDueCount(payload.grammarDueCount);
        }
        if (payload.wordBreakdown && typeof payload.wordBreakdown === 'object') {
          const wb = payload.wordBreakdown as Record<string, unknown>;
          const nextLevels = [
            Number(wb.l1 ?? wb.level1 ?? 0),
            Number(wb.l2 ?? wb.level2 ?? 0),
            Number(wb.l3 ?? wb.level3 ?? 0),
            Number(wb.l4 ?? wb.level4 ?? 0),
            Number(wb.l5 ?? wb.level5 ?? 0),
            Number(wb.l6 ?? wb.level6 ?? 0),
          ];
          setLevelCounts(nextLevels);
        }
        if (payload.skillScores && typeof payload.skillScores === 'object') {
          const scores = payload.skillScores as Record<string, unknown>;
          setSkillScores({
            vocabScore: Number(scores.vocabScore ?? 0),
            grammarScore: Number(scores.grammarScore ?? 0),
            reflexScore: Number(scores.reflexScore ?? 0),
            readingScore: Number(scores.readingScore ?? 0),
            listeningScore: Number(scores.listeningScore ?? 0),
          });
        }
        if (Array.isArray(payload.quizHistory)) {
          setQuizTrend(
            payload.quizHistory.map((item) => {
              const q = (item ?? {}) as Record<string, unknown>;
              return {
                score: Number(q.score ?? 0),
                max_score: Number(q.total ?? q.totalQuestions ?? 10),
                completed_at: String(q.date || q.completedAt || new Date().toISOString()),
                quiz_type: String(q.type || q.quizType || 'vocabulary'),
              };
            }),
          );
        }
        if (Array.isArray(payload.weakWords)) {
          setServerWeakWords(
            payload.weakWords.map((item) => {
              const w = (item ?? {}) as Record<string, unknown>;
              return {
                word: String(w.word || ''),
                meaning: String(w.translation || w.meaning || ''),
                level: Number(w.level ?? 1),
                stability: Number(Number(w.stability ?? 0).toFixed(1)),
              };
            }),
          );
        }
        if (uid) {
          writeDashboardSecondaryCache(uid, {
            dailyActivity: activity,
            todayWords: totalToday,
            todayNewWords: nextTodayNew,
            todayReviewWords: nextTodayReview,
            studyStreak: typeof payload.studyStreak === 'number' ? payload.studyStreak : undefined,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const syncListening = () => {
      try {
        const allProgress = Object.values(getAllVideoWatchProgress());
        const todayKey = dateKeyInTimeZone(new Date());
        let todayCompleted = 0;
        let todayInProgress = 0;
        let totalCompleted = 0;

        for (const item of allProgress) {
          const itemDateKey = item.completedAt
            ? dateKeyInTimeZone(new Date(item.completedAt))
            : item.updatedAt
              ? dateKeyInTimeZone(new Date(item.updatedAt))
              : '';
          const isCompleted = item.completed || (item.percent ?? 0) >= 90;
          const pct = Math.round(item.percent ?? 0);

          if (isCompleted) {
            totalCompleted++;
            if (itemDateKey === todayKey) todayCompleted++;
          } else if (pct > 0) {
            if (itemDateKey === todayKey && pct > todayInProgress) {
              todayInProgress = pct;
            }
          }
        }

        setListeningStats({
          completedCount: todayCompleted,
          inProgressPercent: todayInProgress,
          totalCompleted,
        });
      } catch {
        // ignore
      }
    };
    syncListening();
    window.addEventListener('lingo_listening_watch_updated', syncListening);
    return () => window.removeEventListener('lingo_listening_watch_updated', syncListening);
  }, []);

  useEffect(() => {
    setStudyStreak(
      resolveDisplayStreak({
        currentStreak: gamification.current_streak,
        lastActiveDate: gamification.last_active_date,
        dailyActivity: dailyActivity.length > 0 ? dailyActivity : null,
      }),
    );
  }, [dailyActivity, gamification.current_streak, gamification.last_active_date]);

  const loadSecondaryDashboard = (userId: string, targetScope?: string) => {
    const scope = targetScope !== undefined ? targetScope : currentClassScope;
    const scopeParam =
      scope && scope !== '__personal__' ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';

    loadActivityStats(userId);

    void ReadingApi.getDailyReading('/api/practice/daily-reading')
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success || !Array.isArray(json.exercises)) return;
        const exercises: Array<{
          title?: string;
          sourceWords?: unknown[];
          completion?: { completedAt?: string } | null;
        }> = json.exercises;
        const totalCount = exercises.length;
        const completedCount = exercises.filter((e) => Boolean(e.completion?.completedAt)).length;
        const unfinished = exercises.find((e) => !e.completion?.completedAt);
        const nextStatus: DailyReadingStatus = {
          hasNew: Boolean(json.hasNew && unfinished),
          title: unfinished?.title || 'Bài đọc hàng ngày',
          wordCount: unfinished?.sourceWords?.length || 0,
          completedCount,
          totalCount,
        };
        setDailyReadingStatus(nextStatus);
        writeDashboardSecondaryCache(userId, { dailyReadingStatus: nextStatus });
        writeDailyReadingCache(userId, {
          exercises: json.exercises,
          canGenerateToday: json.canGenerateToday,
          hasNew: json.hasNew,
          hasUncompleted: json.hasUncompleted,
          uncompletedExerciseId: json.uncompletedExerciseId,
        });
      })
      .catch(() => {});

    void VocabApi.getPacks()
      .then((response) => response.json())
      .then((packData: { success?: boolean; packs?: ActiveVocabPack[] }) => {
        if (!packData.success || !packData.packs) return;
        setVocabPacks(packData.packs);
        writeDashboardSecondaryCache(userId, { vocabPacks: packData.packs });
      })
      .catch(() => {});

    const loadLevelsFallback = () => {
      if (levelCountsRef.current.some((n) => n > 0)) return;
      void VocabApi.getWords(`/api/words?summary=1&levels=1${scopeParam}`)
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum, scope);
        })
        .catch(() => {});
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(loadLevelsFallback, { timeout: 2500 });
    } else {
      setTimeout(loadLevelsFallback, 1000);
    }
  };

  const loadData = async (userId: string, targetScope?: string) => {
    const scope = targetScope !== undefined ? targetScope : currentClassScopeRef.current;
    const scopeParam =
      scope && scope !== '__personal__' ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
    try {
      if (STAMPEDE_MODE) {
        const profPromise =
          studentCtx?.profile || profile
            ? Promise.resolve({ data: studentCtx?.profile || profile, error: null })
            : AuthApi.getLegacyProfile(userId)
                .then((data) => ({ data, error: null }))
                .catch((err: unknown) => ({
                  data: null,
                  error: { message: err instanceof Error ? err.message : 'Profile fetch failed' },
                }));

        if (!scope || scope === '__personal__') {
          void fetchWordSummaryOnce(userId).then((sum) => {
            if (sum) applySummaryCounts(userId, sum, scope);
          });
        } else {
          void VocabApi.getWords(`/api/words?summary=1${scopeParam}`)
            .then((r) => r.json())
            .then((sum) => {
              if (sum?.success) applySummaryCounts(userId, sum, scope);
            })
            .catch(() => {});
        }

        const [profRes, wordsJson] = await Promise.all([
          profPromise,
          VocabApi.getWords(`/api/words?limit=${WORDS_PAGE_SIZE}&offset=0&noCount=1${scopeParam}`)
            .then((r) => r.json())
            .catch(() => null),
        ]);

        if (profRes.error) {
          console.warn('[Student] Profile REST lookup fallback:', profRes.error.message);
        } else if (profRes.data) {
          const freshProfile = profRes.data as Profile;
          setProfile(freshProfile);
          writeDashboardProfileCache(userId, freshProfile);
        }

        if (wordsJson?.success) {
          const freshWords = wordsJson.data || [];
          setWords(freshWords);
          if (!scope || scope === '__personal__') {
            writeDashboardWordsCache(userId, freshWords);
          }
          setClassroomId(wordsJson.classroomId ?? null);
          setWordsOffset(WORDS_PAGE_SIZE);
          applySummaryCounts(userId, wordsJson, scope);
        }
        setWordsLoading(false);

        loadSecondaryDashboard(userId, scope);
        return;
      }

      const summaryP = VocabApi.getWords(`/api/words?summary=1${scopeParam}`)
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum, scope);
          return sum;
        })
        .catch(() => null);

      const [profRes] = await Promise.all([
        AuthApi.getLegacyProfile(userId)
          .then((data) => ({ data, error: null }))
          .catch((err: unknown) => ({
            data: null,
            error: { message: err instanceof Error ? err.message : 'Profile fetch failed' },
          })),
        summaryP,
      ]);

      if (profRes.error) {
        console.error('[Student] Load profile failed:', profRes.error.message);
        setWordsLoading(false);
        return;
      }
      if (profRes.data) {
        const freshProfile = profRes.data as Profile;
        setProfile(freshProfile);
        writeDashboardProfileCache(userId, freshProfile);
      }
      setIsLoading(false);
      setWordsLoading(true);

      loadSecondaryDashboard(userId, scope);

      try {
        const wordsJson = await VocabApi.getWords(`/api/words?limit=${WORDS_PAGE_SIZE}&offset=0${scopeParam}`)
          .then((r) => r.json())
          .catch(() => null);

        if (wordsJson?.success) {
          const freshWords = wordsJson.data || [];
          setWords(freshWords);
          if (!scope || scope === '__personal__') {
            writeDashboardWordsCache(userId, freshWords);
          }
          setClassroomId(wordsJson.classroomId ?? null);
          setWordsOffset(WORDS_PAGE_SIZE);
          if (typeof wordsJson.newCount === 'number' || typeof wordsJson.reviewDueCount === 'number') {
            applySummaryCounts(userId, wordsJson, scope);
          } else if (typeof wordsJson.total === 'number') {
            setTotalWords(wordsJson.total);
          }
        }
      } finally {
        setWordsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Load Dashboard error:', msg);
      setWordsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await authService.getSession();
      if (error) {
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        let initialScope = '__personal__';
        if (typeof window !== 'undefined') {
          const p = new URLSearchParams(window.location.search);
          const classParam = p.get('class');
          if (classParam) {
            initialScope = classParam;
            currentClassScopeRef.current = classParam;
            setCurrentClassScope(classParam);
          }
        }

        if (initialScope === '__personal__') {
          const cached =
            (studentCtx?.wordSummary.total ?? 0) > 0 ? studentCtx!.wordSummary : readWordSummaryCache(session.user.id);
          if (cached) {
            setTotalWords(cached.total);
            setNewCount(cached.newCount);
            setReviewDueCount(cached.reviewDueCount);
            if (
              Array.isArray(cached.levelCounts) &&
              cached.levelCounts.length === 6 &&
              cached.levelCounts.some((n) => n > 0)
            ) {
              setLevelCounts(cached.levelCounts.map((n) => Number(n) || 0));
            }
            if (cached.classroomId) setClassroomId(cached.classroomId);
            setCountsReady(true);
          }
        }

        void fetchClassrooms();

        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          void loadData(session.user.id, initialScope);
        }
      } else {
        setIsLoading(false);
        const redirectPath =
          typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/student';
        router.replace(`/auth?redirectTo=${encodeURIComponent(redirectPath)}`);
      }
    };
    void checkAuth();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void fetchClassrooms();
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          void loadData(session.user.id, currentClassScopeRef.current);
        }
      } else if (event === 'SIGNED_OUT') {
        loadStartedRef.current = false;
        router.replace('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const loadMoreWords = async () => {
    if (!profile?.id || isLoadingMore) return;
    setIsLoadingMore(true);
    const scope = currentClassScopeRef.current;
    const scopeParam =
      scope && scope !== '__personal__' ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
    try {
      const res = await VocabApi.getWords(`/api/words?limit=${WORDS_PAGE_SIZE}&offset=${wordsOffset}${scopeParam}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setWords((prev) => [...prev, ...data.data]);
        setWordsOffset((prev) => prev + WORDS_PAGE_SIZE);
        setTotalWords(data.total || totalWords);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Words] Load more error:', msg);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refreshSummary = async (userId: string) => {
    try {
      const scope = currentClassScopeRef.current;
      const scopeParam =
        scope && scope !== '__personal__' ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
      const res = await VocabApi.getWords(`/api/words?summary=1${scopeParam}`);
      const data = await res.json();
      if (data.success) {
        applySummaryCounts(userId, data, scope);
        const now = Date.now();
        setWords((prev) =>
          prev.map((w) => {
            const nextReviewDate = w.srs?.next_review_date ? new Date(w.srs.next_review_date).getTime() : now;
            return { ...w, isDue: !w.srs || nextReviewDate <= now };
          }),
        );
      }
    } catch {
      // silent fail
    }
  };

  const handleSwitchScope = (newScope: string) => {
    if (newScope === currentClassScope) return;
    currentClassScopeRef.current = newScope;
    setCurrentClassScope(newScope);
    setWords([]);
    setWordsOffset(0);
    setWordsLoading(true);
    setCountsReady(false);
    const resetLevels = [0, 0, 0, 0, 0, 0];
    levelCountsRef.current = resetLevels;
    setLevelCounts(resetLevels);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newScope && newScope !== '__personal__') {
        url.searchParams.set('class', newScope);
      } else {
        url.searchParams.delete('class');
      }
      window.history.replaceState({}, '', url.toString());
    }

    if (profile?.id) {
      void loadData(profile.id, newScope);
    }
  };

  useEffect(() => {
    if (words.length === 0) return;

    const sortedWords = [...words]
      .filter((w) => w.srs?.next_review_date)
      .sort((a, b) => new Date(a.srs!.next_review_date).getTime() - new Date(b.srs!.next_review_date).getTime());

    const soonestWord = sortedWords.find((w) => new Date(w.srs!.next_review_date) > new Date());
    if (!soonestWord) {
      setCountdown('');
      return;
    }

    const targetDate = new Date(soonestWord.srs?.next_review_date || Date.now());
    let firedReady = false;

    const tick = () => {
      const diff = targetDate.getTime() - Date.now();

      if (diff <= 0) {
        setCountdown((prev) => (prev === 'Ready!' ? prev : 'Ready!'));
        if (!firedReady && profile?.id) {
          firedReady = true;
          void refreshSummary(profile.id);
        }
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      const next = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
      setCountdown((prev) => (prev === next ? prev : next));
    };

    tick();
    const ms = targetDate.getTime() - Date.now() < 120_000 ? 1000 : 5000;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: track words & profile.id
  }, [words, profile?.id]);

  useEffect(() => {
    if (STAMPEDE_MODE || !profile?.id) return;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshSummary(profile.id);
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: poll summary when visible
  }, [profile?.id]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredWords = useMemo(() => {
    let result = [...words];
    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (w) =>
          w.word?.toLowerCase().includes(q) ||
          w.translation?.toLowerCase().includes(q) ||
          w.ipa?.toLowerCase().includes(q) ||
          w.pos?.toLowerCase().includes(q),
      );
    }
    if (statusFilter === 'new') result = result.filter((w) => !w.srs || w.srs.review_count === 0);
    else if (statusFilter === 'due') result = result.filter((w) => w.isDue);
    else if (statusFilter === 'learned') result = result.filter((w) => w.srs && w.srs.review_count > 0 && !w.isDue);
    else if (statusFilter === 'mastered') result = result.filter((w) => (w.srsLevel ?? 0) >= 5);

    if (sortBy === 'oldest')
      result.sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime());
    else if (sortBy === 'az') result.sort((a, b) => (a.word ?? '').localeCompare(b.word ?? ''));
    else if (sortBy === 'hardest') result.sort((a, b) => (b.srs?.difficulty ?? 0) - (a.srs?.difficulty ?? 0));
    else result.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

    return result;
  }, [words, debouncedQuery, statusFilter, sortBy]);

  const masteredCount = useMemo(
    () =>
      levelCounts.length >= 5 && levelCounts.some((n) => n > 0)
        ? (levelCounts[4] || 0) + (levelCounts[5] || 0)
        : words.filter((w) => (w.srsLevel ?? 0) >= 5).length,
    [levelCounts, words],
  );

  useEffect(() => {
    if (!profile?.id || gamificationLoading) return;
    const currentLevel = xpToLevel(gamification.total_xp);
    const earned = earnedBadges({ ...gamification, current_streak: studyStreak }, masteredCount).filter((b) => b.earned);
    const currentBadges = earned.map((b) => b.id);

    const prev = prevSnapshotRef.current;

    if (!prev) {
      prevSnapshotRef.current = {
        level: currentLevel,
        badgeIds: currentBadges,
        streak: studyStreak,
      };
      try {
        sessionStorage.setItem(`milestone_level_${currentLevel}`, '1');
      } catch {
        /* ignore */
      }
      return;
    }

    const alreadyShown = (key: string) => {
      try {
        return sessionStorage.getItem(key) === '1';
      } catch {
        return false;
      }
    };
    const markShown = (key: string) => {
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    };

    if (currentLevel > prev.level) {
      const ssKey = `milestone_level_${currentLevel}`;
      if (!alreadyShown(ssKey)) {
        markShown(ssKey);
        setMilestonePopup({ kind: 'level', value: currentLevel, intensity: 'epic' });
      }
    } else {
      const newBadgeId = currentBadges.find((id) => !prev.badgeIds.includes(id));
      if (newBadgeId) {
        const ssKey = `milestone_badge_${newBadgeId}`;
        if (!alreadyShown(ssKey)) {
          markShown(ssKey);
          const label = earned.find((b) => b.id === newBadgeId)?.label;
          setMilestonePopup({
            kind: 'badge',
            badgeLabel: label,
            intensity: 'strong',
          });
        }
      } else {
        const hitStreak =
          (STREAK_MILESTONES as readonly number[]).includes(studyStreak) && studyStreak > prev.streak;
        if (hitStreak) {
          const ssKey = `milestone_streak_${studyStreak}`;
          if (!alreadyShown(ssKey)) {
            markShown(ssKey);
            setMilestonePopup({ kind: 'streak', value: studyStreak, intensity: 'strong' });
          }
        }
      }
    }

    prevSnapshotRef.current = {
      level: currentLevel,
      badgeIds: currentBadges,
      streak: studyStreak,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: compare previous vs new snapshot
  }, [gamification.total_xp, gamificationLoading, studyStreak, masteredCount, profile?.id]);

  const handleUpdateMeaning = async (wordId: string, translation: string, pos: string, ipa?: string) => {
    try {
      const res = await VocabApi.updateWord({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, translation, pos, ipa }),
      });
      if (res.ok) {
        toast.success('✅ Meaning updated!');
        setSelectedWord(null);
        if (profile?.id) void loadData(profile.id, currentClassScopeRef.current);
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('❌ Failed to update meaning');
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim() || isJoining) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      interface JoinResponse {
        success: boolean;
        data?: { id: string; name: string; teacher_id: string; enrollment_count: number | null };
        error?: string;
      }
      const res = await ClassroomApi.joinClassroom({
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
        void fetchClassrooms();
        handleSwitchScope(result.data.id);
      }
      setIsJoinModalOpen(false);
      setJoinCode('');
    } catch {
      setJoinError('Kết nối thất bại, vui lòng thử lại.');
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const jc = params.get('joinClass');
      if (jc) {
        setJoinError(null);
        setJoinCode(jc === '1' ? '' : jc.toUpperCase());
        setIsJoinModalOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('joinClass');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  const activeClassroom = useMemo(() => {
    if (!currentClassScope || currentClassScope === '__personal__') return null;
    return enrolledClassrooms.find((c) => c.id === currentClassScope) || null;
  }, [currentClassScope, enrolledClassrooms]);

  const [showVaultWords, setShowVaultWords] = useState(false);

  const todayFormattedDate = useMemo(() => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${days[now.getDay()]}, ${dd}/${mm}`;
  }, []);

  const badges = useMemo(
    () => earnedBadges({ ...gamification, current_streak: studyStreak }, masteredCount),
    [gamification, studyStreak, masteredCount],
  );

  const reviewHref =
    currentClassScope && currentClassScope !== '__personal__'
      ? `/review?class=${encodeURIComponent(currentClassScope)}`
      : '/review';

  const learnHref =
    currentClassScope && currentClassScope !== '__personal__'
      ? `/flashcard?mode=learn&class=${encodeURIComponent(currentClassScope)}`
      : '/flashcard?mode=learn';

  const dailyGoalXp = gamification.daily_goal || 30;
  const firstName = profile?.full_name?.split(' ')[0] || 'bạn';

  const weekDaysStrip = useMemo(() => {
    const activityMap = new Map<string, number>();
    for (const item of dailyActivity) {
      activityMap.set(item.date, item.count);
    }
    const shortLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const result: Array<{ key: string; label: string; done: boolean; isToday: boolean }> = [];
    const now = new Date();
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);
      const dateKey = dateKeyInTimeZone(d);
      const count = activityMap.get(dateKey) ?? 0;
      const isToday = offset === 0;
      const done = count > 0 || (isToday && (todayWords > 0 || gamification.today_xp > 0));
      result.push({
        key: dateKey,
        label: shortLabels[d.getDay()],
        done,
        isToday,
      });
    }
    return result;
  }, [dailyActivity, todayWords, gamification.today_xp]);

  const activePack = useMemo(() => {
    if (!vocabPacks.length) return null;
    return (
      vocabPacks.find((p) => p.status === 'in_progress') ||
      vocabPacks.find((p) => p.status === 'not_started') ||
      vocabPacks[0]
    );
  }, [vocabPacks]);

  const activePackPct =
    activePack && activePack.word_count > 0
      ? Math.min(100, Math.round((activePack.reviewed_count / activePack.word_count) * 100))
      : 0;

  const activePackHref =
    activePack && activePack.status === 'in_progress' && activePack.words?.length
      ? `/flashcard?mode=learn&ids=${activePack.words
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((w) => encodeURIComponent(w.word_id))
          .join(',')}`
      : '/journey';

  const priorityWords = useMemo(() => {
    const weak = words.filter((w) => w.isDue || (w.srsLevel ?? 1) <= 2);
    return (weak.length > 0 ? weak : words).slice(0, 4);
  }, [words]);

  const analyticsWeakWords = useMemo(
    () =>
      serverWeakWords.length > 0
        ? serverWeakWords
        : words
            .filter((w) => (w.srs?.review_count ?? 0) > 0 && (w.srsLevel ?? 1) <= 2)
            .slice(0, 6)
            .map((w) => ({
              word: w.word,
              meaning: w.translation || '',
              level: w.srsLevel || 1,
              stability: Number((w.srs?.stability ?? 1).toFixed(1)),
            })),
    [serverWeakWords, words],
  );

  const handleProTrialClaimed = () => {
    void refreshGamification();
    if (!profile?.id) return;
    void AuthApi.getLegacyProfile(profile.id)
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => {});
  };

  const handleWordDeleted = (deletedId: string) => {
    setWords((prev) => prev.filter((w) => w.id !== deletedId));
    setTotalWords((prev) => Math.max(0, prev - 1));
  };

  return {
    isDesktop,
    profile,
    words,
    classroomId,
    currentClassScope,
    enrolledClassrooms,
    dailyActivity,
    todayNewWords,
    countdown,
    selectedWord,
    setSelectedWord,
    selectedWordId,
    setSelectedWordId,
    dailyReadingStatus,
    listeningStats,
    isJoinModalOpen,
    setIsJoinModalOpen,
    joinCode,
    setJoinCode,
    isJoining,
    joinError,
    setJoinError,
    actionModalType,
    setActionModalType,
    totalWords,
    newCount,
    reviewDueCount,
    levelCounts,
    countsReady,
    wordsLoading,
    isLoadingMore,
    avgStabilityDays,
    retentionRate,
    grammarDueCount,
    skillScores,
    quizTrend,
    serverWeakWords,
    analyticsWeakWords,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    statusFilter,
    setStatusFilter,
    gamification,
    studyStreak,
    milestonePopup,
    setMilestonePopup,
    filteredWords,
    activeClassroom,
    showVaultWords,
    setShowVaultWords,
    todayFormattedDate,
    badges,
    reviewHref,
    learnHref,
    dailyGoalXp,
    firstName,
    weekDaysStrip,
    activePack,
    activePackPct,
    activePackHref,
    priorityWords,
    loadMoreWords,
    handleSwitchScope,
    handleUpdateMeaning,
    handleJoinClassroom,
    handleProTrialClaimed,
    handleWordDeleted,
  };
}
