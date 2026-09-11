'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Grid,
  ChevronRight,
  ChevronLeft,
  X,
  Flag,
  CheckCircle2,
  HelpCircle,
  Bookmark,
} from 'lucide-react';
import type {
  ToeicUnifiedQuestion,
  ToeicOptionKey,
  ToeicPart,
  ToeicClientQuestion,
} from '@/types/toeic';

export interface ToeicQuestionPaletteProps {
  questions: ToeicClientQuestion[];
  answers: Record<number, ToeicOptionKey>;
  flagged: Set<number>;
  currentQNum: number;
  onSelectQuestion: (questionNumber: number) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

type PaletteFilter = 'all' | 'unanswered' | 'answered' | 'flagged';

interface PartGroup {
  part: ToeicPart;
  title: string;
  questions: ToeicClientQuestion[];
}

export function ToeicQuestionPalette({
  questions,
  answers,
  flagged,
  currentQNum,
  onSelectQuestion,
  isOpen = true,
  onToggleOpen,
  className = '',
}: ToeicQuestionPaletteProps) {
  const [filter, setFilter] = useState<PaletteFilter>('all');
  const [activePartTab, setActivePartTab] = useState<ToeicPart | 'all'>('all');
  const currentTileRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll the active question into view inside palette if opened
  useEffect(() => {
    if (currentTileRef.current) {
      currentTileRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [currentQNum]);

  // Group questions by Part (1 to 7)
  const partGroups: PartGroup[] = useMemo(() => {
    const partTitles: Record<ToeicPart, string> = {
      1: 'Part 1: Photographs',
      2: 'Part 2: Question-Response',
      3: 'Part 3: Conversations',
      4: 'Part 4: Short Talks',
      5: 'Part 5: Incomplete Sentences',
      6: 'Part 6: Text Completion',
      7: 'Part 7: Reading Comprehension',
    };

    const map = new Map<ToeicPart, ToeicClientQuestion[]>();

    for (const q of questions) {
      const list = map.get(q.part) || [];
      list.push(q);
      map.set(q.part, list);
    }

    const groups: PartGroup[] = [];
    const sortedParts = Array.from(map.keys()).sort((a, b) => a - b);

    for (const p of sortedParts) {
      groups.push({
        part: p,
        title: partTitles[p] || `Part ${p}`,
        questions: map.get(p) || [],
      });
    }

    return groups;
  }, [questions]);

  // Filter questions based on selected filter
  const filteredGroups = useMemo(() => {
    return partGroups
      .filter((g) => activePartTab === 'all' || g.part === activePartTab)
      .map((g) => {
        const filteredQ = g.questions.filter((q) => {
          const isAnswered = Boolean(answers[q.questionNumber]);
          const isFlag = flagged.has(q.questionNumber);

          if (filter === 'answered') return isAnswered;
          if (filter === 'unanswered') return !isAnswered;
          if (filter === 'flagged') return isFlag;
          return true; // 'all'
        });

        return {
          ...g,
          questions: filteredQ,
        };
      })
      .filter((g) => g.questions.length > 0);
  }, [activePartTab, answers, filter, flagged, partGroups]);

  // State metrics
  const totalCount = questions.length;
  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of questions) {
      if (answers[q.questionNumber]) count++;
    }
    return count;
  }, [answers, questions]);

  const unansweredCount = Math.max(0, totalCount - answeredCount);
  const flaggedCount = useMemo(() => {
    let count = 0;
    for (const q of questions) {
      if (flagged.has(q.questionNumber)) count++;
    }
    return count;
  }, [flagged, questions]);

