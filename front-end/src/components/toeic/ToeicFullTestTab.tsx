import Link from '@/shared/router/navigation';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  LayoutGrid,
  LayoutList,
  Lightbulb,
  ListFilter,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import type { ToeicCatalogTestItem } from '@/lib/toeic-test-loader';
import {
  getTestMeta,
  TESTS_PER_PAGE,
  type ToeicTestFilter,
  type UserExamStatus,
} from './toeicCatalogConstants';

export interface ToeicFullTestTabProps {
  testFilter: ToeicTestFilter;
  onTestFilterChange: (filter: ToeicTestFilter) => void;
  totalFullTestsCount: number;
  full200Count: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  displayedFullTests: ToeicCatalogTestItem[];
  paginatedFullTests: ToeicCatalogTestItem[];
  displayLayout: 'list' | 'grid';
  onLayoutChange: (layout: 'list' | 'grid') => void;
  safeTestPage: number;
  totalTestPages: number;
  onPageChange: (page: number) => void;
  userExamStatus: Record<string, UserExamStatus>;
}

export function ToeicFullTestTab({
  testFilter,
  onTestFilterChange,
  totalFullTestsCount,
  full200Count,
  searchQuery,
  onSearchQueryChange,
  displayedFullTests,
  paginatedFullTests,
  displayLayout,
  onLayoutChange,
  safeTestPage,
  totalTestPages,
  onPageChange,
  userExamStatus,
}: ToeicFullTestTabProps) {
  return (
    <div className="space-y-5 min-w-0">
      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <ListFilter className="h-3.5 w-3.5" />
            Bộ lọc:
          </span>
          {(
            [
              { key: 'all', label: `Tất cả (${totalFullTestsCount})` },
              { key: '200q', label: `200 câu (${full200Count})` },
              { key: 'ets2026', label: 'Bộ 2026 (10)' },
              { key: 'ets2024', label: 'Bộ 2024 (10)' },
              { key: 'estudyme', label: 'Mô phỏng (21)' },
              { key: 'study4', label: 'Tổng hợp (20)' },
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

        <div className="relative w-full sm:w-64 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã đề..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Results Counter & Layout Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
          <span>
            Hiển thị{' '}
            <strong className="text-slate-900 dark:text-white tabular-nums">
              {displayedFullTests.length}
            </strong>{' '}
            đề thi phù hợp
          </span>
          <span className="hidden xs:inline">•</span>
          <span>Thời gian: 120 phút | 200 câu</span>
        </div>

        <div className="flex items-center gap-2 font-sans shrink-0">
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
      {displayedFullTests.length === 0 && (
        <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Không tìm thấy đề thi phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchQueryChange('');
              onTestFilterChange('200q');
            }}
            className="mt-3 text-xs font-mono text-slate-900 dark:text-white underline cursor-pointer"
          >
            Xóa bộ lọc và tìm lại
          </button>
        </div>
      )}

      {/* View Mode 1: Compact List View (Default) */}
      {displayedFullTests.length > 0 && displayLayout === 'list' && (
        <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs min-w-0">
          {paginatedFullTests.map((test, idx) => {
            const index = (safeTestPage - 1) * TESTS_PER_PAGE + idx;
            const meta = getTestMeta(test, index);
            const status = userExamStatus[test.id];

            return (
              <div
                key={test.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 min-w-0 overflow-hidden"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                      [{test.displayId}]
                    </span>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight break-words min-w-0">
                      {test.title}
                    </h3>

                    {status?.isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        ĐÃ THI · {status.score}/990
                      </span>
                    )}
                    {!status?.isCompleted && status?.inProgress && (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                        <Clock className="h-3 w-3" />
                        ĐANG LÀM DỞ · {status.answeredCount}/200
                      </span>
                    )}

                    {meta.badge && !status?.isCompleted && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${meta.badge.color}`}
                      >
                        {meta.badge.icon === 'flame' && <Flame className="h-3 w-3 fill-current" />}
                        {meta.badge.icon === 'star' && <Star className="h-3 w-3 fill-current" />}
                        {meta.badge.icon === 'sparkles' && <Sparkles className="h-3 w-3" />}
                        {meta.badge.label}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums min-w-0">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {test.durationMinutes} phút
                    </span>
                    <span>•</span>
                    <span>
                      {test.questionCount === 200 ? '200 câu (100 LC + 100 RC)' : `${test.questionCount} câu`}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-400">Chuẩn cấu trúc ETS</span>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Có lời giải chi tiết
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
                  <Link
                    href={`/toeic/exam/${test.id}?mode=practice`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 sm:py-1.5 px-3 text-xs font-bold transition-colors text-center"
                    title="Luyện tập từng câu, có ngay đáp án đúng/sai và lời giải thích chi tiết sau khi chọn"
                  >
                    <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                    <span>Luyện đề (Có giải thích)</span>
                  </Link>

                  <Link
                    href={`/toeic/exam/${test.id}?mode=real`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 sm:py-1.5 px-3 text-xs font-medium transition-colors text-center"
                    title="Mô phỏng thi thật 120 phút, tính giờ, ẩn đáp án đến khi nộp bài"
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Thi thử (120p)</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Enhanced Grid View */}
      {displayedFullTests.length > 0 && displayLayout === 'grid' && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {paginatedFullTests.map((test, idx) => {
            const index = (safeTestPage - 1) * TESTS_PER_PAGE + idx;
            const meta = getTestMeta(test, index);
            const status = userExamStatus[test.id];

            return (
              <div
                key={test.id}
                className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        [{test.displayId}]
                      </span>
                      {meta.badge && !status?.isCompleted && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${meta.badge.color}`}
                        >
                          {meta.badge.icon === 'flame' && <Flame className="h-2.5 w-2.5 fill-current" />}
                          {meta.badge.icon === 'star' && <Star className="h-2.5 w-2.5 fill-current" />}
                          {meta.badge.icon === 'sparkles' && <Sparkles className="h-2.5 w-2.5" />}
                          {meta.badge.label}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {test.durationMinutes} phút
                    </span>
                  </div>

                  {status?.isCompleted && (
                    <div className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      ĐÃ THI · {status.score}/990
                    </div>
                  )}
                  {!status?.isCompleted && status?.inProgress && (
                    <div className="inline-flex items-center gap-1 rounded-sm border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                      <Clock className="h-3 w-3" />
                      ĐANG LÀM DỞ · {status.answeredCount}/200
                    </div>
                  )}

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {test.title}
                  </h3>

                  <div className="space-y-1.5 rounded-sm border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    <div className="flex items-center justify-between">
                      <span>Quy mô bài thi:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {test.questionCount === 200 ? '200 câu (100 LC + 100 RC)' : `${test.questionCount} câu`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Thời lượng chuẩn:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {test.durationMinutes} phút tính giờ
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Định dạng:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Chuẩn ETS Khảo Thí
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <Link
                    href={`/toeic/exam/${test.id}?mode=practice`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-2 text-xs font-bold transition-colors text-center"
                    title="Luyện tập từng câu, có ngay đáp án đúng/sai và lời giải thích chi tiết sau khi chọn"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Luyện đề (Có giải thích)</span>
                  </Link>

                  <Link
                    href={`/toeic/exam/${test.id}?mode=real`}
                    className="inline-flex items-center justify-center gap-1 rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-2 text-xs font-medium transition-colors text-center"
                    title="Mô phỏng thi thật 120 phút, tính giờ, ẩn đáp án đến khi nộp bài"
                  >
                    <Clock className="h-3 w-3" />
                    <span>Thi thử (120p)</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Tests Pagination Bar */}
      {displayedFullTests.length > TESTS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 shadow-xs">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            Hiển thị{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {(safeTestPage - 1) * TESTS_PER_PAGE + 1}–
              {Math.min(safeTestPage * TESTS_PER_PAGE, displayedFullTests.length)}
            </span>{' '}
            trong tổng số{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {displayedFullTests.length}
            </span>{' '}
            đề thi
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={safeTestPage <= 1}
              onClick={() => onPageChange(Math.max(1, safeTestPage - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Trước</span>
            </button>

            {Array.from({ length: totalTestPages }, (_, i) => i + 1).map((pageNum) => {
              const isCurrent = pageNum === safeTestPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-sm border px-2 text-xs font-mono font-bold tabular-nums transition-colors cursor-pointer ${
                    isCurrent
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={safeTestPage >= totalTestPages}
              onClick={() => onPageChange(Math.min(totalTestPages, safeTestPage + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
