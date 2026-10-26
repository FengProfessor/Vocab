import type { RefObject } from 'react';
import Link from '@/shared/router/navigation';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Info,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { PartProgressStats } from '@/lib/toeic-question-history';
import type { ToeicCatalogTestItem } from '@/lib/toeic-test-loader';
import {
  catalog,
  PART_DEFINITIONS,
  type PartMeta,
  type ToeicFilterMode,
  type ToeicListeningYear,
} from './toeicCatalogConstants';

export interface ToeicPartPracticeTabProps {
  selectedPart: number;
  onSelectPart: (partNum: number) => void;
  totalPracticeQuestionsFormatted: string;
  totalPracticeSetsCount: number;
  partRailRef: RefObject<HTMLDivElement | null>;
  railCanScrollLeft: boolean;
  railCanScrollRight: boolean;
  onCheckRailScroll: () => void;
  onScrollPartRail: (dir: 'left' | 'right') => void;
  currentPartMeta: PartMeta;
  partProgress: PartProgressStats;
  isResetConfirmOpen: boolean;
  onOpenResetConfirm: () => void;
  onCloseResetConfirm: () => void;
  onConfirmReset: () => void;
  selectedListeningYear: ToeicListeningYear;
  onSelectListeningYear: (yr: ToeicListeningYear) => void;
  getTestsForYear: (yr: string) => ToeicCatalogTestItem[];
  selectedSource: string;
  onSelectSource: (source: string) => void;
  selectedFilterMode: ToeicFilterMode;
  onSelectFilterMode: (mode: ToeicFilterMode) => void;
  presetsForCurrentPart: number[];
  selectedCount: number;
  onSelectCount: (cnt: number) => void;
  customCountInput: string;
  onCustomCountInputChange: (val: string) => void;
  isClusterPart: boolean;
  selectedMode: 'practice' | 'real';
  onSelectMode: (mode: 'practice' | 'real') => void;
  effectiveCount: number;
  estimatedTimeMinutes: number;
}