  // Handle ESC key to close palette
  useEffect(() => {
    if (!isOpen || !onToggleOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggleOpen]);

  const handleTileClick = (qNum: number) => {
    onSelectQuestion(qNum);
    // On mobile viewports, can auto-close or keep open depending on user preference
  };

  return (
    <>
      {/* Floating Toggle Button when Palette is collapsed (positioned safely above footer, hidden on mobile to avoid blocking choices) */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          className="fixed right-4 bottom-20 z-40 hidden md:flex h-9 items-center gap-2 rounded-sm border border-slate-700 bg-slate-900 px-3 font-mono text-xs font-bold text-white shadow-md transition-colors hover:bg-slate-800 dark:border-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
          title="Mở bảng câu hỏi"
        >
          <Grid className="h-4 w-4" />
          <span>Bảng câu hỏi ({answeredCount}/{totalCount})</span>
        </button>
      )}

      {/* Backdrop overlay to dismiss palette drawer when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity"
          onClick={onToggleOpen}
          aria-hidden="true"
        />
      )}

      {/* Main Palette Drawer / Sidebar */}
      <aside
        aria-label="Bảng câu hỏi"
        className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-slate-200 bg-white shadow-xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-950 ${
          isOpen
            ? 'w-full sm:w-80 md:w-96 translate-x-0'
            : 'w-0 translate-x-full pointer-events-none'
        } ${className}`}
      >
        {/* Header with Title and Close Button */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 p-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xs border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Grid className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Bảng điều hướng câu hỏi
              </h2>
              <p className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                [{String(answeredCount).padStart(3, '0')}/{totalCount}] câu đã trả lời
              </p>
            </div>
          </div>

          {onToggleOpen && (
            <button
              type="button"
              onClick={onToggleOpen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer font-mono text-xs font-semibold"
              title="Đóng bảng câu hỏi (Phím tắt: Esc)"
            >
              <X className="h-3.5 w-3.5" />
              <span>Đóng</span>
              <kbd className="hidden sm:inline text-[10px] px-1 py-0.2 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                Esc
              </kbd>
            </button>
          )}
        </div>

        {/* Status Legend (4 States) */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Ký hiệu trạng thái
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Unanswered */}
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-slate-300 bg-transparent text-[9px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                -
              </span>
              <span className="text-slate-600 dark:text-slate-400">Chưa làm</span>
            </div>

            {/* 2. Answered */}
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-[9px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                A
              </span>
              <span className="text-slate-600 dark:text-slate-400">Đã trả lời</span>
            </div>

            {/* 3. Current Viewing */}
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-xs ring-2 ring-slate-900 dark:ring-white bg-white text-[9px] font-bold text-slate-900 dark:bg-slate-800 dark:text-white">
                1
              </span>
              <span className="text-slate-600 dark:text-slate-400">Đang xem</span>
            </div>

            {/* 4. Flagged */}
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-xs bg-amber-500 text-[9px] font-bold text-white">
                ⚑
              </span>
              <span className="text-slate-600 dark:text-slate-400">Gắn cờ</span>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="shrink-0 flex items-center gap-1.5 border-b border-slate-200 p-2 overflow-x-auto dark:border-slate-800 scrollbar-none font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xs px-2 py-1 whitespace-nowrap transition cursor-pointer border ${
              filter === 'all'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unanswered')}
            className={`rounded-xs px-2 py-1 whitespace-nowrap transition cursor-pointer border ${
              filter === 'unanswered'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Chưa làm ({unansweredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('answered')}
            className={`rounded-xs px-2 py-1 whitespace-nowrap transition cursor-pointer border ${
              filter === 'answered'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Đã làm ({answeredCount})
          </button>
          {flaggedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('flagged')}
              className={`inline-flex items-center gap-1 rounded-xs px-2 py-1 whitespace-nowrap transition cursor-pointer border ${
                filter === 'flagged'
                  ? 'border-amber-600 bg-amber-500 text-white font-bold'
                  : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              <Flag className="h-3 w-3 fill-current" />
              <span>Gắn cờ ({flaggedCount})</span>
            </button>
          )}
        </div>

        {/* Part Quick Tabs (Part 1 - 7) */}
        {partGroups.length > 1 && (
          <div className="shrink-0 flex items-center gap-1 border-b border-slate-200 px-2 py-1.5 overflow-x-auto dark:border-slate-800 scrollbar-none font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setActivePartTab('all')}
              className={`rounded-xs px-1.5 py-0.5 font-bold whitespace-nowrap transition cursor-pointer border ${
                activePartTab === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All
            </button>
            {partGroups.map((g) => (
              <button
                key={g.part}
                type="button"
                onClick={() => setActivePartTab(g.part)}
                className={`rounded-xs px-1.5 py-0.5 font-bold whitespace-nowrap transition cursor-pointer border ${
                  activePartTab === g.part
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                P{g.part}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Matrix Grid grouped by Part */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5 scrollbar-thin">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-500">
              Không tìm thấy câu hỏi phù hợp với bộ lọc.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.part} className="space-y-2">
                {/* Part Section Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 dark:border-slate-800">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {group.title}
                  </h3>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {group.questions.filter((q) => answers[q.questionNumber]).length}/
                    {group.questions.length}
                  </span>
                </div>

                {/* Tiles Matrix (5 columns) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {group.questions.map((q) => {
                    const qNum = q.questionNumber;
                    const isCurrent = qNum === currentQNum;
                    const isAnswered = Boolean(answers[qNum]);
                    const isFlag = flagged.has(qNum);
                    const selectedChoice = answers[qNum];

                    // Visual State Determination: 4 distinct states
                    let tileClasses = '';
                    if (isFlag) {
                      tileClasses = 'bg-amber-500 text-white border-amber-600';
                    } else if (isAnswered) {
                      tileClasses =
                        'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 font-bold';
                    } else {
                      tileClasses =
                        'bg-transparent text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200';
                    }

                    if (isCurrent) {
                      tileClasses += ' ring-2 ring-slate-900 dark:ring-white ring-offset-1 dark:ring-offset-slate-950';
                    }

                    return (
                      <button
                        key={qNum}
                        ref={isCurrent ? currentTileRef : null}
                        type="button"
                        onClick={() => handleTileClick(qNum)}
                        className={`relative flex h-9 w-full flex-col items-center justify-center rounded-xs border font-mono text-xs font-semibold tabular-nums transition-colors duration-100 cursor-pointer ${tileClasses}`}
                        title={`Câu ${qNum}${
                          isAnswered ? ` - Đã chọn: (${selectedChoice})` : ' - Chưa trả lời'
                        }${isFlag ? ' - Có gắn cờ' : ''}`}
                      >
                        <span className="leading-none">{qNum}</span>

                        {/* Tiny sub badge for answered choice or flag symbol */}
                        {isAnswered && !isFlag && (
                          <span className="text-[8px] font-mono font-black uppercase leading-none opacity-80">
                            {selectedChoice}
                          </span>
                        )}
                        {isFlag && (
                          <span className="text-[8px] leading-none text-white">
                            ⚑
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
