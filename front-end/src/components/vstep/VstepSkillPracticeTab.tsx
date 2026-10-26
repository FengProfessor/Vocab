import Link from '@/shared/router/navigation';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Info,
  Layers,
  LayoutGrid,
  LayoutList,
  Mic2,
  PenLine,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { VstepDraftSummary, VstepPracticeFilterMode } from '@/lib/vstep-history';
import type { VstepExamCatalogItem, VstepExamSummary } from '@/lib/vstep-types';
import {
  getPaginationPages,
  getSourceBadge,
  type VstepBankTotals,
  type VstepFilterCounts,
  type VstepPracticeSkill,
  type VstepResetOption,
  type VstepSkillProgressStats,
} from './vstepCatalogConstants';

export interface VstepSkillPracticeTabProps {
  bankTotals: VstepBankTotals;
  selectedPracticeSkill: VstepPracticeSkill;
  onSelectPracticeSkill: (skill: VstepPracticeSkill) => void;
  selectedSkillMeta: { label: string; title: string; help: string };
  isObjectivePractice: boolean;
  currentSkillProgress: VstepSkillProgressStats;
  onOpenResetModalForSkill: (option: VstepResetOption) => void;
  filterMode: VstepPracticeFilterMode;
  onFilterModeChange: (mode: VstepPracticeFilterMode) => void;
  selectedSource: string;
  onSelectedSourceChange: (source: string) => void;
  selectedLevel: string;
  onSelectedLevelChange: (level: string) => void;
  counts: VstepFilterCounts;
  filteredItems: VstepExamCatalogItem[];
  paginatedItems: VstepExamCatalogItem[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  displayLayout: 'list' | 'grid';
  onLayoutChange: (layout: 'list' | 'grid') => void;
  hasMounted: boolean;
  examSummaries: Record<string, VstepExamSummary>;
  draftSummaries: Record<string, VstepDraftSummary>;
  getPracticeHref: (item: VstepExamCatalogItem) => string;
  getPracticeWorkload: (item: VstepExamCatalogItem) => string;
  totalPages: number;
  safePage: number;
  onPageChange: (page: number) => void;
}

export function VstepSkillPracticeTab({
  bankTotals,
  selectedPracticeSkill,
  onSelectPracticeSkill,
  selectedSkillMeta,
  isObjectivePractice,
  currentSkillProgress,
  onOpenResetModalForSkill,
  filterMode,
  onFilterModeChange,
  selectedSource,
  onSelectedSourceChange,
  selectedLevel,
  onSelectedLevelChange,
  counts,
  filteredItems,
  paginatedItems,
  searchQuery,
  onSearchQueryChange,
  displayLayout,
  onLayoutChange,
  hasMounted,
  examSummaries,
  draftSummaries,
  getPracticeHref,
  getPracticeWorkload,
  totalPages,
  safePage,
  onPageChange,
}: VstepSkillPracticeTabProps) {
  return (
    <div className="space-y-6">
      {/* Skill Switcher Bar */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center justify-between">
          <span>CHỌN KỸ NĂNG LUYỆN TẬP CHUYÊN SÂU:</span>
          <span className="font-mono tabular-nums">
            {bankTotals.totalPracticeSets} bài · {bankTotals.totalQuestions.toLocaleString('vi-VN')} câu trắc nghiệm · {bankTotals.writingTasks + bankTotals.speakingTasks} task/part tự luận
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onSelectPracticeSkill('listening')}
            className={`flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer ${
              selectedPracticeSkill === 'listening'
                ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                <Headphones className="w-4 h-4" /> Kỹ Năng Nghe
              </span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                  selectedPracticeSkill === 'listening'
                    ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {bankTotals.listeningPracticeSets} Đề
              </span>
            </div>
            <span className="text-xs mt-1 truncate w-full">Listening Part 1–3 Audio R2</span>
            <span
              className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                selectedPracticeSkill === 'listening'
                  ? 'text-slate-300 dark:text-slate-600'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {bankTotals.totalListening.toLocaleString('vi-VN')} câu hỏi
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPracticeSkill('reading')}
            className={`flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer ${
              selectedPracticeSkill === 'reading'
                ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Kỹ Năng Đọc
              </span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                  selectedPracticeSkill === 'reading'
                    ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {bankTotals.readingPracticeSets} Bài
              </span>
            </div>
            <span className="text-xs mt-1 truncate w-full">Reading Passage 1–4 Chuyên Đề</span>
            <span
              className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                selectedPracticeSkill === 'reading'
                  ? 'text-slate-300 dark:text-slate-600'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {bankTotals.totalReading.toLocaleString('vi-VN')} câu hỏi
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPracticeSkill('writing')}
            className={`flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer ${
              selectedPracticeSkill === 'writing'
                ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                <PenLine className="w-4 h-4" /> Kỹ Năng Viết
              </span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                  selectedPracticeSkill === 'writing'
                    ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {bankTotals.writingPracticeSets} Đề
              </span>
            </div>
            <span className="text-xs mt-1 truncate w-full">Email/Letter + Academic Essay</span>
            <span
              className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                selectedPracticeSkill === 'writing'
                  ? 'text-slate-300 dark:text-slate-600'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {bankTotals.writingTasks} task luyện viết
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPracticeSkill('speaking')}
            className={`flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer ${
              selectedPracticeSkill === 'speaking'
                ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                <Mic2 className="w-4 h-4" /> Kỹ Năng Nói
              </span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                  selectedPracticeSkill === 'speaking'
                    ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {bankTotals.speakingPracticeSets} Đề
              </span>
            </div>
            <span className="text-xs mt-1 truncate w-full">Social · Solution · Topic Development</span>
            <span
              className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                selectedPracticeSkill === 'speaking'
                  ? 'text-slate-300 dark:text-slate-600'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {bankTotals.speakingTasks} part luyện nói
            </span>
          </button>
        </div>
      </div>

      {/* Skill Practice Setup Box */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tabular-nums">
              {selectedSkillMeta.label}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {selectedSkillMeta.title}
            </h2>
          </div>

          <div className="group relative flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-help select-none shrink-0">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span className="underline decoration-dotted text-[11px] font-medium">Hướng dẫn kỹ năng</span>
            <div className="absolute right-0 top-full mt-1.5 hidden w-80 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-300 shadow-lg group-hover:block z-30 leading-relaxed">
              {selectedSkillMeta.help}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & 3-Column Stats */}
        {isObjectivePractice && (
          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                TIẾN ĐỘ HOÀN THÀNH KỸ NĂNG {selectedPracticeSkill === 'listening' ? 'NGHE' : 'ĐỌC'}
              </span>
              <button
                type="button"
                onClick={() =>
                  onOpenResetModalForSkill(selectedPracticeSkill === 'reading' ? 'reading' : 'listening')
                }
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Đặt lại tiến độ kỹ năng này"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại tiến độ</span>
              </button>
            </div>

            <div className="h-2 w-full rounded-xs bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="bg-slate-900 dark:bg-white transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, currentSkillProgress.percentage))}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm bg-white dark:bg-slate-950">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đã làm:</div>
                <div className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentSkillProgress.answeredCount.toLocaleString('vi-VN')} / {currentSkillProgress.totalCount.toLocaleString('vi-VN')} câu ({currentSkillProgress.percentage}%)
                </div>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm bg-white dark:bg-slate-950">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cần ôn:</div>
                <div className="text-xs font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {currentSkillProgress.mistakeCount.toLocaleString('vi-VN')} câu từng làm sai
                </div>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm bg-white dark:bg-slate-950">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Còn lại:</div>
                <div className="text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                  {Math.max(0, currentSkillProgress.totalCount - currentSkillProgress.answeredCount).toLocaleString('vi-VN')} câu chưa làm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Chế độ chống trùng */}
        {isObjectivePractice && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                1
              </span>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Chiến thuật nạp câu hỏi chống trùng lặp:
              </label>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onFilterModeChange('unseen')}
                className={`flex items-start gap-3 p-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                  filterMode === 'unseen'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      filterMode === 'unseen'
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {filterMode === 'unseen' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Chỉ câu mới (Chống trùng 100%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Lọc bỏ toàn bộ câu đã làm trong lịch sử.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onFilterModeChange('mistakes')}
                className={`flex items-start gap-3 p-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                  filterMode === 'mistakes'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      filterMode === 'mistakes'
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {filterMode === 'mistakes' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Ôn câu sai (Spaced Repetition)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Chỉ nạp các câu đã từng trả lời sai ({currentSkillProgress.mistakeCount} câu sẵn sàng).
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onFilterModeChange('all_random')}
                className={`flex items-start gap-3 p-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                  filterMode === 'all_random'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      filterMode === 'all_random'
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {filterMode === 'all_random' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Xáo trộn ngẫu nhiên
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Bốc ngẫu nhiên không hoàn lại từ kho câu hỏi.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {!isObjectivePractice && (
          <div className="rounded-sm border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              {selectedPracticeSkill === 'writing'
                ? `${bankTotals.writingPracticeSets} bộ · ${bankTotals.writingTasks} task Writing`
                : `${bankTotals.speakingPracticeSets} bộ · ${bankTotals.speakingTasks} part Speaking`}
            </div>
            <p>
              Đây là bài luyện tự luận theo đề hoàn chỉnh. Chọn nguồn và cấp độ bên dưới rồi vào bài;
              hướng dẫn/bài mẫu chỉ được mở trong luồng review để tránh lộ đáp án trước khi luyện.
            </p>
            {selectedPracticeSkill === 'speaking' && (
              <Link href="/vstep/speaking" className="mt-2 inline-flex font-bold text-amber-800 dark:text-amber-300 hover:underline">
                Mở Speaking Lab 12 phút →
              </Link>
            )}
          </div>
        )}

        {/* Step 2: Bộ lọc nguồn & cấp bậc */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
              {isObjectivePractice ? '2' : '1'}
            </span>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Bộ lọc nguồn đề &amp; cấp bậc:
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSource}
              onChange={(e) => onSelectedSourceChange(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-mono"
            >
              <option value="all">Tất Cả Nguồn Đề ({counts.sources.all})</option>
              <option value="vstepowl">Khảo Thí Chuẩn Hóa ({counts.sources.vstepowl})</option>
              <option value="onthivstep">Đọc Hiểu Chuyên Đề ({counts.sources.onthivstep})</option>
              <option value="englishteststore">Trắc Nghiệm Tương Tác ({counts.sources.englishteststore})</option>
              <option value="vnu">Đề Mẫu ĐHQGHN ({counts.sources.vnu})</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => onSelectedLevelChange(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-mono"
            >
              <option value="all">Mọi Cấp Bậc ({counts.levels.all})</option>
              <option value="B1">Mục Tiêu B1 ({counts.levels.B1})</option>
              <option value="B2">Mục Tiêu B2 ({counts.levels.B2})</option>
              <option value="C1">Mục Tiêu C1 ({counts.levels.C1})</option>
            </select>

            {filteredItems.length > 0 && (
              <Link
                href={getPracticeHref(filteredItems[0])}
                className="ml-auto inline-flex items-center gap-2 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-4 text-xs font-bold transition-colors shadow-xs"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Bắt Đầu Luyện Nhanh (${filteredItems[0].id.toUpperCase()})</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Catalog List of Practice Sets for Selected Skill */}
      <div className="space-y-4">
        <div
          id="catalog-controls"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-500 dark:text-slate-400"
        >
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong className="text-slate-900 dark:text-white tabular-nums">{filteredItems.length}</strong> bài luyện phù hợp
            </span>
            {isObjectivePractice && <span>•</span>}
            {isObjectivePractice && (
              <span>
                Chế độ: <strong className="text-slate-900 dark:text-white uppercase">{filterMode}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-sans">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài luyện..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center rounded-sm border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => onLayoutChange('list')}
                title="Xem danh sách gọn"
                className={`p-1 rounded-xs transition-all cursor-pointer ${
                  displayLayout === 'list'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange('grid')}
                title="Xem dạng lưới"
                className={`p-1 rounded-xs transition-all cursor-pointer ${
                  displayLayout === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact List View for Practice */}
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

                      {isDone && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          ĐÃ LÀM · {summary?.highestScore.toFixed(1)}/10
                        </span>
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
                        Bậc {item.targetLevel || 'B2'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {item.duration} phút
                      </span>
                      <span>•</span>
                      <span>{getPracticeWorkload(item)}</span>
                      {item.totalTasks && (
                        <>
                          <span>•</span>
                          <span>{item.totalTasks} phần thi</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <Link
                      href={getPracticeHref(item)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-1.5 px-3.5 text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{hasDraft ? 'Tiếp Tục Luyện' : 'Luyện Tập Ngay'}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid View for Practice */}
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        [{item.id.toUpperCase()}]
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 tabular-nums">
                            <CheckCircle2 className="h-3 w-3" />
                            {summary?.highestScore !== undefined
                              ? `${summary.highestScore.toFixed(1)}/10`
                              : 'ĐÃ THI'}
                          </span>
                        ) : hasDraft ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 tabular-nums">
                            ĐANG LÀM DỞ
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {item.duration} phút
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-2 pt-1">
                      {getSourceBadge(item.source)}
                      <span className="font-mono text-xs text-slate-500">{getPracticeWorkload(item)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={getPracticeHref(item)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-3 text-xs font-bold transition-colors text-center"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{hasDraft ? 'Tiếp Tục Luyện' : 'Luyện Tập Ngay'}</span>
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
              Trang <span className="font-bold text-slate-800 dark:text-slate-200">{safePage}</span> / {totalPages} ({filteredItems.length} bài luyện)
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
    </div>
  );
}

export interface VstepResetModalProps {
  open: boolean;
  resetOption: VstepResetOption;
  onSelectResetOption: (option: VstepResetOption) => void;
  listeningStats: VstepSkillProgressStats;
  readingStats: VstepSkillProgressStats;
  bankTotals: VstepBankTotals;
  onClose: () => void;
  onConfirm: () => void;
}

export function VstepResetModal({
  open,
  resetOption,
  onSelectResetOption,
  listeningStats,
  readingStats,
  bankTotals,
  onClose,
  onConfirm,
}: VstepResetModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm max-w-lg w-full p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Quản Lý Tiến Độ &amp; Lịch Sử Khảo Thí
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chọn phạm vi dữ liệu bạn muốn đặt lại trên thiết bị này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <label
            className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
              resetOption === 'listening'
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              type="radio"
              name="reset_option"
              checked={resetOption === 'listening'}
              onChange={() => onSelectResetOption('listening')}
              className="mt-1 text-blue-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                1. Đặt lại Kỹ Năng Nghe (Listening Bank)
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Xóa lịch sử {listeningStats.answeredCount} câu Nghe đã làm và {listeningStats.mistakeCount} câu sai.
              </p>
            </div>
          </label>

          <label
            className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
              resetOption === 'reading'
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              type="radio"
              name="reset_option"
              checked={resetOption === 'reading'}
              onChange={() => onSelectResetOption('reading')}
              className="mt-1 text-blue-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                2. Đặt lại Kỹ Năng Đọc (Reading Bank)
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Xóa lịch sử {readingStats.answeredCount} câu Đọc đã làm và {readingStats.mistakeCount} câu sai.
              </p>
            </div>
          </label>

          <label
            className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
              resetOption === 'exams'
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              type="radio"
              name="reset_option"
              checked={resetOption === 'exams'}
              onChange={() => onSelectResetOption('exams')}
              className="mt-1 text-blue-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                3. Đặt lại Bảng Điểm &amp; Lịch Sử Đề Thi (Exam Records)
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Xóa các bản ghi nộp bài, điểm số cao nhất của toàn bộ {bankTotals.totalExams} đề thi.
              </p>
            </div>
          </label>

          <label
            className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
              resetOption === 'all'
                ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              type="radio"
              name="reset_option"
              checked={resetOption === 'all'}
              onChange={() => onSelectResetOption('all')}
              className="mt-1 text-rose-600"
            />
            <div className="text-xs">
              <span className="font-bold text-rose-700 dark:text-rose-400 block">
                4. Đặt Lại Toàn Bộ (Full Reset Khảo Thí)
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Xóa sạch toàn bộ lịch sử {bankTotals.totalQuestions.toLocaleString('vi-VN')} câu hỏi và bảng điểm đề thi, khôi phục trạng thái ban đầu.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Xác nhận đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
