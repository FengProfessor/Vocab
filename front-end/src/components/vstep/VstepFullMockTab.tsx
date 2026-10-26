import Link from '@/shared/router/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  LayoutGrid,
  LayoutList,
  Play,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import type { VstepDraftSummary } from '@/lib/vstep-history';
import type { VstepExamCatalogItem, VstepExamSummary } from '@/lib/vstep-types';
import {
  getPaginationPages,
  getSourceBadge,
  type VstepBankTotals,
  type VstepFilterCounts,
  type VstepTestFilter,
} from './vstepCatalogConstants';

export interface VstepFullMockTabProps {
  testFilter: VstepTestFilter;
  onTestFilterChange: (filter: VstepTestFilter) => void;
  bankTotals: VstepBankTotals;
  counts: VstepFilterCounts;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filteredItems: VstepExamCatalogItem[];
  paginatedItems: VstepExamCatalogItem[];
  displayLayout: 'list' | 'grid';
  onLayoutChange: (layout: 'list' | 'grid') => void;
  hasMounted: boolean;
  examSummaries: Record<string, VstepExamSummary>;
  draftSummaries: Record<string, VstepDraftSummary>;
  totalPages: number;
  safePage: number;
  onPageChange: (page: number) => void;
}

export function VstepFullMockTab({
  testFilter,
  onTestFilterChange,
  bankTotals,
  counts,
  searchQuery,
  onSearchQueryChange,
  filteredItems,
  paginatedItems,
  displayLayout,
  onLayoutChange,
  hasMounted,
  examSummaries,
  draftSummaries,
  totalPages,
  safePage,
  onPageChange,
}: VstepFullMockTabProps) {
  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div
        id="catalog-controls"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Bộ lọc:
          </span>
          {(
            [
              { key: 'all', label: `Tất cả (${bankTotals.totalMockExams})` },
              { key: 'unattempted', label: `Chưa làm (${counts.status.unattempted})` },
              { key: 'completed', label: `Đã thi (${counts.status.completed})` },
              { key: 'b1_b2', label: 'Mục tiêu B1–B2' },
              { key: 'c1', label: `Mục tiêu C1 (${counts.levels.C1 || 0})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onTestFilterChange(item.key)}
              className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                testFilter === item.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã hoặc tên đề..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Counter & Layout Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Hiển thị <strong className="text-slate-900 dark:text-white tabular-nums">{filteredItems.length}</strong> đề thi phù hợp
          </span>
          <span>•</span>
          <span>Thời gian chuẩn: 172 phút | 75 trắc nghiệm + 2 Viết + 3 Nói</span>
        </div>

        <div className="flex items-center gap-2 font-sans">
          <span className="text-slate-500 dark:text-slate-400 text-xs hidden sm:inline">Chế độ xem:</span>
          <div className="flex items-center rounded-sm border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => onLayoutChange('list')}
              title="Xem danh sách gọn (Khuyên dùng)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium transition-all cursor-pointer ${
                displayLayout === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange('grid')}
              title="Xem dạng lưới thẻ"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium transition-all cursor-pointer ${
                displayLayout === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Lưới thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Không tìm thấy đề thi phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchQueryChange('');
              onTestFilterChange('all');
            }}
            className="mt-3 text-xs font-mono text-slate-900 dark:text-white underline cursor-pointer"
          >
            Xóa bộ lọc và tìm lại
          </button>
        </div>
      )}

      {/* View Mode 1: Compact List View */}
      {filteredItems.length > 0 && displayLayout === 'list' && (
        <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
          {paginatedItems.map((item) => {
            const summary = hasMounted ? examSummaries[item.id] : undefined;
            const draft = hasMounted ? draftSummaries[item.id] : undefined;
            const isDone = Boolean(summary?.isCompleted);
            const hasDraft = Boolean(draft && (draft.answeredCount > 0 || draft.writingCount > 0));

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                      [{item.id.toUpperCase()}]
                    </span>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {item.title}
                    </h3>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        ĐÃ THI · {summary?.highestScore.toFixed(1)}/10 (Bậc {summary?.highestCefr})
                      </span>
                    ) : (
                      item.id === 'vstep-mock-01' && (
                        <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80">
                          <Flame className="h-3 w-3 fill-current" />
                          Đề Khuyên Dùng
                        </span>
                      )
                    )}

                    {hasDraft && draft && (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                        <RotateCcw className="h-3 w-3" />
                        ĐANG LÀM DỞ · {draft.answeredCount} câu
                        {draft.writingCount > 0 ? ` + ${draft.writingCount} W` : ''}
                      </span>
                    )}

                    {getSourceBadge(item.source)}

                    <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Bậc {item.targetLevel || 'B1-B2-C1'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                      <Clock className="h-3 w-3 text-slate-400" />
                      172 phút
                    </span>
                    <span>•</span>
                    <span>75 câu trắc nghiệm (Nghe 35, Đọc 40)</span>
                    <span>•</span>
                    <span>2 bài luận Viết</span>
                    <span>•</span>
                    <span>3 phần thi Nói</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Chuẩn Khung 6 Bậc
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/vstep/exam/${item.id}?filter=unseen`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-1.5 px-3.5 text-xs font-bold transition-colors whitespace-nowrap"
                    title="Vào phòng thi máy tính 172 phút đầy đủ 4 kỹ năng"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{hasDraft ? 'Tiếp Tục Thi' : 'Vào Phòng Thi (172p)'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Enhanced Grid View */}
      {filteredItems.length > 0 && displayLayout === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedItems.map((item) => {
            const summary = hasMounted ? examSummaries[item.id] : undefined;
            const draft = hasMounted ? draftSummaries[item.id] : undefined;
            const isDone = Boolean(summary?.isCompleted);
            const hasDraft = Boolean(draft && (draft.answeredCount > 0 || draft.writingCount > 0));

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      [{item.id.toUpperCase()}]
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                      <Clock className="h-3 w-3 text-slate-400" />
                      172 phút
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {isDone && (
                      <div className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        ĐÃ THI · {summary?.highestScore.toFixed(1)}/10
                      </div>
                    )}
                    {hasDraft && draft && (
                      <div className="inline-flex items-center gap-1 rounded-sm border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                        <RotateCcw className="h-3 w-3" />
                        ĐANG LÀM DỞ · {draft.answeredCount} câu
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  <div className="space-y-1.5 rounded-sm border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    <div className="flex items-center justify-between">
                      <span>Quy mô trắc nghiệm:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">75 câu (Nghe + Đọc)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tự luận &amp; Nói:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">2 Viết + 3 Nói</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cấp bậc chuẩn:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Bậc {item.targetLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/vstep/exam/${item.id}?filter=unseen`}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-3 text-xs font-bold transition-colors text-center"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{hasDraft ? 'Tiếp Tục Thi' : 'Vào Phòng Thi (172p)'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-sm p-3 sm:px-4 shadow-xs">
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Trang <span className="font-bold text-slate-800 dark:text-slate-200">{safePage}</span> / {totalPages} ({filteredItems.length} đề thi)
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage === 1}
              className="px-2.5 py-1 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            {getPaginationPages(safePage, totalPages).map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs font-mono text-slate-400 select-none">
                    …
                  </span>
                );
              }
              const isCurrent = p === safePage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[30px] h-[28px] px-1.5 rounded-sm text-xs font-mono tabular-nums transition-colors border ${
                    isCurrent
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage === totalPages}
              className="px-2.5 py-1 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
