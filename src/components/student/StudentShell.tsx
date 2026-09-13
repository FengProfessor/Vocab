'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  Brain,
  ChevronDown,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileBottomNav } from '@/components/student/MobileBottomNav';

// Dynamic imports — marketing/upsell không cần ngay cho initial render
const FreeQuotaBanner = dynamic(
  () => import('@/components/upsell/FreeQuotaBanner').then((m) => m.FreeQuotaBanner),
  { ssr: false },
);
const CohortProPromoBanner = dynamic(
  () => import('@/components/upsell/CohortProPromoBanner').then((m) => m.CohortProPromoBanner),
  { ssr: false },
);
const UpgradeGiftModal = dynamic(
  () => import('@/components/campaign/UpgradeGiftModal').then((m) => m.UpgradeGiftModal),
  { ssr: false },
);

import { useGamification } from '@/hooks/useGamification';
import { supabase, type Profile } from '@/lib/supabase';
import { xpToLevel } from '@/lib/gamification';
import {
  readWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import {
  buildStudentNavSections,
  type StudentNavItem,
  type StudentNavSection,
} from '@/lib/student-nav';
import { cn } from '@/lib/utils';

type ShellProfile = Profile & {
  telegram_id?: string | null;
};

interface StudentShellProps {
  title: string;
  children: ReactNode;
  contentClassName?: string;
  /** Ẩn bottom tab khi đang học tập trung (flashcard/quiz/writing/speaking) */
  hideMobileNav?: boolean;
  /**
   * immersive = tắt sidebar desktop + drawer + header chrome + bottom nav
   * (dùng cho Pixel Hub full-screen)
   */
  immersive?: boolean;
  /** Callback mở modal tham gia lớp (dùng ở Dashboard) */
  onJoinClass?: () => void;
  /** Yêu cầu đăng nhập để truy cập (mặc định true). Đặt false cho các trang công khai / dùng thử như Luyện nghe */
  requireAuth?: boolean;
}

export function StudentShell({
  title,
  children,
  contentClassName,
  hideMobileNav = false,
  immersive = false,
  onJoinClass,
  requireAuth = true,
}: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const wasMenuOpen = useRef(false);
  const [profile, setProfile] = useState<ShellProfile | null>(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [isTeacherUser, setIsTeacherUser] = useState(false);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [grammarDue, setGrammarDue] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  /** Hub iframe: ?embed=1 | from=hub → ẩn chrome (không dùng useSearchParams — tránh Suspense toàn app) */
  const [embedMode, setEmbedMode] = useState(false);
  const { data: gamification } = useGamification(profile?.id ?? null);
  const effectiveImmersive = immersive || embedMode;

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      setEmbedMode(
        q.get('embed') === '1' ||
          q.get('embed') === 'true' ||
          q.get('from') === 'hub' ||
          q.get('from') === 'lingotown-embed',
      );
    } catch {
      setEmbedMode(false);
    }
    setIsMenuOpen(false);
    setIsProfileOpen(false);

    try {
      const saved = sessionStorage.getItem('lingopro_sidebar_scroll');
      if (saved && desktopNavRef.current) {
        desktopNavRef.current.scrollTop = Number(saved);
      } else if (desktopNavRef.current) {
        const activeLink = desktopNavRef.current.querySelector<HTMLElement>('[aria-current="page"]');
        activeLink?.scrollIntoView({ block: 'nearest' });
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    let isCancelled = false;

    const loadShellData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isCancelled) return;
        if (!session?.user) {
          if (requireAuth) {
            router.push('/auth');
          }
          return;
        }

        setProfileEmail(session.user.email ?? '');

        // Paint counts từ cache ngay (trước network)
        const cached = readWordSummaryCache(session.user.id);
        if (cached && !isCancelled) {
          setReviewDueCount(cached.reviewDueCount);
          setNewCount(cached.newCount ?? 0);
          if (cached.classroomId) setClassroomId(cached.classroomId);
        }

        const authHeaders = { Authorization: `Bearer ${session.access_token}` };
        const [{ data: profileData }, wordsResponse, grammarResponse, teacherClassesRes] = await Promise.all([
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
          supabase
            .from('classrooms')
            .select('id', { count: 'exact', head: true })
            .eq('teacher_id', session.user.id)
            .neq('name', '__personal__'),
        ]);

        if (isCancelled) return;

        if (profileData) {
          setProfile(profileData as ShellProfile);
          const hasTeacher = profileData.role === 'teacher' || (teacherClassesRes?.count ?? 0) > 0;
          setIsTeacherUser(hasTeacher);
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
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void loadShellData();

    // Lắng nghe thay đổi phiên đăng nhập thời gian thực (token refresh, signout ở tab khác)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isCancelled) return;
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setProfileEmail('');
        if (requireAuth) {
          router.push('/auth');
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setProfileEmail(session.user.email ?? '');
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [router, requireAuth]);

  // Khoá scroll body khi drawer mở
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

  // Tự động đóng drawer khi màn hình mở rộng sang desktop (>= 768px)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setIsMenuOpen(false);
      }
    };
    mql.addEventListener('change', handleMediaChange);
    return () => {
      mql.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // Tour onboarding: mở/đóng drawer (Ngữ pháp trên mobile)
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27) {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Quản lý focus & khôi phục focus khi đóng drawer
  useEffect(() => {
    if (isMenuOpen && !wasMenuOpen.current) {
      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          firstFocusable?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isMenuOpen && wasMenuOpen.current) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpen.current = isMenuOpen;
  }, [isMenuOpen]);

  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      setIsMenuOpen(false);
      return;
    }
    if (e.key === 'Tab' && drawerRef.current) {
      const focusableEls = drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusableEls.length === 0) return;
      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Math.max(Date.now() - touchStartRef.current.time, 1);
    touchStartRef.current = null;
    // Vuốt sang trái: góc ngang chủ đạo (deltaX vượt trội deltaY)
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    // Flick nhanh (>= 30px trong 250ms) hoặc kéo dứt khoát (>= 45px)
    const isDismissSwipe = deltaX < -30 && (deltaTime < 250 || deltaX < -45);

    if (isHorizontal && isDismissSwipe) {
      setIsMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const navSections = useMemo<StudentNavSection[]>(
    () =>
      buildStudentNavSections({
        classroomId,
        hasClass: Boolean(classroomId),
        reviewDueCount,
        grammarDueCount: grammarDue,
      }),
    [classroomId, reviewDueCount, grammarDue],
  );

  const mobileDrawerSections = useMemo<StudentNavSection[]>(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => !item.footerDup),
        }))
        .filter((section) => section.items.length > 0),
    [navSections],
  );

  const onboardingIdFor = (href: string): string | undefined => {
    if (href.startsWith('/grammar')) return 'grammar';
    if (href.startsWith('/library')) return 'library';
    if (href.startsWith('/journey')) return 'journey';
    if (href.startsWith('/dictionary')) return 'dictionary';
    if (href.startsWith('/review')) return 'nav-review';
    if (href.startsWith('/import')) return 'import';
    return undefined;
  };

  const renderNavLink = (
    item: StudentNavItem,
    active: boolean,
    onClick?: () => void,
  ) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        data-onboarding={item.onboardingId || onboardingIdFor(item.href)}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex min-h-[34px] items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-all',
          active
            ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
            : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300',
            )}
            strokeWidth={active ? 2 : 1.75}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge !== undefined && item.badge !== null ? (
          <span
            className={cn(
              'ml-auto shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold',
              item.href === '/toeic'
                ? 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                : item.href === '/vstep'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/60',
            )}
          >
            {item.badge}
          </span>
        ) : active ? (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ml-1.5" />
        ) : null}
      </Link>
    );
  };

  const initials = (profile?.full_name || profileEmail || 'U')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const currentLevel = xpToLevel(gamification.total_xp);
  const showBottomNav = !hideMobileNav && !effectiveImmersive;
  const showChrome = !effectiveImmersive;
  const isTeacherActive = pathname.startsWith('/teacher');
  const isUpgradeActive = pathname.startsWith('/upgrade');
  const isGroupActive = pathname.startsWith('/group');

  return (
    <>
      <UpgradeGiftModal />
      <div
        className={cn(
          'flex min-h-dvh w-full font-sans',
          effectiveImmersive ? 'bg-background' : 'bg-[#f7f8fc]',
        )}
      >

      {/* ═══ MOBILE DRAWER ═══ */}
      {showChrome && isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            tabIndex={-1}
            onKeyDown={handleDrawerKeyDown}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-white shadow-2xl pl-safe outline-none touch-pan-y animate-in slide-in-from-left duration-200 ease-out dark:border-r dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
          >
            <div className="mb-3 flex items-center justify-between px-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Link
                href="/student"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white font-black text-sm shadow-xs shrink-0">
                  L
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-[14px] text-slate-900 dark:text-white leading-none tracking-tight">
                    LingoPro
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    Học tiếng Anh thông minh
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="touch-target flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Streak / XP */}
            <div className="mx-4 mb-3 flex gap-2">
              <div className="flex flex-1 items-center gap-1.5 rounded-md border border-[#fde2c0] bg-[#fff5e9] px-3 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/25">
                <span className="text-sm leading-none">🔥</span>
                <span className="tabular-nums text-xs font-black text-[#ea7a23]">
                  {gamification.current_streak} ngày
                </span>
              </div>
              <div className="flex flex-1 items-center gap-1.5 rounded-md border border-[#fbeaa6] bg-[#fffbe8] px-3 py-1.5 dark:border-yellow-900/40 dark:bg-yellow-950/25">
                <span className="text-sm leading-none">⭐</span>
                <span className="tabular-nums text-xs font-black text-[#b45309]">
                  {gamification.total_xp} XP
                </span>
              </div>
            </div>

            {/* Nav scroll — theo phân nhóm, bỏ mục trùng footer */}
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 scrollbar-none">
              {mobileDrawerSections.map((section, sIdx) => (
                <div key={section.id} className={sIdx === 0 ? 'space-y-0.5' : 'mt-2.5 space-y-0.5'}>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.title}
                  </div>
                  {section.items.map((item) =>
                    renderNavLink(item, item.match(pathname), () => setIsMenuOpen(false)),
                  )}
                </div>
              ))}
              {onJoinClass ? (
                <button
                  type="button"
                  onClick={() => {
                    onJoinClass();
                    setIsMenuOpen(false);
                  }}
                  className="group mt-1 flex min-h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                >
                  <UserPlus className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300" strokeWidth={1.75} />
                  <span className="min-w-0 truncate">Tham gia lớp</span>
                </button>
              ) : (
                <Link
                  href="/student?joinClass=1"
                  onClick={() => setIsMenuOpen(false)}
                  className="group mt-1 flex min-h-[34px] items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                >
                  <UserPlus className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300" strokeWidth={1.75} />
                  <span className="min-w-0 truncate">Tham gia lớp</span>
                </Link>
              )}
            </nav>

            {/* Footer drawer: Linear workspace card + actions */}
            <div className="shrink-0 space-y-1.5 border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800">
              <Link
                href="/student/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 truncate text-left">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate text-xs group-hover:text-slate-900 dark:group-hover:text-white">
                      {profile?.full_name || profileEmail || 'Học viên'}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      Lv.{currentLevel} · {gamification.total_xp} XP
                    </div>
                  </div>
                </div>
                {profile?.plan && profile.plan !== 'free' ? (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-[9px] font-bold text-white uppercase shrink-0">
                    {profile.plan}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shrink-0">
                    Pro
                  </span>
                )}
              </Link>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                {isTeacherUser && (
                  <Link
                    href="/teacher"
                    onClick={() => setIsMenuOpen(false)}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Giáo viên
                  </Link>
                )}
                <Link
                  href="/group"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  Nhóm
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      {showChrome && (
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-[#ececf1] bg-white px-3 py-3.5 md:flex md:flex-col dark:border-slate-800 dark:bg-slate-900">
        <Link href="/student" className="flex items-center gap-2.5 px-2 pb-3 pt-1 border-b border-slate-100 dark:border-slate-800 mb-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white font-black text-sm shadow-xs shrink-0">
            L
          </span>
          <div className="min-w-0">
            <div className="font-extrabold text-[14px] text-slate-900 dark:text-white leading-none tracking-tight">
              LingoPro
            </div>
            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
              Học tiếng Anh thông minh
            </div>
          </div>
        </Link>
        <nav
          ref={desktopNavRef}
          onScroll={(e) => {
            try {
              sessionStorage.setItem('lingopro_sidebar_scroll', String(e.currentTarget.scrollTop));
            } catch {
              // ignore
            }
          }}
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scrollbar-none pr-0.5"
        >
          {navSections.map((section, sIdx) => (
            <div key={section.id} className={sIdx === 0 ? 'space-y-0.5' : 'mt-2.5 space-y-0.5'}>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </div>
              {section.items.map((item) => renderNavLink(item, item.match(pathname)))}
            </div>
          ))}
          {onJoinClass ? (
            <button
              type="button"
              onClick={onJoinClass}
              className="group mt-1 flex min-h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            >
              <UserPlus className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300" strokeWidth={1.75} />
              <span className="min-w-0 truncate">Tham gia lớp</span>
            </button>
          ) : (
            <Link
              href="/student?joinClass=1"
              className="group mt-1 flex min-h-[34px] items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            >
              <UserPlus className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300" strokeWidth={1.75} />
              <span className="min-w-0 truncate">Tham gia lớp</span>
            </Link>
          )}
        </nav>
        <div className="mt-auto shrink-0 space-y-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          {/* User / Workspace Card */}
          <Link
            href="/student/profile"
            className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                {initials}
              </div>
              <div className="min-w-0 truncate text-left">
                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate text-xs group-hover:text-slate-900 dark:group-hover:text-white">
                  {profile?.full_name || profileEmail || 'Học viên'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  Lv.{currentLevel} · {gamification.total_xp} XP
                </div>
              </div>
            </div>
            {profile?.plan && profile.plan !== 'free' ? (
              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-[9px] font-bold text-white uppercase shrink-0">
                {profile.plan}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shrink-0">
                Pro
              </span>
            )}
          </Link>

          {/* Secondary links row */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            {isTeacherUser && (
              <Link
                href="/teacher"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Giáo viên
              </Link>
            )}
            <Link
              href="/group"
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              Nhóm
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* ═══ MAIN ═══ */}


      <main
        className={cn(
          'flex min-h-dvh min-w-0 flex-1 flex-col',
          showChrome && 'md:pl-[248px]',
          effectiveImmersive && 'min-h-[100dvh]',
        )}
      >
        {/* Flash sale Pro (kết thúc khóa) — trên banner quota */}
        {showChrome && !effectiveImmersive ? (
          <CohortProPromoBanner variant="dashboard" />
        ) : null}
        {/* Free ≥150: banner dính + ép modal — lead upsell chắc thấy */}
        {showChrome && !effectiveImmersive ? <FreeQuotaBanner /> : null}

        {showChrome && (
        <header className="sticky top-0 z-30 flex h-header-safe items-center justify-between gap-1.5 border-b border-[#ececf1] bg-white/90 px-2.5 backdrop-blur-md sm:gap-3 sm:px-7 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className="touch-target -ml-1 flex items-center justify-center rounded-md md:hidden active:bg-slate-100 dark:active:bg-slate-800 text-slate-700 dark:text-slate-300"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Mở menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="h-6 w-6 shrink-0" />
            </button>
            {/* Title: hiện cả mobile (truncate) */}
            <h1 className="truncate text-base font-black tracking-tight sm:text-[19px] text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          </div>

          {isBootstrapping ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
              {isTeacherUser && (
                <Link
                  href="/teacher"
                  className="hidden items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-extrabold text-indigo-700 transition-colors hover:bg-indigo-100 sm:flex"
                >
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Cổng Giáo viên
                </Link>
              )}
              <Link
                href="/download"
                className="hidden items-center gap-1.5 rounded-full border border-[#ffd7bf] bg-[#fff4ec] px-3 py-1.5 text-[12px] font-black text-[#b5502f] transition-colors hover:bg-[#ffe9dc] lg:flex"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Tải app
              </Link>
              {/* Streak/XP: compact trên mobile, full từ md+ */}
              <div className="flex items-center gap-1 rounded-full border border-[#fde2c0] bg-[#fff5e9] py-1 pl-1.5 pr-2 sm:gap-1.5 sm:pl-2 sm:pr-[11px]">
                <span className="text-[13px] leading-none sm:text-[15px]">🔥</span>
                <span className="tabular-nums text-[12px] font-black text-[#ea7a23] sm:text-[13px]">
                  {gamification.current_streak}
                </span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-[#fbeaa6] bg-[#fffbe8] px-[11px] py-1 md:flex">
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
              <div className="hidden h-[22px] w-px bg-[#e8e8ee] sm:block dark:bg-slate-800" />
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((value) => !value)}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full py-[3px] pl-[3px] pr-1 transition-colors hover:bg-slate-50 sm:gap-2 sm:pr-1.5 dark:hover:bg-slate-800"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black text-white sm:h-[34px] sm:w-[34px] sm:text-sm">
                    {initials}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-[13.5px] font-extrabold text-[#0f172a] sm:block dark:text-slate-200">
                    {profile?.full_name?.split(' ')[0] || 'bạn'}
                  </span>
                  <ChevronDown
                    className={`h-[15px] w-[15px] text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isProfileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-40 w-[196px] rounded-md border border-[#ececf1] bg-white p-1.5 shadow-[0_12px_32px_rgba(16,24,40,.14)] animate-in fade-in-50 zoom-in-95 duration-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <div className="px-2.5 pb-1.5 pt-2">
                      <div className="truncate text-[13px] font-extrabold text-[#0f172a] dark:text-slate-100">
                        {profile?.full_name || 'Học viên'}
                      </div>
                      {profileEmail && (
                        <div className="truncate text-[11px] font-semibold text-[#9aa2b1] dark:text-slate-400">
                          {profileEmail}
                        </div>
                      )}
                    </div>
                    <div className="my-1 h-px bg-[#f1f1f5] dark:bg-slate-800" />
                    {isTeacherUser && (
                      <Link
                        href="/teacher"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex min-h-[40px] items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-extrabold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                      >
                        <GraduationCap className="h-[17px] w-[17px] text-indigo-600 dark:text-indigo-400" />
                        <span>Dành cho Giáo viên</span>
                      </Link>
                    )}
                    <Link
                      href="/student/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex min-h-[40px] items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-bold text-[#475569] hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <User className="h-[17px] w-[17px] text-[#64748b] dark:text-slate-400" />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full min-h-[40px] items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] font-extrabold text-[#e11d48] hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
        )}

        <div
          className={cn(
            contentClassName ??
              'mx-auto w-full max-w-[1080px] px-4 py-5 pb-10 sm:px-7 sm:py-6',
            showBottomNav && 'pb-mobile-nav',
            effectiveImmersive && 'w-full max-w-none p-0 sm:p-0',
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
    </>
  );
}

