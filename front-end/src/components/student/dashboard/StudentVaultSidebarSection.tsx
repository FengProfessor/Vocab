import Link from '@/shared/router/navigation';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Word } from '@/lib/supabase';
import { WordCardSkeleton } from '@/components/ui/WordCardSkeleton';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type { EnrolledClassroom, WordStatusFilter } from './useStudentDashboard';

export interface StudentVaultSidebarSectionProps {
  weekDaysStrip: Array<{ key: string; label: string; done: boolean; isToday: boolean }>;
  activeClassroom: EnrolledClassroom | null;
  countsReady: boolean;
  totalWords: number;
  showVaultWords: boolean;
  onToggleVaultWords: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  statusFilter: WordStatusFilter;
  onStatusFilterChange: (f: WordStatusFilter) => void;
  wordsLoading: boolean;
  filteredWords: Word[];
  wordsCount: number;
  debouncedQuery: string;
  isLoadingMore: boolean;
  onLoadMoreWords: () => void;
  onSelectWordId: (wordId: string) => void;
  onSelectActionModal: (type: ActionSelectionType) => void;
}

const FILTER_LABELS: Record<WordStatusFilter, string> = {
  all: 'Tất cả',
  new: 'Mới',
  due: 'Đến hạn',
  learned: 'Đã học',
  mastered: 'Master',
};

export function StudentVaultSidebarSection({
  weekDaysStrip,
  activeClassroom,
  countsReady,
  totalWords,
  showVaultWords,
  onToggleVaultWords,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  wordsLoading,
  filteredWords,
  wordsCount,
  debouncedQuery,
  isLoadingMore,
  onLoadMoreWords,
  onSelectWordId,
  onSelectActionModal,
}: StudentVaultSidebarSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Card: Tuần này */}
      <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
            Tuần này
          </h2>
          <Link
            href="/student/profile"
            className="text-[13px] font-bold text-indigo-600 hover:underline dark:text-[#B3A8FF]"
          >
            Lịch sử
          </Link>
        </div>

        <div className="mt-1.5 flex justify-between">
          {weekDaysStrip.map((day) => (
            <div
              key={day.key}
              className="flex flex-col items-center gap-1.5 text-[12px] font-semibold text-slate-500 dark:text-[#A5AAC6]"
            >
              <i
                className={`block h-[30px] w-[30px] rounded-full transition-colors ${
                  day.done
                    ? 'bg-emerald-500 dark:bg-[#3DD6A0]'
                    : 'bg-slate-100 dark:bg-[#20253F]'
                } ${
                  day.isToday
                    ? 'outline-2 outline-offset-2 outline-[#7B67FF]'
                    : ''
                }`}
              />
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Card: Kho từ vựng (#kho-tu-vung) */}
      <section
        id="kho-tu-vung"
        data-onboarding="vault"
        className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]"
      >
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
            {activeClassroom ? `Kho từ · ${activeClassroom.name}` : 'Kho từ vựng'}
          </h2>
          <span className="text-[12.5px] font-bold text-indigo-600 dark:text-[#B3A8FF] tabular-nums">
            {countsReady ? `${totalWords} từ` : '…'}
          </span>
        </div>
        <div className="text-[13.5px] font-medium text-slate-500 dark:text-[#A5AAC6]">
          Thêm từ từ thư viện gói hoặc tự nạp.
        </div>

        <Link
          href="/library"
          className="mt-3 flex h-11 items-center justify-center rounded-xl border-[1.5px] border-[#7B67FF] text-[14px] font-bold text-indigo-600 transition hover:bg-indigo-50/50 dark:text-[#B3A8FF] dark:hover:bg-[#20253F]"
        >
          Mở kho từ
        </Link>

        <div className="mt-2.5 flex items-center justify-between text-xs font-bold">
          <Link
            href="/import"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-[#A5AAC6] dark:hover:text-[#B3A8FF]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tự nạp từ</span>
          </Link>
          <button
            type="button"
            onClick={onToggleVaultWords}
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-[#B3A8FF] cursor-pointer"
          >
            <span>{showVaultWords ? 'Thu gọn danh sách' : 'Tra từ đã lưu'}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showVaultWords ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showVaultWords && (
          <div className="mt-3 space-y-2.5 border-t border-slate-200/80 pt-3 dark:border-[#272C47]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm từ trong kho..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B67FF]/40 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {(['all', 'new', 'due', 'learned', 'mastered'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onStatusFilterChange(f)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === f
                      ? 'bg-[#7B67FF] text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-[#20253F] dark:text-[#A5AAC6]'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>

            {wordsLoading ? (
              <WordCardSkeleton count={3} />
            ) : filteredWords.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400 dark:text-[#A5AAC6]">
                Không tìm thấy từ phù hợp
              </p>
            ) : (
              <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                {filteredWords.map((word) => (
                  <button
                    key={word.id}
                    type="button"
                    onClick={() => onSelectWordId(word.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-indigo-50/60 dark:bg-[#20253F] dark:hover:bg-[#272C47] cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-extrabold text-slate-900 dark:text-[#F2F3FB]">
                        {word.word}
                      </div>
                      <div className="truncate text-[11px] text-slate-500 dark:text-[#A5AAC6]">
                        {word.translation}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-[#B3A8FF]">
                      L{word.srsLevel || 1}
                    </span>
                  </button>
                ))}

                {wordsCount < totalWords && !debouncedQuery && statusFilter === 'all' && (
                  <button
                    type="button"
                    onClick={onLoadMoreWords}
                    disabled={isLoadingMore}
                    className="mt-1 w-full rounded-xl border border-slate-200 py-1.5 text-center text-xs font-bold text-indigo-600 hover:bg-slate-50 dark:border-[#272C47] dark:text-[#B3A8FF] dark:hover:bg-[#20253F] cursor-pointer"
                  >
                    {isLoadingMore ? 'Đang tải...' : `Tải thêm (${totalWords - wordsCount})`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Card: Luyện thi (.ex) */}
      <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
            Luyện thi
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectActionModal('toeic')}
            className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF] cursor-pointer"
          >
            TOEIC
          </button>
          <Link
            href="/vstep"
            className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF]"
          >
            VSTEP
          </Link>
          <Link
            href="/vnu-bac-3"
            className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF]"
          >
            VNU Test
          </Link>
          <button
            type="button"
            onClick={() => toast.info('Chương trình Luyện thi IELTS đang được cập nhật')}
            className="rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-800 transition hover:border-[#7B67FF] hover:text-indigo-600 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#F2F3FB] dark:hover:border-[#7B67FF] dark:hover:text-[#B3A8FF] cursor-pointer"
          >
            IELTS
          </button>
        </div>
      </section>
    </div>
  );
}
