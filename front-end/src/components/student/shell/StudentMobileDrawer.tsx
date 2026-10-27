import { useEffect, useRef, type RefObject } from 'react';
import Link from '@/shared/router/navigation';
import { Crown, GraduationCap, LogOut, UserPlus, Users, X } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import type { StudentNavSection } from '@/lib/student-nav';
import type { UserGamification } from '@/lib/supabase';
import type { ShellProfile } from '@/components/student/StudentProvider';
import { StudentNavLink } from './StudentNavLink';
import { cn } from '@/lib/utils';

export interface StudentMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  mobileDrawerSections: StudentNavSection[];
  pathname: string;
  isPracticeSubOpen: boolean;
  onTogglePracticeSub: () => void;
  onJoinClass?: () => void;
  effectiveProfile: ShellProfile | null;
  profileEmail: string;
  initials: string;
  currentLevel: number;
  effectiveGamification: UserGamification;
  effectiveIsTeacher: boolean;
  isUpgradeActive: boolean;
  onSignOut: () => void;
}

export function StudentMobileDrawer({
  isOpen,
  onClose,
  menuButtonRef,
  mobileDrawerSections,
  pathname,
  isPracticeSubOpen,
  onTogglePracticeSub,
  onJoinClass,
  effectiveProfile,
  profileEmail,
  initials,
  currentLevel,
  effectiveGamification,
  effectiveIsTeacher,
  isUpgradeActive,
  onSignOut,
}: StudentMobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const wasMenuOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !wasMenuOpen.current) {
      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          firstFocusable?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isOpen && wasMenuOpen.current) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpen.current = isOpen;
  }, [isOpen, menuButtonRef]);

  if (!isOpen) return null;

  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      onClose();
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
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const isDismissSwipe = deltaX < -30 && (deltaTime < 250 || deltaX < -45);

    if (isHorizontal && isDismissSwipe) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
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
          <Link href="/student" onClick={onClose} className="flex items-center gap-2.5">
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
            onClick={onClose}
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

        {/* Nav scroll */}
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 scrollbar-none">
          {mobileDrawerSections.map((section, sIdx) => (
            <div key={section.id} className={sIdx === 0 ? 'space-y-0.5' : 'mt-2.5 space-y-0.5'}>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </div>
              {section.items.map((item) => (
                <StudentNavLink
                  key={item.href}
                  item={item}
                  active={item.match(pathname)}
                  pathname={pathname}
                  isPracticeSubOpen={isPracticeSubOpen}
                  onTogglePracticeSub={onTogglePracticeSub}
                  onClick={onClose}
                />
              ))}
            </div>
          ))}
          {onJoinClass ? (
            <button
              type="button"
              onClick={() => {
                onJoinClass();
                onClose();
              }}
              className="group mt-1 flex min-h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            >
              <UserPlus
                className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300"
                strokeWidth={1.75}
              />
              <span className="min-w-0 truncate">Tham gia lớp</span>
            </button>
          ) : (
            <Link
              href="/student?joinClass=1"
              onClick={onClose}
              className="group mt-1 flex min-h-[34px] items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            >
              <UserPlus
                className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300"
                strokeWidth={1.75}
              />
              <span className="min-w-0 truncate">Tham gia lớp</span>
            </Link>
          )}
        </nav>

        {/* Footer drawer */}
        <div className="shrink-0 space-y-2 border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800">
          <div className="space-y-1">
            <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Giao diện hiển thị
            </div>
            <ThemeToggle variant="sidebar" />
          </div>

          {(!effectiveProfile?.plan || effectiveProfile.plan === 'free') && (
            <Link
              href="/upgrade"
              onClick={onClose}
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
            onClick={onClose}
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
                onClick={onClose}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Giáo viên
              </Link>
            )}
            <Link
              href="/group"
              onClick={onClose}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              Nhóm
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
