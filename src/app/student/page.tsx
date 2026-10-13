'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { Profile, Word } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Loader2, Plus, ArrowRight,
  X, Clock, UserPlus, Sparkles,
  ClipboardList, BookOpen, RotateCw,
  Headphones, Mic, PenTool, FileText, Code2,
  Users, Flame, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/useGamification';
import {
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
  writeDashboardProfileCache,
  writeDashboardWordsCache,
} from '@/lib/dashboard-snapshot-cache';
import { SRS_LEVEL_LABELS, SRS_LEVEL_STABILITY_HINT } from '@/lib/srs';
import { STAMPEDE_MODE } from '@/lib/stampede';
import { parseIpa } from '@/lib/study';

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

/** Compact notification card: "You have a daily reading exercise!" */
function DailyReadingCard() {
  const [hasNew, setHasNew] = useState(false);
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    authFetch('/api/practice/daily-reading')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success && json.hasNew && Array.isArray(json.exercises)) {
          const unfinished = json.exercises.find(
            (e: { completion?: { completedAt?: string } | null }) => !e.completion?.completedAt,
          );
          if (unfinished) {
            setHasNew(true);
            setTitle(unfinished.title || 'Bài đọc hàng ngày');
            setWordCount(unfinished.sourceWords?.length || 0);
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!hasNew) return null;

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
          &ldquo;{title}&rdquo; · {wordCount} từ · Đọc + quiz + điền từ
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
  const studentCtx = useStudentContext();
  const [profile, setProfile] = useState<Profile | null>(() => studentCtx?.profile ?? readLastProfileCache());
  const initialWords = readLastDashboardWordsCache();
  const [words, setWords] = useState<Word[]>(() => initialWords ?? []);
  const [classroomId, setClassroomId] = useState<string | null>(studentCtx?.wordSummary.classroomId ?? null);
  const [currentClassScope, setCurrentClassScope] = useState<string>('__personal__');
  const currentClassScopeRef = useRef<string>('__personal__');
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<EnrolledClassroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>([]);
  const [todayWords, setTodayWords] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [vocabPacks, setVocabPacks] = useState<ActiveVocabPack[]>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  // Join classroom modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Action Selection Modal State (Ô vuông 1cm giữa màn hình)
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
  /** Phân bố SRS L1–L6 full kho (từ API summary) */
  const [levelCounts, setLevelCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  /** Sẵn sàng hiển thị số đếm ngay từ Frame 0 nếu đã có cache */
  const [countsReady, setCountsReady] = useState(() => {
    const cached = (studentCtx?.wordSummary?.total ?? 0) > 0 ? studentCtx!.wordSummary : readLastWordSummaryCache();
    return Boolean(cached);
  });
  const [, setWordsLoading] = useState(() => !initialWords || initialWords.length === 0);
  const [, setWordsOffset] = useState(() => initialWords?.length ?? 0);
  const WORDS_PAGE_SIZE = 20;
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
    return resolveDisplayStreak({
      currentStreak: initialGamification?.current_streak,
      lastActiveDate: initialGamification?.last_active_date,
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
        router.push(`/auth?redirectTo=${encodeURIComponent(redirectPath)}`);
      }
    };
    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {

        void fetchClassrooms();
        // Chỉ reload khi chưa load (tránh double với getSession)
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          loadData(session.user.id, currentClassScopeRef.current);
        }
      } else if (event === 'SIGNED_OUT') {
        loadStartedRef.current = false;

        router.push('/auth');
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
    // Không ghi đè chart L1–L6 bằng [0,0,…] từ poll summary (không levels)
    if (Array.isArray(data.levelCounts) && data.levelCounts.length === 6) {
      const next = data.levelCounts.map((n) => Number(n) || 0);
      if (next.some((n) => n > 0)) setLevelCounts(next);
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
      });
      studentCtx?.updateWordSummary({
        total,
        newCount: nextNew,
        reviewDueCount: nextReview,
        dueCount: data.dueCount,
        classroomId: data.classroomId ?? null,
      });
    }
  };

  /** Heatmap + streak liên tiếp (stats lite). Gọi sau shell. */
  const loadActivityStats = () => {
    void authFetch('/api/student/stats?lite=1', {})
      .then((r) => r.json())
      .then((st) => {
        if (!st?.success) return;
        const activity: { date: string; count: number }[] = st.data?.dailyActivity ?? [];
        setDailyActivity(activity);
        if (typeof st.data?.studyStreak === 'number') {
          setStudyStreak(st.data.studyStreak);
        }
        if (typeof st.data?.todayWords === 'number') {
          setTodayWords(st.data.todayWords);
        } else if (typeof st.data?.todayKey === 'string') {
          setTodayWords(activity.find((a) => a.date === st.data.todayKey)?.count ?? 0);
        }
      })
      .catch(() => {});
  };

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

  /** Levels L1–L6 + grammar due + packs — idle, không chặn first paint. */
  const loadSecondaryDashboard = (userId: string, targetScope?: string) => {
    const scope = targetScope !== undefined ? targetScope : currentClassScope;
    const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';

    loadActivityStats();

    void authFetch('/api/vocab/packs', {})
      .then((response) => response.json())
      .then((packData: { success?: boolean; packs?: ActiveVocabPack[] }) => {
        if (!packData.success || !packData.packs) return;
        setVocabPacks(packData.packs);
      })
      .catch(() => {});

    const loadLevels = () => {
      void authFetch(`/api/words?summary=1&levels=1${scopeParam}`, {})
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum, scope);
        })
        .catch(() => {});
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(loadLevels, { timeout: 4000 });
    } else {
      setTimeout(loadLevels, 1500);
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
         * Secondary (heatmap / đếm từ / levels / packs): fire-and-forget sau shell.
         */
        const profPromise = (studentCtx?.profile || profile)
          ? Promise.resolve({ data: studentCtx?.profile || profile, error: null })
          : supabase
              .from('profiles')
              .select('id, full_name, email, role, avatar_url, plan, created_at')
              .eq('id', userId)
              .single();

        // Fast-path: Nạp số đếm từ cần ôn và từ mới tức thì qua single-flight promise
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


  // Auto-refresh nhẹ: chỉ dùng summary endpoint để cập nhật dueCount
  const refreshSummary = async (userId: string) => {
    try {
      const scope = currentClassScopeRef.current;
      const scopeParam = (scope && scope !== '__personal__') ? `&classroomId=${encodeURIComponent(scope)}` : '&classroomId=__personal__';
      const res = await authFetch(`/api/words?summary=1${scopeParam}`, {});
      const data = await res.json();
      if (data.success) {
        applySummaryCounts(userId, data, scope);
        // Cập nhật isDue trên words hiện có dựa trên thời gian
        const now = Date.now();
        setWords((prev) => prev.map((w) => {
          const nextReviewDate = w.srs?.next_review_date ? new Date(w.srs.next_review_date).getTime() : now;
          return { ...w, isDue: !w.srs || nextReviewDate <= now };
        }));
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
    // 1s chỉ khi còn < 2 phút; còn lại 5s — bớt re-render dashboard
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

  // === Detect mốc (level / badge / streak liên tiếp) → popup chúc mừng ===
  // Dùng useRef (đồng bộ) thay vì useState để tránh fire popup trùng khi re-render nhanh.
  // SessionStorage guard: mỗi mốc chỉ hiện 1 lần / session.
  useEffect(() => {
    if (!profile?.id || gamificationLoading) return;
    const masteredCount = words.filter((w: Word & { srsLevel?: number }) => w.srsLevel === 5).length;
    const currentLevel = xpToLevel(gamification.total_xp);
    const earned = earnedBadges(
      { ...gamification, current_streak: studyStreak },
      masteredCount,
    ).filter((b) => b.earned);
    const currentBadges = earned.map((b) => b.id);

    const prev = prevSnapshotRef.current;

    // Lần đầu sau khi gamification data đã load xong: snapshot baseline, KHÔNG fire popup
    if (!prev) {
      prevSnapshotRef.current = {
        level: currentLevel,
        badgeIds: currentBadges,
        streak: studyStreak,
      };
      try { sessionStorage.setItem(`milestone_level_${currentLevel}`, '1'); } catch { /* ignore */ }
      return;
    }

    // Helper: chặn hiện popup trùng trong cùng session
    const alreadyShown = (key: string) => {
      try { return sessionStorage.getItem(key) === '1'; } catch { return false; }
    };
    const markShown = (key: string) => {
      try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
    };

    // Ưu tiên: level up > badge > streak milestone
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

    // Cập nhật ref đồng bộ → lần render tiếp không fire lại
    prevSnapshotRef.current = {
      level: currentLevel,
      badgeIds: currentBadges,
      streak: studyStreak,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: so sánh snapshot cũ vs mới
  }, [gamification.total_xp, gamificationLoading, studyStreak, words.length, profile?.id]);

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

  // Tự động mở modal Tham gia lớp nếu truy cập /student?joinClass=... (hỗ trợ mã mời hoặc cờ 1)
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


  const masteredCount = useMemo(
    () => (levelCounts.length >= 5 ? levelCounts[4] + (levelCounts[5] || 0) : words.filter((w) => (w.srsLevel ?? 0) >= 5).length),
    [levelCounts, words]
  );

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

              {/* Thông báo trên mobile — cùng hàng bên phải */}
              <div className="md:hidden flex items-center">
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
          <DailyReadingCard />

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
                    {countsReady ? `${todayWords} lượt` : '…'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((todayWords / Math.max(gamification.daily_goal || 20, 1)) * 100))}%`,
                    }}
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
                    {todayWords} / {gamification.daily_goal || 10} từ
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((todayWords / Math.max(gamification.daily_goal || 10, 1)) * 100))}%`,
                    }}
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
                    Luyện nghe
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '60%' }} />
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
                    Luyện đọc
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '100%' }} />
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
              <div
                className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-700 shadow-3xs cursor-pointer active:scale-95 transition-all"
                onClick={() => toast.info('Tính năng Luyện Speaking đang được cập nhật')}
              >
                <span className="absolute -top-1.5 -right-0.5 rounded-full bg-amber-500 text-white px-1 py-0 text-[6.5px] font-black shadow ring-1 ring-white leading-tight">
                  Đang cập nhật
                </span>
                <Mic className="w-4 h-4" strokeWidth={2.4} />
                <span className="mt-0.5 text-[8.5px] font-black leading-none text-rose-800">Speaking</span>
              </div>

              {/* 5. Writing */}
              <div
                className="group relative flex flex-col items-center justify-center h-[46px] rounded-xl bg-slate-100/80 border border-slate-200 text-slate-500 shadow-3xs cursor-pointer active:scale-95 transition-all"
                onClick={() => toast.info('Tính năng Luyện Writing sắp ra mắt')}
              >
                <span className="absolute -top-1.5 -right-0.5 rounded-full bg-slate-500 text-white px-1 py-0 text-[6.5px] font-black shadow ring-1 ring-white leading-tight">
                  Sắp có
                </span>
                <PenTool className="w-4 h-4 opacity-80" strokeWidth={2.4} />
                <span className="mt-0.5 text-[8.5px] font-black leading-none text-slate-600">Writing</span>
              </div>
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
                className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs hover:border-indigo-300 active:scale-95 transition-all cursor-pointer"
              >
                <Image src="/images/exams/toeic.png" alt="TOEIC" width={64} height={32} className="max-h-full max-w-full object-contain" />
              </button>

              {/* 2. VSTEP (Vào trang luôn) */}
              <Link
                href="/vstep"
                className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs hover:border-blue-300 active:scale-95 transition-all cursor-pointer"
              >
                <Image src="/images/exams/vstep.png" alt="VSTEP" width={64} height={32} className="max-h-full max-w-full object-contain" />
              </Link>

              {/* 3. VNU Test (Đang cập nhật) */}
              <button
                type="button"
                onClick={() => toast.info('Chương trình VNU Test đang được cập nhật')}
                className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs hover:border-emerald-300 active:scale-95 transition-all cursor-pointer"
              >
                <span className="absolute -top-1.5 -right-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[6.5px] font-black shadow ring-1 ring-white whitespace-nowrap">
                  Đang cập nhật
                </span>
                <Image src="/images/exams/vnu-test.png" alt="VNU Test" width={64} height={32} className="max-h-full max-w-full object-contain" />
              </button>

              {/* 4. IELTS (Đang cập nhật) */}
              <button
                type="button"
                onClick={() => toast.info('Chương trình Luyện thi IELTS đang được cập nhật')}
                className="group relative flex items-center justify-center h-[52px] rounded-xl border border-slate-200/80 bg-white p-2 shadow-3xs active:scale-95 transition-all cursor-pointer"
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
              {/* Dictionary data shape từ external API khác với DictionaryData interface — dùng narrow type */}
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

      {/* Pop-up Ô vuông 1cm giữa màn hình khi chọn chế độ học/luyện thi */}
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
