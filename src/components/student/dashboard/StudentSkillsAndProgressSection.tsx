'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Code2, FileText, Headphones, Mic } from 'lucide-react';
import type { Profile, UserGamification } from '@/lib/supabase';
import { lastActiveFromActivity } from '@/lib/gamification';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { ProTrialMilestoneCard } from '@/components/gamification/ProTrialMilestoneCard';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type { ListeningStats, ReadingProgress } from './types';

interface StudentSkillsAndProgressSectionProps {
  profile: Profile | null;
  isFreePlan: boolean;
  gamification: UserGamification;
  studyStreak: number;
  dailyActivity: Array<{ date: string; count: number }>;
  todayWords: number;
  todayNewWords: number;
  todayReviewWords: number;
  dailyWordGoal: number;
  reviewDueCount: number;
  countsReady: boolean;
  totalWords: number;
  readingProgress: ReadingProgress;
  listeningStats: ListeningStats;
  onOpenActionModal: (type: ActionSelectionType) => void;
  onMilestoneClaimed: () => void;
}

export function StudentSkillsAndProgressSection({
  profile,
  isFreePlan,
  gamification,
  studyStreak,
  dailyActivity,
  todayWords,
  todayNewWords,
  todayReviewWords,
  dailyWordGoal,
  reviewDueCount,
  countsReady,
  totalWords,
  readingProgress,
  listeningStats,
  onOpenActionModal,
  onMilestoneClaimed,
}: StudentSkillsAndProgressSectionProps) {
  const todayReviewsComputed = todayReviewWords || Math.max(0, todayWords - todayNewWords);
  const reviewProgressPct = Math.min(
    100,
    Math.round(
      (todayReviewsComputed / Math.max(todayReviewsComputed + reviewDueCount, 20, 1)) * 100,
    ),
  );
  const newWordsProgressPct = Math.min(
    100,
    Math.round((todayNewWords / Math.max(dailyWordGoal, 1)) * 100),
  );
  const listeningProgressPct = Math.max(
    0,
    Math.min(
      100,
      listeningStats.completedCount > 0
        ? listeningStats.completedCount * 34
        : listeningStats.inProgressPercent,
    ),
  );
  const rawReadingPct =
    readingProgress.totalArticles > 0
      ? Math.round((readingProgress.completedCount / readingProgress.totalArticles) * 100)
      : 0;
  const readingProgressPct =
    readingProgress.completedCount > 0 || readingProgress.inProgressCount > 0
      ? Math.max(2, Math.min(100, rawReadingPct))
      : 0;

  return (
    <div className="space-y-3">
      {/* ── BLOCK 3: NHỊP HỌC & TIẾN ĐỘ NGÀY ── */}
      <div
        className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-12"
        data-onboarding="progress"
      >
        <div className="min-w-0 lg:col-span-5">
          <StreakCounter
            streak={studyStreak}
            lastActiveDate={
              lastActiveFromActivity(dailyActivity) ?? gamification.last_active_date
            }
            variant="calendar"
            dailyCounts={dailyActivity}
            className="h-full min-w-0"
          />
        </div>

        <div className="flex h-full min-w-0 flex-col justify-between gap-2 rounded-xl border border-[#e9e9f0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,.04)] lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              🎯 <span>Tiến độ ngày hôm nay</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums text-indigo-700">
                {todayNewWords} / {dailyWordGoal} từ
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums text-amber-700">
                ⭐ {gamification.today_xp} XP
              </span>
            </div>
          </div>

          {/* 1. Ôn tập */}
          <button
            type="button"
            onClick={() => onOpenActionModal('review')}
            className="group -mx-1 block w-full cursor-pointer space-y-1 rounded-lg p-1 text-left transition-all hover:bg-emerald-50/60 active:scale-[0.99]"
            title="Bấm để chọn chế độ ôn tập"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-700 transition-colors group-hover:text-emerald-700">
                <span className="inline-block font-black leading-none text-emerald-500 animate-arrow-nudge">
                  →
                </span>
                <span>Ôn tập từ vựng</span>
              </span>
              <span className="font-black tabular-nums text-emerald-700">
                {countsReady ? `${todayReviewsComputed} lượt` : '…'}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${reviewProgressPct}%` }}
              />
            </div>
          </button>

          {/* 2. Nạp từ mới */}
          <button
            type="button"
            onClick={() => onOpenActionModal('learn')}
            className="group -mx-1 block w-full cursor-pointer space-y-1 rounded-lg p-1 text-left transition-all hover:bg-indigo-50/60 active:scale-[0.99]"
            title="Bấm để chọn phương thức nạp từ"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-700 transition-colors group-hover:text-indigo-700">
                <span className="inline-block font-black leading-none text-indigo-500 animate-arrow-nudge">
                  →
                </span>
                <span>Nạp từ mới</span>
              </span>
              <span className="font-black tabular-nums text-indigo-700">
                {todayNewWords} / {dailyWordGoal} từ
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${newWordsProgressPct}%` }}
              />
            </div>
          </button>

          {/* 3. Listening */}
          <button
            type="button"
            onClick={() => onOpenActionModal('listening')}
            className="group -mx-1 block w-full cursor-pointer space-y-1 rounded-lg p-1 text-left transition-all hover:bg-purple-50/60 active:scale-[0.99]"
            title="Bấm để chọn chế độ luyện nghe"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-700 transition-colors group-hover:text-purple-700">
                <span className="inline-block font-black leading-none text-purple-500 animate-arrow-nudge">
                  →
                </span>
                <span>Luyện nghe (Listening)</span>
              </span>
              <span className="font-black tabular-nums text-purple-700">
                {listeningStats.completedCount > 0
                  ? `${listeningStats.completedCount} bài đã nghe`
                  : listeningStats.inProgressPercent > 0
                    ? `${listeningStats.inProgressPercent}% đang nghe`
                    : 'Chưa nghe'}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${listeningProgressPct}%` }}
              />
            </div>
          </button>

          {/* 4. Reading */}
          <button
            type="button"
            onClick={() => onOpenActionModal('reading')}
            className="group -mx-1 block w-full cursor-pointer space-y-1 rounded-lg p-1 text-left transition-all hover:bg-amber-50/60 active:scale-[0.99]"
            title="Bấm để chọn chế độ luyện đọc"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-700 transition-colors group-hover:text-amber-700">
                <span className="inline-block font-black leading-none text-amber-500 animate-arrow-nudge">
                  →
                </span>
                <span>Luyện đọc (Reading)</span>
              </span>
              <span className="font-black tabular-nums text-amber-700">
                {readingProgress.completedCount > 0
                  ? `${readingProgress.completedCount}/${readingProgress.totalArticles} bài đọc`
                  : readingProgress.inProgressCount > 0
                    ? `${readingProgress.inProgressCount} đang đọc`
                    : `0/${readingProgress.totalArticles} · Chưa đọc`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${readingProgressPct}%` }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Nhiệm vụ nhận quà Pro — chỉ kích hoạt khi profile đã resolve là Free */}
      {profile?.id && (
        <ProTrialMilestoneCard
          enabled={Boolean(profile) && isFreePlan}
          hintStreak={studyStreak}
          hintWords={countsReady ? totalWords : undefined}
          onClaimed={onMilestoneClaimed}
        />
      )}

      {/* ── BLOCK 4A: LỐI TẮT LUYỆN THI & KỸ NĂNG (Chỉ giữ tính năng thật) ── */}
      <div className="space-y-2.5">
        {/* 3 Kỳ thi chuẩn hóa */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1.5 text-[11.5px] font-black uppercase tracking-wider text-slate-800">
              <span>🎯</span>
              <span>Luyện thi chuẩn hóa</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9.5px] font-extrabold normal-case tracking-normal text-indigo-700">
                3 Kỳ thi
              </span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => onOpenActionModal('toeic')}
              className="group relative flex min-h-[58px] min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white p-2 text-left shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs active:scale-[0.98] sm:justify-start sm:px-3"
            >
              <span className="absolute -top-1.5 right-1.5 hidden whitespace-nowrap rounded-full bg-indigo-600 px-1.5 py-0.5 text-[8px] font-black text-white ring-1 ring-white shadow-2xs sm:inline">
                7 Parts
              </span>
              <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-1 sm:h-9 sm:w-11">
                <Image
                  src="/images/exams/toeic.png"
                  alt="TOEIC"
                  width={52}
                  height={26}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="text-xs font-black text-slate-800 transition-colors group-hover:text-indigo-600">
                  TOEIC
                </div>
                <div className="truncate text-[10px] font-medium text-slate-500">
                  Đề thi & Từ vựng
                </div>
              </div>
            </button>

            <Link
              href="/vstep"
              className="group relative flex min-h-[58px] min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs active:scale-[0.98] sm:justify-start sm:px-3"
            >
              <span className="absolute -top-1.5 right-1.5 hidden whitespace-nowrap rounded-full bg-blue-600 px-1.5 py-0.5 text-[8px] font-black text-white ring-1 ring-white shadow-2xs sm:inline">
                B1–B2–C1
              </span>
              <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-1 sm:h-9 sm:w-11">
                <Image
                  src="/images/exams/vstep.png"
                  alt="VSTEP"
                  width={52}
                  height={26}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="text-xs font-black text-slate-800 transition-colors group-hover:text-blue-600">
                  VSTEP
                </div>
                <div className="truncate text-[10px] font-medium text-slate-500">
                  Chuẩn Bộ GD&ĐT
                </div>
              </div>
            </Link>

            <Link
              href="/vnu-bac-3"
              aria-label="VNU Test Bậc 3"
              className="group relative flex min-h-[58px] min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-2xs transition-all hover:border-emerald-300 hover:shadow-xs active:scale-[0.98] sm:justify-start sm:px-3"
            >
              <span className="absolute -top-1.5 right-1.5 hidden whitespace-nowrap rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white ring-1 ring-white shadow-2xs sm:inline">
                Bậc 3 / B1
              </span>
              <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-1 sm:h-9 sm:w-11">
                <Image
                  src="/images/exams/vnu-test.png"
                  alt="VNU Test"
                  width={52}
                  height={26}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="text-xs font-black text-slate-800 transition-colors group-hover:text-emerald-600">
                  VNU Test
                </div>
                <div className="truncate text-[10px] font-medium text-slate-500">
                  Năng lực Ngoại ngữ
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 4 Kỹ năng thực hành + Link Trung tâm Luyện tập */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <span className="flex items-center gap-1.5 text-[11.5px] font-black uppercase tracking-wider text-slate-800">
              <span>⚡</span>
              <span>Kỹ năng thực hành</span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9.5px] font-extrabold normal-case tracking-normal text-sky-700">
                4 Kỹ năng
              </span>
            </span>
            <Link
              href="/practice"
              className="shrink-0 text-[11px] font-extrabold text-indigo-600 hover:underline"
            >
              Trung tâm Luyện tập →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            <Link
              href="/grammar"
              className="group relative flex min-h-[58px] min-w-0 items-center gap-2 rounded-xl border border-sky-200/80 bg-sky-50/70 p-2 px-2.5 text-sky-700 shadow-2xs transition-all hover:border-sky-300 hover:bg-sky-50 hover:shadow-xs active:scale-[0.98]"
            >
              <span className="absolute -top-1.5 right-1.5 rounded-full bg-sky-600 px-1.5 py-0.5 text-[8px] font-black leading-tight text-white ring-1 ring-white shadow-2xs">
                A1–C1
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 shadow-2xs">
                <Code2 className="h-3.5 w-3.5" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-sky-900">Grammar</div>
                <div className="truncate text-[10px] font-semibold text-sky-700/80">
                  Ngữ pháp ứng dụng
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => onOpenActionModal('reading')}
              className="group relative flex min-h-[58px] min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2 px-2.5 text-left text-amber-700 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-xs active:scale-[0.98]"
            >
              <span className="absolute -top-1.5 right-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-black leading-tight tabular-nums text-white ring-1 ring-white shadow-2xs">
                {readingProgress.completedCount > 0
                  ? `${readingProgress.completedCount}/${readingProgress.totalArticles}`
                  : '2 Chế độ'}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-2xs">
                <FileText className="h-3.5 w-3.5" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-amber-900">Reading</div>
                <div className="truncate text-[10px] font-semibold text-amber-700/80">
                  Đọc hiểu đa tầng
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenActionModal('listening')}
              className="group relative flex min-h-[58px] min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/70 p-2 px-2.5 text-left text-purple-700 shadow-2xs transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-xs active:scale-[0.98]"
            >
              <span className="absolute -top-1.5 right-1.5 rounded-full bg-purple-600 px-1.5 py-0.5 text-[8px] font-black leading-tight tabular-nums text-white ring-1 ring-white shadow-2xs">
                {listeningStats.completedCount > 0
                  ? `${listeningStats.completedCount} bài`
                  : listeningStats.totalCompleted > 0
                    ? `${listeningStats.totalCompleted} bài`
                    : 'Video & ETS'}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 shadow-2xs">
                <Headphones className="h-3.5 w-3.5" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-purple-900">Listening</div>
                <div className="truncate text-[10px] font-semibold text-purple-700/80">
                  Luyện nghe thực tế
                </div>
              </div>
            </button>

            <Link
              href="/student/speaking/foundation"
              aria-label="Luyện nói phản xạ Speaking"
              className="group relative flex min-h-[58px] min-w-0 items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 p-2 px-2.5 text-rose-700 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:shadow-xs active:scale-[0.98]"
            >
              <span className="absolute -top-1.5 right-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-black leading-tight text-white ring-1 ring-white shadow-2xs">
                A0–C1
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-2xs">
                <Mic className="h-3.5 w-3.5" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-rose-900">Speaking</div>
                <div className="truncate text-[10px] font-semibold text-rose-700/80">
                  Phản xạ nói AI
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
