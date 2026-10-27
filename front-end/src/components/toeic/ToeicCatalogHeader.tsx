import { Bookmark, FileText, Layers, Trophy } from 'lucide-react';
import type { ToeicActiveTab } from './toeicCatalogConstants';

export interface ToeicCatalogHeaderProps {
  totalQuestionsFormatted: string;
  totalFullTestsCount: number;
  reviewCount: number;
  activeTab: ToeicActiveTab;
  onSelectTab: (tab: ToeicActiveTab) => void;
}

export function ToeicCatalogHeader({
  totalQuestionsFormatted,
  totalFullTestsCount,
  reviewCount,
  activeTab,
  onSelectTab,
}: ToeicCatalogHeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
              Hệ Thống Khảo Thí &amp; Luyện Thi TOEIC
            </h1>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Phòng thi trực tuyến chuẩn ETS: 200 câu, chia 2 cột, gắn cờ Flag &amp; bảng điểm 10–990.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 px-3 py-1.5 text-xs font-mono divide-x divide-slate-200 dark:divide-slate-800 shrink-0 self-start lg:self-center shadow-2xs">
            <div className="flex items-center gap-1.5 pr-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
              <span className="text-slate-500 text-[11px]">Kho:</span>
              <strong className="text-slate-900 dark:text-white tabular-nums font-bold">
                {totalQuestionsFormatted}
              </strong>
              <span className="text-[10px] text-slate-400 hidden sm:inline">câu</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5">
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 text-[11px]">Đề:</span>
              <strong className="text-slate-900 dark:text-white tabular-nums font-bold">
                {totalFullTestsCount}
              </strong>
              <span className="text-[10px] text-slate-400 hidden sm:inline">đề</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5">
              <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 text-[11px]">Phần thi:</span>
              <strong className="text-slate-900 dark:text-white tabular-nums font-bold">7</strong>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Parts</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2.5">
              <Trophy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 text-[11px]">Điểm:</span>
              <strong className="text-slate-900 dark:text-white tabular-nums font-bold">10–990</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-1.5 sm:p-2">
        <div className="mx-auto max-w-3xl px-2 sm:px-0">
          <div
            role="tablist"
            aria-label="Chế độ khảo thí"
            className="flex p-0.5 rounded-sm bg-slate-200/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'full_test'}
              onClick={() => onSelectTab('full_test')}
              className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer select-none whitespace-nowrap ${
                activeTab === 'full_test'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Đề Thi Full Test</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums ${
                  activeTab === 'full_test'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {totalFullTestsCount} đề
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'practice_parts'}
              onClick={() => onSelectTab('practice_parts')}
              className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer select-none whitespace-nowrap ${
                activeTab === 'practice_parts'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>Luyện Từng Part</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums ${
                  activeTab === 'practice_parts'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                7 parts
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'review_flagged'}
              onClick={() => onSelectTab('review_flagged')}
              className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer select-none whitespace-nowrap ${
                activeTab === 'review_flagged'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500/30" />
              <span>Câu Cần Luyện Lại</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums ${
                  activeTab === 'review_flagged'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {reviewCount} câu
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
