'use client';
import { authFetch } from '@/lib/auth-fetch';


import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  Brain,
  ChevronDown,
  Crown,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  Search,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileBottomNav } from '@/components/student/MobileBottomNav';
import { StudentTopbar } from '@/components/student/StudentTopbar';
import { ThemeToggle } from '@/components/common/ThemeToggle';

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
import { authService } from '@/features/auth/session';
import { supabase, type Profile, type UserGamification } from '@/lib/supabase';
import { xpToLevel } from '@/lib/gamification';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import {
  readLastProfileCache,
  readLastGamificationCache,
} from '@/lib/dashboard-snapshot-cache';

const DEFAULT_GAMIFICATION: UserGamification = {
  user_id: '',
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  daily_goal: 30,
  today_xp: 0,
  today_date: null,
};

const GRAMMAR_DUE_CACHE_KEY = 'lingopro_grammar_due_cache_v1';
const GRAMMAR_DUE_TTL_MS = 60_000;

function readGrammarDueCache(userId?: string | null): { dueCount: number; fresh: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GRAMMAR_DUE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string; dueCount?: number; ts?: number };
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    if (typeof parsed.dueCount !== 'number') return null;
    const fresh = typeof parsed.ts === 'number' && Date.now() - parsed.ts < GRAMMAR_DUE_TTL_MS;
    return { dueCount: parsed.dueCount, fresh };
  } catch {
    return null;
  }
}

function writeGrammarDueCache(userId: string, dueCount: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      GRAMMAR_DUE_CACHE_KEY,
      JSON.stringify({ userId, dueCount, ts: Date.now() }),
    );
  } catch {
    // ignore storage quota errors
  }
}
import {
  buildStudentNavSections,
  type StudentNavItem,
  type StudentNavSection,
} from '@/lib/student-nav';
import { cn } from '@/lib/utils';
import { useStudentContext, type ShellProfile } from '@/components/student/StudentProvider';

interface StudentShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  /** Ẩn bottom tab khi đang học tập trung (flashcard/quiz/writing/speaking) */
  hideMobileNav?: boolean;
  /** Ẩn header trên di động (dùng cho dashboard gọn gàng) */
  hideMobileHeader?: boolean;
  /** Ẩn header cả trên desktop khi trang tự có Topbar riêng (như Dashboard mới) */
  hideHeader?: boolean;
  /**
   * immersive = tắt sidebar desktop + drawer + header chrome + bottom nav
   * (dùng cho Pixel Hub full-screen)
   */
  immersive?: boolean;
  /** Callback mở modal tham gia lớp (dùng ở Dashboard) */
  onJoinClass?: () => void;
  /** Yêu cầu đăng nhập để truy cập (mặc định true). Đặt false cho các trang công khai / dùng thử như Luyện nghe */
  requireAuth?: boolean;
  /** Optional overrides from parent context or props */
  profile?: ShellProfile | null;
  gamification?: UserGamification;
  reviewDueCount?: number;
  newCount?: number;
  classroomId?: string | null;
}

