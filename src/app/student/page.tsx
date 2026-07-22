'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { track } from '@/lib/analytics';
import type { Profile, Word } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine, Brain, LogOut, Loader2, Plus,
  User, LayoutGrid, ArrowRight,
  Menu, X, Clock, Search, ChevronDown, UserPlus, Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { WordCardSkeleton } from '@/components/ui/WordCardSkeleton';
import { useGamification } from '@/hooks/useGamification';
import { earnedBadges, xpToLevel } from '@/lib/gamification';
import { Mascot, type MascotMood } from '@/components/gamification/Mascot';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XpGoalCard } from '@/components/gamification/XpGoalCard';
import { ProTrialMilestoneCard } from '@/components/gamification/ProTrialMilestoneCard';
import type { CelebrationIntensity } from '@/components/gamification/Celebration';
import { MobileBottomNav } from '@/components/student/MobileBottomNav';
import { StudentShell } from '@/components/student/StudentShell';
import { NotificationBell } from '@/components/NotificationBell';
import { EnableNotifications } from '@/components/EnableNotifications';
import {
  readWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import { SRS_LEVEL_LABELS, SRS_LEVEL_STABILITY_HINT } from '@/lib/srs';
import { STAMPEDE_MODE } from '@/lib/stampede';

// Lazy load: canvas-confetti chỉ chạy client-side, không cần SSR + chỉ tải khi cần
const Celebration = dynamic(
  () => import('@/components/gamification/Celebration').then((m) => m.Celebration),
  { ssr: false }
);
// Modal — chỉ tải khi mở / sau shell
const WordDetailModal = dynamic(
  () => import('@/components/student/WordDetailModal').then((m) => m.WordDetailModal),
  { ssr: false }
);
const BadgeGrid = dynamic(
  () => import('@/components/gamification/BadgeGrid').then((m) => m.BadgeGrid),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> }
);

interface ActiveVocabPack {
  pack_id: string;
  topic_title: string;
  pack_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  word_count: number;
  reviewed_count: number;
  words: Array<{ word_id: string; position: number }>;
}

