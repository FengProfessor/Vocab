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
  Brain, BookOpen, LayoutDashboard, LogOut, Loader2, Plus,
  CheckCircle2, TrendingUp, User, LayoutGrid, ArrowRight,
  Menu, X, Clock, GraduationCap, Search, ChevronDown, BarChart3, Pencil, UserPlus, Trophy, Crown, Library, Sparkles, MessageSquare, Users, RefreshCw, HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { WordCardSkeleton } from '@/components/ui/WordCardSkeleton';
import { useGamification } from '@/hooks/useGamification';
import { earnedBadges, xpToLevel } from '@/lib/gamification';
import { Mascot, type MascotMood } from '@/components/gamification/Mascot';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XpGoalCard } from '@/components/gamification/XpGoalCard';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import type { CelebrationIntensity } from '@/components/gamification/Celebration';
import { WordDetailModal } from '@/components/student/WordDetailModal';
import { NotificationBell } from '@/components/NotificationBell';
import { EnableNotifications } from '@/components/EnableNotifications';
import { OnboardingProvider, OnboardingLayers } from '@/components/onboarding';

// Lazy load: canvas-confetti chỉ chạy client-side, không cần SSR + chỉ tải khi cần
const Celebration = dynamic(
  () => import('@/components/gamification/Celebration').then((m) => m.Celebration),
  { ssr: false }
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

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [joinedClass, setJoinedClass] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStats, setQuizStats] = useState({ total: 0, avgAccuracy: 0 });
  const [isRetryingAI, setIsRetryingAI] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>([]);
  const [todayWords, setTodayWords] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [grammarDue, setGrammarDue] = useState(0);
  const [activeVocabPack, setActiveVocabPack] = useState<ActiveVocabPack | null>(null);
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [wordsOffset, setWordsOffset] = useState(0);
  const WORDS_PAGE_SIZE = 20;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'due' | 'learned' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'hardest'>('newest');
  const router = useRouter();
  const { data: gamification, refresh: refreshGamification } = useGamification(profile?.id ?? null);

  // Celebration state — fire khi level up / badge unlock / streak milestone
  const [celebration, setCelebration] = useState<{ key: string; intensity: CelebrationIntensity } | null>(null);
  const [prevSnapshot, setPrevSnapshot] = useState<{ level: number; badgeIds: string[]; streak: number } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Student] Auth check started');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserMetadata(session.user.user_metadata);
        loadData(session.user.id);
      } else {
        setIsLoading(false);
        router.push('/auth');
      }
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserMetadata(session.user.user_metadata);
        loadData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserMetadata(null);
        router.push('/auth');
      }
    });
    
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadData = async (userId: string) => {
    try {
      const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.error('[Student] Load profile failed:', error.message);
        return;
      }
      if (prof) setProfile(prof);

      // Check if user has joined any real classroom
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', userId);
      setJoinedClass(enrollments && enrollments.length > 0);

      // Tiến độ ôn tập ngữ pháp
      authFetch(`/api/grammar/progress`)
        .then((r) => r.json())
        .then((gp) => { if (gp?.success) setGrammarDue(gp.dueCount || 0); })
        .catch(() => {});

      // Hoạt động theo ngày (heatmap streak) + số từ học hôm nay
      authFetch(`/api/student/stats`)
        .then((r) => r.json())
        .then((st) => {
          if (!st?.success) return;
          const activity: { date: string; count: number }[] = st.data?.dailyActivity ?? [];
          setDailyActivity(activity);
          const todayKey = new Date().toISOString().slice(0, 10);
          setTodayWords(activity.find((a) => a.date === todayKey)?.count ?? 0);
        })
        .catch(() => {});

      authFetch('/api/vocab/packs')
        .then((response) => response.json())
        .then((packData: { success?: boolean; packs?: ActiveVocabPack[] }) => {
          if (!packData.success || !packData.packs) return;
          setActiveVocabPack(packData.packs.find((pack) => pack.status === 'in_progress') ?? null);
        })
        .catch(() => {});

      // Fetch trang đầu với limit để tránh load toàn bộ
      const res = await authFetch(`/api/words?limit=${WORDS_PAGE_SIZE}&offset=0&t=${Date.now()}`);
      const data = await res.json();

      if (data.success) {
        setWords(data.data || []);
        setClassroomId(data.classroomId);
        setTotalWords(data.total || 0);
        setWordsOffset(WORDS_PAGE_SIZE);
        refreshSummary(userId); // lấy newCount / reviewDueCount để tách Học mới vs Ôn tập

        if (data.classroomId) {
          const { data: qr } = await supabase
            .from('quiz_results')
            .select('score, total_questions')
            .eq('user_id', userId)
            .eq('classroom_id', data.classroomId);

          if (qr && qr.length > 0) {
            type QuizRow = { score: number | null; total_questions: number | null };
            const rows = qr as QuizRow[];
            const totalCorrect = rows.reduce((s, q) => s + (q.score || 0), 0);
            const totalQuestions = rows.reduce((s, q) => s + (q.total_questions || 1), 0);
            setQuizStats({
              total: qr.length,
              avgAccuracy: Math.round((totalCorrect / totalQuestions) * 100)
            });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Load Dashboard error:', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Load thêm words (Load More)
  const loadMoreWords = async () => {
    if (!profile?.id || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await authFetch(`/api/words?limit=${WORDS_PAGE_SIZE}&offset=${wordsOffset}&t=${Date.now()}`);
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
  const refreshSummary = async (_userId: string) => {
    try {
      const res = await authFetch(`/api/words?summary=1`);
      const data = await res.json();
      if (data.success) {
        setTotalWords(data.total || 0);
        setNewCount(data.newCount || 0);
        setReviewDueCount(data.reviewDueCount || 0);
        // Cập nhật isDue trên words hiện có dựa trên thời gian
        const now = Date.now();
        setWords(prev => prev.map((w) => {
          const nextReviewDate = w.srs?.next_review_date ? new Date(w.srs.next_review_date).getTime() : now;
          return { ...w, isDue: !w.srs || nextReviewDate <= now };
        }));
      }
    } catch {
      // silent fail
    }
  };

  // === Countdown Timer Hooks ===
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

    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      
      if (diff <= 0) {
        setCountdown('Ready!');
        if (profile?.id) loadData(profile.id);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      if (h > 0) setCountdown(`${h}h ${m}m ${s}s`);
      else if (m > 0) setCountdown(`${m}m ${s}s`);
      else setCountdown(`${s}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [words, profile?.id]);

  // === Auto-retry failed words ===
  useEffect(() => {
    if (!classroomId || words.length === 0) return;
    const hasFailed = words.some((w) =>
      w.translation?.includes('failed') || w.translation?.includes('Analyzing')
    );
    if (hasFailed && !isRetryingAI) {
      handleRetryAI();
    }
  }, [classroomId, words.length]);

  // === Auto-refresh nhẹ mỗi 30s: chỉ cập nhật summary (dueCount), không fetch toàn bộ words ===
  useEffect(() => {
    if (!profile?.id) return;
    const interval = setInterval(() => {
      refreshSummary(profile.id);
      refreshGamification();
    }, 30000);
    return () => clearInterval(interval);
  }, [profile?.id, refreshGamification]);

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
        track('student_joined_teacher_class', {
          classroom_id: result.data.id,
          teacher_id: result.data.teacher_id,
          ...(typeof result.data.enrollment_count === 'number' ? { enrollment_count: result.data.enrollment_count } : {}),
        });
      }
      setIsJoinModalOpen(false);
      setJoinCode('');
      if (profile?.id) loadData(profile.id);
    } catch {
      setJoinError('Không thể kết nối. Thử lại sau.');
    } finally {
      setIsJoining(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-muted/40 p-8 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const masteredCount = words.filter((w) => w.srsLevel === 5).length;

  const mascotMood: MascotMood = reviewDueCount > 0 ? 'cheer' : gamification.current_streak === 0 ? 'sleepy' : 'happy';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();
  const badges = earnedBadges(gamification, masteredCount);

  const hasClass = joinedClass;

  // Sidebar nav — mỗi item có tile màu riêng; gate Thống kê/Bảng xếp hạng theo lớp
  type NavItem = { href: string; label: string; icon: typeof LayoutGrid; color: string; tile: string; onboardingId?: string };
  const navItems: NavItem[] = [
    { href: '/student', label: 'Dashboard', icon: LayoutGrid, color: '#4f46e5', tile: '#eef0ff' },
    { href: classroomId ? `/quiz?class=${classroomId}` : '#', label: 'Mini Quiz', icon: HelpCircle, color: '#f59e0b', tile: '#fff3df', onboardingId: 'quiz' },
    { href: classroomId ? `/writing?class=${classroomId}` : '/writing', label: 'Writing Practice', icon: Pencil, color: '#f43f5e', tile: '#ffe7ec', onboardingId: 'writing' },
    { href: '/student/speaking', label: 'AI Speaking Tutor', icon: MessageSquare, color: '#0ea5e9', tile: '#e2f5fe', onboardingId: 'speaking' },
    { href: '/grammar/learn', label: 'Grammar', icon: GraduationCap, color: '#8b5cf6', tile: '#f1ecff', onboardingId: 'grammar' },
    { href: '/library', label: 'Thư viện từ vựng', icon: Library, color: '#10b981', tile: '#e1f7ee', onboardingId: 'library' },
    { href: '/dictionary', label: 'Tra từ điển', icon: Search, color: '#06b6d4', tile: '#defafd' },
    { href: '/import', label: 'Nhập danh sách riêng', icon: Plus, color: '#64748b', tile: '#eef1f5' },
    ...(hasClass ? [
      { href: '/student/stats', label: 'Thống kê', icon: BarChart3, color: '#3b82f6', tile: '#e7f0ff' },
      { href: classroomId ? `/student/leaderboard?class=${classroomId}` : '/student/leaderboard', label: 'Bảng xếp hạng', icon: Trophy, color: '#f59e0b', tile: '#fff3df' },
    ] as NavItem[] : []),
    { href: '/student/profile', label: 'Hồ sơ', icon: User, color: '#64748b', tile: '#eef1f5' },
  ];
  const profileInitial = (profile?.full_name?.trim()?.[0] || 'U').toUpperCase();
  const profileEmail = (userMetadata?.email as string) || '';

  return (
    <OnboardingProvider userId={profile?.id ?? null} userName={profile?.full_name ?? ''} userMetadata={userMetadata}>
    <div className="flex min-h-dvh w-full bg-muted/40 font-sans relative">
      {/* Onboarding layers (spotlight, tooltips, modals) */}
      <OnboardingLayers />
      {/* ═══ MOBILE DRAWER ═══ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-background flex flex-col p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <Link href="/student" className="flex items-center gap-2 font-bold text-primary">
                  <Brain className="h-6 w-6" /> <span className="text-xl">LingoPro</span>
                </Link>
                <X className="h-6 w-6 cursor-pointer" onClick={() => setIsMenuOpen(false)} />
              </div>
              <nav className="flex-1 space-y-4">
                <Link href="/student" className="flex items-center gap-3 font-bold text-primary bg-primary/5 p-3 rounded-xl"><LayoutDashboard /> Dashboard</Link>
                <Link href="/library" data-onboarding="library" className="flex items-center gap-3 font-semibold p-3"><Library /> Thư viện từ vựng</Link>
                <Link href="/import" className="flex items-center gap-3 font-semibold p-3"><Plus /> Nhập danh sách riêng</Link>
                <Link href={classroomId ? `/flashcard?class=${classroomId}&mode=learn` : '/flashcard?mode=learn'} data-onboarding="learn" className="flex items-center gap-3 font-semibold p-3"><Sparkles /> Học từ mới</Link>
                <Link href={classroomId ? `/flashcard?class=${classroomId}` : '#'} data-onboarding="review" className="flex items-center gap-3 font-semibold p-3"><BookOpen /> Ôn tập</Link>
                <Link href={classroomId ? `/writing?class=${classroomId}` : '/writing'} data-onboarding="writing" className="flex items-center gap-3 font-semibold p-3"><Pencil /> Writing Practice</Link>
                <Link href="/student/speaking" data-onboarding="speaking" className="flex items-center gap-3 font-semibold p-3"><MessageSquare /> AI Speaking Tutor</Link>
                <Link href="/grammar/learn" data-onboarding="grammar" className="flex items-center gap-3 font-semibold p-3"><GraduationCap /> Grammar</Link>
                <Link href="/student/profile" className="flex items-center gap-3 font-semibold p-3"><User /> Hồ sơ</Link>
                <button
                  onClick={() => { setIsMenuOpen(false); setJoinError(null); setJoinCode(''); setIsJoinModalOpen(true); }}
                  className="flex items-center gap-3 font-semibold p-3 w-full text-left"
                >
                  <UserPlus /> Tham gia lớp
                </button>
              </nav>
              <button onClick={handleSignOut} className="flex items-center gap-3 p-3 text-destructive font-bold"><LogOut /> Sign Out</button>
          </div>
        </div>
      )}

      {/* ═══ SIDEBAR (md+) ═══ */}
      <aside className="fixed inset-y-0 left-0 z-20 w-[248px] border-r border-[#ececf1] bg-white hidden md:flex flex-col px-4 py-[22px]">
        <Link href="/student" className="flex items-center gap-2.5 px-2 pb-[22px] pt-1">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,.35)]">
            <Brain className="h-5 w-5 text-white" />
          </span>
          <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-xl font-black tracking-tight text-transparent">LingoPro</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => {
            const active = item.href === '/student';
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                data-onboarding={item.onboardingId}
                className={`flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm transition-colors ${
                  active ? 'bg-[#eef0ff] font-extrabold text-[#4f46e5]' : 'font-bold text-[#525a68] hover:bg-muted'
                }`}
              >
                <span
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg"
                  style={active ? { background: '#fff', boxShadow: '0 1px 2px rgba(79,70,229,.2)' } : { background: item.tile }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: item.color }} strokeWidth={2} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => { setJoinError(null); setJoinCode(''); setIsJoinModalOpen(true); }}
            className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted w-full text-left"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg" style={{ background: '#eef1f5' }}>
              <UserPlus className="h-[18px] w-[18px]" style={{ color: '#64748b' }} strokeWidth={2} />
            </span>
            <span className="truncate">Tham gia lớp</span>
          </button>
        </nav>
        <div className="mt-2.5 border-t border-[#f0f0f4] pt-3 space-y-0.5">
          <Link href="/upgrade" className="flex items-center gap-[11px] rounded-[11px] bg-[#f6f1ff] px-2.5 py-2 text-sm font-extrabold text-[#7c3aed]">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_1px_2px_rgba(124,58,237,.18)]">
              <Crown className="h-[18px] w-[18px] text-[#7c3aed]" strokeWidth={2} />
            </span>
            <span>Nâng cấp Pro</span>
            {profile?.plan && profile.plan !== 'free' && (
              <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-600">{profile.plan}</span>
            )}
          </Link>
          <Link href="/group" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg" style={{ background: '#eef1f5' }}>
              <Users className="h-[18px] w-[18px]" style={{ color: '#64748b' }} strokeWidth={2} />
            </span>
            <span>Nhóm của tôi</span>
          </Link>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 md:pl-[248px] flex flex-col min-h-dvh">
        <header className="h-[62px] border-b border-[#ececf1] bg-white/85 backdrop-blur sticky top-0 z-10 px-4 sm:px-7 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Menu className="h-6 w-6 md:hidden cursor-pointer shrink-0" onClick={() => setIsMenuOpen(true)} />
            <h1 className="font-black text-[19px] tracking-tight hidden sm:block">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Streak pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#fde2c0] bg-[#fff5e9] py-1 pl-2 pr-[11px]">
              <span className="text-[15px] leading-none">🔥</span>
              <span className="text-[13px] font-black text-[#ea7a23] tabular-nums">{gamification.current_streak}</span>
            </div>
            {/* XP pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#fbeaa6] bg-[#fffbe8] px-[11px] py-1">
              <span className="text-[13px] leading-none">⭐</span>
              <span className="text-[13px] font-black text-[#b45309] tabular-nums">{gamification.total_xp} XP</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#d4a017]">Lv.{xpToLevel(gamification.total_xp)}</span>
            </div>
            <NotificationBell
              dueCount={reviewDueCount}
              grammarDueCount={grammarDue}
              streak={gamification.current_streak}
              dailyGoalXp={gamification.today_xp}
              dailyGoal={gamification.daily_goal}
              classroomId={classroomId}
            />
            <div className="hidden sm:block h-[22px] w-px bg-[#e8e8ee]" />

            {/* Profile button + dropdown (Đăng xuất nằm trong đây) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-[3px] pl-[3px] pr-1.5 transition-colors hover:bg-muted"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white">
                  {profileInitial}
                </span>
                <span className="hidden sm:block text-[13.5px] font-extrabold text-[#0f172a] max-w-[120px] truncate">
                  {profile?.full_name?.split(' ')[0] || 'bạn'}
                </span>
                <ChevronDown className={`h-[15px] w-[15px] text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-12 w-[188px] rounded-[14px] border border-[#ececf1] bg-white p-1.5 shadow-[0_12px_32px_rgba(16,24,40,.14)] z-40">
                  <div className="px-2.5 pb-1.5 pt-2">
                    <div className="text-[13px] font-extrabold text-[#0f172a] truncate">{profile?.full_name || 'Học viên'}</div>
                    {profileEmail && <div className="text-[11px] font-semibold text-[#9aa2b1] truncate">{profileEmail}</div>}
                  </div>
                  <div className="my-1 h-px bg-[#f1f1f5]" />
                  <Link
                    href="/student/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-bold text-[#475569] hover:bg-muted"
                  >
                    <User className="h-[17px] w-[17px] text-[#64748b]" /> Hồ sơ của tôi
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] font-extrabold text-[#e11d48] hover:bg-rose-50"
                  >
                    <LogOut className="h-[17px] w-[17px]" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 py-6 pb-10 sm:px-7 max-w-[920px] mx-auto w-full flex flex-col gap-[18px]">
          {/* Greeting */}
          <div className="flex items-center gap-4">
            <Mascot mood={mascotMood} size="lg" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">
                {greeting}, {profile?.full_name?.split(' ')[0] || 'bạn'}! 👋
              </h2>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                {reviewDueCount > 0
                  ? `Bạn có ${reviewDueCount} từ cần ôn hôm nay!`
                  : 'Hôm nay đã học xong hết rồi 🎉'}
              </p>
            </div>
          </div>

          {/* Banner bật push (chỉ hiện khi chưa cấp quyền) */}
          <EnableNotifications />

          {activeVocabPack && (
            <Link
              href={`/flashcard?mode=learn&ids=${activeVocabPack.words
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((word) => encodeURIComponent(word.word_id))
                .join(',')}`}
              className="group flex items-center gap-4 rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-200 transition hover:brightness-105"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black uppercase tracking-wide text-indigo-200">Tiếp tục chặng đang học</div>
                <div className="mt-1 truncate text-lg font-black">
                  {activeVocabPack.topic_title} · Chặng {activeVocabPack.pack_index + 1}
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-amber-300"
                    style={{ width: `${Math.round((activeVocabPack.reviewed_count / activeVocabPack.word_count) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs font-bold text-indigo-100">
                  {activeVocabPack.reviewed_count}/{activeVocabPack.word_count} từ đã học
                </div>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          {/* ═══ Tách bạch: HỌC TỪ MỚI vs ÔN TẬP ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Học từ mới: xem từ + nghĩa + phát âm, rồi điền lại */}
            <Link
              href={classroomId ? `/flashcard?class=${classroomId}&mode=learn` : '/flashcard?mode=learn'}
              data-onboarding="learn"
              className={`group rounded-2xl p-5 border shadow-sm transition-all flex items-center gap-4 ${
                newCount > 0 ? 'bg-white hover:shadow-md hover:border-indigo-300' : 'bg-slate-50 opacity-70 pointer-events-none'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 leading-snug">
                  <span className="font-black text-slate-800 leading-snug">Học từ mới</span>
                  {newCount > 0 && <span className="bg-indigo-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{newCount}</span>}
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  {newCount > 0 ? 'Xem từ, nghĩa, nghe phát âm rồi điền lại' : 'Đã học hết từ mới 🎉'}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Ôn tập: từ đã học, đến hạn nhớ lại */}
            <Link
              href={reviewDueCount > 0 && classroomId ? `/flashcard?class=${classroomId}` : '#'}
              data-onboarding="review"
              className={`group rounded-2xl p-5 border shadow-sm transition-all flex items-center gap-4 ${
                reviewDueCount > 0 ? 'bg-white hover:shadow-md hover:border-emerald-300' : 'bg-slate-50 opacity-70 pointer-events-none'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <RefreshCw className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 leading-snug">
                  <span className="font-black text-slate-800 leading-snug">Ôn tập</span>
                  {reviewDueCount > 0 && <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{reviewDueCount}</span>}
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  {reviewDueCount > 0 ? 'Từ đã học đến hạn nhớ lại' : 'Chưa có từ cần ôn'}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Gamification row — streak lịch tháng + XP/mục tiêu nhỏ gọn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] items-stretch">
            <StreakCounter
              streak={gamification.current_streak}
              variant="calendar"
              dailyCounts={dailyActivity}
            />
            <XpGoalCard
              totalXp={gamification.total_xp}
              todayXp={gamification.today_xp}
              dailyXpGoal={gamification.daily_goal}
              todayWords={todayWords}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: 'Tổng từ', val: totalWords, icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Cần ôn', val: reviewDueCount, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Thành thạo', val: masteredCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Độ chính xác', val: `${quizStats.avgAccuracy}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
            ].map(s => (
              <div key={s.label} className="bg-background border rounded-2xl p-5 shadow-sm">
                <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div className="text-xl sm:text-2xl font-black">{s.val}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          <Link
            href={classroomId ? `/writing?class=${classroomId}` : '/writing'}
            className="flex items-center justify-between bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center">
                <Pencil className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">✍️ Writing Practice</span>
                  {reviewDueCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {reviewDueCount}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  Nhìn nghĩa tiếng Việt, gõ từ tiếng Anh từ trí nhớ
                </div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link
            href="/student/speaking"
            className="flex items-center justify-between bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">🎙️ AI Speaking Tutor</span>
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">MVA</span>
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  Luyện phản xạ giao tiếp và nhận nhận xét phát âm từ AI
                </div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link href="/grammar/learn" className="flex items-center justify-between bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">Bài giảng Ngữ pháp</span>
                  {grammarDue > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {grammarDue}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  {grammarDue > 0 ? `${grammarDue} bài cần ôn tập` : 'Học lý thuyết & luyện tập'}
                </div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <section className="bg-white border rounded-[32px] shadow-xl p-8 sm:p-12 text-center relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500" />
             
             <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-2">Golden Time Analysis</h2>
             <p className="text-muted-foreground font-semibold mb-10">Advanced Spaced Repetition (SRS)</p>
             
             <div className="flex items-end justify-center gap-3 sm:gap-8 h-40 sm:h-56 px-4 border-b-2 border-slate-50 mb-12">
                {[1, 2, 3, 4, 5, 6].map((level) => {
                  const count = words.filter((w) => (w.srsLevel || 1) === level).length;
                  const maxCount = Math.max(1, words.length);
                  const heightPct = Math.max(10, Math.round((count / maxCount) * 100));
                  
                  // Real SRS intervals labels (Aligned with srs.ts)
                  const labels = ['1d', '3d', '7d', '14d', '1mo', '3mo'];
                  const colors = [
                    'bg-rose-400',   // L1
                    'bg-amber-400',  // L2
                    'bg-sky-400',    // L3
                    'bg-indigo-500', // L4
                    'bg-emerald-500',// L5
                    'bg-purple-500'  // L6
                  ];

                  return (
                    <div key={level} className="flex flex-col items-center justify-end h-full w-10 sm:w-16 group">
                      <span className="text-xs font-black text-slate-400 mb-2 transition-transform group-hover:scale-125">{count}</span>
                      <div 
                        className={`w-full rounded-t-2xl transition-all duration-700 ease-out level-bar-${level} shadow-lg ${colors[level-1]}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className="mt-4 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-500">Level {level}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{labels[level-1]}</span>
                      </div>
                    </div>
                  );
                })}
             </div>

             <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-600">
                  Ready to review: <span className="text-emerald-500 font-black">{reviewDueCount}</span> words
                </h3>

                <Link href={reviewDueCount > 0 && classroomId ? `/flashcard?class=${classroomId}` : '#'}
                      className={`inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all
                        ${reviewDueCount > 0
                          ? 'bg-emerald-500 text-white border-b-4 border-emerald-700 hover:brightness-110 active:translate-y-0.5 active:border-b-0'
                          : 'bg-slate-100 text-slate-400 pointer-events-none'}`}>
                  {reviewDueCount > 0 ? 'Ôn ngay! 🚀' : 'Xong hết rồi! 🎉'} <ArrowRight className="h-6 w-6" />
                </Link>
                
                {countdown && reviewDueCount === 0 && (
                  <div className="flex items-center justify-center gap-3 text-slate-500 pt-4 animate-in fade-in zoom-in duration-500">
                    <Clock className="h-6 w-6 text-indigo-500" />
                    <span className="text-sm font-bold">Next session in:</span>
                    <span className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">{countdown}</span>
                  </div>
                )}
              </div>
          </section>

          {/* ═══ WORD MANAGER (Meaning Selector) ═══ */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <LayoutGrid className="h-6 w-6 text-primary" /> Your Vocabulary
              </h3>
              <Badge variant="outline" className="font-bold">{totalWords} items</Badge>
            </div>

            {/* Search + filter */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm từ..."
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="az">A → Z</option>
                    <option value="hardest">Khó nhất</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'new', 'due', 'learned', 'mastered'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      statusFilter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {{ all: 'Tất cả', new: 'Mới', due: 'Đến hạn', learned: 'Đã học', mastered: 'Thành thạo' }[f]}
                  </button>
                ))}
                {(debouncedQuery || statusFilter !== 'all') && (
                  <span className="ml-auto text-xs text-muted-foreground self-center">
                    {filteredWords.length} / {totalWords} từ
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              <WordCardSkeleton count={6} />
            ) : words.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="text-muted-foreground opacity-40"><LayoutGrid className="h-12 w-12 mx-auto" /></div>
                <h4 className="text-lg font-black text-slate-700">Chưa có từ vựng nào</h4>
                <p className="text-sm text-muted-foreground max-w-xs">Chọn một chủ đề. LingoPro chuẩn bị gói 10-20 từ có hình ảnh để bạn học trong 5-8 phút.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/library" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 transition-all">
                    <Sparkles className="h-4 w-4" /> Chọn chủ đề đầu tiên
                  </Link>
                  <button
                    onClick={() => { setJoinError(null); setJoinCode(''); setIsJoinModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-primary/30 text-primary rounded-xl font-bold text-sm hover:bg-primary/5 transition-all"
                  >
                    <UserPlus className="h-4 w-4" /> Tham gia lớp
                  </button>
                </div>
              </div>
            ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredWords.length === 0 && (debouncedQuery || statusFilter !== 'all') && (
                <div className="col-span-2 text-center py-10 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Không tìm thấy từ nào</p>
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
                  className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xl font-black text-primary">{word.word}</h4>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                         <span>{word.pos || '---'}</span>
                         <span>{word.ipa || ''}</span>
                      </div>
                    </div>
                    <Badge className={(word.srsLevel ?? 0) >= 5 ? 'bg-emerald-500' : 'bg-primary/20 text-primary'}>
                      Lvl {word.srsLevel || 1}
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-slate-600 line-clamp-2 mb-4">
                    {word.translation}
                  </p>

                  <div className="flex items-center gap-2">
                    {word.dictionary_data && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedWord(word); }}
                        className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Change Meaning
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteWord(word.id); }}
                      className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors ml-auto opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {words.length < totalWords && !debouncedQuery && statusFilter === 'all' && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMoreWords}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-primary/20 font-bold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
                  ) : (
                    <>Load more ({totalWords - words.length} remaining)</>
                  )}
                </button>
              </div>
            )}
            </>
            )}
          </section>

          {/* Badges */}
          <BadgeGrid badges={badges} />

          {/* Milestone celebration (level up / new badge / streak milestone) */}
          {celebration && (
            <Celebration
              trigger
              triggerKey={celebration.key}
              intensity={celebration.intensity}
            />
          )}
        </div>
      </main>

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

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-background border-t md:hidden flex items-center justify-around z-[90]">
        <Link href="/student" className="p-3 text-primary"><LayoutDashboard /></Link>
        <Link href="/import" className="p-3 text-muted-foreground"><Plus /></Link>
        <Link href="/dictionary" className="p-3 text-muted-foreground"><Search /></Link>
        <Link href="/library" className="p-4 -mt-10 bg-primary text-white rounded-2xl shadow-lg shadow-primary/40"><Sparkles /></Link>
        <Link href={classroomId ? `/flashcard?class=${classroomId}` : '#'} className="p-3 text-muted-foreground"><BookOpen /></Link>
      </nav>
    </div>
    </OnboardingProvider>
  );
}
