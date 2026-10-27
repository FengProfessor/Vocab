import Link from '@/shared/router/navigation';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Library,
  Loader2,
  Package,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { parseIpa } from '@/lib/study';
import type { Word } from '@/lib/supabase';
import { WordCardSkeleton } from '@/components/ui/WordCardSkeleton';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type {
  ActiveVocabPack,
  EnrolledClassroom,
  WordSortOption,
  WordStatusFilter,
} from './useStudentDashboard';

const LEVEL_BAR_STYLES = [
  { bg: 'bg-rose-500', text: 'text-rose-700', hint: '< 2 ngày' },
  { bg: 'bg-amber-500', text: 'text-amber-700', hint: '2–5 ngày' },
  { bg: 'bg-yellow-500', text: 'text-yellow-700', hint: '5–10 ngày' },
  { bg: 'bg-lime-500', text: 'text-lime-700', hint: '10–30 ngày' },
  { bg: 'bg-emerald-500', text: 'text-emerald-700', hint: '1–3 tháng' },
  { bg: 'bg-teal-600', text: 'text-teal-700', hint: '> 3 tháng' },
];

const LEVEL_BADGE_CLASSES: Record<number, string> = {
  1: 'bg-rose-50 text-rose-700 border-rose-200',
  2: 'bg-amber-50 text-amber-700 border-amber-200',
  3: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  4: 'bg-lime-50 text-lime-700 border-lime-200',
  5: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  6: 'bg-teal-50 text-teal-700 border-teal-200',
};

const FILTER_LABELS: Record<WordStatusFilter, string> = {
  all: 'Tất cả',
  new: 'Mới',
  due: 'Đến hạn',
  learned: 'Đã học',
  mastered: 'Master',
};

export interface StudentVocabularyVaultSectionProps {
  words: Word[];
  filteredWords: Word[];
  vocabPacks: ActiveVocabPack[];
  totalWords: number;
  newCount: number;
  reviewDueCount: number;
  levelCounts: number[];
  wordsLoading: boolean;
  isLoadingMore: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  debouncedQuery: string;
  statusFilter: WordStatusFilter;
  setStatusFilter: (f: WordStatusFilter) => void;
  sortBy: WordSortOption;
  setSortBy: (s: WordSortOption) => void;
  loadMoreWords: () => void;
  onSelectWordId: (wordId: string) => void;
}

/**
 * Full Vocabulary Vault section (`#kho-tu-vung`) restored from the original student dashboard:
 * - 3 summary stat boxes (Tích lũy / Đã học / Gói)
 * - 6-level FSRS memory chart (L1..L6)
 * - Active & completed vocabulary packs (`Gói từ trong kho`)
 * - Personal word list (`Danh sách từ cá nhân`) with search, sort, status filter pills, and 2-column word cards
 */
