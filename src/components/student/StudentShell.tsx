'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  Brain,
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileBottomNav } from '@/components/student/MobileBottomNav';
import { useGamification } from '@/hooks/useGamification';
import { supabase, type Profile } from '@/lib/supabase';
import { xpToLevel } from '@/lib/gamification';
import {
  readWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import { cn } from '@/lib/utils';

type ShellProfile = Profile & {
  telegram_id?: string | null;
};

/** Nav item — emoji màu (không lucide vector) */
type NavItem = {
  href: string;
  label: string;
  emoji: string;
  color: string;
  tile: string;
  match: (pathname: string) => boolean;
  /** Đã có ở footer mobile → ẩn trong drawer */
  footerDup?: boolean;
};

const FB_COMMUNITY_URL = 'https://www.facebook.com/groups/1586345819865575';

interface StudentShellProps {
  title: string;
  children: ReactNode;
  contentClassName?: string;
  /** Ẩn bottom tab khi đang học tập trung (flashcard/quiz/writing/speaking) */
  hideMobileNav?: boolean;
}

export function StudentShell({
  title,
  children,
  contentClassName,
  hideMobileNav = false,
}: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ShellProfile | null>(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
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
          setNewCount(cached.newCount ?? 0);
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

  // Khoá scroll body khi drawer mở
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

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

  // Không: Speaking, Hồ sơ (profile qua avatar). Footer dup ẩn ở drawer mobile.
  const navItems = useMemo<NavItem[]>(() => [
    {
      href: '/student',
      label: 'Dashboard',
      emoji: '🏠',
      color: '#4f46e5',
      tile: '#eef0ff',
      match: (value) => value === '/student',
      footerDup: true,
    },
    {
      href: '/journey',
      label: 'Lộ trình',
      emoji: '🗺️',
      color: '#059669',
      tile: '#dcfce7',
      match: (value) => value.startsWith('/journey'),
      footerDup: true,
    },
    {
      href: '/flashcard',
      label: 'Flashcards',
      emoji: '📚',
      color: '#6366f1',
      tile: '#e8eafe',
      match: (value) => value.startsWith('/flashcard'),
      footerDup: true,
    },
    {
      href: classroomId ? `/quiz?class=${classroomId}` : '/quiz',
      label: 'Mini Quiz',
      emoji: '❓',
      color: '#f59e0b',
      tile: '#fff3df',
      match: (value) => value.startsWith('/quiz'),
    },
    {
      href: classroomId ? `/writing?class=${classroomId}` : '/writing',
      label: 'Writing Practice',
      emoji: '✍️',
      color: '#f43f5e',
      tile: '#ffe7ec',
      match: (value) => value.startsWith('/writing'),
    },
    {
      href: '/grammar/learn',
      label: 'Grammar',
      emoji: '🎓',
      color: '#8b5cf6',
      tile: '#f1ecff',
      match: (value) => value.startsWith('/grammar'),
    },
    {
      href: '/library',
      label: 'Thư viện từ vựng',
      emoji: '📦',
      color: '#10b981',
      tile: '#e1f7ee',
      match: (value) => value.startsWith('/library'),
      footerDup: true,
    },
    {
      href: '/dictionary',
      label: 'Tra từ điển',
      emoji: '🔍',
      color: '#06b6d4',
      tile: '#defafd',
      match: (value) => value.startsWith('/dictionary'),
      footerDup: true,
    },
    {
      href: '/import',
      label: 'Nhập danh sách riêng',
      emoji: '➕',
      color: '#64748b',
      tile: '#eef1f5',
      match: (value) => value.startsWith('/import'),
    },
    {
      href: '/student/profile#stats',
      label: 'Thống kê',
      emoji: '📊',
      color: '#3b82f6',
      tile: '#e7f0ff',
      match: (value) => value.startsWith('/student/profile'),
    },
    {
      href: classroomId ? `/student/leaderboard?class=${classroomId}` : '/student/leaderboard',
      label: 'Bảng xếp hạng',
      emoji: '🏆',
      color: '#f59e0b',
      tile: '#fff3df',
      match: (value) => value.startsWith('/student/leaderboard'),
    },
  ], [classroomId]);

  const mobileDrawerItems = useMemo(
    () => navItems.filter((item) => !item.footerDup),
    [navItems],
  );

  const renderNavLink = (
    item: NavItem,
    active: boolean,
    onClick?: () => void,
  ) => (
    <Link
      key={item.label}
      href={item.href}
      onClick={onClick}
      className={`flex min-h-[44px] items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm transition-colors active:scale-[0.98] md:min-h-0 ${
        active
          ? 'bg-[#eef0ff] font-extrabold text-[#4f46e5]'
          : 'font-bold text-[#525a68] hover:bg-slate-50'
      }`}
    >
      <span
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-[15px] leading-none"
        style={
          active
            ? { background: '#fff', boxShadow: '0 1px 2px rgba(79,70,229,.2)' }
            : { background: item.tile }
        }
      >
        {item.emoji}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );

  const initials = (profile?.full_name ?? profileEmail ?? 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentLevel = xpToLevel(gamification.total_xp);
  const showBottomNav = !hideMobileNav;

  return (
    <div className="flex min-h-dvh w-full bg-[#f7f8fc] font-sans">
      {/* ═══ MOBILE DRAWER ═══ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-white shadow-2xl pl-safe"
            style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
          >
            <div className="mb-4 flex items-center justify-between px-5 pt-5">
              <Link
                href="/student"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 font-black text-[#4f46e5]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,.35)]">
                  <Brain className="h-5 w-5 text-white" />
                </span>
                <span className="text-xl">LingoPro</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="touch-target flex items-center justify-center rounded-xl hover:bg-slate-100"
                aria-label="Đóng menu"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            {/* Streak / XP */}
            <div className="mx-5 mb-3 flex gap-2">
              <div className="flex flex-1 items-center gap-1.5 rounded-full border border-[#fde2c0] bg-[#fff5e9] px-3 py-1.5">
                <span className="text-sm leading-none">🔥</span>
                <span className="tabular-nums text-xs font-black text-[#ea7a23]">
                  {gamification.current_streak} ngày
                </span>
              </div>
              <div className="flex flex-1 items-center gap-1.5 rounded-full border border-[#fbeaa6] bg-[#fffbe8] px-3 py-1.5">
                <span className="text-sm leading-none">⭐</span>
                <span className="tabular-nums text-xs font-black text-[#b45309]">
                  {gamification.total_xp} XP
                </span>
              </div>
            </div>

            {/* Nav scroll — giống desktop, bỏ mục trùng footer */}
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-3 scrollbar-none">
              {mobileDrawerItems.map((item) =>
                renderNavLink(item, item.match(pathname), () => setIsMenuOpen(false)),
              )}
            </nav>

            {/* Footer drawer: Pro + FB + đăng xuất */}
            <div className="shrink-0 space-y-0.5 border-t border-[#f0f0f4] px-3 pb-3 pt-2">
              <Link
                href="/upgrade"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-[11px] rounded-[11px] bg-[#f6f1ff] px-2.5 py-2 text-sm font-extrabold text-[#7c3aed]"
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white text-[15px] shadow-[0_1px_2px_rgba(124,58,237,.18)]">
                  👑
                </span>
                <span>Nâng cấp Pro</span>
                {profile?.plan && profile.plan !== 'free' && (
                  <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-600">
                    {profile.plan}
                  </span>
                )}
              </Link>
              <Link
                href="/group"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] hover:bg-slate-50"
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#eef1f5] text-[15px]">
                  👥
                </span>
                <span>Nhóm của tôi</span>
              </Link>
              <a
                href={FB_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-[11px] rounded-[11px] bg-[#e7f0ff] px-2.5 py-2 text-sm font-extrabold text-[#1877f2]"
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white text-[15px]">
                  💬
                </span>
                <span className="truncate">Nhóm live &amp; trao đổi</span>
              </a>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full min-h-[44px] items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-left text-sm font-extrabold text-[#e11d48] hover:bg-rose-50"
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[15px]">
                  🚪
                </span>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-[#ececf1] bg-white px-4 py-[22px] md:flex md:flex-col">
        <Link href="/student" className="flex items-center gap-2.5 px-2 pb-[22px] pt-1">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,.35)]">
            <Brain className="h-5 w-5 text-white" />
          </span>
          <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-xl font-black tracking-tight text-transparent">
            LingoPro
          </span>
        </Link>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-none">
          {navItems.map((item) => renderNavLink(item, item.match(pathname)))}
        </nav>
        <div className="mt-2.5 shrink-0 space-y-0.5 border-t border-[#f0f0f4] pt-3">
          <Link
            href="/upgrade"
            className="flex items-center gap-[11px] rounded-[11px] bg-[#f6f1ff] px-2.5 py-2 text-sm font-extrabold text-[#7c3aed]"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white text-[15px] shadow-[0_1px_2px_rgba(124,58,237,.18)]">
              👑
            </span>
            <span>Nâng cấp Pro</span>
            {profile?.plan && profile.plan !== 'free' && (
              <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-600">
                {profile.plan}
              </span>
            )}
          </Link>
          <Link
            href="/group"
            className="flex items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-slate-50"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#eef1f5] text-[15px]">
              👥
            </span>
            <span>Nhóm của tôi</span>
          </Link>
          <a
            href={FB_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[11px] rounded-[11px] bg-[#e7f0ff] px-2.5 py-2 text-sm font-extrabold text-[#1877f2] transition-colors hover:brightness-95"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white text-[15px]">
              💬
            </span>
            <span className="truncate">Nhóm live &amp; trao đổi</span>
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-[11px] rounded-[11px] px-2.5 py-2 text-left text-sm font-bold text-[#525a68] transition-colors hover:bg-slate-50 hover:text-[#e11d48]"
          >
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex min-h-dvh min-w-0 flex-1 flex-col md:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-header-safe items-center justify-between gap-2 border-b border-[#ececf1] bg-white/90 px-3 backdrop-blur-md sm:gap-3 sm:px-7">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="touch-target -ml-1 flex items-center justify-center rounded-xl md:hidden active:bg-slate-100"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="h-6 w-6 shrink-0" />
            </button>
            {/* Title: hiện cả mobile (truncate) */}
            <h1 className="truncate text-base font-black tracking-tight sm:text-[19px]">
              {title}
            </h1>
          </div>

          {isBootstrapping ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <Link
                href="/download"
                className="hidden items-center gap-1.5 rounded-full border border-[#ffd7bf] bg-[#fff4ec] px-3 py-1.5 text-[12px] font-black text-[#b5502f] transition-colors hover:bg-[#ffe9dc] lg:flex"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Tải app
              </Link>
              {/* Streak/XP: compact trên mobile, full từ sm+ */}
              <div className="flex items-center gap-1 rounded-full border border-[#fde2c0] bg-[#fff5e9] py-1 pl-1.5 pr-2 sm:gap-1.5 sm:pl-2 sm:pr-[11px]">
                <span className="text-[13px] leading-none sm:text-[15px]">🔥</span>
                <span className="tabular-nums text-[12px] font-black text-[#ea7a23] sm:text-[13px]">
                  {gamification.current_streak}
                </span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-[#fbeaa6] bg-[#fffbe8] px-[11px] py-1 sm:flex">
                <span className="text-[13px] leading-none">⭐</span>
                <span className="tabular-nums text-[13px] font-black text-[#b45309]">
                  {gamification.total_xp} XP
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#d4a017]">
                  Lv.{currentLevel}
                </span>
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
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full py-[3px] pl-[3px] pr-1 transition-colors hover:bg-slate-50 sm:gap-2 sm:pr-1.5"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black text-white sm:h-[34px] sm:w-[34px] sm:text-sm">
                    {initials}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-[13.5px] font-extrabold text-[#0f172a] sm:block">
                    {profile?.full_name?.split(' ')[0] || 'bạn'}
                  </span>
                  <ChevronDown
                    className={`h-[15px] w-[15px] text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isProfileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-40 w-[188px] rounded-[14px] border border-[#ececf1] bg-white p-1.5 shadow-[0_12px_32px_rgba(16,24,40,.14)]"
                  >
                    <div className="px-2.5 pb-1.5 pt-2">
                      <div className="truncate text-[13px] font-extrabold text-[#0f172a]">
                        {profile?.full_name || 'Học viên'}
                      </div>
                      {profileEmail && (
                        <div className="truncate text-[11px] font-semibold text-[#9aa2b1]">
                          {profileEmail}
                        </div>
                      )}
                    </div>
                    <div className="my-1 h-px bg-[#f1f1f5]" />
                    <Link
                      href="/student/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex min-h-[40px] items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-bold text-[#475569] hover:bg-slate-50"
                    >
                      <User className="h-[17px] w-[17px] text-[#64748b]" />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full min-h-[40px] items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] font-extrabold text-[#e11d48] hover:bg-rose-50"
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

        <div
          className={cn(
            contentClassName ??
              'mx-auto w-full max-w-[1080px] px-4 py-5 pb-10 sm:px-7 sm:py-6',
            showBottomNav && 'pb-mobile-nav',
          )}
        >
          {children}
        </div>
      </main>

      {showBottomNav && (
        <MobileBottomNav
          classroomId={classroomId}
          reviewDueCount={reviewDueCount}
          newCount={newCount}
        />
      )}
    </div>
  );
}
