'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';

export interface StudentTopbarProps {
  title: string;
  subtitle?: React.ReactNode;
  streak: number;
  totalXp: number;
  level: number;
  dueCount: number;
  grammarDueCount: number;
  dailyGoalXp: number;
  dailyGoal: number;
  classroomId: string | null;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
  hideHeader?: boolean;
  hideMobileHeader?: boolean;
}

export function StudentTopbar({
  title,
  subtitle,
  streak,
  totalXp,
  level,
  dueCount,
  grammarDueCount,
  dailyGoalXp,
  dailyGoal,
  classroomId,
  isMenuOpen,
  onOpenMenu,
  menuButtonRef,
  hideHeader = false,
  hideMobileHeader = false,
}: StudentTopbarProps) {
  const todayFormattedDate = React.useMemo(() => {
    try {
      const s = new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
      }).format(new Date());
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch {
      return 'Hôm nay';
    }
  }, []);

  const effectiveGoalXp = dailyGoal > 0 ? dailyGoal : 50;

  return (
    <header
      className={cn(
        'sticky top-0 z-20 relative w-full border-b border-slate-200/85 bg-white/85 px-4 py-4 backdrop-blur-xl shadow-[0_8px_30px_-10px_rgba(15,23,42,0.08)] transition-all sm:px-9 sm:py-4.5 dark:border-[#272C47] dark:bg-[#161A2E]/88 dark:shadow-[0_12px_34px_-8px_rgba(0,0,0,0.5)]',
        hideHeader ? 'hidden' : hideMobileHeader && 'hidden md:block',
      )}
    >
      {/* Subtle luminous gradient divider along the bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#7B67FF]/55 to-transparent"
      />

      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            className="touch-target -ml-1 flex items-center justify-center rounded-md md:hidden active:bg-slate-100 dark:active:bg-slate-800 text-slate-700 dark:text-slate-300"
            onClick={onOpenMenu}
            aria-label="Mở menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <Menu className="h-6 w-6 shrink-0" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-xl sm:text-[24px] font-extrabold tracking-tight text-slate-900 dark:text-[#F2F3FB]">
              {title}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] sm:text-[14px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              {subtitle ?? (
                <span>
                  {todayFormattedDate} · mục tiêu hôm nay chỉ cần {effectiveGoalXp} XP
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Chip: Streak */}
          <div className="inline-flex min-h-[38px] sm:min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[12.5px] sm:text-[13px] font-bold text-slate-800 shadow-2xs dark:border-[#272C47] dark:bg-[#0D0F1E]/80 dark:text-[#F2F3FB]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBA94C" aria-hidden="true">
              <path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" />
            </svg>
            <span className="tabular-nums">
              {streak}{' '}
              <span className="hidden xs:inline">ngày liên tiếp</span>
              <span className="xs:hidden">ngày</span>
            </span>
          </div>

          {/* Chip: XP & Level */}
          <div className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3.5 py-2 text-[13px] font-bold text-slate-800 shadow-2xs tabular-nums dark:border-[#272C47] dark:bg-[#0D0F1E]/80 dark:text-[#F2F3FB]">
            {totalXp.toLocaleString('vi-VN')} XP · Lv.{level}
          </div>

          {/* Chip: Từ điển */}
          <Link
            href="/dictionary"
            aria-label="Tra từ điển"
            className="inline-flex min-h-[38px] sm:min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[12.5px] sm:text-[13px] font-bold text-slate-800 shadow-2xs transition hover:border-indigo-400 dark:border-[#272C47] dark:bg-[#0D0F1E]/80 dark:text-[#F2F3FB] dark:hover:border-[#7B67FF]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <span className="hidden sm:inline">Từ điển</span>
          </Link>

          <NotificationBell
            dueCount={dueCount}
            grammarDueCount={grammarDueCount}
            streak={streak}
            dailyGoalXp={dailyGoalXp}
            dailyGoal={dailyGoal}
            classroomId={classroomId}
          />
        </div>
      </div>
    </header>
  );
}