export function StudentShell({
  title,
  subtitle,
  children,
  contentClassName,
  hideMobileNav = false,
  hideMobileHeader = false,
  hideHeader = false,
  immersive = false,
  onJoinClass,
  requireAuth = true,
  profile: propProfile,
  gamification: propGamification,
  reviewDueCount: propReviewDueCount,
  newCount: propNewCount,
  classroomId: propClassroomId,
}: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const context = useStudentContext();
  const profileRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const wasMenuOpen = useRef(false);
  const [internalProfile, setInternalProfile] = useState<ShellProfile | null>(() => {
    if (propProfile || context?.profile) return null;
    return readLastProfileCache();
  });
  const [profileEmail, setProfileEmail] = useState<string>(() => {
    const cached = propProfile ?? context?.profile ?? readLastProfileCache();
    return cached?.email ?? '';
  });
  const [isTeacherUser, setIsTeacherUser] = useState<boolean>(() => {
    const cached = propProfile ?? context?.profile ?? readLastProfileCache();
    return cached?.role === 'teacher';
  });
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState<number>(() => {
    if (context?.wordSummary) return context.wordSummary.reviewDueCount;
    const cached = readLastWordSummaryCache();
    return cached?.reviewDueCount ?? 0;
  });
  const [newCount, setNewCount] = useState<number>(() => {
    if (context?.wordSummary) return context.wordSummary.newCount;
    const cached = readLastWordSummaryCache();
    return cached?.newCount ?? 0;
  });
  const [grammarDue, setGrammarDue] = useState<number>(() => readGrammarDueCache()?.dueCount ?? 0);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(() => {
    const active = propProfile ?? context?.profile ?? readLastProfileCache();
    return !active;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  /** Hub iframe: ?embed=1 | from=hub → ẩn chrome (không dùng useSearchParams — tránh Suspense toàn app) */
  const [embedMode, setEmbedMode] = useState(false);

  // Fallback gamification hook: only queries when outside StudentProvider
  const { data: fallbackGamification } = useGamification(
    context ? null : (internalProfile?.id ?? null),
  );

  const cachedGamification = useMemo(() => {
    if (propGamification || (context?.gamification && context.gamification.total_xp > 0)) {
      return null;
    }
    return readLastGamificationCache();
  }, [propGamification, context?.gamification]);

  // Effective values derived from Props -> Context -> Internal State
  const effectiveProfile = propProfile ?? context?.profile ?? internalProfile;
  const effectiveGamification =
    propGamification ??
    (context?.gamification && (context.gamification.total_xp > 0 || !cachedGamification)
      ? context.gamification
      : (cachedGamification ?? fallbackGamification ?? DEFAULT_GAMIFICATION));
  const effectiveIsTeacher = context
    ? context.isTeacherUser
    : (effectiveProfile?.role === 'teacher' || isTeacherUser);
  const effectiveClassroomId =
    propClassroomId ?? context?.wordSummary.classroomId ?? classroomId;
  const effectiveReviewDueCount =
    propReviewDueCount ?? context?.wordSummary.reviewDueCount ?? reviewDueCount;
  const effectiveNewCount =
    propNewCount ?? context?.wordSummary.newCount ?? newCount;
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
        if (effectiveProfile) {
          setIsBootstrapping(false);
        }
        if (context) {
          const result = context.session ? null : await authService.getSession();
          if (result?.error) return;
          const session = context.session ?? result?.data.session;
          if (isCancelled) return;
          if (!session?.user) {
            if (requireAuth) {
              router.replace('/auth');
            }
            return;
          }

          setProfileEmail(session.user.email ?? '');

          // Grammar progress is specific to shell notification bell — reuse sessionStorage if fresh (< 60s)
          const cachedGrammar = readGrammarDueCache(session.user.id);
          if (cachedGrammar && !isCancelled) {
            setGrammarDue(cachedGrammar.dueCount);
            if (cachedGrammar.fresh) {
              return;
            }
          }

          const authHeaders = { 'X-LingoPro-Request': '1' };
          const grammarResponse = await authFetch('/api/grammar/progress?summary=1', { headers: authHeaders })
            .then((response) => response.json())
            .catch(() => null);

          if (!isCancelled && grammarResponse?.success) {
            const nextGrammarDue = Number(grammarResponse.dueCount ?? 0);
            setGrammarDue(nextGrammarDue);
            writeGrammarDueCache(session.user.id, nextGrammarDue);
          }
          return;
        }

        // Fallback for standalone routes outside StudentProvider (e.g. /journey, /library)
        const { data: { session }, error } = await authService.getSession();
        if (error) return;
        if (isCancelled) return;
        if (!session?.user) {
          if (requireAuth) {
            router.replace('/auth');
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
        const cachedGrammar = readGrammarDueCache(session.user.id);
        if (cachedGrammar && !isCancelled) {
          setGrammarDue(cachedGrammar.dueCount);
        }

        const cachedProfile = readLastProfileCache();
        if (cachedProfile && cachedProfile.id === session.user.id && !isCancelled) {
          setInternalProfile(cachedProfile);
          setIsTeacherUser(cachedProfile.role === 'teacher');
        }

        const authHeaders = { 'X-LingoPro-Request': '1' };
        const [wordsResponse, grammarResponse] = await Promise.all([
          cached
            ? Promise.resolve(null)
            : authFetch('/api/words?summary=1', { headers: authHeaders })
                .then((response) => response.json())
                .catch(() => null),
          cachedGrammar?.fresh
            ? Promise.resolve(null)
            : authFetch('/api/grammar/progress?summary=1', { headers: authHeaders })
                .then((response) => response.json())
                .catch(() => null),
        ]);

        if (isCancelled) return;

        if (!cachedProfile || cachedProfile.id !== session.user.id) {
          const fallbackProfile: ShellProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name:
              (session.user.user_metadata?.full_name as string) ||
              session.user.email?.split('@')[0] ||
              'Học viên',
            avatar_url: (session.user.user_metadata?.avatar_url as string) || undefined,
            role: (session.user.user_metadata?.role as 'teacher' | 'student') || 'student',
            plan: (session.user.user_metadata?.plan as 'free' | 'pro' | 'premium') || 'free',
            created_at: new Date().toISOString(),
          };
          setInternalProfile(fallbackProfile);
          setIsTeacherUser(fallbackProfile.role === 'teacher');
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
            levelCounts: Array.isArray(wordsResponse.levelCounts)
              ? wordsResponse.levelCounts.map((n: unknown) => Number(n) || 0)
              : undefined,
          });
        }

        if (grammarResponse?.success) {
          const nextGrammarDue = Number(grammarResponse.dueCount ?? 0);
          setGrammarDue(nextGrammarDue);
          writeGrammarDueCache(session.user.id, nextGrammarDue);
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void loadShellData();

    // Lắng nghe thay đổi phiên đăng nhập thời gian thực (token refresh, signout ở tab khác)
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (isCancelled) return;
      if (event === 'SIGNED_OUT') {
        setInternalProfile(null);
        setProfileEmail('');
        if (requireAuth) {
          router.replace('/auth');
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setProfileEmail(session.user.email ?? '');
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [router, requireAuth, context]);

  // Warmup các route chính trong idle time khi mạng cho phép (Wi-Fi / 4G không bật Save-Data)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('lp:routes_prefetched') === '1') return;
    } catch {}

    const runRouteWarmup = async () => {
      try {
        const { getNetworkPolicy } = await import('@/lib/offline/network-policy');
        if (!getNetworkPolicy().canPrefetchRoutes) return;
        sessionStorage.setItem('lp:routes_prefetched', '1');
        const primaryRoutes = [
          '/student',
          '/library',
          '/journey',
          '/grammar',
          '/dictionary',
          '/student/profile',
          '/flashcard?mode=learn',
          '/review/session?mode=mixed',
          '/practice/daily-reading',
        ];
        for (const r of primaryRoutes) {
          try {
            router.prefetch(r);
          } catch {}
        }
      } catch {}
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(runRouteWarmup, { timeout: 3500 });
      return () => (window as any).cancelIdleCallback?.(id);
    } else {
      const timer = setTimeout(runRouteWarmup, 1500);
      return () => clearTimeout(timer);
    }
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
    const { error } = await authService.signOut();
    if (error) { alert(error.message); return; }
    router.replace('/auth');
  };

  const navSections = useMemo<StudentNavSection[]>(
    () =>
      buildStudentNavSections({
        classroomId: effectiveClassroomId,
        hasClass: Boolean(effectiveClassroomId),
        reviewDueCount: effectiveReviewDueCount,
        grammarDueCount: grammarDue,
      }),
    [effectiveClassroomId, effectiveReviewDueCount, grammarDue],
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
    if (href.startsWith('/practice')) return 'practice-hub';
    if (href.startsWith('/toeic')) return 'toeic';
    return undefined;
  };

  const isInPracticeHub =
    pathname === '/practice' ||
    pathname.startsWith('/practice/') ||
    pathname.startsWith('/student/speaking') ||
    pathname.startsWith('/toeic');
  const [isPracticeSubOpen, setIsPracticeSubOpen] = useState<boolean>(isInPracticeHub);

  useEffect(() => {
    if (isInPracticeHub) {
      setIsPracticeSubOpen(true);
    }
  }, [isInPracticeHub]);

  const renderNavLink = (
    item: StudentNavItem,
    active: boolean,
    onClick?: () => void,
  ) => {
    const Icon = item.icon;
    const hasSubItems = Boolean(item.children && item.children.length > 0);

    if (hasSubItems && item.children) {
      return (
        <div key={item.href} className="space-y-1">
          <button
            type="button"
            data-onboarding={item.onboardingId || onboardingIdFor(item.href)}
            onClick={() => setIsPracticeSubOpen((prev) => !prev)}
            aria-expanded={isPracticeSubOpen}
            className={cn(
              'group flex min-h-[34px] w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition-all cursor-pointer',
              active
                ? 'bg-indigo-50/60 font-semibold text-indigo-700 dark:bg-[#20253F]/70 dark:text-[#B3A8FF]'
                : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:bg-[#20253F] dark:hover:text-[#F2F3FB]',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active
                    ? 'text-indigo-600 dark:text-[#B3A8FF]'
                    : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A5AAC6] dark:group-hover:text-[#F2F3FB]',
                )}
                strokeWidth={active ? 2 : 1.75}
              />
              <span className="truncate">{item.label}</span>
            </div>

            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 dark:text-[#A5AAC6]',
                isPracticeSubOpen && 'rotate-180',
              )}
            />
          </button>

          {/* ── SIDEBAR CON (SUB-SIDEBAR) CHO TRUNG TÂM LUYỆN TẬP ── */}
          {isPracticeSubOpen && (
            <div
              role="group"
              aria-label="Danh mục con Trung tâm Luyện tập"
              className="ml-3.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2 py-0.5 dark:border-[#272C47]"
            >
              {item.children.map((sub) => {
                const subActive = sub.match(pathname);
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClick}
                    title={sub.desc}
                    aria-current={subActive ? 'page' : undefined}
                    className={cn(
                      'group flex min-h-[32px] items-center justify-between gap-2 rounded-md px-2 py-1 text-[12.5px] transition-all',
                      subActive
                        ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-[#20253F] dark:text-[#B3A8FF]'
                        : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:bg-[#20253F] dark:hover:text-[#F2F3FB]',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SubIcon
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 transition-colors',
                          subActive
                            ? 'text-indigo-600 dark:text-[#B3A8FF]'
                            : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A5AAC6] dark:group-hover:text-[#F2F3FB]',
                        )}
                        strokeWidth={subActive ? 2 : 1.75}
                      />
                      <span className="truncate">{sub.label}</span>
                    </div>
                    {subActive && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600 dark:bg-[#7B67FF]" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

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
            ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-[#20253F] dark:text-[#B3A8FF]'
            : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:bg-[#20253F] dark:hover:text-[#F2F3FB]',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active
                ? 'text-indigo-600 dark:text-[#B3A8FF]'
                : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A5AAC6] dark:group-hover:text-[#F2F3FB]',
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
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-[#20253F] dark:text-[#B3A8FF] dark:border-[#272C47]',
            )}
          >
            {item.badge}
          </span>
        ) : active ? (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-[#7B67FF] shrink-0 ml-1.5" />
        ) : null}
      </Link>
    );
  };

  const initials = (effectiveProfile?.full_name || profileEmail || 'U')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const currentLevel = xpToLevel(effectiveGamification.total_xp);
  const showBottomNav = !hideMobileNav && !effectiveImmersive;
  const showChrome = !effectiveImmersive;
  const isTeacherActive = pathname.startsWith('/teacher');
  const isUpgradeActive = pathname.startsWith('/upgrade');
  const isGroupActive = pathname.startsWith('/group');

  return (
    <>
      <UpgradeGiftModal />
      <div
        data-shell-theme-toggle="true"
        className={cn(
          'flex min-h-dvh w-full font-sans transition-colors duration-200',
          effectiveImmersive ? 'bg-background' : 'bg-[#F6F7FB] dark:bg-[#0D0F1E]',
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
            className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-white shadow-2xl pl-safe outline-none touch-pan-y animate-in slide-in-from-left duration-200 ease-out dark:border-r dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB]"
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
                  {effectiveGamification.current_streak} ngày
                </span>
              </div>
              <div className="flex flex-1 items-center gap-1.5 rounded-md border border-[#fbeaa6] bg-[#fffbe8] px-3 py-1.5 dark:border-yellow-900/40 dark:bg-yellow-950/25">
                <span className="text-sm leading-none">⭐</span>
                <span className="tabular-nums text-xs font-black text-[#b45309]">
                  {effectiveGamification.total_xp} XP
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
            <div className="shrink-0 space-y-2 border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800">
              {/* Theme Switcher (Light / Dark / System) */}
              <div className="space-y-1">
                <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Giao diện hiển thị
                </div>
                <ThemeToggle variant="sidebar" />
              </div>

              {/* Nâng cấp Pro CTA - Chỉ hiện cho tài khoản free */}
              {(!effectiveProfile?.plan || effectiveProfile.plan === 'free') && (
                <Link
                  href="/upgrade"
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isUpgradeActive ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-[36px] items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition-all',
                    isUpgradeActive
                      ? 'bg-amber-500/15 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-black'
                      : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 text-amber-900 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200/80 shadow-[0_1px_2px_rgba(245,158,11,0.08)] dark:border-amber-900/50 dark:text-amber-300 dark:from-amber-950/30 dark:to-orange-950/20',
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Crown className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Nâng cấp Pro</span>
                  </div>
                  <span className="shrink-0 rounded bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                    ƯU ĐÃI
                  </span>
                </Link>
              )}

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
                      {effectiveProfile?.full_name || profileEmail || 'Học viên'}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      Lv.{currentLevel} · {effectiveGamification.total_xp} XP
                    </div>
                  </div>
                </div>
                {effectiveProfile?.plan && effectiveProfile.plan !== 'free' ? (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-[9px] font-bold text-white uppercase shrink-0">
                    {effectiveProfile.plan}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[9px] font-bold uppercase shrink-0">
                    {effectiveProfile ? 'Free' : '…'}
                  </span>
                )}
              </Link>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                {effectiveIsTeacher && (
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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-[#ececf1] bg-white px-3 py-3.5 md:flex md:flex-col dark:border-[#272C47] dark:bg-[#161A2E]">
        <Link href="/student" className="flex items-center gap-2.5 px-2 pb-3 pt-1 border-b border-slate-100 dark:border-[#272C47] mb-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 dark:bg-[#7B67FF] text-white font-black text-sm shadow-xs shrink-0">
            L
          </span>
          <div className="min-w-0">
            <div className="font-extrabold text-[14px] text-slate-900 dark:text-[#F2F3FB] leading-none tracking-tight">
              LingoPro
            </div>
            <div className="text-[10px] font-medium text-slate-400 dark:text-[#A5AAC6] mt-0.5">
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
        <div className="mt-auto shrink-0 space-y-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          {/* Theme Switcher (Light / Dark / System) */}
          <ThemeToggle variant="sidebar" />

          {/* Nâng cấp Pro CTA - Chỉ hiện cho tài khoản free */}
          {(!effectiveProfile?.plan || effectiveProfile.plan === 'free') && (
            <Link
              href="/upgrade"
              aria-current={isUpgradeActive ? 'page' : undefined}
              className={cn(
                'group flex min-h-[36px] items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition-all',
                isUpgradeActive
                  ? 'bg-amber-500/15 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-black'
                  : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 text-amber-900 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200/80 shadow-[0_1px_2px_rgba(245,158,11,0.08)] dark:border-amber-900/50 dark:text-amber-300 dark:from-amber-950/30 dark:to-orange-950/20',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Crown className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="truncate">Nâng cấp Pro</span>
              </div>
              <span className="shrink-0 rounded bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                ƯU ĐÃI
              </span>
            </Link>
          )}

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
                  {effectiveProfile?.full_name || profileEmail || 'Học viên'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  Lv.{currentLevel} · {effectiveGamification.total_xp} XP
                </div>
              </div>
            </div>
            {effectiveProfile?.plan && effectiveProfile.plan !== 'free' ? (
              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-[9px] font-bold text-white uppercase shrink-0">
                {effectiveProfile.plan}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[9px] font-bold uppercase shrink-0">
                {effectiveProfile ? 'Free' : '…'}
              </span>
            )}
          </Link>

          {/* Secondary links row */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            {effectiveIsTeacher && (
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
        {/* Flash sale Pro (kết thúc khóa) — chỉ hiện cho user free, trên banner quota */}
        {showChrome && !effectiveImmersive && (!effectiveProfile?.plan || effectiveProfile.plan === 'free') ? (
          <CohortProPromoBanner variant="dashboard" />
        ) : null}
        {/* Free ≥150: banner dính + ép modal — lead upsell chắc thấy */}
        {showChrome && !effectiveImmersive ? <FreeQuotaBanner /> : null}

        {showChrome && (
          <StudentTopbar
            title={title}
            subtitle={subtitle}
            streak={effectiveGamification.current_streak}
            totalXp={effectiveGamification.total_xp}
            level={currentLevel}
            dueCount={effectiveReviewDueCount}
            grammarDueCount={grammarDue}
            dailyGoalXp={effectiveGamification.today_xp}
            dailyGoal={effectiveGamification.daily_goal}
            classroomId={effectiveClassroomId}
            isMenuOpen={isMenuOpen}
            onOpenMenu={() => setIsMenuOpen(true)}
            menuButtonRef={menuButtonRef}
            hideHeader={hideHeader}
            hideMobileHeader={hideMobileHeader}
          />
        )}

        <div
          className={cn(
            contentClassName ??
              'mx-auto w-full max-w-[1080px] px-4 py-5 pb-10 sm:px-7 sm:py-6',
            showBottomNav && 'pb-mobile-nav',
            hideMobileHeader && 'pt-safe md:pt-0',
            effectiveImmersive && 'w-full max-w-none p-0 sm:p-0',
          )}
        >
          {children}
        </div>
      </main>

      {showBottomNav && (
        <MobileBottomNav
          classroomId={effectiveClassroomId}
          reviewDueCount={effectiveReviewDueCount}
          newCount={effectiveNewCount}
        />
      )}
    </div>
    </>
  );
}
