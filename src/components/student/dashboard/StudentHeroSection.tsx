'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, SlidersHorizontal } from 'lucide-react';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type { ActiveVocabPack } from './types';

interface StudentHeroSectionProps {
  learnHref: string;
  reviewHref: string;
  freeFlashcardHref: string;
  reviewSessionHref: (mode: string) => string;
  learnHeaderLink: ReactNode;
  reviewHeaderLink: ReactNode;
  inProgressPacks: ActiveVocabPack[];
  onOpenActionModal: (type: ActionSelectionType) => void;
}

export function StudentHeroSection({
  learnHref,
  reviewHref,
  freeFlashcardHref,
  reviewSessionHref,
  learnHeaderLink,
  reviewHeaderLink,
  inProgressPacks,
  onOpenActionModal,
}: StudentHeroSectionProps) {
  return (
    <section className="space-y-2 md:space-y-2.5">
      {/* 2 Primary Action Cards: Học Từ Mới & Ôn Tập FSRS */}
      <div className="grid grid-cols-2 items-stretch gap-2 md:gap-2.5">
        {/* Card 1: Học Từ Mới */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-indigo-300/70 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-2 px-2.5 text-white shadow-sm shadow-indigo-500/10 transition-all hover:shadow-md hover:shadow-indigo-500/20 md:p-2.5 md:px-3">
          <div className="flex items-center justify-between gap-2.5">
            {learnHeaderLink}
            <Link
              href={learnHref}
              aria-label="Bắt đầu học từ mới"
              className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-bold text-indigo-700 shadow-xs transition-transform group-hover:translate-x-0.5 md:flex"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-1.5 flex items-center justify-end border-t border-white/15 pt-1 md:mt-2 md:flex-wrap md:justify-start md:gap-1 md:pt-1.5">
            <Link
              href={learnHref}
              className="hidden h-6 items-center gap-1 rounded bg-white/20 px-2 text-[10.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30 md:inline-flex"
            >
              <span>🃏</span>
              <span>Flashcard</span>
            </Link>
            <Link
              href="/import"
              className="hidden h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-indigo-50 backdrop-blur-sm transition hover:bg-white/25 md:inline-flex"
            >
              <span>📥</span>
              <span>Tự nạp</span>
            </Link>
            <Link
              href="/library"
              className="hidden h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-indigo-50 backdrop-blur-sm transition hover:bg-white/25 md:inline-flex"
            >
              <span>📚</span>
              <span>Thư viện</span>
            </Link>
            <button
              type="button"
              onClick={() => onOpenActionModal('learn')}
              className="inline-flex h-5.5 w-full cursor-pointer items-center justify-center gap-1 rounded bg-white/15 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25 md:ml-auto md:h-6 md:w-auto"
              title="Mở bảng chọn phương thức nạp từ"
            >
              <SlidersHorizontal className="h-2.5 w-2.5" />
              <span>Chế độ</span>
            </button>
          </div>
        </div>

        {/* Card 2: Ôn Tập FSRS */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-emerald-300/70 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2 px-2.5 text-white shadow-sm shadow-emerald-500/10 transition-all hover:shadow-md hover:shadow-emerald-500/20 md:p-2.5 md:px-3">
          <div className="flex items-center justify-between gap-2.5">
            {reviewHeaderLink}
            <Link
              href={reviewHref}
              aria-label="Bắt đầu ôn tập FSRS"
              className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-bold text-emerald-700 shadow-xs transition-transform group-hover:translate-x-0.5 md:flex"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-1.5 flex items-center justify-end border-t border-white/15 pt-1 md:mt-2 md:flex-wrap md:justify-start md:gap-1 md:pt-1.5">
            <Link
              href={reviewSessionHref('mixed')}
              className="hidden h-6 items-center gap-1 rounded bg-white/20 px-2 text-[10.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30 md:inline-flex"
            >
              <span>⚡</span>
              <span>Hỗn hợp</span>
            </Link>
            <Link
              href={reviewSessionHref('type')}
              className="hidden h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25 md:inline-flex"
            >
              <span>⌨️</span>
              <span>Gõ</span>
            </Link>
            <Link
              href={reviewSessionHref('cloze')}
              className="hidden h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25 md:inline-flex"
            >
              <span>🧩</span>
              <span>Điền</span>
            </Link>
            <Link
              href={reviewSessionHref('mcq')}
              className="hidden h-6 items-center gap-1 rounded bg-white/15 px-2 text-[10.5px] font-medium text-emerald-50 backdrop-blur-sm transition hover:bg-white/25 md:inline-flex"
            >
              <span>🎯</span>
              <span>Trắc nghiệm</span>
            </Link>
            <button
              type="button"
              onClick={() => onOpenActionModal('review')}
              className="inline-flex h-5.5 w-full cursor-pointer items-center justify-center gap-1 rounded bg-white/15 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25 md:ml-auto md:h-6 md:w-auto"
              title="Xem tất cả 5 chế độ ôn tập FSRS"
            >
              <SlidersHorizontal className="h-2.5 w-2.5" />
              <span>Tất cả</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lối tắt Luyện tập Flashcard tự do (đặt ngay màn hình chính mobile, tách khỏi Ôn tập FSRS) */}
      <Link
        href={freeFlashcardHref}
        className="flex items-center justify-between gap-2.5 rounded-xl border border-violet-200/90 bg-gradient-to-r from-violet-50 via-fuchsia-50/50 to-indigo-50 px-3 py-2 shadow-2xs transition-all hover:border-violet-300 hover:shadow-xs active:scale-[0.99]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-base text-white shadow-xs">
            🃏
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-black text-violet-950">
                Luyện tập Flashcard
              </span>
              <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9.5px] font-extrabold text-violet-700">
                Không chờ hạn
              </span>
            </div>
            <p className="truncate text-[10.5px] font-medium text-violet-700/80">
              Test &amp; lật thẻ tự do tất cả từ đang có ngay lập tức
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-2xs">
          <span>Luyện ngay</span>
          <ArrowRight className="h-3 w-3" />
        </span>
      </Link>

      {/* Strip "Tiếp tục học" (1–3 in_progress packs for BOTH Mobile & Desktop) */}
      {inProgressPacks.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-2 md:p-2.5">
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
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
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
                  className="flex min-w-[205px] flex-1 shrink-0 flex-col justify-between rounded-xl border border-indigo-200/80 bg-white px-2.5 py-1.5 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-xs active:scale-[0.99] sm:min-w-0 sm:px-3 sm:py-2"
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
