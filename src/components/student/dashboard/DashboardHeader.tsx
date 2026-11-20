'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Profile, UserGamification } from '@/lib/supabase';
import { Mascot, type MascotMood } from '@/components/gamification/Mascot';
import { NotificationBell } from '@/components/NotificationBell';

interface DashboardHeaderProps {
  greeting: string;
  profile: Profile | null;
  mascotMood: MascotMood;
  reviewDueCount: number;
  newCount: number;
  todayNewWords: number;
  dailyWordGoal: number;
  countsReady: boolean;
  totalWords: number;
  masteredCount: number;
  studyStreak: number;
  gamification: UserGamification;
  classroomId: string | null;
}

export function DashboardHeader({
  greeting,
  profile,
  mascotMood,
  reviewDueCount,
  newCount,
  todayNewWords,
  dailyWordGoal,
  countsReady,
  totalWords,
  masteredCount,
  studyStreak,
  gamification,
  classroomId,
}: DashboardHeaderProps) {
  const firstName = profile?.full_name?.split(' ')[0] || 'bạn';

  return (
    <div className="flex items-center justify-between gap-2 pt-0.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Mascot mood={mascotMood} size="sm" />
        <div className="flex min-w-0 flex-col md:flex-row md:items-baseline md:gap-2">
          <h2 className="truncate text-base font-black leading-tight text-foreground sm:text-[17px]">
            {greeting}, {firstName}! 👋
          </h2>
          <span className="hidden truncate text-[11.5px] font-semibold text-muted-foreground md:inline">
            {reviewDueCount > 0
              ? `· ${reviewDueCount} từ cần ôn tập FSRS`
              : newCount > 0
                ? `· ${newCount} từ mới sẵn sàng hôm nay`
                : '· Hoàn thành mục tiêu hôm nay 🎉'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-indigo-700">
            🎯 {todayNewWords}/{dailyWordGoal} từ/ngày
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-slate-600">
            {countsReady ? totalWords : '…'} từ tích lũy
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-emerald-700">
            {masteredCount} master
          </span>
        </div>

        {/* Mobile quick controls (StudentShell sets hideMobileHeader on /student) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <Link
            href="/dictionary"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-indigo-600 active:scale-95"
            title="Tra từ điển nhanh"
            aria-label="Tra từ điển nhanh"
          >
            <Search className="h-4 w-4 shrink-0" />
          </Link>
          <NotificationBell
            dueCount={reviewDueCount}
            grammarDueCount={0}
            streak={studyStreak}
            dailyGoalXp={gamification.today_xp}
            dailyGoal={gamification.daily_goal}
            classroomId={classroomId}
          />
        </div>
      </div>
    </div>
  );
}
