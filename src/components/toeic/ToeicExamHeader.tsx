'use client';

import React from 'react';
import {
  Clock,
  AlertTriangle,
  Pause,
  Send,
  Headphones,
  BookOpen,
  Flag,
  Grid,
  Lightbulb,
} from 'lucide-react';
import type { ToeicSection, ToeicPart, ToeicExamMode } from '@/types/toeic';

export interface ToeicExamHeaderProps {
  title: string;
  section?: ToeicSection;
  currentPart?: ToeicPart;
  formattedTime: string;
  isTimeWarning?: boolean;
  timeRemainingSeconds?: number;
  answeredCount: number;
  totalQuestions: number;
  flaggedCount?: number;
  mode?: ToeicExamMode;
  onToggleMode?: () => void;
  onPause: () => void;
  onSubmit: () => void;
  onOpenPalette?: () => void;
  isPaused?: boolean;
  allowPause?: boolean;
  className?: string;
}

export function ToeicExamHeader({
  title,
  section,
  currentPart,
  formattedTime,
  isTimeWarning = false,
  answeredCount,
  totalQuestions,
  flaggedCount = 0,
  mode = 'real',
  onToggleMode,
  onPause,
  onSubmit,
  onOpenPalette,
  isPaused = false,
  allowPause = true,
  className = '',
}: ToeicExamHeaderProps) {
  const percentComplete =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const isListening = section === 'listening' || (currentPart && currentPart <= 4);

  return (
    <header
      className={`sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 shadow-none dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      {/* Left: Title & Section / Part Badge */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 max-w-[140px] sm:max-w-xs md:max-w-md">
            {title}
          </h1>

          {/* Section badge */}
          <span className="hidden sm:inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
            {isListening ? (
              <>
                <Headphones className="h-3 w-3" />
                <span>Listening</span>
              </>
            ) : (
              <>
                <BookOpen className="h-3 w-3" />
                <span>Reading</span>
              </>
            )}
          </span>

          {/* Part indicator */}
          {currentPart && (
            <span className="inline-flex rounded-sm border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
              Part {currentPart}
            </span>
          )}
        </div>

        {/* Question progress */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
          <span>
            [{String(answeredCount).padStart(3, '0')}/{totalQuestions}]
          </span>
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Flag className="h-3 w-3 fill-amber-500" />
              {flaggedCount}
            </span>
          )}
        </div>
      </div>

      {/* Center: Digital Countdown Timer */}
      <div className="flex items-center">
        <div
          className={`flex items-center gap-1.5 rounded-sm px-3 py-1 font-mono text-xs sm:text-sm font-bold tabular-nums tracking-wider border transition-colors ${
            isTimeWarning
              ? 'border-rose-500 bg-rose-50 text-rose-600 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
              : 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
          }`}
          title={isTimeWarning ? 'Thời gian còn dưới 5 phút!' : 'Thời gian làm bài còn lại'}
        >
          {isTimeWarning ? (
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          )}
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Right: Mode Toggle, Palette, Pause & Submit Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onToggleMode && (
          <button
            type="button"
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-mono font-bold transition-colors cursor-pointer border ${
              mode === 'practice'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
            title={
              mode === 'practice'
                ? 'Đang bật giải thích ngay sau khi chọn đáp án. Bấm để chuyển sang Thi thử.'
                : 'Đang ở chế độ Thi thử (ẩn đáp án). Bấm để BẬT giải thích chi tiết ngay.'
            }
          >
            <Lightbulb
              className={`h-3.5 w-3.5 ${
                mode === 'practice'
                  ? 'fill-emerald-500 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-300'
                  : 'text-slate-400'
              }`}
            />
            <span className="hidden sm:inline">
              {mode === 'practice' ? 'Giải thích: BẬT' : 'Giải thích: TẮT'}
            </span>
          </button>
        )}

        {onOpenPalette && (
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono font-medium text-slate-700 shadow-none transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Mở bảng điều hướng câu hỏi"
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bảng câu hỏi</span>
          </button>
        )}

        {allowPause && (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-none transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Tạm dừng làm bài"
          >
            <Pause className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-1.5 rounded-sm bg-slate-900 px-3.5 py-1 text-xs font-bold text-white shadow-none transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
        >
          <Send className="h-3 w-3" />
          <span>Nộp bài</span>
        </button>
      </div>
    </header>
  );
}
