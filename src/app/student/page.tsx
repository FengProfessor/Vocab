'use client';

import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { Profile, Word } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Loader2, Plus, ArrowRight,
  X, Clock, UserPlus, Search, ChevronDown, Sparkles,
  BookOpen, RotateCw,
  Headphones, Mic, PenTool, FileText, Code2, SlidersHorizontal,
  Users, Flame, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { WordCardSkeleton } from '@/components/ui/WordCardSkeleton';
import { useGamification } from '@/hooks/useGamification';
import {
  dateKeyInTimeZone,
  earnedBadges,
  lastActiveFromActivity,
  resolveDisplayStreak,
  xpToLevel,
} from '@/lib/gamification';
import { STREAK_MILESTONES } from '@/lib/encouragement';
import { Mascot, type MascotMood } from '@/components/gamification/Mascot';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { ProTrialMilestoneCard } from '@/components/gamification/ProTrialMilestoneCard';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';
import { StudentShell } from '@/components/student/StudentShell';
import { NotificationBell } from '@/components/NotificationBell';
import { EnableNotifications } from '@/components/EnableNotifications';
import { ActionSelectionModal, type ActionSelectionType } from '@/components/student/ActionSelectionModal';
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
  clearDashboardSnapshotCache,
} from '@/lib/dashboard-snapshot-cache';
import { SRS_LEVEL_LABELS, SRS_LEVEL_STABILITY_HINT } from '@/lib/srs';
import { STAMPEDE_MODE } from '@/lib/stampede';
import { parseIpa } from '@/lib/study';
import { getAllVideoWatchProgress } from '@/lib/listening-recommendation';

// Modal — chỉ tải khi mở / sau shell
const WordDetailModal = dynamic(
  () => import('@/components/student/WordDetailModal').then((m) => m.WordDetailModal),
  { ssr: false }
);
const BadgeGrid = dynamic(
  () => import('@/components/gamification/BadgeGrid').then((m) => m.BadgeGrid),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> }
);
const MilestonePopup = dynamic(
  () => import('@/components/gamification/MilestonePopup').then((m) => m.MilestonePopup),
  { ssr: false }
);
import { useStudentContext, fetchWordSummaryOnce, fetchProfileOnce } from '@/components/student/StudentProvider';
const ChallengeWidget = dynamic(
  () => import('@/components/challenge/ChallengeWidget').then((m) => m.ChallengeWidget),
  { ssr: false }
);

