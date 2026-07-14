'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Map,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileBottomNavProps = {
  classroomId?: string | null;
  /** Số từ cần ôn — badge trên tab Ôn */
  reviewDueCount?: number;
  /** @deprecated không dùng (tab giữa = Lộ trình) */
  newCount?: number;
  className?: string;
};

type TabItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  elevated?: boolean;
  badge?: number;
};

/**
 * Footer mobile: Home · Ôn · Lộ trình+ · Kho · Tra từ
 */
export function MobileBottomNav({
  classroomId,
  reviewDueCount = 0,
  className,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const flashHref = classroomId ? `/flashcard?class=${classroomId}` : '/flashcard';

  const tabs: TabItem[] = [
    {
      key: 'home',
      href: '/student',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      key: 'review',
      href: flashHref,
      label: 'Ôn',
      icon: BookOpen,
      badge: reviewDueCount > 0 ? reviewDueCount : undefined,
    },
    {
      key: 'journey',
      href: '/journey',
      label: 'Lộ trình',
      icon: Map,
      elevated: true,
    },
    {
      key: 'vault',
      href: '/library',
      label: 'Kho',
      icon: Library,
    },
    {
      key: 'dict',
      href: '/dictionary',
      label: 'Tra từ',
      icon: Search,
    },
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
      return pathname.startsWith('/flashcard');
    }
    if (key === 'journey') {
      return pathname.startsWith('/journey');
    }
    if (key === 'vault') {
      // Thư viện + import = kho từ
      return pathname.startsWith('/library') || pathname.startsWith('/import');
    }
    if (key === 'dict') {
      return pathname.startsWith('/dictionary');
    }
    return false;
  };

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[90] border-t border-[#ececf1] bg-white/95 backdrop-blur-xl md:hidden',
        'h-mobile-nav px-safe',
        'shadow-[0_-4px_24px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="mx-auto flex h-[var(--mobile-nav-h)] max-w-lg items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.key);
          const badge = tab.badge && tab.badge > 0 ? tab.badge : 0;
          const badgeText = badge > 99 ? '99+' : String(badge);

          if (tab.elevated) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                className="relative flex min-w-0 flex-1 flex-col items-center justify-end pb-1 touch-manipulation"
              >
                <span
                  className={cn(
                    'absolute -top-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95',
                    active
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-300/50 ring-2 ring-emerald-200'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200/60',
                  )}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.25} />
                </span>
                <span
                  className={cn(
                    'mt-7 text-[10px] font-extrabold leading-none',
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
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors active:opacity-80"
            >
              <span className="relative">
                <Icon
                  className={cn(
                    'h-[22px] w-[22px]',
                    active
                      ? tab.key === 'vault'
                        ? 'text-emerald-600'
                        : 'text-indigo-600'
                      : 'text-slate-400',
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                    {badgeText}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'max-w-full truncate text-[10px] font-extrabold leading-none',
                  active
                    ? tab.key === 'vault'
                      ? 'text-emerald-600'
                      : 'text-indigo-600'
                    : 'text-slate-400',
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