export function ToeicPartPracticeTab({
  selectedPart,
  onSelectPart,
  totalPracticeQuestionsFormatted,
  totalPracticeSetsCount,
  partRailRef,
  railCanScrollLeft,
  railCanScrollRight,
  onCheckRailScroll,
  onScrollPartRail,
  currentPartMeta,
  partProgress,
  isResetConfirmOpen,
  onOpenResetConfirm,
  onCloseResetConfirm,
  onConfirmReset,
  selectedListeningYear,
  onSelectListeningYear,
  getTestsForYear,
  selectedSource,
  onSelectSource,
  selectedFilterMode,
  onSelectFilterMode,
  presetsForCurrentPart,
  selectedCount,
  onSelectCount,
  customCountInput,
  onCustomCountInputChange,
  isClusterPart,
  selectedMode,
  onSelectMode,
  effectiveCount,
  estimatedTimeMinutes,
}: ToeicPartPracticeTabProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-4 pb-16 sm:pb-0">
      {/* Part Switcher Bar (Part 1 to Part 7) */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
              CHỌN PHẦN THI (PART 1 – 7):
            </span>
            <span
              aria-hidden="true"
              className="sm:hidden inline-flex items-center gap-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-slate-400 dark:text-slate-400 select-none shadow-2xs"
            >
              <ChevronLeft className="h-3 w-3 opacity-60" />
              <span className="h-1 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              <ChevronRight className="h-3 w-3 animate-pulse text-slate-600 dark:text-slate-300" />
            </span>
          </div>
          <span className="font-mono tabular-nums text-[11px] text-slate-500">
            {totalPracticeQuestionsFormatted} câu luyện tập ({totalPracticeSetsCount} bộ)
          </span>
        </div>

        {/* Mobile Part Rail */}
        <div className="relative sm:hidden">
          {railCanScrollLeft && (
            <button
              type="button"
              onClick={() => onScrollPartRail('left')}
              aria-label="Cuộn sang trái"
              className="absolute left-0 top-0 bottom-1.5 z-10 w-7 flex items-center justify-start pl-0.5 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-opacity cursor-pointer select-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={partRailRef}
            onScroll={onCheckRailScroll}
            className="sm:hidden flex overflow-x-auto gap-2 pb-1.5 scrollbar-none snap-x snap-mandatory -mx-1 px-1 scroll-smooth"
          >
            {PART_DEFINITIONS.map((p) => {
              const isSelected = p.part === selectedPart;
              return (
                <button
                  key={p.part}
                  data-part={p.part}
                  type="button"
                  onClick={() => onSelectPart(p.part)}
                  className={`snap-start shrink-0 w-[140px] flex flex-col items-start p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-extrabold uppercase">Part {p.part}</span>
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                        isSelected
                          ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {p.section === 'listening' ? 'LC' : 'RC'}
                    </span>
                  </div>
                  <span className="text-xs mt-1 truncate w-full font-medium">{p.vietnameseTitle}</span>
                  <span
                    className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                      isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {p.questionCount.toLocaleString('vi-VN')} câu
                  </span>
                </button>
              );
            })}
          </div>

          {railCanScrollRight && (
            <button
              type="button"
              onClick={() => onScrollPartRail('right')}
              aria-label="Cuộn sang phải"
              className="absolute right-0 top-0 bottom-1.5 z-10 w-7 flex items-center justify-end pr-0.5 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-opacity cursor-pointer select-none"
            >
              <ChevronRight className="h-4 w-4 animate-pulse" />
            </button>
          )}
        </div>

        {/* Desktop Part Grid */}
        <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {PART_DEFINITIONS.map((p) => {
            const isSelected = p.part === selectedPart;
            return (
              <button
                key={p.part}
                type="button"
                onClick={() => onSelectPart(p.part)}
                className={`flex flex-col items-start p-2 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-extrabold uppercase">Part {p.part}</span>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded-2xs uppercase tabular-nums ${
                      isSelected
                        ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {p.section === 'listening' ? 'LC' : 'RC'}
                  </span>
                </div>
                <span className="text-[11px] mt-0.5 truncate w-full">{p.vietnameseTitle}</span>
                <span
                  className={`font-mono text-[10px] mt-0.5 tabular-nums ${
                    isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {p.questionCount.toLocaleString('vi-VN')} câu
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Part Practice Setup Box */}
      <div className="max-w-3xl mx-auto rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tabular-nums">
              Part {currentPartMeta.part} ({currentPartMeta.section === 'listening' ? 'LC' : 'RC'})
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {currentPartMeta.name} — {currentPartMeta.vietnameseTitle}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              (~{currentPartMeta.secondsPerQuestion}s/câu)
            </span>
          </div>

          <div className="group relative flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-help select-none shrink-0">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span className="underline decoration-dotted text-[11px] font-medium">Hướng dẫn phần thi</span>
            <div className="absolute right-0 top-full mt-1.5 hidden w-80 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-300 shadow-lg group-hover:block z-30 leading-relaxed">
              <div className="font-bold text-slate-900 dark:text-white mb-1">{currentPartMeta.name}</div>
              {currentPartMeta.desc}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & Stats */}
        <div className="w-full rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                TIẾN ĐỘ HOÀN THÀNH PART {selectedPart}
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                ({partProgress.percentage}%)
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenResetConfirm}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
              title={`Đặt lại tiến độ Part ${selectedPart}`}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại</span>
            </button>
          </div>

          <div className="h-1.5 w-full rounded-xs bg-slate-200 dark:border-slate-800 overflow-hidden flex">
            <div
              className="bg-slate-900 dark:bg-white transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, partProgress.percentage))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 px-1 text-center shadow-2xs">
            <div className="px-1 min-w-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                Đã làm
              </span>
              <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate block">
                {partProgress.completedCount}/{partProgress.totalQuestions} ({partProgress.percentage}%)
              </span>
            </div>
            <div className="px-1 min-w-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                Cần ôn
              </span>
              <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 truncate block">
                {partProgress.mistakeCount} câu sai
              </span>
            </div>
            <div className="px-1 min-w-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                Còn lại
              </span>
              <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-400 truncate block">
                {partProgress.unseenCount} câu mới
              </span>
            </div>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Xác nhận đặt lại tiến độ Part {selectedPart}?
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Toàn bộ lịch sử {partProgress.completedCount} câu đã làm của Part này sẽ bị xóa khỏi máy. Bạn sẽ bắt đầu luyện tập lại từ 0 câu.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onCloseResetConfirm}
                  className="px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onConfirmReset}
                  className="px-3 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Xác nhận đặt lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bộ sưu tập luyện nghe ETS (2019–2026 — 260 bộ đề) */}
        {currentPartMeta.section === 'listening' && (
          <div className="space-y-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80">
                  <Headphones className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Bộ Sưu Tập Luyện Nghe ETS (2019–2026 — 260 Bộ Đề):
                  </h3>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {selectedListeningYear === 'all'
                      ? `260 bộ đề (65 bộ Part ${selectedPart})`
                      : selectedListeningYear === '2021'
                        ? `20 bộ đề (5 bộ Part ${selectedPart})`
                        : `40 bộ đề (10 bộ Part ${selectedPart})`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Thanh chọn năm luyện nghe ETS</span>
            </div>

            <div className="flex flex-wrap items-center sm:justify-center gap-1">
              {(['all', '2026', '2024', '2023', '2022', '2021', '2020', '2019'] as const).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    onSelectListeningYear(yr);
                    if (yr !== 'all') {
                      const yearTests = getTestsForYear(yr);
                      if (yearTests.length > 0) {
                        onSelectSource(yearTests[0].id);
                      }
                    } else {
                      onSelectSource('all');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xs font-mono text-xs font-semibold transition cursor-pointer select-none ${
                    selectedListeningYear === yr
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-2xs'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {yr === 'all' ? 'Tất cả năm' : `ETS ${yr}`}
                </button>
              ))}
            </div>

            {selectedListeningYear !== 'all' && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>
                    Danh sách đề Part {selectedPart} năm ETS {selectedListeningYear}:
                  </span>
                  <span className="tabular-nums">
                    {getTestsForYear(selectedListeningYear).length} đề sẵn sàng
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {getTestsForYear(selectedListeningYear).map((t, idx) => {
                    const isSelected = selectedSource === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectSource(t.id)}
                        className={`p-2 rounded-xs border text-left transition cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-bold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold">
                            Test {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1 py-0.2 rounded-2xs ${
                              isSelected
                                ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {selectedPart === 1
                              ? '6 câu'
                              : selectedPart === 2
                                ? '25 câu'
                                : selectedPart === 3
                                  ? '39 câu'
                                  : '30 câu'}
                          </span>
                        </div>
                        <div className="text-[10px] truncate opacity-80 mt-1 font-mono">{t.displayId}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bước 1: Nguồn đề thi lấy câu hỏi */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
              1
            </span>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Nguồn đề thi:
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectSource('all')}
              className={`flex items-center justify-between p-2.5 sm:px-3 sm:py-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                selectedSource === 'all'
                  ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedSource === 'all'
                      ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedSource === 'all' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                  )}
                </div>
                <span className="text-xs font-bold truncate">
                  Toàn bộ ngân hàng ({currentPartMeta.questionCount.toLocaleString('vi-VN')} câu)
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 font-bold ${
                  selectedSource === 'all'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                Khuyên dùng
              </span>
            </button>

            <div
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-sm border transition-colors ${
                selectedSource !== 'all'
                  ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (selectedSource === 'all') {
                    onSelectSource(catalog.fullTests[0]?.id || 'ets2026-01');
                  }
                }}
                className="flex items-center gap-1.5 shrink-0 cursor-pointer text-left pl-1"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedSource !== 'all'
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedSource !== 'all' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  Đề cụ thể:
                </span>
              </button>

              <select
                value={selectedSource === 'all' ? '' : selectedSource}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectSource(e.target.value);
                  }
                }}
                onFocus={() => {
                  if (selectedSource === 'all') {
                    onSelectSource(catalog.fullTests[0]?.id || 'ets2026-01');
                  }
                }}
                className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-hidden font-mono truncate"
              >
                <option value="" disabled>
                  -- Chọn đề thi cụ thể --
                </option>
                {selectedListeningYear !== 'all' && currentPartMeta.section === 'listening' ? (
                  <optgroup
                    label={`Bộ Đề ETS ${selectedListeningYear} (${getTestsForYear(selectedListeningYear).length} đề)`}
                  >
                    {getTestsForYear(selectedListeningYear).map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.displayId}] {t.title}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <>
                    <optgroup label="Bộ Đề 2026 (10 đề)">
                      {catalog.fullTests
                        .filter((t) => t.source === 'ets2026')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.displayId}] {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Bộ Đề 2024 (10 đề)">
                      {catalog.fullTests
                        .filter((t) => t.source === 'ets2024')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.displayId}] {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Bộ Đề Thực Chiến ETS Pro (20 đề)">
                      {catalog.fullTests
                        .filter((t) => (t.source as string) === 'ets_pro')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.displayId}] {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Bộ Đề Mô Phỏng (21 đề)">
                      {catalog.fullTests
                        .filter((t) => t.source === 'estudyme')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.displayId}] {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Bộ Đề Tổng Hợp (20 đề)">
                      {catalog.fullTests
                        .filter((t) => t.source === 'study4')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.displayId}] {t.title}
                          </option>
                        ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Bước 2: Bộ lọc câu hỏi thông minh */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                2
              </span>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Bộ lọc câu hỏi (Chống trùng):
              </label>
            </div>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              (Thuật toán loại trừ lịch sử học)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSelectFilterMode('unseen')}
              title="Chỉ câu mới chưa làm (Quét toàn bộ kho đề và loại bỏ 100% câu đã làm trong lịch sử)"
              className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                selectedFilterMode === 'unseen'
                  ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                    selectedFilterMode === 'unseen'
                      ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedFilterMode === 'unseen' && (
                    <div className="w-1.5 h-1.5 rounded-xs bg-slate-900 dark:bg-white" />
                  )}
                </div>
                <span className="text-xs font-bold truncate">Chỉ câu mới chưa làm</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 font-bold ${
                  selectedFilterMode === 'unseen'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                Mặc định
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterMode('mistakes')}
              title="Ôn câu từng làm sai (Tập trung củng cố những câu từng chọn sai để khắc phục điểm yếu)"
              className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                partProgress.mistakeCount === 0 ? 'opacity-70' : ''
              } ${
                selectedFilterMode === 'mistakes'
                  ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                    selectedFilterMode === 'mistakes'
                      ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedFilterMode === 'mistakes' && (
                    <div className="w-1.5 h-1.5 rounded-xs bg-slate-900 dark:bg-white" />
                  )}
                </div>
                <span className="text-xs font-bold truncate">Ôn câu từng làm sai</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums font-bold ${
                  selectedFilterMode === 'mistakes'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : partProgress.mistakeCount > 0
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {partProgress.mistakeCount} câu
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilterMode('all_random')}
              title="Xáo trộn ngẫu nhiên (Bốc ngẫu nhiên từ toàn bộ kho câu hỏi không xét lịch sử)"
              className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                selectedFilterMode === 'all_random'
                  ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                    selectedFilterMode === 'all_random'
                      ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedFilterMode === 'all_random' && (
                    <div className="w-1.5 h-1.5 rounded-xs bg-slate-900 dark:bg-white" />
                  )}
                </div>
                <span className="text-xs font-bold truncate">Xáo trộn ngẫu nhiên</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums ${
                  selectedFilterMode === 'all_random'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                Kho {partProgress.totalQuestions}
              </span>
            </button>
          </div>
        </div>

        {/* Bước 3: Số lượng câu hỏi muốn làm */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                3
              </span>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Số lượng câu hỏi:
              </label>
            </div>
            {selectedMode === 'practice' ? (
              <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                (Không giới hạn thời gian · Tự do)
              </span>
            ) : (
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                (~{estimatedTimeMinutes} phút · Tính giờ)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
            {presetsForCurrentPart.map((cnt) => {
              const isSelected = selectedCount === cnt && !customCountInput;
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    onSelectCount(cnt);
                    onCustomCountInputChange('');
                  }}
                  className={`px-3 py-1.5 rounded-sm border text-xs font-mono font-bold transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cnt} câu
                  {cnt === currentPartMeta.standardCount && (
                    <span className="ml-1 text-[10px] opacity-80 font-sans font-normal hidden sm:inline">
                      (chuẩn 1 đề)
                    </span>
                  )}
                </button>
              );
            })}

            <div className="flex items-center gap-1">
              <input
                type="number"
                min={isClusterPart ? 3 : 1}
                max={isClusterPart ? (selectedPart === 3 ? 39 : 30) : 100}
                step={isClusterPart ? 3 : 1}
                placeholder={isClusterPart ? 'Bội số của 3...' : 'Tự nhập...'}
                value={customCountInput}
                onChange={(e) => {
                  const val = e.target.value;
                  onCustomCountInputChange(val);
                  const n = parseInt(val, 10);
                  if (!isNaN(n) && n > 0) {
                    const maxAllowed = isClusterPart ? (selectedPart === 3 ? 39 : 30) : 100;
                    const minAllowed = isClusterPart ? 3 : 1;
                    onSelectCount(Math.min(maxAllowed, Math.max(minAllowed, n)));
                  }
                }}
                onBlur={() => {
                  if (isClusterPart && customCountInput) {
                    const n = parseInt(customCountInput, 10);
                    if (!isNaN(n) && n > 0) {
                      const snapped = Math.max(
                        3,
                        Math.min(selectedPart === 3 ? 39 : 30, Math.round(n / 3) * 3),
                      );
                      onCustomCountInputChange(String(snapped));
                      onSelectCount(snapped);
                    }
                  }
                }}
                className="w-20 sm:w-24 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-hidden"
              />
              <span className="text-xs text-slate-500 font-mono">câu</span>
            </div>

            {isClusterPart && (
              <div className="w-full text-center text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                * Part {selectedPart} gồm các cụm 3 câu hỏi (chọn số chia hết cho 3: 3, 6, 9, 15...).
              </div>
            )}
          </div>
        </div>

        {/* Bước 4: Hình thức làm bài */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
              4
            </span>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Hình thức làm bài:
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectMode('practice')}
              className={`flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                selectedMode === 'practice'
                  ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedMode === 'practice'
                      ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedMode === 'practice' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold truncate block">Luyện tập (Có giải thích)</span>
                  <span
                    className={`text-[10px] block truncate font-mono ${
                      selectedMode === 'practice' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'
                    }`}
                  >
                    Hiện ngay đáp án &amp; transcript
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 font-bold ml-1 ${
                  selectedMode === 'practice'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                Khuyên dùng
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('real')}
              className={`flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                selectedMode === 'real'
                  ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedMode === 'real'
                      ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                      : 'border-slate-400'
                  }`}
                >
                  {selectedMode === 'real' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold truncate block">Mô phỏng áp lực thi thật</span>
                  <span
                    className={`text-[10px] block truncate font-mono ${
                      selectedMode === 'real' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'
                    }`}
                  >
                    Đếm ngược giờ, ẩn đáp án đến nộp bài
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Launch Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            <span className="rounded-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-bold text-slate-900 dark:text-white">
              Part {currentPartMeta.part}
            </span>
            <span>·</span>
            <span className="font-semibold text-slate-900 dark:text-white">{effectiveCount} câu</span>
            <span>·</span>
            <span>
              {selectedFilterMode === 'unseen'
                ? 'Chỉ câu mới'
                : selectedFilterMode === 'mistakes'
                  ? 'Ôn câu sai'
                  : 'Ngẫu nhiên'}
            </span>
            <span>·</span>
            <span>{selectedMode === 'practice' ? 'Luyện tập (Có giải thích)' : 'Thi thử (Tính giờ)'}</span>
          </div>

          <Link
            href={`/toeic/exam/${selectedSource === 'all' ? 'bank' : selectedSource}?part=${selectedPart}&limit=${effectiveCount}&mode=${selectedMode}&filterMode=${selectedFilterMode}`}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>
              {selectedMode === 'practice'
                ? `Bắt đầu luyện Part ${currentPartMeta.part} (${effectiveCount} câu · Tự do)`
                : `Bắt đầu thi Part ${currentPartMeta.part} (${effectiveCount} câu · ${estimatedTimeMinutes}p)`}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Mobile Sticky Launch Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-md flex items-center justify-between gap-2.5">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white truncate">
            <span className="font-mono">Part {currentPartMeta.part}</span>
            <span>·</span>
            <span className="font-mono">{effectiveCount} câu</span>
            <span>·</span>
            <span className="text-[11px] font-normal text-slate-500">
              {selectedMode === 'practice' ? 'Có giải thích' : 'Thi thật'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 truncate">
            {selectedFilterMode === 'unseen'
              ? 'Chỉ câu mới'
              : selectedFilterMode === 'mistakes'
                ? 'Ôn câu từng sai'
                : 'Xáo ngẫu nhiên'}
            {selectedSource !== 'all' ? ' · Đề cụ thể' : ' · Ngân hàng'}
          </div>
        </div>

        <Link
          href={`/toeic/exam/${selectedSource === 'all' ? 'bank' : selectedSource}?part=${selectedPart}&limit=${effectiveCount}&mode=${selectedMode}&filterMode=${selectedFilterMode}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-2 text-xs font-bold transition-colors shadow-xs shrink-0"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Bắt đầu</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
