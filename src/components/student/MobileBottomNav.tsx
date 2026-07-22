'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type MobileBottomNavProps = {
  classroomId?: string | null;
  reviewDueCount?: number;
  newCount?: number;
  className?: string;
};

type TabItem = {
  key: string;
  href: string;
  label: string;
  /** Emoji màu — không dùng lucide vector */
  emoji: string;
  elevated?: boolean;
  badge?: number;
};

/**
 * Footer: Home · Ôn · Lộ trình+ · Kho · Tra từ
 */
export function MobileBottomNav({
  classroomId,
  reviewDueCount = 0,
  className,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const reviewHref = classroomId ? `/review?class=${classroomId}` : '/review';

  const tabs: TabItem[] = [
    { key: 'home', href: '/student', label: 'Home', emoji: '🏠' },
    {
      key: 'review',
      href: reviewHref,
      label: 'Ôn',
      emoji: '📚',
      badge: reviewDueCount > 0 ? reviewDueCount : undefined,
    },
    { key: 'journey', href: '/journey', label: 'Lộ trình', emoji: '🗺️', elevated: true },
    { key: 'vault', href: '/library', label: 'Kho', emoji: '📦' },
    { key: 'dict', href: '/dictionary', label: 'Tra từ', emoji: '🔍' },
  ];

  const isActive = (key: string): boolean => {
    if (key === 'home') {
      return (
        pathname === '/student' ||
        pathname.startsWith('/student/profile') ||
        pathname.startsWith('/student/leaderboard')
      );
    }
    if (key === 'review') {
      return (
        pathname.startsWith('/review') ||
        pathname.startsWith('/flashcard') ||
        pathname.startsWith('/writing') ||
        pathname.startsWith('/quiz') ||
        pathname.startsWith('/practice')
      );
    }
    if (key === 'journey') return pathname.startsWith('/journey');
    if (key === 'vault') {
      return pathname.startsWith('/library') || pathname.startsWith('/import');
    }
    if (key === 'dict') return pathname.startsWith('/dictionary');
    return false;
  };

  return (
    <nav
      aria-label="Điều hướng chính"
      data-onboarding="mobile-nav"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[90] border-t border-[#ececf1] bg-white/95 backdrop-blur-xl md:hidden',
        'h-mobile-nav px-safe',
        'shadow-[0_-4px_24px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="mx-auto flex h-[var(--mobile-nav-h)] max-w-lg items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          const badge = tab.badge && tab.badge > 0 ? tab.badge : 0;
          const badgeText = badge > 99 ? '99+' : String(badge);

          const onboardingId =
            tab.key === 'home'
              ? 'mobile-home'
              : tab.key === 'journey'
                ? 'mobile-journey'
                : tab.key === 'vault'
                  ? 'mobile-library'
                  : tab.key === 'review'
                    ? 'mobile-review'
                    : tab.key === 'dict'
                      ? 'mobile-dictionary'
                      : undefined;

          if (tab.elevated) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                data-onboarding={onboardingId}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                className="relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-end pb-1 touch-manipulation"
              >
                <span
                  className={cn(
                    'absolute -top-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[28px] shadow-lg transition-transform active:scale-95',
                    active
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-300/50 ring-2 ring-emerald-200'
                      : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200/60',
                  )}
                >
                  {tab.emoji}
                </span>
                <span
                  className={cn(
                    'mt-7 max-w-full truncate text-[10px] font-extrabold leading-none',
                    active ? 'text-emerald-600' : 'text-slate-500',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              data-onboarding={onboardingId}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors active:opacity-80"
            >
              <span className="relative text-[22px] leading-none">
                {tab.emoji}
                {badge > 0 && (
                  <span className="pointer-events-none absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                    {badgeText}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'max-w-full truncate text-[10px] font-extrabold leading-none',
                  active ? 'text-indigo-600' : 'text-slate-400',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