export function StudentVocabularyVaultSection({
  words,
  filteredWords,
  vocabPacks,
  totalWords,
  newCount,
  reviewDueCount,
  levelCounts,
  wordsLoading,
  isLoadingMore,
  searchQuery,
  setSearchQuery,
  debouncedQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  loadMoreWords,
  onSelectWordId,
}: StudentVocabularyVaultSectionProps) {
  const learnedTotal = Math.max(0, totalWords - newCount);
  const activePacks = vocabPacks.filter((p) => p.status !== 'completed');
  const completedPacks = vocabPacks.filter((p) => p.status === 'completed');
  const maxLevelCount = Math.max(...levelCounts, 1);

  return (
    <section
      id="kho-tu-vung"
      data-onboarding="vault"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-6 dark:border-[#272C47] dark:bg-[#161A2E]"
    >
      {/* ── Header + 3 Summary Boxes ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-[#272C47]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2">
            <Library className="h-3.5 w-3.5" />
            Kho từ vựng cá nhân
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F2F3FB]">
            Quản lý kho từ & gói từ vựng đã nạp
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 dark:text-[#A5AAC6]">
            Theo dõi mức độ nhớ FSRS (L1–L6), tiếp tục học các gói từ đang dở hoặc tra cứu nhanh từ đã lưu.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-center dark:border-[#272C47] dark:bg-[#20253F]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A5AAC6]">
              Tích lũy
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-0.5 dark:text-[#F2F3FB]">
              {totalWords}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3.5 py-2.5 text-center dark:border-emerald-800/50 dark:bg-emerald-950/30">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Đã học
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5 dark:text-emerald-300">
              {learnedTotal}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 px-3.5 py-2.5 text-center dark:border-indigo-800/50 dark:bg-indigo-950/30">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Gói từ
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-indigo-700 tabular-nums mt-0.5 dark:text-indigo-300">
              {vocabPacks.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Mức độ nhớ · cả kho (L1..L6 Bar Chart) ── */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 dark:border-[#272C47] dark:bg-[#20253F]/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#A5AAC6]">
            Mức độ nhớ · cả kho (L1 → L6)
          </span>
          <span className="text-xs text-slate-500 dark:text-[#A5AAC6]">
            Cần ôn hôm nay:{' '}
            <strong className="text-amber-600 font-bold">{reviewDueCount} từ</strong>
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-3 pt-1">
          {levelCounts.slice(0, 6).map((count, idx) => {
            const style = LEVEL_BAR_STYLES[idx] || LEVEL_BAR_STYLES[0];
            const heightPct = totalWords > 0 ? Math.max(8, Math.round((count / maxLevelCount) * 100)) : 8;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs font-extrabold tabular-nums ${style.text}`}>
                  {count}
                </span>
                <div className="w-full h-16 bg-slate-200/60 rounded-lg flex items-end p-1 overflow-hidden dark:bg-slate-800">
                  <div
                    className={`w-full rounded-md transition-all duration-300 ${style.bg}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-[#F2F3FB]">L{idx + 1}</p>
                  <p className="text-[10px] text-slate-400 hidden sm:block">{style.hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Gói từ trong kho ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 dark:text-[#F2F3FB]">
            <Package className="h-4 w-4 text-indigo-600" />
            Gói từ trong kho ({vocabPacks.length})
          </h3>
          <div className="flex items-center gap-2">
            <Link
              href="/library"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm gói từ Thư viện
            </Link>
          </div>
        </div>

        {vocabPacks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center space-y-2 dark:border-[#272C47]">
            <p className="text-sm font-medium text-slate-600 dark:text-[#A5AAC6]">
              Bạn chưa nạp gói từ vựng nào từ Thư viện hoặc Lộ trình.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                <Library className="h-3.5 w-3.5" /> Khám phá Thư viện gói từ
              </Link>
              <Link
                href="/import"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors dark:border-[#272C47] dark:text-[#F2F3FB]"
              >
                <Plus className="h-3.5 w-3.5" /> Tự nhập từ mới
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activePacks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePacks.map((pack) => {
                  const pct =
                    pack.word_count > 0
                      ? Math.min(100, Math.round((pack.reviewed_count / pack.word_count) * 100))
                      : 0;
                  const idsParam = (pack.words || [])
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((w) => encodeURIComponent(w.word_id))
                    .join(',');
                  const learnPackHref = idsParam
                    ? `/flashcard?mode=learn&ids=${idsParam}`
                    : '/flashcard?mode=learn';

                  return (
                    <div
                      key={pack.pack_id}
                      className="rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between gap-3 hover:border-emerald-300 transition-colors dark:border-[#272C47]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900 line-clamp-1 dark:text-[#F2F3FB]">
                            {pack.topic_title}
                          </p>
                          <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {pack.reviewed_count}/{pack.word_count} từ
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2 dark:bg-slate-800">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-[#A5AAC6]">
                          Tiến độ: <strong className="text-slate-700 dark:text-[#F2F3FB]">{pct}%</strong>
                        </span>
                        <Link
                          href={learnPackHref}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Học tiếp
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {completedPacks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {completedPacks.map((pack) => (
                  <span
                    key={pack.pack_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {pack.topic_title} ({pack.word_count} từ)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Danh sách từ cá nhân (Search + Sort + Filter Pills + 2-Col Word Cards) ── */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#272C47]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-[#F2F3FB]">
            Danh sách từ cá nhân ({filteredWords.length}/{totalWords})
          </h3>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ hoặc nghĩa..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as WordSortOption)}
              className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-500 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="az">A → Z</option>
              <option value="hardest">Khó nhất</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'new', label: 'Chưa học' },
              { id: 'due', label: 'Đến hạn ôn' },
              { id: 'learned', label: 'Đang nhớ' },
              { id: 'mastered', label: 'Thuộc sâu (L5–L6)' },
            ] as Array<{ id: WordStatusFilter; label: string }>
          ).map((pill) => {
            const active = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#20253F] dark:text-[#A5AAC6]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Word Grid */}
        {wordsLoading ? (
          <div className="py-8 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách từ...
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            {debouncedQuery || statusFilter !== 'all'
              ? 'Không tìm thấy từ vựng phù hợp với bộ lọc hiện tại.'
              : 'Kho từ của bạn đang trống. Hãy thêm từ mới hoặc nạp gói từ từ Thư viện!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredWords.map((w) => {
              const parsedIpa = parseIpa(w.ipa);
              const srsLevel = w.srsLevel || 1;
              const badgeClass = LEVEL_BADGE_CLASSES[srsLevel] || LEVEL_BADGE_CLASSES[1];
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWordId(w.id)}
                  className="text-left p-3 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-start justify-between gap-2 group dark:border-[#272C47] dark:hover:bg-[#20253F]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors dark:text-[#F2F3FB]">
                        {w.word}
                      </span>
                      {w.pos && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-[#20253F] dark:text-[#A5AAC6]">
                          {w.pos}
                        </span>
                      )}
                      {parsedIpa && (
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          {parsedIpa}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-1 dark:text-[#A5AAC6]">
                      {w.translation}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
                    >
                      L{srsLevel}
                    </span>
                    {w.isDue && (
                      <span className="text-[10px] font-semibold text-amber-600">Đến hạn</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {words.length < totalWords && (
          <button
            type="button"
            onClick={loadMoreWords}
            disabled={isLoadingMore}
            className="w-full py-2.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-50/60 transition-colors flex items-center justify-center gap-1.5"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải thêm...
              </>
            ) : (
              `Tải thêm (${totalWords - words.length} từ còn lại)`
            )}
          </button>
        )}
      </div>
    </section>
  );
}

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
            Hồ sơ & Phân tích
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

      {/* Card: Tác vụ nhanh Kho từ vựng */}
      <section className="rounded-[18px] border border-slate-200/90 bg-white p-5 sm:p-[22px] dark:border-[#272C47] dark:bg-[#161A2E]">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="m-0 text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
            {activeClassroom ? `Kho từ · ${activeClassroom.name}` : 'Thư viện & Nạp từ'}
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
            <span>{showVaultWords ? 'Ẩn danh sách' : 'Tra nhanh'}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showVaultWords ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showVaultWords && (
          <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-[#272C47]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm từ trong kho..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#7B67FF] dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {(['all', 'new', 'due', 'learned', 'mastered'] as WordStatusFilter[]).map((f) => (
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
