import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from '@/shared/ui/dynamic';
import { MobileBottomNav } from '@/components/student/MobileBottomNav';
import { StudentTopbar } from '@/components/student/StudentTopbar';
import type { UserGamification } from '@/lib/supabase';
import { xpToLevel } from '@/lib/gamification';
import {
  buildStudentNavSections,
  type StudentNavSection,
} from '@/lib/student-nav';
import { cn } from '@/lib/utils';
import type { ShellProfile } from '@/components/student/StudentProvider';
import { useStudentShellData } from '@/components/student/shell/useStudentShellData';
import { StudentSidebar } from '@/components/student/shell/StudentSidebar';
import { StudentMobileDrawer } from '@/components/student/shell/StudentMobileDrawer';

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

export interface StudentShellProps {
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    pathname,
    effectiveProfile,
    effectiveGamification,
    effectiveIsTeacher,
    effectiveClassroomId,
    effectiveReviewDueCount,
    effectiveNewCount,
    effectiveImmersive,
    grammarDue,
    profileEmail,
    handleSignOut,
  } = useStudentShellData({
    requireAuth,
    immersive,
    propProfile,
    propGamification,
    propReviewDueCount,
    propNewCount,
    propClassroomId,
  });

  useEffect(() => {
    setIsMenuOpen(false);
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
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const initials =
    (effectiveProfile?.full_name || profileEmail || 'U')
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const currentLevel = xpToLevel(effectiveGamification.total_xp);
  const showBottomNav = !hideMobileNav && !effectiveImmersive;
  const showChrome = !effectiveImmersive;
  const isUpgradeActive = pathname.startsWith('/upgrade');

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
        {showChrome && (
          <StudentMobileDrawer
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            menuButtonRef={menuButtonRef}
            mobileDrawerSections={mobileDrawerSections}
            pathname={pathname}
            isPracticeSubOpen={isPracticeSubOpen}
            onTogglePracticeSub={() => setIsPracticeSubOpen((prev) => !prev)}
            onJoinClass={onJoinClass}
            effectiveProfile={effectiveProfile}
            profileEmail={profileEmail}
            initials={initials}
            currentLevel={currentLevel}
            effectiveGamification={effectiveGamification}
            effectiveIsTeacher={effectiveIsTeacher}
            isUpgradeActive={isUpgradeActive}
            onSignOut={handleSignOut}
          />
        )}

        {/* ═══ DESKTOP SIDEBAR (includes /download & /upgrade actions) ═══ */}
        {showChrome && (
          <StudentSidebar
            desktopNavRef={desktopNavRef}
            navSections={navSections}
            pathname={pathname}
            isPracticeSubOpen={isPracticeSubOpen}
            onTogglePracticeSub={() => setIsPracticeSubOpen((prev) => !prev)}
            onJoinClass={onJoinClass}
            effectiveProfile={effectiveProfile}
            profileEmail={profileEmail}
            initials={initials}
            currentLevel={currentLevel}
            effectiveGamification={effectiveGamification}
            effectiveIsTeacher={effectiveIsTeacher}
            isUpgradeActive={isUpgradeActive}
            onSignOut={handleSignOut}
          />
        )}

        {/* ═══ MAIN ═══ */}
        <main
          className={cn(
            'flex min-h-dvh min-w-0 flex-1 flex-col',
            showChrome && 'md:pl-[248px]',
            effectiveImmersive && 'min-h-[100dvh]',
          )}
        >
          {showChrome && !effectiveImmersive && (!effectiveProfile?.plan || effectiveProfile.plan === 'free') ? (
            <CohortProPromoBanner variant="dashboard" />
          ) : null}
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
