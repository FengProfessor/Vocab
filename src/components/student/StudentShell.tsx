'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  Brain,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  Library,
  Loader2,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useGamification } from '@/hooks/useGamification';
import { supabase, type Profile } from '@/lib/supabase';
import { xpToLevel } from '@/lib/gamification';
import {
  readWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';

type ShellProfile = Profile & {
  telegram_id?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  color: string;
  tile: string;
  match: (pathname: string) => boolean;
};

interface StudentShellProps {
  title: string;
  children: ReactNode;
  contentClassName?: string;
}

export function StudentShell({ title, children, contentClassName }: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ShellProfile | null>(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const [grammarDue, setGrammarDue] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: gamification } = useGamification(profile?.id ?? null);

  useEffect(() => {
    const loadShellData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        setProfileEmail(session.user.email ?? '');

        // Paint counts từ cache ngay (trước network)
        const cached = readWordSummaryCache(session.user.id);
        if (cached) {
          setReviewDueCount(cached.reviewDueCount);
          if (cached.classroomId) setClassroomId(cached.classroomId);
        }

        const authHeaders = { Authorization: `Bearer ${session.access_token}` };
        const [{ data: profileData }, wordsResponse, grammarResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single(),
          fetch('/api/words?summary=1', { headers: authHeaders })
            .then((response) => response.json())
            .catch(() => null),
          fetch('/api/grammar/progress?summary=1', { headers: authHeaders })
            .then((response) => response.json())
            .catch(() => null),
        ]);

        if (profileData) {
          setProfile(profileData as ShellProfile);
        }

        if (wordsResponse?.success) {
          const nextReview = Number(wordsResponse.reviewDueCount ?? 0);
          setClassroomId(wordsResponse.classroomId ?? null);
          setReviewDueCount(nextReview);
          writeWordSummaryCache(session.user.id, {
            total: Number(wordsResponse.total ?? 0),
            newCount: Number(wordsResponse.newCount ?? 0),
            reviewDueCount: nextReview,
            dueCount: Number(wordsResponse.dueCount ?? 0),
            classroomId: wordsResponse.classroomId ?? null,
          });
        }

        if (grammarResponse?.success) {
          setGrammarDue(Number(grammarResponse.dueCount ?? 0));
        }
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadShellData();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const navItems = useMemo<NavItem[]>(() => [
    {
      href: '/student',
      label: 'Dashboard',
      icon: LayoutGrid,
      color: '#4f46e5',
      tile: '#eef0ff',
      match: (value) => value === '/student',
    },
    {
      href: '/journey',
      label: 'Lộ trình',
      icon: Map,
      color: '#059669',
      tile: '#dcfce7',
      match: (value) => value.startsWith('/journey'),
    },
    {
      href: '/flashcard',
      label: 'Flashcards',
      icon: BookOpen,
      color: '#6366f1',
      tile: '#e8eafe',
      match: (value) => value.startsWith('/flashcard'),
    },
    {
      href: classroomId ? `/quiz?class=${classroomId}` : '/quiz',
      label: 'Mini Quiz',
      icon: HelpCircle,
      color: '#f59e0b',
      tile: '#fff3df',
      match: (value) => value.startsWith('/quiz'),
    },
    {
      href: classroomId ? `/writing?class=${classroomId}` : '/writing',
      label: 'Writing Practice',
      icon: Pencil,
      color: '#f43f5e',
      tile: '#ffe7ec',
      match: (value) => value.startsWith('/writing'),
    },
    {
      href: '/student/speaking',
      label: 'AI Speaking Tutor',
      icon: MessageSquare,
      color: '#0ea5e9',
      tile: '#e2f5fe',
      match: (value) => value.startsWith('/student/speaking'),
    },
    {
      href: '/grammar/learn',
      label: 'Grammar',
      icon: GraduationCap,
      color: '#8b5cf6',
      tile: '#f1ecff',
      match: (value) => value.startsWith('/grammar'),
    },
    {
      href: '/library',
      label: 'Thư viện từ vựng',
      icon: Library,
      color: '#10b981',
      tile: '#e1f7ee',
      match: (value) => value.startsWith('/library'),
    },
    {
      href: '/dictionary',
      label: 'Tra từ điển',
      icon: Search,
      color: '#06b6d4',
      tile: '#defafd',
      match: (value) => value.startsWith('/dictionary'),
    },
    {
      href: '/import',
      label: 'Nhập danh sách riêng',
      icon: Plus,
      color: '#64748b',
      tile: '#eef1f5',
      match: (value) => value.startsWith('/import'),
    },
    {
      href: '/download',
      label: 'Tải Desktop',
      icon: ArrowDownToLine,
      color: '#b5502f',
      tile: '#fff1e8',
      match: (value) => value.startsWith('/download'),
    },
    {
      href: '/student/profile#stats',
      label: 'Thống kê',
      icon: BarChart3,
      color: '#3b82f6',
      tile: '#e7f0ff',
      match: (value) => value.startsWith('/student/profile'),
    },
    {
      href: classroomId ? `/student/leaderboard?class=${classroomId}` : '/student/leaderboard',
      label: 'Bảng xếp hạng',
      icon: Trophy,
      color: '#f59e0b',
      tile: '#fff3df',
      match: (value) => value.startsWith('/student/leaderboard'),
    },
    {
      href: '/student/profile',
      label: 'Hồ sơ',
      icon: User,
      color: '#64748b',
      tile: '#eef1f5',
      match: (value) => value.startsWith('/student/profile'),
    },
  ], [classroomId]);

  const initials = (profile?.full_name ?? profileEmail ?? 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentLevel = xpToLevel(gamification.total_xp);

  return (
    <div className="flex min-h-dvh w-full bg-[#f7f8fc] font-sans">
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/student" className="flex items-center gap-2.5 font-black text-[#4f46e5]">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,.35)]">
                  <Brain className="h-5 w-5 text-white" />
                </span>
                <span className="text-xl">LingoPro</span>
              </Link>
              <button type="button" onClick={() => setIsMenuOpen(false)}>
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm transition-colors ${
                      active ? 'bg-[#eef0ff] font-extrabold text-[#4f46e5]' : 'font-bold text-[#525a68] hover:bg-slate-50'
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
            </nav>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-left text-sm font-extrabold text-[#e11d48] hover:bg-rose-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
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
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm transition-colors ${
                  active ? 'bg-[#eef0ff] font-extrabold text-[#4f46e5]' : 'font-bold text-[#525a68] hover:bg-slate-50'
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
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-left text-sm font-bold text-[#525a68] transition-colors hover:bg-slate-50 hover:text-[#e11d48]"
        >
          <LogOut className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <main className="flex min-h-dvh flex-1 flex-col md:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between gap-3 border-b border-[#ececf1] bg-white/85 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button type="button" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-6 w-6 shrink-0 cursor-pointer" />
            </button>
            <h1 className="hidden text-[19px] font-black tracking-tight sm:block">{title}</h1>
          </div>

          {isBootstrapping ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/download"
                className="hidden items-center gap-1.5 rounded-full border border-[#ffd7bf] bg-[#fff4ec] px-3 py-1.5 text-[12px] font-black text-[#b5502f] transition-colors hover:bg-[#ffe9dc] lg:flex"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Tải app
              </Link>
              <div className="hidden items-center gap-1.5 rounded-full border border-[#fde2c0] bg-[#fff5e9] py-1 pl-2 pr-[11px] sm:flex">
                <span className="text-[15px] leading-none">🔥</span>
                <span className="tabular-nums text-[13px] font-black text-[#ea7a23]">{gamification.current_streak}</span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-[#fbeaa6] bg-[#fffbe8] px-[11px] py-1 sm:flex">
                <span className="text-[13px] leading-none">⭐</span>
                <span className="tabular-nums text-[13px] font-black text-[#b45309]">{gamification.total_xp} XP</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#d4a017]">Lv.{currentLevel}</span>
              </div>
              <NotificationBell
                dueCount={reviewDueCount}
                grammarDueCount={grammarDue}
                streak={gamification.current_streak}
                dailyGoalXp={gamification.today_xp}
                dailyGoal={gamification.daily_goal}
                classroomId={classroomId}
              />
              <div className="hidden h-[22px] w-px bg-[#e8e8ee] sm:block" />
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full py-[3px] pl-[3px] pr-1.5 transition-colors hover:bg-slate-50"
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
                      className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-bold text-[#475569] hover:bg-slate-50"
                    >
                      <User className="h-[17px] w-[17px] text-[#64748b]" />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] font-extrabold text-[#e11d48] hover:bg-rose-50"
                    >
                      <LogOut className="h-[17px] w-[17px]" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <div className={contentClassName ?? 'mx-auto w-full max-w-[1080px] px-6 py-6 pb-10 sm:px-7'}>
          {children}
        </div>
      </main>
    </div>
  );
}
