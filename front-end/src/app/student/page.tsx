'use client';
import { ClassroomApi } from '@/features/classroom/api';
import { VocabApi } from '@/features/vocab/api';
import { ReadingApi } from '@/features/reading/api';
import { authService } from '@/features/auth/session';

import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { AuthApi } from '@/features/auth/api';
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
import { ProTrialMilestoneCard } from '@/components/gamification/ProTrialMilestoneCard';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';
import { StudentShell } from '@/components/student/StudentShell';
import { LearningAnalyticsPanel } from '@/components/student/LearningAnalyticsPanel';
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
} from '@/lib/dashboard-snapshot-cache';
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
import { useStudentContext, fetchWordSummaryOnce } from '@/components/student/StudentProvider';
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
  const [avgStabilityDays, setAvgStabilityDays] = useState<number | null>(null);
  const [retentionRate, setRetentionRate] = useState<number | null>(null);
  const [grammarDueCount, setGrammarDueCount] = useState<number>(0);
  const [skillScores, setSkillScores] = useState<{
    vocabScore: number;
    grammarScore: number;
    reflexScore: number;
    readingScore: number;
    listeningScore: number;
  } | null>(null);
  const [quizTrend, setQuizTrend] = useState<
    { score: number; max_score: number; completed_at: string; quiz_type: string }[]
  >([]);
  const [serverWeakWords, setServerWeakWords] = useState<
    { word: string; meaning: string; level: number; stability: number }[]
  >([]);

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

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Student] Auth check started');
      const { data: { session }, error } = await authService.getSession();
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

        void fetchClassrooms();

        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          loadData(session.user.id, initialScope);
        }
      } else {
        setIsLoading(false);
        const redirectPath = typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/student';
        router.replace(`/auth?redirectTo=${encodeURIComponent(redirectPath)}`);
      }
    };
    void checkAuth();

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void fetchClassrooms();
        // Chỉ reload khi chưa load (tránh double với getSession)
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
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
    if (Array.isArray(data.levelCounts) && data.levelCounts.length === 6) {
      const next = data.levelCounts.map((n) => Number(n) || 0);
      parsedLevels = next;
      setLevelCounts(next);
    }
    const anyData = data as Record<string, any>;
    if (typeof anyData.avgStabilityDays === 'number') {
      setAvgStabilityDays(anyData.avgStabilityDays);
    }
    if (typeof anyData.retentionRatePercent === 'number') {
      setRetentionRate(anyData.retentionRatePercent);
    }
    if (typeof anyData.grammarDueCount === 'number') {
      setGrammarDueCount(anyData.grammarDueCount);
    }
    if (anyData.skillScores && typeof anyData.skillScores === 'object') {
      setSkillScores({
        vocabScore: Number(anyData.skillScores.vocabScore ?? 0),
        grammarScore: Number(anyData.skillScores.grammarScore ?? 0),
        reflexScore: Number(anyData.skillScores.reflexScore ?? 0),
        readingScore: Number(anyData.skillScores.readingScore ?? 0),
        listeningScore: Number(anyData.skillScores.listeningScore ?? 0),
      });
    }
    if (Array.isArray(anyData.weakWords)) {
      setServerWeakWords(
        anyData.weakWords.map((w: any) => ({
          word: String(w.word || ''),
          meaning: String(w.translation || w.meaning || ''),
          level: Number(w.level ?? 1),
          stability: Number(Number(w.stability ?? 0).toFixed(1)),
        })),
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

  /** Heatmap + streak liên tiếp + phân tích dữ liệu học tập từ server (/api/student/stats). Gọi sau shell. */
  const loadActivityStats = (userId?: string) => {
    const uid = userId || profile?.id;
    void VocabApi.getStudentStats()
      .then((r) => r.json())
      .then((st) => {
        if (!st?.success) return;
        const payload = st.data || st;
        const activity: { date: string; count: number }[] = payload.dailyActivity ?? [];
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
          const wb = payload.wordBreakdown;
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
          setSkillScores({
            vocabScore: Number(payload.skillScores.vocabScore ?? 0),
            grammarScore: Number(payload.skillScores.grammarScore ?? 0),
            reflexScore: Number(payload.skillScores.reflexScore ?? 0),
            readingScore: Number(payload.skillScores.readingScore ?? 0),
            listeningScore: Number(payload.skillScores.listeningScore ?? 0),
          });
        }
        if (Array.isArray(payload.quizHistory)) {
          setQuizTrend(
            payload.quizHistory.map((q: any) => ({
              score: Number(q.score ?? 0),
              max_score: Number(q.total ?? q.totalQuestions ?? 10),
              completed_at: String(q.date || q.completedAt || new Date().toISOString()),
              quiz_type: String(q.type || q.quizType || 'vocabulary'),
            })),
          );
        }
        if (Array.isArray(payload.weakWords)) {
          setServerWeakWords(
            payload.weakWords.map((w: any) => ({
              word: String(w.word || ''),
              meaning: String(w.translation || w.meaning || ''),
              level: Number(w.level ?? 1),
              stability: Number(Number(w.stability ?? 0).toFixed(1)),
            })),
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

    // Chỉ gọi fallback ?summary=1&levels=1 nếu sau summary=1 ban đầu levelCounts vẫn toàn số 0
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
    const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
    try {
      if (STAMPEDE_MODE) {
        /**
         * CHẾ ĐỘ LỚP ĐÔNG (NEXT_PUBLIC_STAMPEDE_MODE=1, mặc định):
         * Critical path: profile + words kèm counts (shell nhanh).
         * Secondary (heatmap / đếm từ / levels / packs / daily reading): fire-and-forget sau shell.
         */
        const profPromise = (studentCtx?.profile || profile)
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

        // Sau shell: heatmap + đếm từ hôm nay + chart L1–L6 (không chặn paint)
        loadSecondaryDashboard(userId, scope);
        return;
      }

      // ── Full mode (STAMPEDE=0): progressive load, đủ packs/grammar/heatmap ──
      const summaryP = VocabApi.getWords(`/api/words?summary=1${scopeParam}`)
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum, scope);
          return sum;
        })
        .catch(() => null);

      const [profRes] = await Promise.all([
        AuthApi.getLegacyProfile(userId).then((data) => ({ data, error: null })).catch((err: unknown) => ({ data: null, error: { message: err instanceof Error ? err.message : 'Profile fetch failed' } })),
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
        const wordsJson = await VocabApi.getWords(`/api/words?limit=${WORDS_PAGE_SIZE}&offset=0${scopeParam}`).then((r) => r.json()).catch(() => null);

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

  // Auto-refresh nhẹ: chỉ dùng summary endpoint để cập nhật dueCount
  const refreshSummary = async (userId: string) => {
    try {
      const scope = currentClassScopeRef.current;
      const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
      const res = await VocabApi.getWords(`/api/words?summary=1${scopeParam}`);
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

  const todayReviewsComputed = todayReviewWords || Math.max(0, todayWords - todayNewWords);
  const currentLevel = xpToLevel(gamification.total_xp);
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

  return (
    <>
      <StudentShell
        title={`Chào ${firstName}, sẵn sàng học chưa?`}
        subtitle={
          <>
            <span>
              {todayFormattedDate} · mục tiêu hôm nay chỉ cần {dailyGoalXp} XP
            </span>
            {countdown && reviewDueCount === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:bg-[#20253F] dark:text-[#B3A8FF]">
                <Clock className="h-3 w-3" />
                {countdown}
              </span>
            )}
          </>
        }
        contentClassName="p-0"
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
        <div
          className="flex w-full flex-1 min-w-0 flex-col text-[14px] leading-[1.45] text-slate-900 dark:text-[#F2F3FB]"
          data-Responsive-mode={isDesktop ? 'desktop' : 'mobile'}
        >
          {/* ═══ MAIN DASHBOARD BODY — FULL REMAINING WIDTH AFTER SIDEBAR ═══ */}
          <div className="flex w-full flex-1 min-w-0 flex-col gap-6 px-4 py-6 sm:px-9 sm:py-7">
            {/* ═══ CLASSROOM SCOPE BAR (IF ENROLLED IN CLASSES) ═══ */}
          {enrolledClassrooms.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSwitchScope('__personal__')}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  currentClassScope === '__personal__'
                    ? 'bg-[#7B67FF] text-white shadow-xs'
                    : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#A5AAC6]'
                }`}
              >
                Kho cá nhân
              </button>
              {enrolledClassrooms.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleSwitchScope(cls.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    currentClassScope === cls.id
                      ? 'bg-[#7B67FF] text-white shadow-xs'
                      : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#A5AAC6]'
                  }`}
                >
                  Lớp: {cls.name}
                </button>
              ))}
            </div>
          )}

          <EnableNotifications />
          <DailyReadingCard status={dailyReadingStatus} />
          <ChallengeWidget />

          {/* ═══ HERO BANNER (.hero) ═══ */}
          <section className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 lg:gap-7 rounded-[22px] bg-[#3A2FA8] p-6 sm:p-7 text-white shadow-lg shadow-indigo-950/15">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-white/85">
                Việc nên làm bây giờ
              </div>

              <h2 className="mt-1.5 mb-2 text-2xl sm:text-[30px] font-extrabold leading-[1.2] text-white">
                {reviewDueCount > 0
                  ? `Ôn tập ${reviewDueCount} từ đến hạn`
                  : `Học ${newCount > 0 ? Math.min(10, newCount) : 10} từ mới`}
              </h2>

              <p className="mb-5 max-w-[420px] text-[14.5px] sm:text-[15px] text-white/90 leading-relaxed">
                {reviewDueCount > 0
                  ? `Bạn có ${reviewDueCount} từ vựng đến hạn ôn theo FSRS. Ôn tập ngay để giữ chuỗi và đạt mục tiêu ${dailyGoalXp} XP.`
                  : `Bạn đã ôn xong lượt hôm nay. Nạp thêm từ mới để giữ chuỗi và đạt mục tiêu ${dailyGoalXp} XP.`}
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                {reviewDueCount > 0 ? (
                  <>
                    <Link
                      href={
                        currentClassScope && currentClassScope !== '__personal__'
                          ? `/review?class=${encodeURIComponent(currentClassScope)}`
                          : '/review'
                      }
                      data-onboarding="review"
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5.5 text-[15px] font-bold text-[#2B2090] shadow-sm transition hover:bg-indigo-50 active:scale-[0.99]"
                    >
                      <span>Bắt đầu ôn · ~5 phút</span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                    <Link
                      href={learnHref}
                      data-onboarding="learn"
                      className="inline-flex h-12 items-center px-3.5 text-[14px] font-semibold text-white underline underline-offset-4 hover:text-indigo-200 transition"
                    >
                      Học từ mới
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={learnHref}
                      data-onboarding="learn"
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5.5 text-[15px] font-bold text-[#2B2090] shadow-sm transition hover:bg-indigo-50 active:scale-[0.99]"
                    >
                      <span>Bắt đầu học · ~5 phút</span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                    <Link
                      href={
                        currentClassScope && currentClassScope !== '__personal__'
                          ? `/review?class=${encodeURIComponent(currentClassScope)}`
                          : '/review'
                      }
                      data-onboarding="review"
                      className="inline-flex h-12 items-center px-3.5 text-[14px] font-semibold text-white underline underline-offset-4 hover:text-indigo-200 transition"
                    >
                      Ôn tập tự do
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setActionModalType(reviewDueCount > 0 ? 'review' : 'learn')}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/25 cursor-pointer"
                  title="Chọn chế độ học / ôn tập"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Chọn chế độ</span>
                </button>
              </div>
            </div>

            {/* Daily Goal Checklist (.ck) */}
            <div className="w-full lg:w-[260px] shrink-0 rounded-2xl bg-white/[0.14] p-4">
              <div className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white/85 tabular-nums">
                Mục tiêu hôm nay · {gamification.today_xp}/{dailyGoalXp} XP
              </div>

              <button
                type="button"
                onClick={() => setActionModalType('review')}
                className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
              >
                <span
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                    reviewDueCount === 0
                      ? 'border-white bg-white'
                      : 'border-white/70 bg-transparent'
                  }`}
                />
                <span className="truncate">
                  Ôn tập từ vựng ·{' '}
                  {countsReady
                    ? reviewDueCount === 0
                      ? 'hoàn tất'
                      : `${reviewDueCount} cần ôn`
                    : '…'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionModalType('learn')}
                className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
              >
                <span
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                    todayNewWords >= dailyGoalXp
                      ? 'border-white bg-white'
                      : 'border-white/70 bg-transparent'
                  }`}
                />
                <span className="truncate tabular-nums">
                  Nạp từ mới · {todayNewWords}/{dailyGoalXp}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionModalType('listening')}
                className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
              >
                <span
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                    listeningStats.completedCount > 0
                      ? 'border-white bg-white'
                      : 'border-white/70 bg-transparent'
                  }`}
                />
                <span className="truncate">
                  Luyện nghe
                  {listeningStats.completedCount > 0 ? ` · ${listeningStats.completedCount} bài` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionModalType('reading')}
                className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
              >
                <span
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                    dailyReadingStatus.completedCount > 0
                      ? 'border-white bg-white'
                      : 'border-white/70 bg-transparent'
                  }`}
                />
                <span className="truncate">
                  Luyện đọc
                  {dailyReadingStatus.completedCount > 0
                    ? ` · ${dailyReadingStatus.completedCount}/${dailyReadingStatus.totalCount}`
                    : ''}
                </span>
              </button>
            </div>
          </section>

          {/* ═══ PHÂN TÍCH DỮ LIỆU HỌC TẬP (#phan-tich) ═══ */}
          <LearningAnalyticsPanel
            stats={{
              total: totalWords,
              due: reviewDueCount,
              new: newCount,
              learned: Math.max(0, totalWords - newCount),
            }}
            wordBreakdown={{
              l1: levelCounts[0] || 0,
              l2: levelCounts[1] || 0,
              l3: levelCounts[2] || 0,
              l4: levelCounts[3] || 0,
              l5: levelCounts[4] || 0,
              l6: levelCounts[5] || 0,
            }}
            avgStabilityDays={avgStabilityDays}
            retentionRate={retentionRate}
            skillScores={skillScores}
            dailyActivity={dailyActivity}
            quizTrend={quizTrend}
            grammarDue={grammarDueCount}
            weakWords={
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
                    }))
            }
            currentStreak={studyStreak}
            longestStreak={gamification.longest_streak}
            totalXp={gamification.total_xp}
            todayXp={gamification.today_xp}
            dailyGoal={gamification.daily_goal}
          />

          {/* ═══ LOWER 2-COLUMN GRID (.gr) ═══ */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            {/* LEFT COLUMN (.col) */}
            <div className="flex min-w-0 flex-col gap-6">
              {/* Card: Luyện 5 kỹ năng */}
              <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
                <div className="mb-3.5 flex items-baseline justify-between">
                  <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    Luyện 5 kỹ năng
                  </h2>
                  <Link
                    href="/practice"
                    className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
                  >
                    Tất cả
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* 1. Grammar (Sky) */}
                  <Link
                    href="/grammar"
                    className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-slate-900 transition hover:border-sky-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-sky-400"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                      <Code2 className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <b className="text-[15px] font-bold">Grammar</b>
                    <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                      Ngữ pháp ứng dụng
                    </span>
                  </Link>

                  {/* 2. Reading (Amber) */}
                  <button
                    type="button"
                    onClick={() => setActionModalType('reading')}
                    className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-left text-slate-900 transition hover:border-amber-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-amber-400 cursor-pointer"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                      <FileText className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <b className="text-[15px] font-bold">Reading</b>
                    <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                      Đọc hiểu đa tầng
                    </span>
                  </button>

                  {/* 3. Listening (Emerald) */}
                  <button
                    type="button"
                    onClick={() => setActionModalType('listening')}
                    className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-left text-slate-900 transition hover:border-emerald-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-emerald-400 cursor-pointer"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <Headphones className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <b className="text-[15px] font-bold">Listening</b>
                    <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                      Nghe video &amp; ETS
                    </span>
                  </button>

                  {/* 4. Speaking (Rose) */}
                  <Link
                    href="/student/speaking/foundation"
                    aria-label="Luyện nói phản xạ Speaking"
                    className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-slate-900 transition hover:border-rose-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-rose-400"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                      <Mic className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <b className="text-[15px] font-bold">Speaking</b>
                    <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                      Phản xạ, phát âm AI
                    </span>
                  </Link>

                  {/* 5. Writing (Violet) */}
                  <Link
                    href="/writing"
                    className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-slate-900 transition hover:border-violet-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-violet-400"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                      <PenTool className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <b className="text-[15px] font-bold">Writing</b>
                    <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                      Luyện viết AI
                    </span>
                  </Link>
                </div>
              </section>

              {/* 2-Column Sub-grid (.two): Học tiếp + Từ cần ưu tiên */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Học tiếp */}
                <section className="flex flex-col rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
                  <div className="mb-3.5 flex items-baseline justify-between">
                    <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                      Học tiếp
                    </h2>
                    <Link
                      href="/journey"
                      className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
                    >
                      Mở lộ trình
                    </Link>
                  </div>

                  <div className="text-[15px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    {activePack
                      ? `${activePack.topic_title} · Chặng ${activePack.pack_index + 1}`
                      : 'Lộ trình học · bài hiện tại'}
                  </div>
                  <div className="mt-0.5 text-[13.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                    {activePack
                      ? `Đã học ${activePack.reviewed_count}/${activePack.word_count} từ trong chặng`
                      : 'Tiếp tục đúng chỗ bạn đã dừng'}
                  </div>

                  <div className="my-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#20253F]">
                    <i
                      className="block h-full rounded-full bg-[#7B67FF] transition-all duration-500"
                      style={{ width: `${activePackPct}%` }}
                    />
                  </div>

                  <div className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                    {activePack
                      ? activePack.status === 'completed'
                        ? 'Đã hoàn thành'
                        : activePack.status === 'in_progress'
                          ? `Đang học (${activePackPct}%)`
                          : 'Chưa bắt đầu'
                      : 'Chưa bắt đầu'}
                  </div>

                  <Link
                    href={activePackHref}
                    className="mt-3 flex h-11 items-center justify-center rounded-xl border-[1.5px] border-[#7B67FF] text-[14px] font-bold text-indigo-600 transition hover:bg-indigo-50/50 dark:text-[#B3A8FF] dark:hover:bg-[#20253F]"
                  >
                    Tiếp tục
                  </Link>
                </section>

                {/* Từ cần ưu tiên */}
                <section className="flex flex-col rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
                  <div className="mb-3.5 flex items-baseline justify-between">
                    <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                      Từ cần ưu tiên
                    </h2>
                    <Link
                      href={reviewHref}
                      className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
                    >
                      {priorityWords.length > 0 ? `${priorityWords.length} từ` : 'Ôn tập'}
                    </Link>
                  </div>

                  {priorityWords.length > 0 ? (
                    <div className="space-y-2">
                      {priorityWords.slice(0, 3).map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWordId(w.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-[10px] bg-slate-100/80 px-3 py-2.5 text-left transition hover:bg-indigo-50/70 dark:bg-[#20253F] dark:hover:bg-[#272C47] cursor-pointer"
                        >
                          <b className="truncate text-[15px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                            {w.word}
                          </b>
                          <span className="truncate text-[13px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                            {w.translation}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : serverWeakWords.length > 0 ? (
                    <div className="space-y-2">
                      {serverWeakWords.slice(0, 3).map((w) => (
                        <div
                          key={w.word}
                          className="flex items-center justify-between gap-3 rounded-[10px] bg-slate-100/80 px-3 py-2.5 dark:bg-[#20253F]"
                        >
                          <b className="truncate text-[15px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                            {w.word}
                          </b>
                          <span className="truncate text-[13px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                            {w.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[10px] border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-4 text-center text-[13px] font-medium text-slate-500 dark:border-[#272C47] dark:bg-[#20253F]/50 dark:text-[#A5AAC6]">
                      Chưa có từ vựng nào đến hạn hoặc cần ưu tiên ôn tập.
                    </div>
                  )}
                </section>
              </div>

              {/* Nhiệm vụ nhận quà Pro */}
              {profile?.id && (
                <ProTrialMilestoneCard
                  enabled
                  hintStreak={studyStreak}
                  hintWords={countsReady ? totalWords : undefined}
                  onClaimed={() => {
                    void refreshGamification();
                    void AuthApi.getLegacyProfile(profile.id)
                      .then((data) => {
                        if (data) setProfile(data);
                      })
                      .catch(() => {});
                  }}
                />
              )}

              {/* Thành tích & Huy hiệu */}
              <div className="opacity-95">
                <BadgeGrid badges={badges} />
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN (.col) */}
            <div className="flex min-w-0 flex-col gap-6">
              {/* Card: Tuần này */}
              <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
                <div className="mb-3.5 flex items-baseline justify-between">
                  <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    Tuần này
                  </h2>
                  <Link
                    href="/student/profile"
                    className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
                  >
                    Lịch sử
                  </Link>
                </div>

                <div className="mt-1.5 flex justify-between">
                  {weekDaysStrip.map((day) => (
                    <div
                      key={day.key}
                      className="flex flex-col items-center gap-1.5 text-[12px] font-semibold text-slate-500 dark:text-[#A5AAC6]"
                    >
                      <i
                        className={`block h-[30px] w-[30px] rounded-full transition-colors ${
                          day.done
                            ? 'bg-emerald-500 dark:bg-[#3DD6A0]'
                            : 'bg-slate-100 dark:bg-[#20253F]'
                        } ${
                          day.isToday
                            ? 'outline-2 outline-offset-2 outline-[#7B67FF]'
                            : ''
                        }`}
                      />
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card: Kho từ vựng (#kho-tu-vung) */}
              <section
                id="kho-tu-vung"
                data-onboarding="vault"
                className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]"
              >
                <div className="mb-1 flex items-baseline justify-between">
                  <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    {activeClassroom ? `Kho từ · ${activeClassroom.name}` : 'Kho từ vựng'}
                  </h2>
                  <span className="text-[12.5px] font-bold text-indigo-600 dark:text-[#B3A8FF] tabular-nums">
                    {countsReady ? `${totalWords} từ` : '…'}
                  </span>
                </div>
                <div className="text-[13.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                  Thêm từ từ thư viện gói hoặc tự nạp.
                </div>

                <Link
                  href="/library"
                  className="mt-3 flex h-11 items-center justify-center rounded-xl border-[1.5px] border-[#7B67FF] text-[14px] font-bold text-indigo-600 transition hover:bg-indigo-50/50 dark:text-[#B3A8FF] dark:hover:bg-[#20253F]"
                >
                  Mở kho từ
                </Link>

                <div className="mt-2.5 flex items-center justify-between text-xs font-bold">
                  <Link
                    href="/import"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-[#A5AAC6] dark:hover:text-[#B3A8FF]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tự nạp từ</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowVaultWords((v) => !v)}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-[#B3A8FF] cursor-pointer"
                  >
                    <span>{showVaultWords ? 'Thu gọn danh sách' : 'Tra từ đã lưu'}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${showVaultWords ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {showVaultWords && (
                  <div className="mt-3 space-y-2.5 border-t border-slate-200/80 pt-3 dark:border-[#272C47]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm từ trong kho..."
                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B67FF]/40 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
                      />
                    </div>

                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {(['all', 'new', 'due', 'learned', 'mastered'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setStatusFilter(f)}
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            statusFilter === f
                              ? 'bg-[#7B67FF] text-white'
                              : 'bg-slate-100 text-slate-500 dark:bg-[#20253F] dark:text-[#A5AAC6]'
                          }`}
                        >
                          {{ all: 'Tất cả', new: 'Mới', due: 'Đến hạn', learned: 'Đã học', mastered: 'Master' }[f]}
                        </button>
                      ))}
                    </div>

                    {wordsLoading ? (
                      <WordCardSkeleton count={3} />
                    ) : filteredWords.length === 0 ? (
                      <p className="py-3 text-center text-xs text-slate-400 dark:text-[#A5AAC6]">
                        Không tìm thấy từ phù hợp
                      </p>
                    ) : (
                      <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                        {filteredWords.map((word) => (
                          <button
                            key={word.id}
                            type="button"
                            onClick={() => setSelectedWordId(word.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-indigo-50/60 dark:bg-[#20253F] dark:hover:bg-[#272C47] cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-extrabold text-slate-900 dark:text-[#F2F3FB]">
                                {word.word}
                              </div>
                              <div className="truncate text-[11px] text-slate-500 dark:text-[#A5AAC6]">
                                {word.translation}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-[#B3A8FF]">
                              L{word.srsLevel || 1}
                            </span>
                          </button>
                        ))}

                        {words.length < totalWords && !debouncedQuery && statusFilter === 'all' && (
                          <button
                            type="button"
                            onClick={loadMoreWords}
                            disabled={isLoadingMore}
                            className="mt-1 w-full rounded-xl border border-slate-200 py-1.5 text-center text-xs font-bold text-indigo-600 hover:bg-slate-50 dark:border-[#272C47] dark:text-[#B3A8FF] dark:hover:bg-[#20253F] cursor-pointer"
                          >
                            {isLoadingMore ? 'Đang tải...' : `Tải thêm (${totalWords - words.length})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Card: Luyện thi (.ex) */}
              <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
                <div className="mb-3.5 flex items-baseline justify-between">
                  <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    Luyện thi
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActionModalType('toeic')}
                    className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF] cursor-pointer"
                  >
                    TOEIC
                  </button>
                  <Link
                    href="/vstep"
                    className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF]"
                  >
                    VSTEP
                  </Link>
                  <Link
                    href="/vnu-bac-3"
                    className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF]"
                  >
                    VNU Test
                  </Link>
                  <button
                    type="button"
                    onClick={() => toast.info('Chương trình Luyện thi IELTS đang được cập nhật')}
                    className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF] cursor-pointer"
                  >
                    IELTS
                  </button>
                </div>
              </section>
            </div>
          </div>
          </div>
        </div>

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
