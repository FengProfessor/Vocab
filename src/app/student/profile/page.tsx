'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Copy,
  Flame,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  Library,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Search,
  Star,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/NotificationBell';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XpBadge } from '@/components/gamification/XpBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { requestForToken } from '@/lib/firebase';
import { levelProgress, xpToLevel } from '@/lib/gamification';
import { supabase, type Profile } from '@/lib/supabase';

type StudentProfile = Profile & {
  telegram_id?: string | null;
};

interface DayActivity {
  date: string;
  count: number;
}

interface QuizEntry {
  accuracy: number;
  score: number;
  total: number;
  created_at: string;
}

interface WeakWord {
  word_id: string;
  word: string;
  translation: string;
  stability: number;
  difficulty: number;
  review_count: number;
  next_review_date: string;
  level: number;
}

interface GamificationInfo {
  totalXp: number;
  streak: number;
  todayXp: number;
}

interface StatsData {
  wordStats: { total: number; levelCounts: number[]; avgStability: number; wordsDue: number };
  dailyActivity: DayActivity[];
  quizHistory: QuizEntry[];
  studyStreak: number;
  avgAccuracy: number;
  bestScore: number;
  weakWords: WeakWord[];
  gamification: GamificationInfo | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  color: string;
  tile: string;
}

const LEVEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
const LEVEL_LABELS = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6'];

function heatColor(count: number): string {
  if (count === 0) return 'bg-slate-200';
  if (count <= 2) return 'bg-green-200';
  if (count <= 5) return 'bg-green-400';
  return 'bg-green-600';
}