function useIsDesktop(breakpoint = 768): boolean {
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

interface DailyReadingStatus {
  hasNew: boolean;
  title: string;
  wordCount: number;
  completedCount: number;
  totalCount: number;
}

/** Compact notification card: "You have a daily reading exercise!" */
function DailyReadingCard({ status }: { status: DailyReadingStatus }) {
  if (!status.hasNew) return null;

  return (
    <Link
      href="/practice/daily-reading"
      className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white px-3 py-2.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">
        🌅
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-indigo-900">Bài luyện đọc mới!</p>
        <p className="mt-0.5 truncate text-[11px] text-indigo-700/80">
          &ldquo;{status.title}&rdquo; · {status.wordCount} từ · Đọc + quiz + điền từ
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400" />
    </Link>
  );
}


interface ActiveVocabPack {
  pack_id: string;
  topic_title: string;
  pack_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  word_count: number;
  reviewed_count: number;
  words: Array<{ word_id: string; position: number }>;
}

interface EnrolledClassroom {
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

export default function StudentDashboard() {
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
  const [todayReviewWords, setTodayReviewWords] = useState(() => initialSecondary?.todayReviewWords ?? 0);
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
  // Join classroom modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Action Selection Modal State (Ô vuông 1cm trên mobile / Modal rộng trên desktop)
  const [actionModalType, setActionModalType] = useState<ActionSelectionType | null>(null);
  // Pagination state cho word list - Khởi tạo tức thì Frame 0 từ Context hoặc Cache
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
  /** Phân bố SRS L1–L6 full kho (từ API summary hoặc cache Frame 0) */
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
  const totalWordsRef = useRef<number>(totalWords);
  useEffect(() => {
    totalWordsRef.current = totalWords;
  }, [totalWords]);
  /** Sẵn sàng hiển thị số đếm ngay từ Frame 0 nếu đã có cache */
  const [countsReady, setCountsReady] = useState(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    return Boolean(cached);
  });
  /** word list load sau shell — nếu có cached words thì render ngay không skeleton */
  const [wordsLoading, setWordsLoading] = useState(() => !initialWords || initialWords.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [wordsOffset, setWordsOffset] = useState(() => initialWords?.length ?? 0);
  const WORDS_PAGE_SIZE = 20;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'due' | 'learned' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'hardest'>('newest');
  const router = useRouter();
  const initialGamification = studentCtx?.gamification ?? readLastGamificationCache();
  const { data: fallbackGamification, refresh: fallbackRefreshGamification, loading: fallbackGamificationLoading } = useGamification(
    studentCtx ? null : (profile?.id ?? null),
  );
  const gamification = studentCtx ? studentCtx.gamification : (fallbackGamification ?? initialGamification ?? {
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
  /** Streak hiển thị = ngày LIÊN TIẾP từ heatmap (không dùng raw current_streak / tổng ngày học). */
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

  // Sync profile when studentCtx resolves
  useEffect(() => {
    if (studentCtx?.profile && !profile) {
      setProfile(studentCtx.profile);
    }
  }, [studentCtx?.profile, profile]);

  // Sync wordSummary counts when studentCtx updates
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

  // Popup chúc mừng mốc (level / badge / streak)
  const [milestonePopup, setMilestonePopup] = useState<MilestonePopupPayload | null>(null);
  const prevSnapshotRef = useRef<{ level: number; badgeIds: string[]; streak: number } | null>(null);

  // Chặn double-load: getSession + onAuthStateChange SIGNED_IN/INITIAL_SESSION
  const loadStartedRef = useRef(false);

  const fetchClassrooms = async (): Promise<EnrolledClassroom[]> => {
    try {
      const res = await authFetch('/api/student/classrooms', {});
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

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Student] Auth check started');
      const { data: { session }, error } = await supabase.auth.getSession();
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

        // Stale-while-revalidate: paint counts từ cache ngay (chỉ cho personal scope)
        if (initialScope === '__personal__') {
          const cached = (studentCtx?.wordSummary.total ?? 0) > 0
            ? studentCtx!.wordSummary
            : readWordSummaryCache(session.user.id);
          if (cached) {
            setTotalWords(cached.total);
            setNewCount(cached.newCount);
            setReviewDueCount(cached.reviewDueCount);
            if (Array.isArray(cached.levelCounts) && cached.levelCounts.length === 6 && cached.levelCounts.some((n) => n > 0)) {
              setLevelCounts(cached.levelCounts.map((n) => Number(n) || 0));
            }
            if (cached.classroomId) setClassroomId(cached.classroomId);
            setCountsReady(true);
          }
        }

        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          void fetchClassrooms();
          loadData(session.user.id, initialScope);
        }
      } else {
        clearDashboardSnapshotCache();
        setIsLoading(false);
        const redirectPath = typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/student';
        router.replace(`/auth?redirectTo=${encodeURIComponent(redirectPath)}`);
      }
    };
    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Chỉ reload khi chưa load (tránh double với getSession)
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          void fetchClassrooms();
          loadData(session.user.id, currentClassScopeRef.current);
        }
      } else if (event === 'SIGNED_OUT') {
        loadStartedRef.current = false;
        router.replace('/auth');
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

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
    // Không ghi đè chart L1–L6 bằng [0,0,…] từ poll summary (không levels)
    if (Array.isArray(data.levelCounts) && data.levelCounts.length === 6) {
      const next = data.levelCounts.map((n) => Number(n) || 0);
      if (next.some((n) => n > 0)) {
        parsedLevels = next;
        setLevelCounts(next);
      }
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

  /** Heatmap + streak liên tiếp + phân tách từ mới/ôn tập hôm nay (stats lite). Gọi sau shell. */
  const loadActivityStats = (userId?: string) => {
    const uid = userId || profile?.id;
    void authFetch('/api/student/stats?lite=1', {})
      .then((r) => r.json())
      .then((st) => {
        if (!st?.success) return;
        const activity: { date: string; count: number }[] = st.data?.dailyActivity ?? [];
        setDailyActivity(activity);
        if (typeof st.data?.studyStreak === 'number') {
          setStudyStreak(st.data.studyStreak);
        }
        const totalToday =
          typeof st.data?.todayWords === 'number'
            ? st.data.todayWords
            : typeof st.data?.todayKey === 'string'
            ? (activity.find((a) => a.date === st.data.todayKey)?.count ?? 0)
            : 0;
        setTodayWords(totalToday);
        const nextTodayNew = typeof st.data?.todayNewWords === 'number' ? st.data.todayNewWords : undefined;
        const nextTodayReview = typeof st.data?.todayReviewWords === 'number' ? st.data.todayReviewWords : undefined;
        if (nextTodayNew !== undefined) {
          setTodayNewWords(nextTodayNew);
        }
        if (nextTodayReview !== undefined) {
          setTodayReviewWords(nextTodayReview);
        }
        if (uid) {
          writeDashboardSecondaryCache(uid, {
            dailyActivity: activity,
            todayWords: totalToday,
            todayNewWords: nextTodayNew,
            todayReviewWords: nextTodayReview,
            studyStreak: typeof st.data?.studyStreak === 'number' ? st.data.studyStreak : undefined,
          });
        }
      })
      .catch(() => {});
  };

  // Đồng bộ tiến độ Listening từ localStorage (getAllVideoWatchProgress)
  useEffect(() => {
    const syncListening = () => {
      try {
        const allProgress = Object.values(getAllVideoWatchProgress());
        const todayKey = dateKeyInTimeZone(new Date());
        let todayCompleted = 0;
        let todayInProgress = 0;
        let totalCompleted = 0;
        let maxInProgress = 0;

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
            // Chỉ tính tiến độ đang nghe nếu là bài học phát sinh trong ngày HÔM NAY
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

  // Đồng bộ streak hiển thị: ưu tiên heatmap liên tiếp, không tin raw current_streak
  useEffect(() => {
    setStudyStreak(
      resolveDisplayStreak({
        currentStreak: gamification.current_streak,
        lastActiveDate: gamification.last_active_date,
        dailyActivity: dailyActivity.length > 0 ? dailyActivity : null,
      }),
    );
  }, [dailyActivity, gamification.current_streak, gamification.last_active_date]);

  /** Levels L1–L6 + daily reading + packs — idle, không chặn first paint. */
  const loadSecondaryDashboard = (userId: string, targetScope?: string) => {
    const scope = targetScope !== undefined ? targetScope : currentClassScope;
    const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';

    loadActivityStats(userId);

    void authFetch('/api/practice/daily-reading')
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

    void authFetch('/api/vocab/packs', {})
      .then((response) => response.json())
      .then((packData: { success?: boolean; packs?: ActiveVocabPack[] }) => {
        if (!packData.success || !packData.packs) return;
        setVocabPacks(packData.packs);
        writeDashboardSecondaryCache(userId, { vocabPacks: packData.packs });
      })
      .catch(() => {});

    // Chỉ gọi fallback ?summary=1&levels=1 nếu user có từ (>0) nhưng sau summary=1 ban đầu levelCounts vẫn toàn số 0
    const loadLevelsFallback = () => {
      if (totalWordsRef.current === 0 || levelCountsRef.current.some((n) => n > 0)) return;
      void authFetch(`/api/words?summary=1&levels=1${scopeParam}`, {})
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
    const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
    try {
      if (STAMPEDE_MODE) {
        /**
         * CHẾ ĐỘ LỚP ĐÔNG (NEXT_PUBLIC_STAMPEDE_MODE=1, mặc định):
         * Critical path: profile + words kèm counts (shell nhanh).
         * Secondary (heatmap / đếm từ / levels / packs / daily reading): fire-and-forget sau shell.
         */
        const profPromise: Promise<{ data: Profile | null; error: { message?: string } | null }> = (studentCtx?.profile || profile)
          ? Promise.resolve({ data: studentCtx?.profile || profile, error: null })
          : fetchProfileOnce(userId).then((data) => ({ data, error: null }));

        if (!scope || scope === '__personal__') {
          void fetchWordSummaryOnce(userId).then((sum) => {
            if (sum) applySummaryCounts(userId, sum, scope);
          });
        } else {
          void authFetch(`/api/words?summary=1${scopeParam}`, {})
            .then((r) => r.json())
            .then((sum) => {
              if (sum?.success) applySummaryCounts(userId, sum, scope);
            })
            .catch(() => {});
        }

        const [profRes, wordsJson] = await Promise.all([
          profPromise,
          authFetch(
            `/api/words?limit=${WORDS_PAGE_SIZE}&offset=0&noCount=1${scopeParam}`,
            {},
          )
            .then((r) => r.json())
            .catch(() => null),
        ]);

        const profileErr = (profRes as { error?: { message?: string } | null })?.error;
        if (profileErr) {
          console.error('[Student] Load profile failed:', profileErr.message || profileErr);
          setWordsLoading(false);
          return;
        }
        if (profRes.data) {
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

        // Sau shell: heatmap + đếm từ hôm nay + chart L1–L6 (không chặn paint)
        loadSecondaryDashboard(userId, scope);
        return;
      }

      // ── Full mode (STAMPEDE=0): progressive load, đủ packs/grammar/heatmap ──
      const summaryP = authFetch(`/api/words?summary=1${scopeParam}`, {})
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum, scope);
          return sum;
        })
        .catch(() => null);

      const [profRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
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
        const wordsJson = await authFetch(
          `/api/words?limit=${WORDS_PAGE_SIZE}&offset=0${scopeParam}`,
          {},
        ).then((r) => r.json()).catch(() => null);

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

  // Load thêm words (Load More)
  const loadMoreWords = async () => {
    if (!profile?.id || isLoadingMore) return;
    setIsLoadingMore(true);
    const scope = currentClassScopeRef.current;
    const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
    try {
      const res = await authFetch(
        `/api/words?limit=${WORDS_PAGE_SIZE}&offset=${wordsOffset}${scopeParam}`,
        {},
      );
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

  // Auto-refresh nhẹ: chỉ dùng summary endpoint để cập nhật dueCount
  const refreshSummary = async (userId: string) => {
    try {
      const scope = currentClassScopeRef.current;
      const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
      const res = await authFetch(`/api/words?summary=1${scopeParam}`, {});
      const data = await res.json();
      if (data.success) {
        applySummaryCounts(userId, data, scope);
        const now = Date.now();
        setWords((prev) =>
          prev.map((w) => {
            const nextReviewDate = w.srs?.next_review_date ? new Date(w.srs.next_review_date).getTime() : now;
            return { ...w, isDue: !w.srs || nextReviewDate <= now };
          })
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

  // === Countdown: chỉ setState khi chuỗi đổi; Ready → refreshSummary (không full loadData) ===
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

      const next =
        h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
      setCountdown((prev) => (prev === next ? prev : next));
    };

    tick();
    const ms = targetDate.getTime() - Date.now() < 120_000 ? 1000 : 5000;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [words, profile?.id]);

  // Stampede: tắt poll 60s. Full mode: refresh summary khi tab visible.
  useEffect(() => {
    if (STAMPEDE_MODE || !profile?.id) return;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshSummary(profile.id);
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [profile?.id]);

  // Debounce search — must be before any early return (Rules of Hooks)
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
          w.pos?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'new') result = result.filter((w) => !w.srs || w.srs.review_count === 0);
    else if (statusFilter === 'due') result = result.filter((w) => w.isDue);
    else if (statusFilter === 'learned') result = result.filter((w) => w.srs && w.srs.review_count > 0 && !w.isDue);
    else if (statusFilter === 'mastered') result = result.filter((w) => (w.srsLevel ?? 0) >= 5);

    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime());
    else if (sortBy === 'az') result.sort((a, b) => (a.word ?? '').localeCompare(b.word ?? ''));
    else if (sortBy === 'hardest') result.sort((a, b) => (b.srs?.difficulty ?? 0) - (a.srs?.difficulty ?? 0));
    else result.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

    return result;
  }, [words, debouncedQuery, statusFilter, sortBy]);

  const masteredCount = useMemo(
    () => (
      levelCounts.length >= 5 && levelCounts.some((n) => n > 0)
        ? (levelCounts[4] || 0) + (levelCounts[5] || 0)
        : words.filter((w) => (w.srsLevel ?? 0) >= 5).length
    ),
    [levelCounts, words]
  );

  // === Detect mốc (level / badge / streak liên tiếp) → popup chúc mừng ===
  useEffect(() => {
    if (!profile?.id || gamificationLoading) return;
    const currentLevel = xpToLevel(gamification.total_xp);
    const earned = earnedBadges(
      { ...gamification, current_streak: studyStreak },
      masteredCount,
    ).filter((b) => b.earned);
    const currentBadges = earned.map((b) => b.id);

    const prev = prevSnapshotRef.current;

    if (!prev) {
      prevSnapshotRef.current = {
        level: currentLevel,
        badgeIds: currentBadges,
        streak: studyStreak,
      };
      try { sessionStorage.setItem(`milestone_level_${currentLevel}`, '1'); } catch { /* ignore */ }
      return;
    }

    const alreadyShown = (key: string) => {
      try { return sessionStorage.getItem(key) === '1'; } catch { return false; }
    };
    const markShown = (key: string) => {
      try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
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
          (STREAK_MILESTONES as readonly number[]).includes(studyStreak) &&
          studyStreak > prev.streak;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: so sánh snapshot cũ vs mới
  }, [gamification.total_xp, gamificationLoading, studyStreak, masteredCount, profile?.id]);

  const handleUpdateMeaning = async (wordId: string, translation: string, pos: string, ipa?: string) => {
    try {
      const res = await authFetch('/api/words', {
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
      const res = await authFetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      });
      const result: JoinResponse = await res.json();
      if (!res.ok || !result.success) {
        const msg =
          res.status === 404 ? 'Không tìm thấy lớp học. Kiểm tra lại mã.' :
          res.status === 409 ? 'Bạn đã tham gia lớp học này rồi.' :
          result.error ?? 'Đã có lỗi xảy ra.';
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

  // Tự động mở modal Tham gia lớp nếu truy cập /student?joinClass=...
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buổi sáng tốt lành';
    if (hour < 18) return 'Buổi chiều làm việc tốt';
    return 'Buổi tối vui vẻ';
  }, []);

  const mascotMood: MascotMood = reviewDueCount > 0 ? 'thinking' : newCount > 0 ? 'happy' : 'cheer';

  const badges = useMemo(
    () => earnedBadges({ ...gamification, current_streak: studyStreak }, masteredCount),
    [gamification, studyStreak, masteredCount]
  );

  const reviewHref =
    currentClassScope && currentClassScope !== '__personal__'
      ? `/review?class=${encodeURIComponent(currentClassScope)}`
      : '/review';

  const learnHref =
    currentClassScope && currentClassScope !== '__personal__'
      ? `/flashcard?mode=learn&class=${encodeURIComponent(currentClassScope)}`
      : '/flashcard?mode=learn';

  const reviewSessionHref = (mode: string) =>
    currentClassScope && currentClassScope !== '__personal__'
      ? `/review/session?mode=${mode}&class=${encodeURIComponent(currentClassScope)}`
      : `/review/session?mode=${mode}`;

  const todayReviewsComputed = todayReviewWords || Math.max(0, todayWords - todayNewWords);
  const reviewProgressPct = Math.min(
    100,
    Math.round(
      (todayReviewsComputed /
        Math.max(todayReviewsComputed + reviewDueCount, gamification.daily_goal || 20, 1)) *
        100
    )
  );
  const newWordsProgressPct = Math.min(
    100,
    Math.round((todayNewWords / Math.max(gamification.daily_goal || 10, 1)) * 100)
  );
  const listeningProgressPct = Math.max(
    0,
    Math.min(
      100,
      listeningStats.completedCount > 0
        ? listeningStats.completedCount * 34
        : listeningStats.inProgressPercent
    )
  );
  const readingProgressPct =
    dailyReadingStatus.totalCount > 0
      ? Math.min(
          100,
          Math.round((dailyReadingStatus.completedCount / dailyReadingStatus.totalCount) * 100)
        )
      : 0;

  return (
    <>
      <StudentShell
        title="Dashboard"
        contentClassName="p-0"
        hideMobileHeader
        profile={profile}
        gamification={gamification}
        reviewDueCount={reviewDueCount}
        newCount={newCount}
        classroomId={classroomId}
        onJoinClass={() => {
          setJoinError(null);
          setJoinCode('');
          setIsJoinModalOpen(true);
        }}
      >
        {isDesktop ? (
          /* ═════════════════════════════════════════════════════════════════════ */
          /* GIAO DIỆN MÁY TÍNH (if isDesktop — thiết kế rộng rãi chuẩn PC/Laptop) */
          /* ═════════════════════════════════════════════════════════════════════ */
          <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-2.5 px-6 py-2.5">
            {/* Greeting & Quick Meta */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mascot mood={mascotMood} size="sm" />
                <div className="flex items-baseline gap-2 min-w-0">
                  <h2 className="truncate text-[15px] font-black leading-tight text-foreground">
                    {greeting}, {profile?.full_name?.split(' ')[0] || 'bạn'}! 👋
                  </h2>
                  <span className="hidden md:inline truncate text-[11.5px] font-semibold text-muted-foreground">
                    {reviewDueCount > 0
                      ? `· ${reviewDueCount} từ cần ôn tập FSRS`
                      : newCount > 0
                        ? `· ${newCount} từ mới sẵn sàng hôm nay`
                        : '· Hoàn thành mục tiêu hôm nay 🎉'}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-slate-600">
                  {countsReady ? totalWords : '…'} từ tích lũy
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-emerald-700">
                  {masteredCount} master
                </span>
                {countdown && reviewDueCount === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-extrabold text-indigo-600">
                    <Clock className="h-2.5 w-2.5" />
                    {countdown}
                  </span>
                )}
              </div>
            </div>

            <EnableNotifications />
            <DailyReadingCard status={dailyReadingStatus} />
            <ChallengeWidget />

            {/* ── CTA CHÍNH TRÊN MÁY TÍNH: 2 THẺ COMPACT (Học Từ Mới & Ôn Tập FSRS) ── */}
            <div className="grid grid-cols-2 gap-2.5 items-stretch">
              {/* Thẻ Học Từ Mới */}
              <div className="group relative flex flex-col justify-between rounded-xl border border-indigo-300/70 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-2.5 px-3 text-white shadow-sm shadow-indigo-500/10 transition-all hover:shadow-md hover:shadow-indigo-500/20">
                <div className="flex items-center justify-between gap-2.5">
                  <Link
                    href={learnHref}
                    data-onboarding="learn"
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-base backdrop-blur-sm shadow-inner">
                      📖
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Học Từ Mới
                        </span>
                        <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9.5px] font-extrabold text-white backdrop-blur-sm tabular-nums">
                          {countsReady ? (newCount > 0 ? `${newCount} từ mới` : 'Tất cả') : '...'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-indigo-100 font-medium">
                        {newCount > 0 ? 'Thẻ lật thông minh nạp từ nhanh' : 'Học flashcard từ vựng đã lưu'}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={learnHref}
                    aria-label="Bắt đầu học từ mới"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-indigo-700 font-bold shadow-xs group-hover:translate-x-0.5 transition-transform"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Thanh chọn nhanh chế độ nạp từ trên máy tính */}
                <div className="mt-2 flex items-center gap-1 border-t border-white/15 pt-1.5">
                  <Link
                    href={learnHref}
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/20 px-2 text-[10.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    <span>🃏</span>
                    <span>Flashcard</span>
                  </Link>
                  <Link
                    href="/import"
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-indigo-50 backdrop-blur-sm transition hover:bg-white/25"
                  >
                    <span>📥</span>
                    <span>Tự nạp</span>
                  </Link>
                  <Link
                    href="/library"
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-indigo-50 backdrop-blur-sm transition hover:bg-white/25"
                  >
                    <span>📚</span>
                    <span>Thư viện</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActionModalType('learn')}
                    className="ml-auto inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25 cursor-pointer"
                    title="Mở bảng chọn phương thức nạp từ"
                  >
                    <SlidersHorizontal className="h-2.5 w-2.5" />
                    <span>Chế độ</span>
                  </button>
                </div>
              </div>

              {/* Thẻ Ôn Tập FSRS */}
              <div className="group relative flex flex-col justify-between rounded-xl border border-emerald-300/70 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2.5 px-3 text-white shadow-sm shadow-emerald-500/10 transition-all hover:shadow-md hover:shadow-emerald-500/20">
                <div className="flex items-center justify-between gap-2.5">
                  <Link
                    href={
                      currentClassScope && currentClassScope !== '__personal__'
                        ? `/review?class=${encodeURIComponent(currentClassScope)}`
                        : '/review'
                    }
                    data-onboarding="review"
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-base backdrop-blur-sm shadow-inner">
                      🔄
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Ôn Tập FSRS
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold backdrop-blur-sm tabular-nums ${
                            reviewDueCount > 0
                              ? 'bg-amber-400 text-amber-950 animate-pulse'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          {countsReady ? (reviewDueCount > 0 ? `${reviewDueCount} cần ôn` : 'Đã sẵn sàng') : '...'}
                        </span>
                        {countdown && reviewDueCount === 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-black/15 px-1.5 py-0.2 text-[9px] font-bold text-emerald-50 tabular-nums">
                            <Clock className="h-2.5 w-2.5" />
                            {countdown}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-emerald-100 font-medium">
                        {reviewDueCount > 0 ? 'Đến hạn ôn trước khi quên theo FSRS' : 'Ôn luyện tự do củng cố trí nhớ dài hạn'}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={reviewHref}
                    aria-label="Bắt đầu ôn tập FSRS"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 font-bold shadow-xs group-hover:translate-x-0.5 transition-transform"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Thanh chọn nhanh chế độ ôn tập FSRS trên máy tính */}
                <div className="mt-2 flex items-center gap-1 border-t border-white/15 pt-1.5">
                  <Link
                    href={reviewSessionHref('mixed')}
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/20 px-2 text-[10.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    <span>⚡</span>
                    <span>Hỗn hợp</span>
                  </Link>
                  <Link
                    href={reviewSessionHref('type')}
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25"
                  >
                    <span>⌨️</span>
                    <span>Gõ</span>
                  </Link>
                  <Link
                    href={reviewSessionHref('cloze')}
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25"
                  >
                    <span>🧩</span>
                    <span>Điền</span>
                  </Link>
                  <Link
                    href={reviewSessionHref('mcq')}
                    className="inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25"
                  >
                    <span>🎯</span>
                    <span>Trắc nghiệm</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActionModalType('review')}
                    className="ml-auto inline-flex h-5.5 items-center gap-1 rounded bg-white/15 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25 cursor-pointer"
                    title="Xem tất cả 5 chế độ ôn tập FSRS"
                  >
                    <SlidersHorizontal className="h-2.5 w-2.5" />
                    <span>Tất cả</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── LUYỆN THI CHUẨN HÓA (4 THẺ RỘNG CHUẨN DESKTOP — HIỂN THỊ NỔI BẬT ABOVE THE FOLD) ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Luyện thi chuẩn hóa</span>
                  </span>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.2 text-[9.5px] font-extrabold text-indigo-700">
                    4 Kỳ thi
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {/* 1. TOEIC */}
                <button
                  type="button"
                  onClick={() => setActionModalType('toeic')}
                  className="group relative flex min-h-[64px] items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2 px-3 shadow-2xs hover:border-indigo-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer text-left"
                >
                  <span className="absolute -top-1.5 right-2 rounded-full bg-indigo-600 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white whitespace-nowrap">
                    7 Parts
                  </span>
                  <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1 border border-slate-100">
                    <Image src="/images/exams/toeic.png" alt="TOEIC" width={52} height={26} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">TOEIC</div>
                    <div className="truncate text-[10px] font-medium text-slate-500">Đề thi & Từ vựng</div>
                  </div>
                </button>

                {/* 2. VSTEP */}
                <Link
                  href="/vstep"
                  className="group relative flex min-h-[64px] items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2 px-3 shadow-2xs hover:border-blue-300 hover:shadow-xs active:scale-[0.98] transition-all"
                >
                  <span className="absolute -top-1.5 right-2 rounded-full bg-blue-600 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white whitespace-nowrap">
                    B1–B2–C1
                  </span>
                  <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1 border border-slate-100">
                    <Image src="/images/exams/vstep.png" alt="VSTEP" width={52} height={26} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">VSTEP</div>
                    <div className="truncate text-[10px] font-medium text-slate-500">Chuẩn Bộ GD&ĐT</div>
                  </div>
                </Link>

                {/* 3. VNU Test */}
                <Link
                  href="/vnu-bac-3"
                  aria-label="VNU Test Bậc 3"
                  className="group relative flex min-h-[64px] items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2 px-3 shadow-2xs hover:border-emerald-300 hover:shadow-xs active:scale-[0.98] transition-all"
                >
                  <span className="absolute -top-1.5 right-2 rounded-full bg-emerald-600 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white whitespace-nowrap">
                    Bậc 3 / B1
                  </span>
                  <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1 border border-slate-100">
                    <Image src="/images/exams/vnu-test.png" alt="VNU Test" width={52} height={26} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800 group-hover:text-emerald-600 transition-colors">VNU Test</div>
                    <div className="truncate text-[10px] font-medium text-slate-500">Năng lực Ngoại ngữ</div>
                  </div>
                </Link>

                {/* 4. IELTS */}
                <button
                  type="button"
                  aria-label="IELTS (Đang cập nhật)"
                  onClick={() => toast.info('Chương trình Luyện thi IELTS đang được cập nhật')}
                  className="group relative flex min-h-[64px] items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2 px-3 shadow-2xs hover:border-amber-300 active:scale-[0.98] transition-all cursor-pointer text-left"
                >
                  <span className="absolute -top-1.5 right-2 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white whitespace-nowrap">
                    Sắp có
                  </span>
                  <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1 border border-slate-100">
                    <Image src="/images/exams/ielts.png" alt="IELTS" width={52} height={26} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800">IELTS</div>
                    <div className="truncate text-[10px] font-medium text-slate-500">Academic & GT</div>
                  </div>
                </button>
              </div>
            </div>

            {/* ── KỸ NĂNG THỰC HÀNH (5 THẺ RỘNG CHUẨN DESKTOP) ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Kỹ năng thực hành</span>
                  </span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.2 text-[9.5px] font-extrabold text-sky-700">
                    5 Kỹ năng
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {/* 1. Grammar */}
                <Link
                  href="/grammar"
                  className="group relative flex min-h-[64px] items-center gap-2 rounded-xl bg-sky-50/70 border border-sky-200/80 p-2 px-2.5 text-sky-700 shadow-2xs transition-all hover:border-sky-300 hover:bg-sky-50 hover:shadow-xs active:scale-[0.98]"
                >
                  <span className="absolute -top-1.5 right-1.5 rounded-full bg-sky-600 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white leading-tight">
                    A1–C1
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 shadow-2xs">
                    <Code2 className="w-3.5 h-3.5" strokeWidth={2.3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-sky-900">Grammar</div>
                    <div className="truncate text-[10px] font-semibold text-sky-700/80">Ngữ pháp ứng dụng</div>
                  </div>
                </Link>

                {/* 2. Reading */}
                <button
                  type="button"
                  onClick={() => setActionModalType('reading')}
                  className="group relative flex min-h-[64px] items-center gap-2 rounded-xl bg-amber-50/70 border border-amber-200/80 p-2 px-2.5 text-amber-700 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-xs active:scale-[0.98] cursor-pointer text-left"
                >
                  <span className="absolute -top-1.5 right-1.5 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white leading-tight tabular-nums">
                    {dailyReadingStatus.totalCount > 0
                      ? `${dailyReadingStatus.completedCount}/${dailyReadingStatus.totalCount}`
                      : '3 Chế độ'}
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-2xs">
                    <FileText className="w-3.5 h-3.5" strokeWidth={2.3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-amber-900">Reading</div>
                    <div className="truncate text-[10px] font-semibold text-amber-700/80">Đọc hiểu đa tầng</div>
                  </div>
                </button>

                {/* 3. Listening */}
                <button
                  type="button"
                  onClick={() => setActionModalType('listening')}
                  className="group relative flex min-h-[64px] items-center gap-2 rounded-xl bg-purple-50/70 border border-purple-200/80 p-2 px-2.5 text-purple-700 shadow-2xs transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-xs active:scale-[0.98] cursor-pointer text-left"
                >
                  <span className="absolute -top-1.5 right-1.5 rounded-full bg-purple-600 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white leading-tight tabular-nums">
                    {listeningStats.completedCount > 0
                      ? `${listeningStats.completedCount} bài`
                      : listeningStats.totalCompleted > 0
                      ? `${listeningStats.totalCompleted} bài`
                      : 'Video & ETS'}
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 shadow-2xs">
                    <Headphones className="w-3.5 h-3.5" strokeWidth={2.3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-purple-900">Listening</div>
                    <div className="truncate text-[10px] font-semibold text-purple-700/80">Luyện nghe thực tế</div>
                  </div>
                </button>

                {/* 4. Speaking */}
                <Link
                  href="/student/speaking/foundation"
                  aria-label="Luyện nói phản xạ Speaking"
                  className="group relative flex min-h-[64px] items-center gap-2 rounded-xl bg-rose-50/70 border border-rose-200/80 p-2 px-2.5 text-rose-700 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:shadow-xs active:scale-[0.98]"
                >
                  <span className="absolute -top-1.5 right-1.5 rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white leading-tight">
                    A0–C1
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-2xs">
                    <Mic className="w-3.5 h-3.5" strokeWidth={2.3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-rose-900">Speaking</div>
                    <div className="truncate text-[10px] font-semibold text-rose-700/80">Phản xạ nói AI</div>
                  </div>
                </Link>

                {/* 5. Writing */}
                <button
                  type="button"
                  aria-label="Writing (Sắp có)"
                  onClick={() => toast.info('Tính năng Luyện Writing sắp ra mắt')}
                  className="group relative flex min-h-[64px] items-center gap-2 rounded-xl bg-slate-100/80 border border-slate-200 p-2 px-2.5 text-slate-600 shadow-2xs transition-all hover:border-slate-300 active:scale-[0.98] cursor-pointer text-left"
                >
                  <span className="absolute -top-1.5 right-1.5 rounded-full bg-slate-500 text-white px-1.5 py-0.2 text-[8px] font-black shadow-2xs ring-1 ring-white leading-tight">
                    Sắp có
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-2xs">
                    <PenTool className="w-3.5 h-3.5 opacity-80" strokeWidth={2.3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-700">Writing</div>
                    <div className="truncate text-[10px] font-semibold text-slate-500">Luyện viết học thuật</div>
                  </div>
                </button>
              </div>
            </div>

            {/* ── KHU VỰC LỊCH THÁNG (col-span-5) & TIẾN ĐỘ NGÀY (col-span-7) CÂN ĐỐI CHIỀU CAO ── */}
            <div className="grid grid-cols-12 gap-2.5 items-stretch">
              <div className="col-span-12 lg:col-span-5 min-w-0">
                <StreakCounter
                  streak={studyStreak}
                  lastActiveDate={
                    lastActiveFromActivity(dailyActivity) ?? gamification.last_active_date
                  }
                  variant="calendar"
                  dailyCounts={dailyActivity}
                  className="h-full min-w-0"
                />
              </div>

              <div className="col-span-12 lg:col-span-7 flex h-full min-w-0 flex-col justify-between rounded-xl border border-[#e9e9f0] bg-white p-2.5 px-3 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="flex items-center gap-1.5 text-[11.5px] font-black text-slate-800">
                    🎯 <span>Tiến độ ngày hôm nay</span>
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.2 text-[10px] font-extrabold text-amber-700 tabular-nums">
                    ⭐ {gamification.today_xp} / {gamification.daily_goal || 30} XP
                  </span>
                </div>

                {/* 1. Ôn tập */}
                <div
                  onClick={() => setActionModalType('review')}
                  className="group block space-y-0.5 rounded-lg p-0.5 -mx-0.5 hover:bg-emerald-50/60 active:scale-[0.99] transition-all cursor-pointer"
                  title="Bấm để chọn chế độ ôn tập"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                      <span className="inline-block font-black leading-none text-emerald-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Ôn tập từ vựng</span>
                    </span>
                    <span className="font-black text-emerald-700 tabular-nums">
                      {countsReady ? `${todayReviewsComputed} lượt` : '…'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${reviewProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Từ mới */}
                <div
                  onClick={() => setActionModalType('learn')}
                  className="group block space-y-0.5 rounded-lg p-0.5 -mx-0.5 hover:bg-indigo-50/60 active:scale-[0.99] transition-all cursor-pointer"
                  title="Bấm để chọn phương thức nạp từ"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1 group-hover:text-indigo-700 transition-colors">
                      <span className="inline-block font-black leading-none text-indigo-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Nạp từ mới</span>
                    </span>
                    <span className="font-black text-indigo-700 tabular-nums">
                      {todayNewWords} / {gamification.daily_goal || 10} từ
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${newWordsProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* 3. Listening */}
                <div
                  onClick={() => setActionModalType('listening')}
                  className="group block space-y-0.5 rounded-lg p-0.5 -mx-0.5 hover:bg-purple-50/60 active:scale-[0.99] transition-all cursor-pointer"
                  title="Bấm để chọn chế độ luyện nghe"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1 group-hover:text-purple-700 transition-colors">
                      <span className="inline-block font-black leading-none text-purple-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Luyện nghe (Listening)</span>
                    </span>
                    <span className="font-black text-purple-700 tabular-nums">
                      {listeningStats.completedCount > 0
                        ? `${listeningStats.completedCount} bài đã nghe`
                        : listeningStats.inProgressPercent > 0
                        ? `${listeningStats.inProgressPercent}% đang nghe`
                        : 'Chưa nghe'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${listeningProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* 4. Reading */}
                <div
                  onClick={() => setActionModalType('reading')}
                  className="group block space-y-0.5 rounded-lg p-0.5 -mx-0.5 hover:bg-amber-50/60 active:scale-[0.99] transition-all cursor-pointer"
                  title="Bấm để chọn chế độ luyện đọc"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1 group-hover:text-amber-700 transition-colors">
                      <span className="inline-block font-black leading-none text-amber-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Luyện đọc (Reading)</span>
                    </span>
                    <span className="font-black text-amber-700 tabular-nums">
                      {dailyReadingStatus.totalCount > 0
                        ? `${dailyReadingStatus.completedCount}/${dailyReadingStatus.totalCount} bài đọc`
                        : 'Chưa đọc'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${readingProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Nhiệm vụ nhận quà Pro */}
            {profile?.id && (
              <ProTrialMilestoneCard
                enabled
                hintStreak={studyStreak}
                hintWords={countsReady ? totalWords : undefined}
                onClaimed={() => {
                  void refreshGamification();
                  void supabase
                    .from('profiles')
                    .select('id, full_name, email, role, avatar_url, plan, plan_expires_at, created_at')
                    .eq('id', profile.id)
                    .maybeSingle()
                    .then(({ data }) => {
                      if (data) setProfile(data as Profile);
                    });
                }}
              />
            )}

            {/* HỘP THƯỞNG PRO VIP TRÊN DESKTOP: 2 CỘT NGANG (Chuỗi học 7 ngày + Mời bạn cùng tiến) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-purple-500/10 p-4 border border-amber-200/70 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-slate-800">
                  <span className="text-amber-500">🎁</span>
                  <span>Săn ngày PRO miễn phí</span>
                </div>
                <span className="text-[10.5px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-3xs">
                  +3 ngày PRO / mốc
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Học chăm chỉ (Streak 7 ngày) */}
                <div className="flex items-center justify-between gap-3 bg-white/95 rounded-xl p-3 border border-slate-100 shadow-3xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-500">
                      <Flame className="w-4 h-4 fill-amber-500 stroke-none" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-700 truncate">Chuỗi học 7 ngày</span>
                        <span className="font-black text-amber-600 tabular-nums">
                          {Math.min(studyStreak, 7)}/7 ngày
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((studyStreak / 7) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
                    +3 ngày PRO
                  </span>
                </div>

                {/* 2. Mời bạn cùng tiến */}
                <div className="flex items-center justify-between gap-3 bg-white/95 rounded-xl p-3 border border-slate-100 shadow-3xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 text-indigo-600">
                      <Users className="w-4 h-4 stroke-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-800 leading-tight">
                        Mời bạn học cùng
                      </div>
                      <div className="text-[10.5px] font-medium text-slate-400 truncate mt-0.5">
                        Cả hai đều nhận +3 ngày PRO miễn phí
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/student/referral"
                    className="text-[11px] font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 rounded-lg shrink-0 shadow-3xs active:scale-95 transition-all hover:brightness-110 flex items-center gap-1"
                  >
                    <span>Mời bạn</span>
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── KHO TỪ VỰNG ĐẦY ĐỦ TRÊN MÁY TÍNH (Gói từ + Danh sách từ + Search/Filter) ── */}
            <section
              className="space-y-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              id="kho-tu-vung"
              data-onboarding="vault"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-black text-slate-800 truncate">
                  <span className="text-lg leading-none shrink-0">📦</span>
                  <span className="truncate">{activeClassroom ? `Từ vựng · ${activeClassroom.name}` : 'Kho từ vựng'}</span>
                </h3>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {activeClassroom && (
                    <button
                      type="button"
                      onClick={() => handleSwitchScope('__personal__')}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                    >
                      Về kho cá nhân
                    </button>
                  )}
                  <Badge variant="outline" className="h-7 px-2.5 text-xs font-bold tabular-nums">
                    {countsReady ? totalWords : '…'} từ
                  </Badge>
                  <Link
                    href="/import"
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100 transition active:brightness-110"
                    title="Dán list / file / quét ảnh của bạn"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nạp từ mới
                  </Link>
                  <Link
                    href="/library"
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition active:brightness-110"
                    title="Chọn gói từ sẵn theo chủ đề"
                  >
                    Thư viện
                  </Link>
                </div>
              </div>

              {/* Tóm tắt kho: tích lũy / đã học / gói */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <div className={`text-base font-black tabular-nums text-slate-800 ${!countsReady ? 'animate-pulse text-slate-400' : ''}`}>
                    {countsReady ? totalWords : '…'}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400">Tích lũy</div>
                </div>
                <div className="rounded-xl bg-indigo-50/80 px-3 py-2 text-center">
                  <div className={`text-base font-black tabular-nums text-indigo-700 ${!countsReady ? 'animate-pulse' : ''}`}>
                    {countsReady ? Math.max(0, totalWords - newCount) : '…'}
                  </div>
                  <div className="text-[11px] font-bold text-indigo-400">Đã học</div>
                </div>
                <div className="rounded-xl bg-violet-50/80 px-3 py-2 text-center">
                  <div className="text-base font-black tabular-nums text-violet-700">{vocabPacks.length}</div>
                  <div className="text-[11px] font-bold text-violet-400">Gói</div>
                </div>
              </div>

              {/* Mức độ nhớ — full kho (levelCounts từ API), nhãn ≈ interval FSRS */}
              {countsReady && totalWords > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                      Mức độ nhớ · cả kho
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {levelCounts.reduce((a, b) => a + b, 0)}/{totalWords} từ
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    {levelCounts.map((count, idx) => {
                      const maxCount = Math.max(1, ...levelCounts);
                      const barH = Math.round(4 + (count / maxCount) * 44);
                      const colors = [
                        'bg-rose-400',
                        'bg-amber-400',
                        'bg-sky-400',
                        'bg-indigo-500',
                        'bg-emerald-500',
                        'bg-purple-500',
                      ] as const;
                      return (
                        <div
                          key={idx + 1}
                          className="flex min-w-0 flex-1 flex-col items-center"
                          title={`L${idx + 1}: ${SRS_LEVEL_STABILITY_HINT[idx]} · ~interval ${SRS_LEVEL_LABELS[idx]} · ${count} từ`}
                        >
                          <span className="mb-0.5 text-[10px] font-black tabular-nums text-slate-600">{count}</span>
                          <div
                            className={`w-full max-w-[32px] rounded-t-md ${colors[idx]}`}
                            style={{ height: barH }}
                          />
                          <span className="mt-1 text-[9px] font-extrabold text-slate-500">L{idx + 1}</span>
                          <span className="text-[8px] font-bold uppercase text-slate-400">{SRS_LEVEL_LABELS[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[10px] font-semibold leading-snug text-slate-400">
                    Nhãn ≈ khoảng ôn lại FSRS (theo stability), không phải mốc cứng Anki.
                  </p>
                </div>
              )}

              {/* Gói trong kho — đang dở lên đầu, bấm tiếp tục */}
              {vocabPacks.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                      Gói trong kho · {vocabPacks.length}
                    </span>
                    <Link href="/library" className="text-xs font-bold text-emerald-600 hover:underline">
                      Xem thư viện →
                    </Link>
                  </div>
                  <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1 scrollbar-none">
                    {[...vocabPacks]
                      .sort((a, b) => {
                        const rank = (s: ActiveVocabPack['status']) =>
                          s === 'in_progress' ? 0 : s === 'not_started' ? 1 : 2;
                        return rank(a.status) - rank(b.status);
                      })
                      .slice(0, 12)
                      .map((pack) => {
                        const pct = pack.word_count > 0
                          ? Math.round((pack.reviewed_count / pack.word_count) * 100)
                          : 0;
                        const inProgress = pack.status === 'in_progress' && !!pack.words?.length;
                        const href = inProgress
                          ? `/flashcard?mode=learn&ids=${pack.words
                              .slice()
                              .sort((a, b) => a.position - b.position)
                              .map((w) => encodeURIComponent(w.word_id))
                              .join(',')}`
                          : '/library';
                        return (
                          <Link
                            key={pack.pack_id}
                            href={href}
                            className={`min-w-[164px] max-w-[190px] shrink-0 rounded-xl border px-3 py-2.5 transition-all hover:shadow-xs active:scale-[0.99] ${
                              inProgress
                                ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm shadow-indigo-100'
                                : pack.status === 'completed'
                                  ? 'border-emerald-100 bg-emerald-50/50'
                                  : 'border-slate-100 bg-slate-50/80'
                            }`}
                          >
                            {inProgress && (
                              <div className="mb-1 text-[9.5px] font-extrabold uppercase tracking-wide text-indigo-600">
                                ▶ Tiếp tục
                              </div>
                            )}
                            <div className="truncate text-xs font-extrabold text-slate-800">
                              {pack.topic_title}
                            </div>
                            <div className="mt-0.5 text-[10.5px] font-bold text-slate-400">
                              Chặng {pack.pack_index + 1}
                              {pack.status === 'completed'
                                ? ' · xong'
                                : pack.status === 'in_progress'
                                  ? ' · đang học'
                                  : ''}
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                              <div
                                className={`h-full rounded-full ${
                                  pack.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10.5px] font-bold tabular-nums text-slate-500">
                              <span>{pack.reviewed_count}/{pack.word_count}</span>
                              {inProgress && <span className="text-indigo-600">Học tiếp →</span>}
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}

              {vocabPacks.length === 0 && countsReady && totalWords === 0 && (
                <Link
                  href="/library"
                  className="flex items-center gap-2.5 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3.5 py-3"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-emerald-800">Kho còn trống</div>
                    <div className="text-[11px] font-semibold text-emerald-600/80">
                      Chọn gói từ thư viện để bắt đầu
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                </Link>
              )}

              {/* Search + filter danh sách từ */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Danh sách từ cá nhân
                </div>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      enterKeyHint="search"
                      autoComplete="off"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm trong kho..."
                      className="min-h-[40px] w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="min-h-[40px] cursor-pointer appearance-none rounded-xl border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                      <option value="az">A → Z</option>
                      <option value="hardest">Khó nhất</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-none">
                  {(['all', 'new', 'due', 'learned', 'mastered'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStatusFilter(f)}
                      className={`min-h-[32px] shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        statusFilter === f
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {{ all: 'Tất cả', new: 'Mới', due: 'Đến hạn', learned: 'Đã học', mastered: 'Thành thạo' }[f]}
                    </button>
                  ))}
                  {(debouncedQuery || statusFilter !== 'all') && (
                    <span className="ml-auto shrink-0 self-center whitespace-nowrap text-xs text-muted-foreground">
                      {filteredWords.length}/{totalWords}
                    </span>
                  )}
                </div>
              </div>

              {wordsLoading ? (
                <WordCardSkeleton count={4} />
              ) : words.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Chưa có từ — chọn gói trong thư viện
                  </p>
                  <Link
                    href="/library"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Mở thư viện
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredWords.length === 0 && (debouncedQuery || statusFilter !== 'all') && (
                      <div className="col-span-full py-6 text-center text-muted-foreground">
                        <Search className="mx-auto mb-1 h-5 w-5 opacity-30" />
                        <p className="text-xs">Không tìm thấy từ</p>
                      </div>
                    )}
                    {filteredWords.map((word) => (
                      <div
                        key={word.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWordId(word.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedWordId(word.id);
                          }
                        }}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 transition-all hover:border-primary/40 hover:bg-white hover:shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <h4 className="truncate text-base font-black text-primary">{word.word}</h4>
                              <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                                {word.pos || ''}
                              </span>
                            </div>
                            {word.ipa && (
                              <div className="truncate text-[11px] font-semibold text-muted-foreground font-mono">
                                {parseIpa(word.ipa)}
                              </div>
                            )}
                          </div>
                          <Badge className={`shrink-0 text-[10px] ${(word.srsLevel ?? 0) >= 5 ? 'bg-emerald-500' : 'bg-primary/15 text-primary'}`}>
                            L{word.srsLevel || 1}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">
                          {word.translation}
                        </p>
                      </div>
                    ))}
                  </div>

                  {words.length < totalWords && !debouncedQuery && statusFilter === 'all' && (
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={loadMoreWords}
                        disabled={isLoadingMore}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
                      >
                        {isLoadingMore ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải…</>
                        ) : (
                          <>Tải thêm ({totalWords - words.length})</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <div className="opacity-90">
              <BadgeGrid badges={badges} />
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════════ */
          /* GIAO DIỆN ĐIỆN THOẠI (else — giữ nguyên 100% thiết kế mobile hiện tại) */
          /* ═════════════════════════════════════════════════════════════════════ */
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-2.5 px-3.5 py-2.5 sm:gap-3.5 sm:px-7 sm:py-5">
            {/* Greeting — 1 dòng gọn cùng Thông báo bên phải */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <Mascot mood={mascotMood} size="sm" />
                <h2 className="truncate text-base font-black leading-tight text-foreground sm:text-xl">
                  {greeting}, {profile?.full_name?.split(' ')[0] || 'bạn'}! 👋
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Meta siêu gọn — desktop */}
                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-600">
                    {countsReady ? totalWords : '…'} từ
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-emerald-700">
                    {masteredCount} master
                  </span>
                </div>

                {/* Tra từ điển & Thông báo trên mobile — cùng hàng bên phải */}
                <div className="md:hidden flex items-center gap-1.5">
                  <Link
                    href="/dictionary"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-indigo-600 active:scale-95"
                    title="Tra từ điển nhanh"
                    aria-label="Tra từ điển nhanh"
                  >
                    <Search className="h-4 w-4 shrink-0" />
                  </Link>
                  <NotificationBell
                    dueCount={reviewDueCount}
                    grammarDueCount={0}
                    streak={studyStreak}
                    dailyGoalXp={gamification.today_xp}
                    dailyGoal={gamification.daily_goal}
                    classroomId={classroomId}
                  />
                </div>
              </div>
            </div>

            {/* Desktop banner; mobile = fixed popup trong component */}
            <EnableNotifications />

            {/* Daily reading notification */}
            <DailyReadingCard status={dailyReadingStatus} />

            {/* Challenge campaign widget */}
            <ChallengeWidget />

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* KHU VỰC CHIA ĐÔI 50/50: 3 Nút + Chuỗi (trái) vs Tiến độ ngày (phải) */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 items-stretch pt-1">
              {/* CỘT BÊN TRÁI: 3 Nút chuẩn 1cm ở trên + Bảng chuỗi ở dưới */}
              <div className="flex flex-col gap-2 min-w-0">
                {/* 2 Nút vuông chuẩn 1cm (Learn & Revise) */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                  {/* 1. New Words (Learn) */}
                  <button
                    type="button"
                    onClick={() => setActionModalType('learn')}
                    data-onboarding="learn"
                    className="group relative flex h-[48px] flex-col items-center justify-center rounded-lg border border-indigo-300/40 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xs active:scale-95 transition-all hover:scale-105 cursor-pointer text-left w-full"
                    title="Learn - Chọn phương thức nạp từ"
                  >
                    <span className="absolute -top-1.5 -right-0.5 rounded bg-rose-500 px-1 py-0.2 text-[8px] font-black text-white shadow ring-1 ring-white">
                      {countsReady ? (newCount > 0 ? newCount : 0) : '…'}
                    </span>
                    <BookOpen className="h-4 w-4 drop-shadow-sm" strokeWidth={2.4} />
                    <span className="mt-0.5 text-[8.5px] font-black leading-none tracking-tight text-white drop-shadow-xs">
                      Learn
                    </span>
                  </button>

                  {/* 2. Revise */}
                  <button
                    type="button"
                    onClick={() => setActionModalType('review')}
                    data-onboarding="review"
                    className="group relative flex h-[48px] flex-col items-center justify-center rounded-lg border border-emerald-300/40 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs active:scale-95 transition-all hover:scale-105 cursor-pointer text-left w-full"
                    title="Revise - Chọn chế độ ôn tập"
                  >
                    <span
                      className={`absolute -top-1.5 -right-0.5 rounded px-1 py-0.2 text-[8px] font-black shadow ring-1 ring-white ${
                        reviewDueCount > 0 ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-emerald-800 text-white'
                      }`}
                    >
                      {countsReady ? reviewDueCount : '…'}
                    </span>
                    <RotateCw className="h-4 w-4 drop-shadow-sm" strokeWidth={2.4} />
                    <span className="mt-0.5 text-[8.5px] font-black leading-none tracking-tight text-white drop-shadow-xs">
                      Revise
                    </span>
                  </button>
                </div>

                {/* Bảng chuỗi học ở dưới (StreakCounter) */}
                <div className="flex-1 min-w-0">
                  <StreakCounter
                    streak={studyStreak}
                    lastActiveDate={
                      lastActiveFromActivity(dailyActivity) ?? gamification.last_active_date
                    }
                    variant="calendar"
                    dailyCounts={dailyActivity}
                    className="h-full min-w-0"
                  />
                </div>
              </div>

              {/* CỘT BÊN PHẢI: Nhiều thanh tiến độ chiếm từ trên xuống dưới */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs min-w-0">
                {/* Header nhỏ */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                    🎯 <span>Tiến độ ngày</span>
                  </span>
                </div>

                {/* 1. Ôn tập */}
                <div
                  onClick={() => setActionModalType('review')}
                  className="group block space-y-0.5 rounded-lg p-1 -mx-1 hover:bg-emerald-50/60 active:scale-[0.98] transition-all cursor-pointer"
                  title="Bấm vào mũi tên hoặc chữ để chọn chế độ ôn tập"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5 group-hover:text-emerald-700 transition-colors">
                      <span className="inline-block text-[11.5px] font-black leading-none text-emerald-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Ôn tập</span>
                    </span>
                    <span className="font-black text-emerald-700 tabular-nums">
                      {countsReady
                        ? `${todayReviewsComputed} lượt`
                        : '…'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${reviewProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Từ mới */}
                <div
                  onClick={() => setActionModalType('learn')}
                  className="group block space-y-0.5 rounded-lg p-1 -mx-1 hover:bg-indigo-50/60 active:scale-[0.98] transition-all cursor-pointer"
                  title="Bấm vào mũi tên hoặc chữ để chọn phương thức nạp từ"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5 group-hover:text-indigo-700 transition-colors">
                      <span className="inline-block text-[11.5px] font-black leading-none text-indigo-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Từ mới</span>
                    </span>
                    <span className="font-black text-indigo-700 tabular-nums">
                      {todayNewWords} / {gamification.daily_goal || 10} từ
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${newWordsProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* 3. Listening */}
                <div
                  onClick={() => setActionModalType('listening')}
                  className="group block space-y-0.5 rounded-lg p-1 -mx-1 hover:bg-purple-50/60 active:scale-[0.98] transition-all cursor-pointer"
                  title="Bấm vào mũi tên hoặc chữ để chọn chế độ luyện nghe"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5 group-hover:text-purple-700 transition-colors">
                      <span className="inline-block text-[11.5px] font-black leading-none text-purple-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Listening</span>
                    </span>
                    <span className="font-black text-purple-700 tabular-nums">
                      {listeningStats.completedCount > 0
                        ? `${listeningStats.completedCount} bài đã nghe`
                        : listeningStats.inProgressPercent > 0
                        ? `${listeningStats.inProgressPercent}% đang nghe`
                        : 'Chưa nghe'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${listeningProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* 4. Reading */}
                <div
                  onClick={() => setActionModalType('reading')}
                  className="group block space-y-0.5 rounded-lg p-1 -mx-1 hover:bg-amber-50/60 active:scale-[0.98] transition-all cursor-pointer"
                  title="Bấm vào mũi tên hoặc chữ để chọn chế độ luyện đọc"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5 group-hover:text-amber-700 transition-colors">
                      <span className="inline-block text-[11.5px] font-black leading-none text-amber-500 animate-arrow-nudge">
                        →
                      </span>
                      <span>Reading</span>
                    </span>
                    <span className="font-black text-amber-700 tabular-nums">
                      {dailyReadingStatus.totalCount > 0
                        ? `${dailyReadingStatus.completedCount}/${dailyReadingStatus.totalCount} bài đọc`
                        : 'Chưa đọc'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${readingProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Nhiệm vụ nhận quà Pro — luôn hiện trên dashboard free */}
            {profile?.id && (
              <ProTrialMilestoneCard
                enabled
                hintStreak={studyStreak}
                hintWords={countsReady ? totalWords : undefined}
                onClaimed={() => {
                  void refreshGamification();
                  void supabase
                    .from('profiles')
                    .select('id, full_name, email, role, avatar_url, plan, plan_expires_at, created_at')
                    .eq('id', profile.id)
                    .maybeSingle()
                    .then(({ data }) => {
                      if (data) setProfile(data as Profile);
                    });
                }}
              />
            )}

            {/* ═══ KHO TỪ VỰNG ═══ */}
            <section
              className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-3.5"
              id="kho-tu-vung"
              data-onboarding="vault"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-800 sm:text-base truncate">
                  <span className="text-base leading-none shrink-0">📦</span>
                  <span className="truncate">{activeClassroom ? `Từ vựng · ${activeClassroom.name}` : 'Kho từ vựng'}</span>
                </h3>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {activeClassroom && (
                    <button
                      type="button"
                      onClick={() => handleSwitchScope('__personal__')}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-extrabold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                    >
                      Về kho cá nhân
                    </button>
                  )}
                  <Badge variant="outline" className="h-6 px-2 text-[10px] font-bold tabular-nums">
                    {countsReady ? totalWords : '…'} từ
                  </Badge>
                  <Link
                    href="/import"
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-[11px] font-extrabold text-indigo-700 active:brightness-110"
                    title="Dán list / file / quét ảnh của bạn"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nạp từ mới
                  </Link>
                  <Link
                    href="/library"
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white active:brightness-110"
                    title="Chọn gói từ sẵn theo chủ đề"
                  >
                    Thư viện
                  </Link>
                </div>
              </div>

              {/* Tóm tắt kho: tích lũy / đã học / gói */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
                  <div className={`text-sm font-black tabular-nums text-slate-800 ${!countsReady ? 'animate-pulse text-slate-400' : ''}`}>
                    {countsReady ? totalWords : '…'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">Tích lũy</div>
                </div>
                <div className="rounded-xl bg-indigo-50/80 px-2 py-1.5 text-center">
                  <div className={`text-sm font-black tabular-nums text-indigo-700 ${!countsReady ? 'animate-pulse' : ''}`}>
                    {countsReady ? Math.max(0, totalWords - newCount) : '…'}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400">Đã học</div>
                </div>
                <div className="rounded-xl bg-violet-50/80 px-2 py-1.5 text-center">
                  <div className="text-sm font-black tabular-nums text-violet-700">{vocabPacks.length}</div>
                  <div className="text-[10px] font-bold text-violet-400">Gói</div>
                </div>
              </div>

              {/* Mức độ nhớ — full kho (levelCounts từ API), nhãn ≈ interval FSRS */}
              {countsReady && totalWords > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                      Mức độ nhớ · cả kho
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                      {levelCounts.reduce((a, b) => a + b, 0)}/{totalWords} từ
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-1 sm:gap-1.5">
                    {levelCounts.map((count, idx) => {
                      const maxCount = Math.max(1, ...levelCounts);
                      const barH = Math.round(4 + (count / maxCount) * 40);
                      const colors = [
                        'bg-rose-400',
                        'bg-amber-400',
                        'bg-sky-400',
                        'bg-indigo-500',
                        'bg-emerald-500',
                        'bg-purple-500',
                      ] as const;
                      return (
                        <div
                          key={idx + 1}
                          className="flex min-w-0 flex-1 flex-col items-center"
                          title={`L${idx + 1}: ${SRS_LEVEL_STABILITY_HINT[idx]} · ~interval ${SRS_LEVEL_LABELS[idx]} · ${count} từ`}
                        >
                          <span className="mb-0.5 text-[9px] font-black tabular-nums text-slate-600">{count}</span>
                          <div
                            className={`w-full max-w-[28px] rounded-t-md ${colors[idx]}`}
                            style={{ height: barH }}
                          />
                          <span className="mt-0.5 text-[8px] font-extrabold text-slate-500">L{idx + 1}</span>
                          <span className="text-[7px] font-bold uppercase text-slate-400">{SRS_LEVEL_LABELS[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[9px] font-semibold leading-snug text-slate-400">
                    Nhãn ≈ khoảng ôn lại FSRS (theo stability), không phải mốc cứng Anki.
                  </p>
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* MỤC KỸ NĂNG: TIÊU ĐỀ + 5 NÚT 1CM                           */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                  Kỹ năng
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {/* 1. Grammar */}
                <Link
                  href="/grammar"
                  className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-sky-50 border border-sky-200/80 text-sky-700 shadow-3xs active:scale-95 transition-all hover:border-sky-300"
                >
                  <Code2 className="w-4 h-4" strokeWidth={2.4} />
                  <span className="mt-0.5 text-[8.5px] font-black leading-none text-sky-800">Grammar</span>
                </Link>

                {/* 2. Reading */}
                <button
                  type="button"
                  onClick={() => setActionModalType('reading')}
                  className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 shadow-3xs active:scale-95 transition-all hover:border-amber-300 cursor-pointer"
                >
                  <FileText className="w-4 h-4" strokeWidth={2.4} />
                  <span className="mt-0.5 text-[8.5px] font-black leading-none text-amber-800">Reading</span>
                </button>

                {/* 3. Listening */}
                <button
                  type="button"
                  onClick={() => setActionModalType('listening')}
                  className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-purple-50 border border-purple-200/80 text-purple-700 shadow-3xs active:scale-95 transition-all hover:border-purple-300 cursor-pointer"
                >
                  <Headphones className="w-4 h-4" strokeWidth={2.4} />
                  <span className="mt-0.5 text-[8.5px] font-black leading-none text-purple-800">Listening</span>
                </button>

                {/* 4. Speaking */}
                <Link
                  href="/student/speaking/foundation"
                  aria-label="Luyện nói phản xạ Speaking"
                  className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-700 shadow-3xs cursor-pointer active:scale-95 transition-all hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <span className="absolute -top-1.5 -right-0.5 rounded-full bg-rose-500 text-white px-1 py-0 text-[6.5px] font-black shadow ring-1 ring-white leading-tight">
                    A0–C1
                  </span>
                  <Mic className="w-4 h-4" strokeWidth={2.4} />
                  <span className="mt-0.5 text-[8.5px] font-black leading-none text-rose-800">Speaking</span>
                </Link>

                {/* 5. Writing */}
                <button
                  type="button"
                  aria-label="Writing (Sắp có)"
                  className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-slate-100/80 border border-slate-200 text-slate-500 shadow-3xs cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  onClick={() => toast.info('Tính năng Luyện Writing sắp ra mắt')}
                >
                  <span className="absolute -top-1.5 -right-0.5 rounded-full bg-slate-500 text-white px-1 py-0 text-[6.5px] font-black shadow ring-1 ring-white leading-tight">
                    Sắp có
                  </span>
                  <PenTool className="w-4 h-4 opacity-80" strokeWidth={2.4} />
                  <span className="mt-0.5 text-[8.5px] font-black leading-none text-slate-600">Writing</span>
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* MỤC LUYỆN THI: TIÊU ĐỀ + 4 LOGO THẬT                       */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                  Luyện thi
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* 1. TOEIC (Popup: Vào luyện thi + Học TOEIC) */}
                <button
                  type="button"
                  onClick={() => setActionModalType('toeic')}
                  className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs hover:border-indigo-300 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Image src="/images/exams/toeic.png" alt="TOEIC" width={64} height={32} className="max-h-full max-w-full object-contain" />
                </button>

                {/* 2. VSTEP (Vào trang luôn) */}
                <Link
                  href="/vstep"
                  className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs hover:border-blue-300 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Image src="/images/exams/vstep.png" alt="VSTEP" width={64} height={32} className="max-h-full max-w-full object-contain" />
                </Link>

                {/* 3. VNU Test */}
                <Link
                  href="/vnu-bac-3"
                  aria-label="VNU Test Bậc 3"
                  className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs hover:border-emerald-300 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Image src="/images/exams/vnu-test.png" alt="VNU Test" width={64} height={32} className="max-h-full max-w-full object-contain" />
                </Link>

                {/* 4. IELTS (Đang cập nhật) */}
                <button
                  type="button"
                  aria-label="IELTS (Đang cập nhật)"
                  onClick={() => toast.info('Chương trình Luyện thi IELTS đang được cập nhật')}
                  className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="absolute -top-1.5 -right-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[6.5px] font-black shadow ring-1 ring-white whitespace-nowrap">
                    Đang cập nhật
                  </span>
                  <Image src="/images/exams/ielts.png" alt="IELTS" width={64} height={32} className="max-h-full max-w-full object-contain" />
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* HỘP THƯỞNG PRO VIP: HỌC CHĂM + MỜI BẠN                     */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-purple-500/10 p-2.5 border border-amber-200/70 shadow-2xs space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                  <span className="text-amber-500">🎁</span>
                  <span>Săn ngày PRO miễn phí</span>
                </div>
                <span className="text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-3xs">
                  +3 ngày PRO / mốc
                </span>
              </div>

              {/* 2 Nhiệm vụ săn PRO */}
              <div className="space-y-1.5">
                {/* 1. Học chăm chỉ (Streak 7 ngày) */}
                <div className="flex items-center justify-between gap-2 bg-white/95 rounded-xl p-2 border border-slate-100 shadow-3xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-500">
                      <Flame className="w-4 h-4 fill-amber-500 stroke-none" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="font-extrabold text-slate-700 truncate">Chuỗi học 7 ngày</span>
                        <span className="font-black text-amber-600 tabular-nums">
                          {Math.min(studyStreak, 7)}/7 ngày
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((studyStreak / 7) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-[8.5px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0">
                    +3 ngày PRO
                  </span>
                </div>

                {/* 2. Mời bạn cùng tiến */}
                <div className="flex items-center justify-between gap-2 bg-white/95 rounded-xl p-2 border border-slate-100 shadow-3xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 text-indigo-600">
                      <Users className="w-4 h-4 stroke-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9.5px] font-extrabold text-slate-800 leading-tight">
                        Mời bạn học cùng
                      </div>
                      <div className="text-[8px] font-medium text-slate-400 truncate mt-0.5">
                        Cả hai đều nhận +3 ngày PRO miễn phí
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/student/referral"
                    className="text-[8.5px] font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1 rounded-lg shrink-0 shadow-3xs active:scale-95 transition-all hover:brightness-110 flex items-center gap-0.5"
                  >
                    <span>Mời bạn</span>
                    <ChevronRight className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="opacity-90">
              <BadgeGrid badges={badges} />
            </div>
          </div>
        )}

        {/* Popup chúc mừng mốc (level / badge / streak) */}
        <MilestonePopup
          open={!!milestonePopup}
          payload={milestonePopup}
          onClose={() => setMilestonePopup(null)}
        />

        {/* ═══ WORD DETAIL MODAL ═══ */}
        <WordDetailModal
          wordId={selectedWordId}
          onClose={() => setSelectedWordId(null)}
          onDeleted={(deletedId) => {
            setWords((prev) => prev.filter((w) => w.id !== deletedId));
            setTotalWords((prev) => Math.max(0, prev - 1));
          }}
        />

        {/* ═══ MEANING SELECTOR MODAL ═══ */}
        {selectedWord && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedWord(null)} />
            <div className="relative w-full max-w-xl bg-background rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b flex items-center justify-between bg-primary/5">
                <div>
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tight">{selectedWord.word}</h3>
                  <p className="text-xs font-bold text-muted-foreground">Select the correct meaning to study</p>
                </div>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {(selectedWord.dictionary_data as unknown as Array<{
                  pos?: string;
                  pronunciations?: { ipa?: string }[];
                  definitions: Array<{ definition: string; pos?: string; example?: string }>;
                }> | null | undefined)?.map((entry, eIdx) => (
                  <div key={eIdx} className="space-y-3">
                    {entry.definitions.map((def, dIdx) => (
                      <button
                        key={`${eIdx}-${dIdx}`}
                        onClick={() => handleUpdateMeaning(selectedWord.id, def.definition, def.pos || '', entry.pronunciations?.[0]?.ipa)}
                        className="w-full text-left p-4 rounded-2xl border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/20">
                            {def.pos || entry.pos || 'Word'}
                          </Badge>
                          {entry.pronunciations?.[0]?.ipa && (
                            <span className="text-xs font-bold text-muted-foreground font-mono">
                              {parseIpa(entry.pronunciations[0].ipa)}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 mb-2 leading-relaxed">
                          {def.definition}
                        </p>
                        {def.example && (
                          <p className="text-xs font-medium text-slate-500 italic">
                            &quot;{def.example}&quot;
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-end">
                <button
                  onClick={() => setSelectedWord(null)}
                  className="px-6 py-2 font-black text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ JOIN CLASSROOM MODAL ═══ */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div
              className="absolute inset-0"
              onClick={() => { if (!isJoining) { setIsJoinModalOpen(false); setJoinError(null); } }}
            />
            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-80 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Tham gia lớp học
                </h3>
                <button
                  onClick={() => { if (!isJoining) { setIsJoinModalOpen(false); setJoinError(null); } }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>
              <p className="text-sm text-white/50 mb-4">Nhập mã lớp do giáo viên cung cấp (VD: ABC123)</p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinClassroom(); }}
                placeholder="Mã lớp..."
                maxLength={12}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
              />
              {joinError && (
                <p className="text-rose-400 text-sm font-semibold mb-3">{joinError}</p>
              )}
              <button
                onClick={handleJoinClassroom}
                disabled={!joinCode.trim() || isJoining}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang tham gia...</>
                ) : (
                  'Tham gia'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pop-up chọn chế độ học/luyện thi (Ô vuông 1cm trên điện thoại / Thẻ rộng trên máy tính) */}
        <ActionSelectionModal
          type={actionModalType}
          onClose={() => setActionModalType(null)}
          reviewDueCount={reviewDueCount}
          newCount={newCount}
          currentClassScope={currentClassScope}
        />
      </StudentShell>
    </>
  );
}