interface StudentUserMetadata {
  email?: string;
  lingopro_onboarding_completed?: unknown;
  lingopro_onboarding_version?: unknown;
  force_onboarding?: boolean;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userMetadata, setUserMetadata] = useState<StudentUserMetadata | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [joinedClass, setJoinedClass] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetryingAI, setIsRetryingAI] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>([]);
  const [todayWords, setTodayWords] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [grammarDue, setGrammarDue] = useState(0);
  const [vocabPacks, setVocabPacks] = useState<ActiveVocabPack[]>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  // Join classroom modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Pagination state cho word list
  const [totalWords, setTotalWords] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  /** Phân bố SRS L1–L6 full kho (từ API summary) */
  const [levelCounts, setLevelCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  /** false cho đến khi có counts (cache hoặc API) — progressive badge */
  const [countsReady, setCountsReady] = useState(false);
  /** word list load sau shell — tránh flash empty state */
  const [wordsLoading, setWordsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [wordsOffset, setWordsOffset] = useState(0);
  const WORDS_PAGE_SIZE = 20;
  const accessTokenRef = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'due' | 'learned' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'hardest'>('newest');
  const router = useRouter();
  const { data: gamification, refresh: refreshGamification } = useGamification(profile?.id ?? null);

  // Celebration state — fire khi level up / badge unlock / streak milestone
  const [celebration, setCelebration] = useState<{ key: string; intensity: CelebrationIntensity } | null>(null);
  const [prevSnapshot, setPrevSnapshot] = useState<{ level: number; badgeIds: string[]; streak: number } | null>(null);

  // Chặn double-load: getSession + onAuthStateChange SIGNED_IN/INITIAL_SESSION
  const loadStartedRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Student] Auth check started');
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        accessTokenRef.current = session.access_token;
        setUserMetadata(session.user.user_metadata);
        // Stale-while-revalidate: paint counts từ cache ngay (0ms)
        const cached = readWordSummaryCache(session.user.id);
        if (cached) {
          setTotalWords(cached.total);
          setNewCount(cached.newCount);
          setReviewDueCount(cached.reviewDueCount);
          if (cached.classroomId) setClassroomId(cached.classroomId);
          setCountsReady(true);
        }
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          loadData(session.user.id, session.access_token);
        }
      } else {
        setIsLoading(false);
        router.push('/auth');
      }
    };
    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        accessTokenRef.current = session.access_token;
        setUserMetadata(session.user.user_metadata);
        // Chỉ reload khi chưa load (tránh double với getSession)
        if (!loadStartedRef.current) {
          loadStartedRef.current = true;
          loadData(session.user.id, session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        loadStartedRef.current = false;
        setUserMetadata(null);
        accessTokenRef.current = null;
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
  ) => {
    const total = data.total || 0;
    const nextNew = data.newCount ?? 0;
    const nextReview = data.reviewDueCount ?? 0;
    setTotalWords(total);
    setNewCount(nextNew);
    setReviewDueCount(nextReview);
    // Không ghi đè chart L1–L6 bằng [0,0,…] từ poll summary (không levels)
    if (Array.isArray(data.levelCounts) && data.levelCounts.length === 6) {
      const next = data.levelCounts.map((n) => Number(n) || 0);
      if (next.some((n) => n > 0)) setLevelCounts(next);
    }
    if (data.classroomId) setClassroomId(data.classroomId);
    setCountsReady(true);
    writeWordSummaryCache(userId, {
      total,
      newCount: nextNew,
      reviewDueCount: nextReview,
      dueCount: data.dueCount,
      classroomId: data.classroomId ?? null,
    });
  };

  /** Heatmap + đếm từ hôm nay (stats lite). Gọi sau shell. */
  const loadActivityStats = (token?: string | null) => {
    void authFetch('/api/student/stats?lite=1', {}, token)
      .then((r) => r.json())
      .then((st) => {
        if (!st?.success) return;
        const activity: { date: string; count: number }[] = st.data?.dailyActivity ?? [];
        setDailyActivity(activity);
        const n = new Date();
        const todayKey = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
        setTodayWords(activity.find((a) => a.date === todayKey)?.count ?? 0);
      })
      .catch(() => {});
  };

  /** Levels L1–L6 + grammar due + packs — idle, không chặn first paint. */
  const loadSecondaryDashboard = (userId: string, token?: string | null) => {
    loadActivityStats(token);

    void authFetch('/api/grammar/progress?summary=1', {}, token)
      .then((r) => r.json())
      .then((gp) => { if (gp?.success) setGrammarDue(gp.dueCount || 0); })
      .catch(() => {});

    void authFetch('/api/vocab/packs', {}, token)
      .then((response) => response.json())
      .then((packData: { success?: boolean; packs?: ActiveVocabPack[] }) => {
        if (!packData.success || !packData.packs) return;
        setVocabPacks(packData.packs);
      })
      .catch(() => {});

    const loadLevels = () => {
      void authFetch('/api/words?summary=1&levels=1', {}, token)
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum);
        })
        .catch(() => {});
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(loadLevels, { timeout: 4000 });
    } else {
      setTimeout(loadLevels, 1500);
    }
  };

  const loadData = async (userId: string, accessToken?: string) => {
    const token = accessToken ?? accessTokenRef.current;
    try {
      if (STAMPEDE_MODE) {
        /**
         * CHẾ ĐỘ LỚP ĐÔNG (NEXT_PUBLIC_STAMPEDE_MODE=1, mặc định):
         * Critical path: profile + words kèm counts (shell nhanh).
         * Secondary (heatmap / đếm từ / levels / packs): fire-and-forget sau shell.
         */
        const [profRes, wordsJson] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email, role, avatar_url, plan, created_at')
            .eq('id', userId)
            .single(),
          authFetch(
            `/api/words?limit=${WORDS_PAGE_SIZE}&offset=0&includeCounts=1`,
            {},
            token,
          )
            .then((r) => r.json())
            .catch(() => null),
        ]);

        if (profRes.error) {
          console.error('[Student] Load profile failed:', profRes.error.message);
          setWordsLoading(false);
          return;
        }
        if (profRes.data) setProfile(profRes.data as Profile);

        if (wordsJson?.success) {
          setWords(wordsJson.data || []);
          setClassroomId(wordsJson.classroomId ?? null);
          setWordsOffset(WORDS_PAGE_SIZE);
          applySummaryCounts(userId, {
            total: wordsJson.total,
            newCount: wordsJson.newCount,
            reviewDueCount: wordsJson.reviewDueCount,
            dueCount: wordsJson.dueCount,
            classroomId: wordsJson.classroomId ?? null,
          });
        }
        setWordsLoading(false);
        // Sau shell: heatmap + đếm từ hôm nay + chart L1–L6 (không chặn paint)
        loadSecondaryDashboard(userId, token);
        return;
      }

      // ── Full mode (STAMPEDE=0): progressive load, đủ packs/grammar/heatmap ──
      const summaryP = authFetch('/api/words?summary=1', {}, token)
        .then((r) => r.json())
        .then((sum) => {
          if (sum?.success) applySummaryCounts(userId, sum);
          return sum;
        })
        .catch(() => null);

      const [profRes, enrollRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('enrollments').select('id').eq('student_id', userId),
        summaryP,
      ]);

      if (profRes.error) {
        console.error('[Student] Load profile failed:', profRes.error.message);
        setWordsLoading(false);
        return;
      }
      if (profRes.data) setProfile(profRes.data as Profile);
      setJoinedClass((enrollRes.data?.length ?? 0) > 0);
      setIsLoading(false);
      setWordsLoading(true);

      loadSecondaryDashboard(userId, token);

      try {
        const wordsJson = await authFetch(
          `/api/words?limit=${WORDS_PAGE_SIZE}&offset=0`,
          {},
          token,
        ).then((r) => r.json()).catch(() => null);

        if (wordsJson?.success) {
          setWords(wordsJson.data || []);
          setClassroomId(wordsJson.classroomId ?? null);
          setWordsOffset(WORDS_PAGE_SIZE);
          if (typeof wordsJson.newCount === 'number' || typeof wordsJson.reviewDueCount === 'number') {
            applySummaryCounts(userId, wordsJson);
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
    try {
      const res = await authFetch(
        `/api/words?limit=${WORDS_PAGE_SIZE}&offset=${wordsOffset}`,
        {},
        accessTokenRef.current,
      );
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setWords(prev => [...prev, ...data.data]);
        setWordsOffset(prev => prev + WORDS_PAGE_SIZE);
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
      const res = await authFetch('/api/words?summary=1', {}, accessTokenRef.current);
      const data = await res.json();
      if (data.success) {
        applySummaryCounts(userId, data);
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

  // === Detect milestones (level up / new badge / streak milestone) → trigger Celebration ===
  useEffect(() => {
    if (!profile?.id) return;
    const masteredCount = words.filter((w: Word & { srsLevel?: number }) => w.srsLevel === 5).length;
    const currentLevel = xpToLevel(gamification.total_xp);
    const currentBadges = earnedBadges(gamification, masteredCount)
      .filter(b => b.earned)
      .map(b => b.id);

    // Lần đầu chỉ snapshot, không fire
    if (!prevSnapshot) {
      setPrevSnapshot({
        level: currentLevel,
        badgeIds: currentBadges,
        streak: gamification.current_streak,
      });
      return;
    }

    // Level up
    if (currentLevel > prevSnapshot.level) {
      setCelebration({ key: `level-${currentLevel}`, intensity: 'epic' });
      toast.success(`🎉 Lên Level ${currentLevel}!`, { duration: 4000 });
    } else {
      // Badge mới
      const newBadge = currentBadges.find(id => !prevSnapshot.badgeIds.includes(id));
      if (newBadge) {
        setCelebration({ key: `badge-${newBadge}`, intensity: 'strong' });
        toast.success('🏆 Mở khoá thành tích mới!', { duration: 4000 });
      } else {
        // Streak milestone (3, 7, 14, 30, 60, 100)
        const MILESTONES = [3, 7, 14, 30, 60, 100];
        const hitMilestone = MILESTONES.includes(gamification.current_streak)
          && gamification.current_streak > prevSnapshot.streak;
        if (hitMilestone) {
          setCelebration({ key: `streak-${gamification.current_streak}`, intensity: 'strong' });
          toast.success(`🔥 Streak ${gamification.current_streak} ngày!`, { duration: 4000 });
        }
      }
    }

    setPrevSnapshot({
      level: currentLevel,
      badgeIds: currentBadges,
      streak: gamification.current_streak,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: so sánh snapshot cũ vs mới, không re-run khi prevSnapshot đổi
  }, [gamification.total_xp, gamification.current_streak, words.length, profile?.id]);

  // Đóng dropdown profile khi click ra ngoài
  useEffect(() => {
    if (!isProfileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isProfileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

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
        if (profile?.id) loadData(profile.id);
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('❌ Failed to update meaning');
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    try {
      const res = await authFetch('/api/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      if (res.ok) {
        toast.success('Word deleted');
        if (profile?.id) loadData(profile.id);
      }
    } catch {
      toast.error('Failed to delete word');
    }
  };

  const handleRetryAI = async () => {
    if (!classroomId || isRetryingAI) return;
    setIsRetryingAI(true);
    try {
      const res = await fetch('/api/words/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId }),
      });
      if (!res.ok) throw new Error('Background refresh failed');
      const data = await res.json();
      if (data.refreshed > 0) {
        toast.success(`✅ AI analyzed ${data.refreshed} word(s)!`);
        setTimeout(() => { if (profile?.id) loadData(profile.id); }, 2000);
      }
    } catch {
      // Background maintenance failed - silently log without toast
      console.warn('Background AI retry failed, will try again next cycle.');
    } finally {
      setIsRetryingAI(false);
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
        setJoinedClass(true);
      }
      setIsJoinModalOpen(false);
      setJoinCode('');
      if (profile?.id) void loadData(profile.id);
    } catch {
      setJoinError('Kết nối thất bại, vui lòng thử lại.');
    } finally {
      setIsJoining(false);
    }
  };

  // Tự động mở modal Tham gia lớp nếu truy cập /student?joinClass=1
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('joinClass') === '1') {
        setJoinError(null);
        setJoinCode('');
        setIsJoinModalOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('joinClass');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  // Debounce search — must be before any early return (Rules of Hooks)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Onboarding spotlight Grammar (mobile): mở/đóng drawer hamburger
  useEffect(() => {
    const open = () => setIsMenuOpen(true);
    const close = () => setIsMenuOpen(false);
    window.addEventListener('lingopro-onboarding-open-menu', open);
    window.addEventListener('lingopro-onboarding-close-menu', close);
    return () => {
      window.removeEventListener('lingopro-onboarding-open-menu', open);
      window.removeEventListener('lingopro-onboarding-close-menu', close);
    };
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-muted/40 p-8 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const masteredCount = words.filter((w) => w.srsLevel === 5).length;
  const badges = earnedBadges(gamification, masteredCount);

  const mascotMood: MascotMood = reviewDueCount > 0 ? 'cheer' : gamification.current_streak === 0 ? 'sleepy' : 'happy';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  const hasClass = joinedClass;

  const FB_COMMUNITY_URL = 'https://www.facebook.com/groups/1586345819865575';

  return (
    <StudentShell
      title="Dashboard"
      contentClassName="p-0"
      onJoinClass={() => {
        setJoinError(null);
        setJoinCode('');
        setIsJoinModalOpen(true);
      }}
    >
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-3 px-4 py-3 sm:gap-3.5 sm:px-7 sm:py-5">
          {/* Greeting — 1 dòng gọn */}
          <div className="flex items-center gap-2.5">
            <Mascot mood={mascotMood} size="sm" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-black leading-tight text-foreground sm:text-xl">
                {greeting}, {profile?.full_name?.split(' ')[0] || 'bạn'}!
              </h2>
              <p className="truncate text-xs font-semibold text-muted-foreground">
                {reviewDueCount > 0
                  ? `${reviewDueCount} từ cần ôn · bấm Ôn tập`
                  : newCount > 0
                    ? `${newCount} từ mới chờ học`
                    : 'Xong hết hôm nay 🎉'}
              </p>
            </div>
            {/* Meta siêu gọn — thay 4 stat card */}
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-600">
                {countsReady ? totalWords : '…'} từ
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-emerald-700">
                {masteredCount} master
              </span>
            </div>
          </div>

          {/* Desktop banner; mobile = fixed popup trong component */}
          <EnableNotifications />

          {/* CTA chính: số Học / Ôn TO — ưu tiên visual mobile */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={classroomId ? `/flashcard?class=${classroomId}&mode=learn` : '/flashcard?mode=learn'}
              data-onboarding="learn"
              className={`group flex min-h-[88px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center shadow-sm transition-all sm:min-h-[72px] sm:items-stretch sm:px-3 sm:py-2.5 sm:text-left ${
                !countsReady || newCount > 0
                  ? 'border-indigo-100 bg-white hover:border-indigo-300 hover:shadow-md'
                  : 'pointer-events-none border-transparent bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex w-full items-center justify-center gap-1 sm:justify-start sm:gap-1.5">
                <span className="text-base leading-none sm:text-lg">📖</span>
                <span className="text-xs font-black text-slate-800 sm:text-sm">Cần học</span>
              </div>
              <div
                className={`mt-1 text-4xl font-black leading-none tabular-nums tracking-tight sm:mt-0.5 sm:text-3xl ${
                  !countsReady ? 'animate-pulse text-indigo-300' : newCount > 0 ? 'text-indigo-600' : 'text-slate-300'
                }`}
              >
                {countsReady ? newCount : '…'}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                {!countsReady ? 'Đang tải…' : newCount > 0 ? 'từ mới' : 'Hết từ mới 🎉'}
              </p>
            </Link>

            <Link
              href={(!countsReady || reviewDueCount > 0) && classroomId ? `/review?class=${classroomId}` : reviewDueCount > 0 ? '/review' : '#'}
              data-onboarding="review"
              className={`group flex min-h-[88px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center shadow-sm transition-all sm:min-h-[72px] sm:items-stretch sm:px-3 sm:py-2.5 sm:text-left ${
                !countsReady || reviewDueCount > 0
                  ? 'border-emerald-100 bg-white hover:border-emerald-300 hover:shadow-md'
                  : 'pointer-events-none border-transparent bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex w-full items-center justify-center gap-1 sm:justify-start sm:gap-1.5">
                <span className="text-base leading-none sm:text-lg">🔄</span>
                <span className="text-xs font-black text-slate-800 sm:text-sm">Cần ôn</span>
              </div>
              <div
                className={`mt-1 text-4xl font-black leading-none tabular-nums tracking-tight sm:mt-0.5 sm:text-3xl ${
                  !countsReady ? 'animate-pulse text-emerald-300' : reviewDueCount > 0 ? 'text-emerald-600' : 'text-slate-300'
                }`}
              >
                {countsReady ? reviewDueCount : '…'}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                {!countsReady ? 'Đang tải…' : reviewDueCount > 0 ? 'đến hạn nhớ' : 'Chưa có due'}
              </p>
            </Link>
          </div>

          {/* Nhiệm vụ nhận quà Pro — luôn hiện trên dashboard free */}
          {profile?.id && (
            <ProTrialMilestoneCard
              enabled
              hintStreak={gamification.current_streak}
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

          {/* Luyện sử dụng từ / đặt câu — bulk 1–20 → VI+EN → AI EN */}
          <Link
            href="/practice/codemix"
            className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-amber-50 px-3 py-3 shadow-sm transition-all hover:border-violet-300 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xl text-white shadow">
              ✨
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-violet-900">Sử dụng từ / Đặt câu</p>
              <p className="text-[11px] font-semibold text-violet-700/80">
                Chọn 1–20 từ · viết đoạn có từ · AI nâng full English
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-violet-400" />
          </Link>

          {/* Luyện đọc gói — nhập từ → chọn chủ đề → Gen AI on-demand */}
          <Link
            href="/practice/pack-reading"
            className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-3 py-3 shadow-sm transition-all hover:border-teal-300 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-xl text-white shadow">
              📖
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-teal-900">Luyện đọc gói từ</p>
              <p className="text-[11px] font-semibold text-teal-700/80">
                Yếu / đang nhớ / vững · chủ đề · cấp độ · Gen AI
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-teal-400" />
          </Link>

          {/* Meta mobile — 1 dòng thay 4 card */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 sm:hidden">
            <span className="tabular-nums">{countsReady ? totalWords : '…'} từ</span>
            <span className="text-slate-300">·</span>
            <span className="tabular-nums text-emerald-600">{masteredCount} master</span>
            {countdown && reviewDueCount === 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-indigo-500">
                  <Clock className="h-3 w-3" />
                  {countdown}
                </span>
              </>
            )}
          </div>

          {/* Mobile: heatmap trái · Rookie/XP/mục tiêu phải | Desktop: 2 cột */}
          <section
            aria-label="Bảng hoạt động hàng tháng"
            className="grid grid-cols-[1fr_minmax(0,0.95fr)] items-stretch gap-1.5 sm:grid-cols-2 sm:gap-2.5"
          >
            <StreakCounter
              streak={gamification.current_streak}
              variant="calendar"
              dailyCounts={dailyActivity}
              className="min-w-0"
            />
            <XpGoalCard
              totalXp={gamification.total_xp}
              todayXp={gamification.today_xp}
              dailyXpGoal={gamification.daily_goal}
              todayWords={todayWords}
              className="min-w-0"
            />
          </section>

          {/* ═══ KHO TỪ VỰNG ═══ */}
          <section
            className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-3.5"
            id="kho-tu-vung"
            data-onboarding="vault"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-800 sm:text-base">
                <span className="text-base leading-none">📦</span>
                Kho từ vựng
              </h3>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Badge variant="outline" className="h-6 px-2 text-[10px] font-bold tabular-nums">
                  {countsReady ? totalWords : '…'} từ
                </Badge>
                <Link
                  href="/import"
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-[11px] font-extrabold text-indigo-700 active:brightness-110"
                  title="Dán list / file / quét ảnh của bạn"
                >
                  <Plus className="h-3.5 w-3.5" />
                  List riêng
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

            {/* Gói trong kho — đang dở lên đầu, bấm tiếp tục */}
            {vocabPacks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                    Gói trong kho · {vocabPacks.length}
                  </span>
                  <Link href="/library" className="text-[11px] font-bold text-emerald-600">
                    Xem thư viện →
                  </Link>
                </div>
                <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-none">
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
                          className={`min-w-[148px] max-w-[168px] shrink-0 rounded-xl border px-2.5 py-2 active:scale-[0.99] ${
                            inProgress
                              ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm shadow-indigo-100'
                              : pack.status === 'completed'
                                ? 'border-emerald-100 bg-emerald-50/50'
                                : 'border-slate-100 bg-slate-50/80'
                          }`}
                        >
                          {inProgress && (
                            <div className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-indigo-600">
                              ▶ Tiếp tục
                            </div>
                          )}
                          <div className="truncate text-[11px] font-extrabold text-slate-800">
                            {pack.topic_title}
                          </div>
                          <div className="mt-0.5 text-[10px] font-bold text-slate-400">
                            Chặng {pack.pack_index + 1}
                            {pack.status === 'completed'
                              ? ' · xong'
                              : pack.status === 'in_progress'
                                ? ' · đang học'
                                : ''}
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/80">
                            <div
                              className={`h-full rounded-full ${
                                pack.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <div className="mt-0.5 flex items-center justify-between text-[10px] font-bold tabular-nums text-slate-500">
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
                className="flex items-center gap-2.5 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-2.5"
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
            <div className="space-y-2 border-t border-slate-100 pt-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                Danh sách từ
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
                    className="min-h-[40px] w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm"
                  />
                </div>
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="min-h-[40px] cursor-pointer appearance-none rounded-xl border bg-background py-2 pl-3 pr-8 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm"
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
                    className={`min-h-[32px] shrink-0 touch-manipulation rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 transition-all hover:border-primary/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                        <div className="truncate text-[11px] font-semibold text-muted-foreground">{word.ipa}</div>
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
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

          {/* Milestone celebration (level up / new badge / streak milestone) */}
          {celebration && (
            <Celebration
              trigger
              triggerKey={celebration.key}
              intensity={celebration.intensity}
            />
          )}
        </div>

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
                          <span className="text-xs font-bold text-muted-foreground italic">
                            {entry.pronunciations[0].ipa}
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

    </StudentShell>
  );
}