function fmtDay(isoDate: string): string {
  return isoDate.slice(8) + '/' + isoDate.slice(5, 7);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [userMetadata, setUserMetadata] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isCopyingToken, setIsCopyingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [grammarDue, setGrammarDue] = useState(0);

  const [fullName, setFullName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(30);
  const [notificationHour, setNotificationHour] = useState(8);
  const [telegramId, setTelegramId] = useState('');

  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: gamification } = useGamification(profile?.id ?? null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }

      setUserMetadata((session.user.user_metadata as Record<string, unknown> | undefined) ?? null);

      const statsPromise = fetch('/api/student/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }).then((response) => response.json()).catch(() => null);
      const grammarPromise = fetch('/api/grammar/progress', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }).then((response) => response.json()).catch(() => null);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const statsResponse = await statsPromise;
      const grammarResponse = await grammarPromise;

      if (prof) {
        const nextProfile = prof as StudentProfile;
        setProfile(nextProfile);
        setFullName(nextProfile.full_name ?? '');
        setDailyGoal(nextProfile.daily_goal ?? 30);
        setNotificationHour(nextProfile.notification_hour ?? 8);
        setTelegramId(nextProfile.telegram_id ?? '');
      }

      if (statsResponse?.success) {
        setStats(statsResponse.data as StatsData);
      }

      if (grammarResponse?.success) {
        setGrammarDue(Number(grammarResponse.dueCount ?? 0));
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, [router]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Chưa đăng nhập');

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          daily_goal: dailyGoal,
          notification_hour: notificationHour,
        }),
      });

      const result = await res.json() as { success: boolean; data?: StudentProfile; error?: string };
      if (!res.ok || !result.success) {
        throw new Error(result.error ?? 'Lưu thất bại');
      }

      if (result.data) {
        setProfile((prev) => ({ ...(prev ?? {}), ...result.data } as StudentProfile));
      }

      toast.success('Đã lưu thay đổi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(`Lưu thất bại: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyExtensionToken = async () => {
    setIsCopyingToken(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error('Chưa đăng nhập');

      let token = jwt;
      let isLongLived = false;

      try {
        const res = await fetch('/api/extension-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        const result = await res.json() as { success?: boolean; token?: string };
        if (result.success && typeof result.token === 'string') {
          token = result.token;
          isLongLived = true;
        }
      } catch {
        // Fallback sang access token hiện tại nếu mint token dài hạn lỗi.
      }

      await navigator.clipboard.writeText(token);
      setTokenCopied(true);
      toast.success(
        isLongLived
          ? 'Đã copy token dài hạn cho extension.'
          : 'Đã copy access token tạm thời. Nếu extension báo 401, copy lại token.'
      );
      window.setTimeout(() => setTokenCopied(false), 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không copy được token');
    } finally {
      setIsCopyingToken(false);
    }
  };

  const handleEnablePush = async () => {
    setIsEnablingPush(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Chưa đăng nhập');

      const fcmToken = await requestForToken();
      if (!fcmToken) throw new Error('Không lấy được mã thiết bị');

      const res = await fetch('/api/push/fcm-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fcmToken }),
      });

      const result = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !result.success) {
        throw new Error(result.error ?? 'Bật thông báo thất bại');
      }

      toast.success('Đã bật thông báo trên thiết bị này.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bật thông báo thất bại');
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleSaveTelegram = async () => {
    if (!profile) return;
    setIsSavingTelegram(true);

    try {
      const nextTelegramId = telegramId.trim() || null;
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_id: nextTelegramId })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, telegram_id: nextTelegramId } : prev));
      toast.success('Đã lưu Telegram ID.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lưu Telegram ID thất bại');
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!profile) return;
    setIsTestingTelegram(true);

    try {
      const res = await fetch('/api/test/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.id }),
      });

      const result = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !result.success) {
        throw new Error(result.error ?? 'Gửi test Telegram thất bại');
      }

      toast.success('Đã gửi tin nhắn test Telegram.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi test Telegram thất bại');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-muted/40 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name ?? profile?.email ?? 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const level = xpToLevel(gamification.total_xp);
  const statsXpInfo = stats?.gamification ? levelProgress(stats.gamification.totalXp) : null;
  const statsWeeks: DayActivity[][] = [];
  if (stats) {
    for (let index = 0; index < 30; index += 7) {
      statsWeeks.push(stats.dailyActivity.slice(index, index + 7));
    }
  }
  const reviewDueCount = stats?.wordStats.wordsDue ?? 0;
  const profileEmail = (userMetadata?.email as string) ?? profile?.email ?? '';
  const navItems: NavItem[] = [
    { href: '/student', label: 'Dashboard', icon: LayoutGrid, color: '#4f46e5', tile: '#eef0ff' },
    { href: '/journey', label: 'Lộ trình', icon: Map, color: '#059669', tile: '#dcfce7' },
    { href: '/quiz', label: 'Mini Quiz', icon: HelpCircle, color: '#f59e0b', tile: '#fff3df' },
    { href: '/writing', label: 'Writing Practice', icon: Pencil, color: '#f43f5e', tile: '#ffe7ec' },
    { href: '/student/speaking', label: 'AI Speaking Tutor', icon: MessageSquare, color: '#0ea5e9', tile: '#e2f5fe' },
    { href: '/grammar/learn', label: 'Grammar', icon: GraduationCap, color: '#8b5cf6', tile: '#f1ecff' },
    { href: '/library', label: 'Thư viện từ vựng', icon: Library, color: '#10b981', tile: '#e1f7ee' },
    { href: '/dictionary', label: 'Tra từ điển', icon: Search, color: '#06b6d4', tile: '#defafd' },
    { href: '/import', label: 'Nhập danh sách riêng', icon: Plus, color: '#64748b', tile: '#eef1f5' },
    { href: '/student/profile#stats', label: 'Thống kê', icon: BarChart3, color: '#3b82f6', tile: '#e7f0ff' },
    { href: '/student/leaderboard', label: 'Bảng xếp hạng', icon: Trophy, color: '#f59e0b', tile: '#fff3df' },
    { href: '/student/profile', label: 'Hồ sơ', icon: User, color: '#64748b', tile: '#eef1f5' },
  ];

  return (
    <div className="flex min-h-dvh w-full bg-[#f7f8fc] font-sans">
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/student" className="flex items-center gap-2 font-bold text-primary">
                <Brain className="h-6 w-6" /> <span className="text-xl">LingoPro</span>
              </Link>
              <X className="h-6 w-6 cursor-pointer" onClick={() => setIsMenuOpen(false)} />
            </div>
            <nav className="flex-1 space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === '/student/profile';
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl p-3 ${active ? 'bg-primary/5 font-bold text-primary' : 'font-semibold text-[#475569]'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button onClick={handleSignOut} className="flex items-center gap-3 p-3 font-bold text-destructive">
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-[#ececf1] bg-white px-4 py-[22px] md:flex md:flex-col">
        <Link href="/student" className="flex items-center gap-2.5 px-2 pb-[22px] pt-1">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,.35)]">
            <Brain className="h-5 w-5 text-white" />
          </span>
          <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-xl font-black tracking-tight text-transparent">LingoPro</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          <Link href="/student" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link href="/flashcard" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <BookOpen className="h-5 w-5" /> Flashcards
          </Link>
          <Link href="/quiz" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <Zap className="h-5 w-5" /> Mini Quiz
          </Link>
          <Link href="/writing" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <Pencil className="h-5 w-5" /> Writing Practice
          </Link>
          <Link href="/grammar/learn" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <GraduationCap className="h-5 w-5" /> Grammar
          </Link>
          <Link href="/import" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <Plus className="h-5 w-5" /> Import Words
          </Link>
          <Link href="/student/profile#stats" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <BarChart3 className="h-5 w-5" /> Thống kê
          </Link>
          <Link href="/student/leaderboard" className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted">
            <Trophy className="h-5 w-5" /> Bảng xếp hạng
          </Link>
          <Link href="/student/profile" className="flex items-center gap-[11px] rounded-[11px] bg-[#eef0ff] px-2.5 py-2 text-sm font-extrabold text-[#4f46e5] transition-colors">
            <User className="h-5 w-5" /> Hồ sơ
          </Link>
        </nav>
        <button onClick={handleSignOut} className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted hover:text-destructive">
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </aside>

      <main className="flex min-h-dvh flex-1 flex-col md:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-[62px] items-center justify-between gap-3 border-b border-[#ececf1] bg-white/85 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-6 w-6 shrink-0 cursor-pointer" />
            </button>
            <h1 className="hidden text-[19px] font-black tracking-tight sm:block">Hồ sơ của tôi</h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#fde2c0] bg-[#fff5e9] py-1 pl-2 pr-[11px]">
              <span className="text-[15px] leading-none">🔥</span>
              <span className="tabular-nums text-[13px] font-black text-[#ea7a23]">{gamification.current_streak}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#fbeaa6] bg-[#fffbe8] px-[11px] py-1">
              <span className="text-[13px] leading-none">⭐</span>
              <span className="tabular-nums text-[13px] font-black text-[#b45309]">{gamification.total_xp} XP</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#d4a017]">Lv.{xpToLevel(gamification.total_xp)}</span>
            </div>
            <NotificationBell
              dueCount={reviewDueCount}
              grammarDueCount={grammarDue}
              streak={gamification.current_streak}
              dailyGoalXp={gamification.today_xp}
              dailyGoal={gamification.daily_goal}
              classroomId={null}
            />
            <div className="hidden h-[22px] w-px bg-[#e8e8ee] sm:block" />
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full py-[3px] pl-[3px] pr-1.5 transition-colors hover:bg-muted"
              >
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[120px] truncate text-[13.5px] font-extrabold text-[#0f172a] sm:block">
                  {profile?.full_name?.split(' ')[0] || 'bạn'}
                </span>
                <ChevronDown className={`h-[15px] w-[15px] text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-12 z-40 w-[188px] rounded-[14px] border border-[#ececf1] bg-white p-1.5 shadow-[0_12px_32px_rgba(16,24,40,.14)]">
                  <div className="px-2.5 pb-1.5 pt-2">
                    <div className="truncate text-[13px] font-extrabold text-[#0f172a]">{profile?.full_name || 'Học viên'}</div>
                    {profileEmail && <div className="truncate text-[11px] font-semibold text-[#9aa2b1]">{profileEmail}</div>}
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

        <div className="mx-auto w-full max-w-[1080px] space-y-8 px-6 py-6 pb-10 sm:px-7">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-black text-primary-foreground shadow-lg">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">{profile?.full_name || 'Chưa đặt tên'}</h2>
              <p className="text-sm font-semibold text-muted-foreground">{profile?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="font-bold capitalize">
                  {profile?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </Badge>
                <Badge className="bg-amber-500 font-bold text-white">
                  Level {level}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <XpBadge totalXp={gamification.total_xp} variant="detailed" />
            <StreakCounter
              streak={gamification.current_streak}
              lastActiveDate={gamification.last_active_date}
              variant="detailed"
            />
          </div>

          <section id="stats" className="space-y-5 rounded-2xl border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-black text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Thống kê học tập
              </h3>
              {stats && <span className="text-xs font-semibold text-muted-foreground">30 ngày gần nhất</span>}
            </div>

            {!stats ? (
              <p className="text-sm text-muted-foreground">Chưa tải được dữ liệu thống kê.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
                      label: 'Tổng từ',
                      value: stats.wordStats.total,
                      sub: null,
                    },
                    {
                      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
                      label: 'Due hôm nay',
                      value: stats.wordStats.wordsDue,
                      sub: stats.wordStats.wordsDue > 0 ? 'cần ôn' : 'đã ôn xong',
                    },
                    {
                      icon: <Flame className="h-5 w-5 text-orange-500" />,
                      label: 'Streak',
                      value: `${stats.studyStreak} ngày`,
                      sub: null,
                    },
                    {
                      icon: <Target className="h-5 w-5 text-green-500" />,
                      label: 'Accuracy TB',
                      value: `${stats.avgAccuracy}%`,
                      sub: `Best: ${stats.bestScore}%`,
                    },
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl border bg-muted/30 p-4 text-center">
                      <div className="mb-1 flex justify-center">{card.icon}</div>
                      <div className="text-2xl font-black">{card.value}</div>
                      <div className="text-xs text-muted-foreground">{card.label}</div>
                      {card.sub && <div className="mt-0.5 text-xs text-muted-foreground/80">{card.sub}</div>}
                    </div>
                  ))}
                </div>

                {statsXpInfo && (
                  <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="flex items-center gap-2 text-sm font-bold">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Cấp độ - Lv{statsXpInfo.level} {statsXpInfo.name}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {stats.gamification!.totalXp} XP
                        {stats.gamification!.todayXp > 0 && (
                          <span className="ml-1 text-yellow-600">+{stats.gamification!.todayXp} hôm nay</span>
                        )}
                      </span>
                    </div>

                    {!statsXpInfo.isMax ? (
                      <>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-700"
                            style={{ width: `${statsXpInfo.pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{statsXpInfo.current} XP</span>
                          <span>{statsXpInfo.next} XP đến Lv{statsXpInfo.level + 1}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <Trophy className="h-4 w-4" /> Cấp độ tối đa - Legend
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
                  <h4 className="flex items-center gap-2 text-sm font-bold">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Hoạt động 30 ngày
                  </h4>
                  <div className="space-y-1.5">
                    {statsWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex gap-1.5">
                        {week.map((day) => (
                          <div
                            key={day.date}
                            title={`${fmtDay(day.date)}: ${day.count} từ`}
                            className={`h-7 flex-1 rounded-sm ${heatColor(day.count)}`}
                          />
                        ))}
                        {week.length < 7 &&
                          Array.from({ length: 7 - week.length }).map((_, padIndex) => (
                            <div key={`pad-${padIndex}`} className="h-7 flex-1" />
                          ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Ít</span>
                    {['bg-slate-200', 'bg-green-200', 'bg-green-400', 'bg-green-600'].map((color) => (
                      <div key={color} className={`h-4 w-4 rounded-sm ${color}`} />
                    ))}
                    <span>Nhiều</span>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
                  <h4 className="flex items-center gap-2 text-sm font-bold">
                    <Star className="h-4 w-4 text-cyan-500" />
                    Phân bổ cấp độ SRS
                  </h4>
                  <div className="space-y-2.5">
                    {LEVEL_LABELS.map((label, index) => {
                      const count = stats.wordStats.levelCounts[index] ?? 0;
                      const pct = stats.wordStats.total > 0 ? Math.round((count / stats.wordStats.total) * 100) : 0;
                      return (
                        <div key={label} className="flex items-center gap-3">
                          <span className="w-8 text-xs font-bold" style={{ color: LEVEL_COLORS[index] }}>
                            {label}
                          </span>
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: LEVEL_COLORS[index] }}
                            />
                          </div>
                          <span className="w-16 text-right text-xs text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {stats.weakWords.length > 0 && (
                  <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Top từ yếu nhất
                    </h4>
                    <div className="space-y-2">
                      {stats.weakWords.map((word, index) => (
                        <div key={word.word_id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                          <span className="w-5 text-xs font-bold text-muted-foreground">{index + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{word.word || word.word_id}</div>
                            {word.translation && <div className="truncate text-xs text-muted-foreground">{word.translation}</div>}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-bold"
                              style={{
                                backgroundColor: `${LEVEL_COLORS[Math.max(0, word.level - 1)]}33`,
                                color: LEVEL_COLORS[Math.max(0, word.level - 1)],
                              }}
                            >
                              Lv{word.level}
                            </span>
                            <span className="text-xs text-muted-foreground">{word.review_count} lần</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.quizHistory.length > 0 && (
                  <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Accuracy 10 quiz gần nhất
                    </h4>
                    <div className="relative h-20">
                      <svg viewBox={`0 0 ${stats.quizHistory.length * 30} 64`} className="h-full w-full overflow-visible">
                        <polyline
                          points={stats.quizHistory.map((quiz, index) => `${index * 30 + 15},${64 - (quiz.accuracy / 100) * 56}`).join(' ')}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {stats.quizHistory.map((quiz, index) => (
                          <circle
                            key={index}
                            cx={index * 30 + 15}
                            cy={64 - (quiz.accuracy / 100) * 56}
                            r="4"
                            fill="#22c55e"
                          >
                            <title>{quiz.accuracy}% - {new Date(quiz.created_at).toLocaleDateString('vi')}</title>
                          </circle>
                        ))}
                      </svg>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-5 rounded-2xl border bg-background p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Thông tin cá nhân</h3>

            <div className="space-y-2">
              <Label htmlFor="full-name" className="font-bold">Họ và tên</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={50}
                placeholder="Nhập họ và tên..."
                className="font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Email</Label>
              <Input
                value={profile?.email ?? ''}
                readOnly
                disabled
                className="cursor-not-allowed bg-muted/50 font-semibold"
              />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Vai trò</Label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <Badge variant="outline" className="font-bold capitalize">
                  {profile?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </Badge>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border bg-background p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Mục tiêu học tập</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-goal" className="font-bold">Mục tiêu hằng ngày</Label>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                  {dailyGoal} phút/ngày
                </span>
              </div>
              <input
                id="daily-goal"
                type="range"
                min={5}
                max={50}
                step={5}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>5 phút</span>
                <span>50 phút</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-hour" className="font-bold">Giờ nhắc nhở</Label>
              <div className="relative">
                <select
                  id="notification-hour"
                  value={notificationHour}
                  onChange={(e) => setNotificationHour(Number(e.target.value))}
                  className="w-full cursor-pointer appearance-none rounded-xl border bg-background px-4 py-2.5 pr-10 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Array.from({ length: 17 }, (_, index) => index + 6).map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">▼</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Bạn sẽ nhận thông báo lúc {String(notificationHour).padStart(2, '0')}:00 mỗi ngày
              </p>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border bg-background p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Extension & thiết bị</h3>

            <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">Chrome Extension token</p>
                  <p className="text-sm text-muted-foreground">
                    Copy token rồi dán vào extension để lưu từ trực tiếp.
                  </p>
                </div>
                <Button type="button" onClick={handleCopyExtensionToken} disabled={isCopyingToken} className="sm:shrink-0">
                  {isCopyingToken ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : tokenCopied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {tokenCopied ? 'Đã copy' : 'Copy token'}
                </Button>
              </div>

              <div className="rounded-xl border bg-background px-3 py-2 font-mono text-sm text-muted-foreground">
                lpext_... hoặc access token tạm thời
              </div>

              <p className="text-xs text-muted-foreground">
                Ưu tiên token dài hạn. Nếu hệ thống fallback sang access token tạm thời thì extension có thể cần copy lại sau.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <p className="font-bold text-foreground">Thông báo trên thiết bị này</p>
                <p className="text-sm text-muted-foreground">
                  Kết nối Firebase để nhận nhắc ôn tập trên máy hiện tại.
                </p>
              </div>
              <Button type="button" onClick={handleEnablePush} disabled={isEnablingPush} variant="outline" className="w-full sm:w-auto">
                {isEnablingPush ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Bật thông báo
              </Button>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border bg-background p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Telegram</h3>

            <div className="space-y-2">
              <Label htmlFor="telegram-id" className="font-bold">Telegram Chat ID</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="telegram-id"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Ví dụ: 123456789"
                  className="font-mono"
                />
                <Button type="button" onClick={handleSaveTelegram} disabled={isSavingTelegram} className="sm:shrink-0">
                  {isSavingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu Telegram
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dùng để nhận thông báo test hoặc luồng Telegram cũ nếu bạn còn dùng.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram || !telegramId.trim()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isTestingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Gửi test Telegram
            </Button>
          </section>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-2xl py-6 text-base font-black active:translate-y-0.5"
            variant="chunky"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" /> Lưu thay đổi
              </>
            )}
          </Button>

          <div className="pb-6 text-center">
            <Link href="/student" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
