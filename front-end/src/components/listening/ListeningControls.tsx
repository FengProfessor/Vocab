'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Languages,
  Clock,
} from 'lucide-react';
import { formatTime } from '@/lib/listening';
import type { SubtitleDisplayMode } from '@/types/listening';

export interface ListeningControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevSentence: () => void;
  onRepeatSentence: () => void;
  onNextSentence: () => void;
  isLoopingCue: boolean;
  onToggleLoop: () => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  subtitleMode: SubtitleDisplayMode;
  onChangeSubtitleMode: (mode: SubtitleDisplayMode) => void;
  currentTime: number;
  duration: number;
  className?: string;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25] as const;

export const ListeningControls: React.FC<ListeningControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrevSentence,
  onRepeatSentence,
  onNextSentence,
  isLoopingCue,
  onToggleLoop,
  playbackRate,
  onChangePlaybackRate,
  subtitleMode,
  onChangeSubtitleMode,
  currentTime,
  duration,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 sm:p-4 ${className}`}
    >
      {/* Top row: Time info & Subtitle mode toggle */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Clock className="h-3.5 w-3.5 text-indigo-500" />
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">{formatTime(duration)}</span>
        </div>

        {/* Subtitle mode segmented selector */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          <Languages className="ml-1.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <button
            type="button"
            onClick={() => onChangeSubtitleMode('bilingual')}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
              subtitleMode === 'bilingual'
                ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Hiển thị song ngữ Anh - Việt"
          >
            Song ngữ
          </button>
          <button
            type="button"
            onClick={() => onChangeSubtitleMode('en_only')}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
              subtitleMode === 'en_only'
                ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Chỉ hiển thị tiếng Anh"
          >
            Chỉ Anh
          </button>
          <button
            type="button"
            onClick={() => onChangeSubtitleMode('hidden')}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
              subtitleMode === 'hidden'
                ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Ẩn phụ đề (luyện nghe chép chính tả)"
          >
            Ẩn phụ đề
          </button>
        </div>
      </div>

      {/* Main playback control cluster */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Navigation & Jump controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous sentence */}
          <button
            type="button"
            onClick={onPrevSentence}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Tua về câu trước (Phím ←)"
          >
            <SkipBack className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Câu trước</span>
            <kbd className="hidden lg:inline rounded bg-slate-200/70 px-1 py-0.5 text-[9px] font-mono text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              ←
            </kbd>
          </button>

          {/* Repeat current sentence */}
          <button
            type="button"
            onClick={onRepeatSentence}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Nghe lại câu hiện tại"
          >
            <RotateCcw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Nghe lại</span>
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95"
            title={isPlaying ? 'Tạm dừng video (Space)' : 'Phát video (Space)'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>

          {/* Next sentence */}
          <button
            type="button"
            onClick={onNextSentence}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Chuyển đến câu kế tiếp (Phím →)"
          >
            <span className="hidden sm:inline">Câu sau</span>
            <kbd className="hidden lg:inline rounded bg-slate-200/70 px-1 py-0.5 text-[9px] font-mono text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              →
            </kbd>
            <SkipForward className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>

        {/* Right side: Loop toggle & Speed selector */}
        <div className="flex items-center gap-2">
          {/* Sentence Loop (A-B loop) Toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all active:scale-95 ${
              isLoopingCue
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title="Lặp lại câu này liên tục (Phím L)"
          >
            <Repeat className={`h-4 w-4 ${isLoopingCue ? 'animate-pulse' : ''}`} />
            <span>{isLoopingCue ? 'Đang lặp câu' : 'Lặp câu'}</span>
            <kbd
              className={`hidden sm:inline rounded px-1 py-0.5 text-[9px] font-mono ${
                isLoopingCue
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              L
            </kbd>
          </button>

          {/* Speed Presets */}
          <div
            className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800"
            title="Tốc độ phát (Phím S để chuyển nhanh)"
          >
            {SPEED_OPTIONS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={`Tốc độ ${rate}x (Phím S)`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
