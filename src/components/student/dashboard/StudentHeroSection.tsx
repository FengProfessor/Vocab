'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, SlidersHorizontal } from 'lucide-react';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type { ActiveVocabPack } from './types';

interface StudentHeroSectionProps {
  learnHref: string;
  reviewHref: string;
  reviewSessionHref: (mode: string) => string;
  learnHeaderLink: ReactNode;
  reviewHeaderLink: ReactNode;
  inProgressPacks: ActiveVocabPack[];
  onOpenActionModal: (type: ActionSelectionType) => void;
}

export function StudentHeroSection({
  learnHref,
  reviewHref,
  reviewSessionHref,
  learnHeaderLink,
  reviewHeaderLink,
  inProgressPacks,
  onOpenActionModal,
}: StudentHeroSectionProps) {
  return (
    <section className="space-y-2.5">
      {/* 2 Primary Action Cards: Học Từ Mới & Ôn Tập FSRS */}
      <div className="grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2">
        {/* Card 1: Học Từ Mới */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-indigo-300/70 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-2.5 px-3 text-white shadow-sm shadow-indigo-500/10 transition-all hover:shadow-md hover:shadow-indigo-500/20">
          <div className="flex items-center justify-between gap-2.5">
            {learnHeaderLink}
            <Link
              href={learnHref}
              aria-label="Bắt đầu học từ mới"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-bold text-indigo-700 shadow-xs transition-transform group-hover:translate-x-0.5"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-white/15 pt-1.5">
            <Link
              href={learnHref}
              className="inline-flex h-6 items-center gap-1 rounded bg-white/20 px-2 text-[10.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <span>🃏</span>
              <span>Flashcard</span>
            </Link>
            <Link
              href="/import"
              className="inline-flex h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-indigo-50 backdrop-blur-sm transition hover:bg-white/25"
            >
              <span>📥</span>
              <span>Tự nạp</span>
            </Link>
            <Link
              href="/library"
              className="inline-flex h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-indigo-50 backdrop-blur-sm transition hover:bg-white/25"
            >
              <span>📚</span>
              <span>Thư viện</span>
            </Link>
            <button
              type="button"
              onClick={() => onOpenActionModal('learn')}
              className="ml-auto inline-flex h-6 cursor-pointer items-center gap-1 rounded bg-white/15 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25"
              title="Mở bảng chọn phương thức nạp từ"
            >
              <SlidersHorizontal className="h-2.5 w-2.5" />
              <span>Chế độ</span>
            </button>
          </div>
        </div>

        {/* Card 2: Ôn Tập FSRS */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-emerald-300/70 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2.5 px-3 text-white shadow-sm shadow-emerald-500/10 transition-all hover:shadow-md hover:shadow-emerald-500/20">
          <div className="flex items-center justify-between gap-2.5">
            {reviewHeaderLink}
            <Link
              href={reviewHref}
              aria-label="Bắt đầu ôn tập FSRS"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-bold text-emerald-700 shadow-xs transition-transform group-hover:translate-x-0.5"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-white/15 pt-1.5">
            <Link
              href={reviewSessionHref('mixed')}
              className="inline-flex h-6 items-center gap-1 rounded bg-white/20 px-2 text-[10.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <span>⚡</span>
              <span>Hỗn hợp</span>
            </Link>
            <Link
              href={reviewSessionHref('type')}
              className="inline-flex h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25"
            >
              <span>⌨️</span>
              <span>Gõ</span>
            </Link>
            <Link
              href={reviewSessionHref('cloze')}
              className="inline-flex h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25"
            >
              <span>🧩</span>
              <span>Điền</span>
            </Link>
            <Link
              href={reviewSessionHref('mcq')}
              className="inline-flex h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25"
            >
              <span>🎯</span>
              <span>Trắc nghiệm</span>
            </Link>
            <button
              type="button"
              onClick={() => onOpenActionModal('review')}
              className="ml-auto inline-flex h-6 cursor-pointer items-center gap-1 rounded bg-white/15 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25"
              title="Xem tất cả 5 chế độ ôn tập FSRS"
            >
              <SlidersHorizontal className="h-2.5 w-2.5" />
              <span>Tất cả</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strip "Tiếp tục học" (1–3 in_progress packs for BOTH Mobile & Desktop) */}
      {inProgressPacks.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-800">
              <Play className="h-3 w-3 fill-indigo-600 text-indigo-600" />
              <span>Tiếp tục học</span>
            </span>
            <Link
              href="/library"
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              Thư viện →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {inProgressPacks.slice(0, 3).map((pack) => {
              const pct =
                pack.word_count > 0
                  ? Math.round((pack.reviewed_count / pack.word_count) * 100)
                  : 0;
              const sortedIds = pack.words
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((w) => encodeURIComponent(w.word_id))
                .join(',');
              const href = `/flashcard?mode=learn&ids=${sortedIds}`;
              return (
                <Link
                  key={pack.pack_id}
                  href={href}
                  className="flex min-w-0 flex-col justify-between rounded-xl border border-indigo-200/80 bg-white px-3 py-2 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold text-slate-800">
                      {pack.topic_title}
                    </span>
                    <span className="shrink-0 text-[10px] font-black text-indigo-600">
                      Học tiếp →
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10.5px] font-bold text-slate-400">
                    <span>Chặng {pack.pack_index + 1} · đang học</span>
                    <span className="tabular-nums text-slate-600">
                      {pack.reviewed_count}/{pack.word_count}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
