import dynamic from '@/shared/ui/dynamic';
import Link from '@/shared/router/navigation';
import { Code2, FileText, Headphones, Mic, PenTool } from 'lucide-react';
import type { Word } from '@/lib/supabase';
import type { EarnedBadge } from '@/lib/gamification';
import { ProTrialMilestoneCard } from '@/components/gamification/ProTrialMilestoneCard';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type { ActiveVocabPack, WeakWordSummary } from './useStudentDashboard';

const BadgeGrid = dynamic(
  () => import('@/components/gamification/BadgeGrid').then((m) => m.BadgeGrid),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> },
);

export interface StudentSkillsAndProgressSectionProps {
  onSelectActionModal: (type: ActionSelectionType) => void;
  activePack: ActiveVocabPack | null;
  activePackPct: number;
  activePackHref: string;
  priorityWords: Word[];
  serverWeakWords: WeakWordSummary[];
  reviewHref: string;
  onSelectWordId: (wordId: string) => void;
  profileId?: string;
  studyStreak: number;
  countsReady: boolean;
  totalWords: number;
  onProTrialClaimed: () => void;
  badges: EarnedBadge[];
}

export function StudentSkillsAndProgressSection({
  onSelectActionModal,
  activePack,
  activePackPct,
  activePackHref,
  priorityWords,
  serverWeakWords,
  reviewHref,
  onSelectWordId,
  profileId,
  studyStreak,
  countsReady,
  totalWords,
  onProTrialClaimed,
  badges,
}: StudentSkillsAndProgressSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Card: Luyện 5 kỹ năng */}
      <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
            Luyện 5 kỹ năng
          </h2>
          <Link
            href="/practice"
            className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
          >
            Tất cả
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Grammar (Sky) */}
          <Link
            href="/grammar"
            className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-slate-900 transition hover:border-sky-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-sky-400"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
              <Code2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <b className="text-[15px] font-bold">Grammar</b>
            <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              Ngữ pháp ứng dụng
            </span>
          </Link>

          {/* 2. Reading (Amber) */}
          <button
            type="button"
            onClick={() => onSelectActionModal('reading')}
            className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-left text-slate-900 transition hover:border-amber-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-amber-400 cursor-pointer"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </div>
            <b className="text-[15px] font-bold">Reading</b>
            <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              Đọc hiểu đa tầng
            </span>
          </button>

          {/* 3. Listening (Emerald) */}
          <button
            type="button"
            onClick={() => onSelectActionModal('listening')}
            className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-left text-slate-900 transition hover:border-emerald-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-emerald-400 cursor-pointer"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Headphones className="h-5 w-5" strokeWidth={2} />
            </div>
            <b className="text-[15px] font-bold">Listening</b>
            <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              Nghe video &amp; ETS
            </span>
          </button>

          {/* 4. Speaking (Rose) */}
          <Link
            href="/student/speaking/foundation"
            aria-label="Luyện nói phản xạ Speaking"
            className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-slate-900 transition hover:border-rose-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-rose-400"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
              <Mic className="h-5 w-5" strokeWidth={2} />
            </div>
            <b className="text-[15px] font-bold">Speaking</b>
            <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              Phản xạ, phát âm AI
            </span>
          </Link>

          {/* 5. Writing (Violet) */}
          <Link
            href="/writing"
            className="group flex min-h-[112px] flex-col gap-2.5 rounded-[14px] border border-slate-200/90 bg-white p-4 text-slate-900 transition hover:border-violet-500 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-violet-400"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <PenTool className="h-5 w-5" strokeWidth={2} />
            </div>
            <b className="text-[15px] font-bold">Writing</b>
            <span className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              Luyện viết AI
            </span>
          </Link>
        </div>
      </section>

      {/* 2-Column Sub-grid (.two): Học tiếp + Từ cần ưu tiên */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Học tiếp */}
        <section className="flex flex-col rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
              Học tiếp
            </h2>
            <Link
              href="/journey"
              className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
            >
              Mở lộ trình
            </Link>
          </div>

          <div className="text-[15px] font-bold text-slate-900 dark:text-[#F2F3FB]">
            {activePack
              ? `${activePack.topic_title} · Chặng ${activePack.pack_index + 1}`
              : 'Lộ trình học · bài hiện tại'}
          </div>
          <div className="mt-0.5 text-[13.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
            {activePack
              ? `Đã học ${activePack.reviewed_count}/${activePack.word_count} từ trong chặng`
              : 'Tiếp tục đúng chỗ bạn đã dừng'}
          </div>

          <div className="my-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#20253F]">
            <i
              className="block h-full rounded-full bg-[#7B67FF] transition-all duration-500"
              style={{ width: `${activePackPct}%` }}
            />
          </div>

          <div className="text-[12.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
            {activePack
              ? activePack.status === 'completed'
                ? 'Đã hoàn thành'
                : activePack.status === 'in_progress'
                  ? `Đang học (${activePackPct}%)`
                  : 'Chưa bắt đầu'
              : 'Chưa bắt đầu'}
          </div>

          <Link
            href={activePackHref}
            className="mt-3 flex h-11 items-center justify-center rounded-xl border-[1.5px] border-[#7B67FF] text-[14px] font-bold text-indigo-600 transition hover:bg-indigo-50/50 dark:text-[#B3A8FF] dark:hover:bg-[#20253F]"
          >
            Tiếp tục
          </Link>
        </section>

        {/* Từ cần ưu tiên */}
        <section className="flex flex-col rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
              Từ cần ưu tiên
            </h2>
            <Link
              href={reviewHref}
              className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
            >
              {priorityWords.length > 0 ? `${priorityWords.length} từ` : 'Ôn tập'}
            </Link>
          </div>

          {priorityWords.length > 0 ? (
            <div className="space-y-2">
              {priorityWords.slice(0, 3).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWordId(w.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] bg-slate-100/80 px-3 py-2.5 text-left transition hover:bg-indigo-50/70 dark:bg-[#20253F] dark:hover:bg-[#272C47] cursor-pointer"
                >
                  <b className="truncate text-[15px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    {w.word}
                  </b>
                  <span className="truncate text-[13px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                    {w.translation}
                  </span>
                </button>
              ))}
            </div>
          ) : serverWeakWords.length > 0 ? (
            <div className="space-y-2">
              {serverWeakWords.slice(0, 3).map((w) => (
                <div
                  key={w.word}
                  className="flex items-center justify-between gap-3 rounded-[10px] bg-slate-100/80 px-3 py-2.5 dark:bg-[#20253F]"
                >
                  <b className="truncate text-[15px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                    {w.word}
                  </b>
                  <span className="truncate text-[13px] font-medium text-slate-500 dark:text-[#A5AAC6]">
                    {w.meaning}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-4 text-center text-[13px] font-medium text-slate-500 dark:border-[#272C47] dark:bg-[#20253F]/50 dark:text-[#A5AAC6]">
              Chưa có từ vựng nào đến hạn hoặc cần ưu tiên ôn tập.
            </div>
          )}
        </section>
      </div>

      {/* Nhiệm vụ nhận quà Pro */}
      {profileId && (
        <ProTrialMilestoneCard
          enabled
          hintStreak={studyStreak}
          hintWords={countsReady ? totalWords : undefined}
          onClaimed={onProTrialClaimed}
        />
      )}

      {/* Thành tích & Huy hiệu */}
      <div className="opacity-95">
        <BadgeGrid badges={badges} />
      </div>
    </div>
  );
}
