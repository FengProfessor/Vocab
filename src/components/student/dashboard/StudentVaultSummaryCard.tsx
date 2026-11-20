'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { SRS_LEVEL_LABELS, SRS_LEVEL_STABILITY_HINT } from '@/lib/srs';
import type { EnrolledClassroom } from './types';

const LEVEL_COLORS = [
  'bg-rose-400',
  'bg-amber-400',
  'bg-sky-400',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-purple-500',
] as const;

interface StudentVaultSummaryCardProps {
  currentClassScope: string;
  enrolledClassrooms: EnrolledClassroom[];
  activeClassroom: EnrolledClassroom | null;
  countsReady: boolean;
  totalWords: number;
  newCount: number;
  reviewDueCount: number;
  levelCounts: number[];
  onSwitchScope: (scope: string) => void;
}

export function StudentVaultSummaryCard({
  currentClassScope,
  enrolledClassrooms,
  activeClassroom,
  countsReady,
  totalWords,
  newCount,
  reviewDueCount,
  levelCounts,
  onSwitchScope,
}: StudentVaultSummaryCardProps) {
  const isScoped = currentClassScope && currentClassScope !== '__personal__';
  const vaultHref = isScoped
    ? `/student/vault?class=${encodeURIComponent(currentClassScope)}`
    : '/student/vault';
  const hasClassrooms = enrolledClassrooms.length > 0;
  const maxCount = Math.max(1, ...levelCounts);

  return (
    <section
      className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:space-y-3 sm:p-4"
      id="kho-tu-vung"
      data-onboarding="vault"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-black text-slate-800 sm:gap-2 sm:text-base">
            <span className="shrink-0 text-base leading-none sm:text-lg">📦</span>
            <span className="truncate">
              {activeClassroom ? `Từ vựng · ${activeClassroom.name}` : 'Kho từ vựng'}
            </span>
          </h3>

          {(hasClassrooms || isScoped) && (
            <div className="flex shrink-0 items-center gap-1.5">
              {hasClassrooms && isScoped && (
                <button
                  type="button"
                  onClick={() => onSwitchScope('__personal__')}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-extrabold text-slate-600 transition hover:bg-slate-50 active:scale-95 sm:h-8 sm:px-3 sm:text-xs"
                >
                  Về kho cá nhân
                </button>
              )}

              {hasClassrooms && (
                <div className="relative">
                  <select
                    aria-label="Phạm vi kho từ"
                    value={currentClassScope}
                    onChange={(e) => onSwitchScope(e.target.value)}
                    className="h-7 cursor-pointer appearance-none rounded-full border border-slate-200 bg-slate-50 pl-2.5 pr-6 text-[11px] font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:h-8 sm:pl-3 sm:pr-7 sm:text-xs"
                  >
                    <option value="__personal__">Tất cả kho</option>
                    {enrolledClassrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
          <Link
            href={vaultHref}
            className="inline-flex h-7.5 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 text-[11px] font-extrabold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 sm:h-8 sm:px-3 sm:text-xs"
          >
            Mở kho từ →
          </Link>

          <Link
            href="/import"
            className="inline-flex h-7.5 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-2 text-[11px] font-extrabold text-indigo-700 transition hover:bg-indigo-100 active:brightness-110 sm:h-8 sm:px-3 sm:text-xs"
            title="Dán list / file / quét ảnh của bạn"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>
              Nạp từ<span className="hidden sm:inline"> mới</span>
            </span>
          </Link>

          <Link
            href="/library"
            className="inline-flex h-7.5 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-emerald-600 px-2 text-[11px] font-extrabold text-white transition hover:bg-emerald-700 active:brightness-110 sm:h-8 sm:px-3 sm:text-xs"
            title="Chọn gói từ sẵn theo chủ đề"
          >
            Thư viện
          </Link>
        </div>
      </div>

      {/* 3 Summary Counts */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 text-center sm:py-2">
          <div
            className={`text-sm font-black tabular-nums text-slate-800 sm:text-base ${!countsReady ? 'animate-pulse text-slate-400' : ''}`}
          >
            {countsReady ? totalWords : '…'}
          </div>
          <div className="text-[11px] font-bold text-slate-400">Tích lũy</div>
        </div>
        <div className="rounded-xl bg-indigo-50/80 px-2.5 py-1.5 text-center sm:py-2">
          <div
            className={`text-sm font-black tabular-nums text-indigo-700 sm:text-base ${!countsReady ? 'animate-pulse' : ''}`}
          >
            {countsReady ? Math.max(0, totalWords - newCount) : '…'}
          </div>
          <div className="text-[11px] font-bold text-indigo-400">Đã học</div>
        </div>
        <div className="rounded-xl bg-amber-50/80 px-2.5 py-1.5 text-center sm:py-2">
          <div
            className={`text-sm font-black tabular-nums text-amber-700 sm:text-base ${!countsReady ? 'animate-pulse' : ''}`}
          >
            {countsReady ? reviewDueCount : '…'}
          </div>
          <div className="text-[11px] font-bold text-amber-500">Cần ôn</div>
        </div>
      </div>

      {/* L1–L6 SRS Mastery Bars */}
      {countsReady && totalWords > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2 sm:px-3 sm:py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Mức độ nhớ · cả kho
            </span>
            <span className="text-[10px] font-bold tabular-nums text-slate-400">
              {levelCounts.reduce((a, b) => a + b, 0)}/{totalWords} từ
            </span>
          </div>
          <div className="flex items-end justify-between gap-1.5 sm:gap-2">
            {levelCounts.map((count, idx) => {
              const barH = Math.round(4 + (count / maxCount) * 42);
              return (
                <div
                  key={idx + 1}
                  className="flex min-w-0 flex-1 flex-col items-center"
                  title={`L${idx + 1}: ${SRS_LEVEL_STABILITY_HINT[idx]} · ~interval ${SRS_LEVEL_LABELS[idx]} · ${count} từ`}
                >
                  <span className="mb-0.5 text-[10px] font-black tabular-nums text-slate-600">
                    {count}
                  </span>
                  <div
                    className={`w-full max-w-[30px] rounded-t-md ${LEVEL_COLORS[idx]}`}
                    style={{ height: barH }}
                  />
                  <span className="mt-1 text-[9px] font-extrabold text-slate-500">
                    L{idx + 1}
                  </span>
                  <span className="text-[8px] font-bold uppercase text-slate-400">
                    {SRS_LEVEL_LABELS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 hidden text-[10px] font-semibold leading-snug text-slate-400 sm:block">
            Nhãn ≈ khoảng ôn lại FSRS (theo stability), không phải mốc cứng Anki.
          </p>
        </div>
      )}

      {countsReady && totalWords === 0 && (
        <Link
          href="/library"
          className="flex items-center gap-2.5 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3.5 py-3"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold text-emerald-800">Kho còn trống</div>
            <div className="text-[11px] font-semibold text-emerald-600/80">
              Chọn gói từ thư viện để bắt đầu
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-600" />
        </Link>
      )}
    </section>
  );
}
