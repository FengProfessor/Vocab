'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Repeat, Eye, EyeOff, ArrowDown, Sparkles } from 'lucide-react';
import { findActiveCueIndex, formatTime } from '@/lib/listening';
import { WordLookupPopover } from './WordLookupPopover';
import type { TranscriptCue, CoreVocabulary, SubtitleDisplayMode } from '@/types/listening';

export interface SyncedTranscriptProps {
  cues: TranscriptCue[];
  currentTime: number;
  onSeek: (seconds: number, playImmediate?: boolean) => void;
  coreVocabulary?: CoreVocabulary[];
  subtitleMode: SubtitleDisplayMode;
  isLoopingCue: boolean;
  onToggleLoop: () => void;
  loopRange: { start: number; end: number } | null;
  onSetLoopRange: (range: { start: number; end: number } | null) => void;
  className?: string;
}

export const SyncedTranscript: React.FC<SyncedTranscriptProps> = ({
  cues,
  currentTime,
  onSeek,
  coreVocabulary = [],
  subtitleMode,
  isLoopingCue,
  onToggleLoop,
  loopRange,
  onSetLoopRange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(true);
  const [revealedHiddenCues, setRevealedHiddenCues] = useState<Record<string, boolean>>({});
  const isProgrammaticScrollRef = useRef(false);

  // Active cue calculation with O(log N) binary search and 1.2s silence gap hysteresis
  const activeIndex = findActiveCueIndex(cues, currentTime);

  // Auto-scrolling: center active cue smoothly when auto-scroll is locked
  useEffect(() => {
    if (activeIndex === -1 || !isAutoScrollLocked) return;

    const container = containerRef.current;
    if (!container) return;

    const activeElement = container.querySelector(`[data-cue-index="${activeIndex}"]`) as HTMLElement | null;
    if (activeElement) {
      isProgrammaticScrollRef.current = true;
      // Scroll ONLY within the transcript container div — NEVER scroll the main browser window!
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = relativeTop - (container.clientHeight / 2) + (elementRect.height / 2);

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });

      // Reset programmatic flag after smooth scroll finishes
      const timer = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, isAutoScrollLocked]);

  // Detect manual user scroll to pause auto-scroll
  const handleUserScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    // User interacted manually: disable auto-scroll
    setIsAutoScrollLocked(false);
  }, []);

  // Restore auto-scroll when user clicks the floating "⬇ Cuộn theo video" chip
  const handleRestoreAutoScroll = () => {
    setIsAutoScrollLocked(true);
    if (activeIndex !== -1) {
      const container = containerRef.current;
      const activeElement = container?.querySelector(`[data-cue-index="${activeIndex}"]`) as HTMLElement | null;
      if (container && activeElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = relativeTop - (container.clientHeight / 2) + (elementRect.height / 2);
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    }
  };

  // Toggle reveal for a specific hidden sentence in 'hidden' mode
  const handleToggleRevealHidden = (cueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedHiddenCues((prev) => ({
      ...prev,
      [cueId]: !prev[cueId],
    }));
  };

  // Handle cue loop toggle
  const handleToggleCueLoop = (cue: TranscriptCue, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyThisCue =
      loopRange && Math.abs(loopRange.start - cue.start) < 0.1 && Math.abs(loopRange.end - cue.end) < 0.1;

    if (isCurrentlyThisCue && isLoopingCue) {
      // Disable loop
      onToggleLoop();
      onSetLoopRange(null);
    } else {
      // Enable loop on this cue
      onSetLoopRange({ start: cue.start, end: cue.end });
      if (!isLoopingCue) {
        onToggleLoop();
      }
      onSeek(cue.start, true);
    }
  };

  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {/* Transcript Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Phụ đề đồng bộ ({cues.length} câu)
          </h3>
        </div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Chạm vào từ để tra nghĩa & lưu từ vựng
        </p>
      </div>

      {/* Scrollable Cue List */}
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 sm:p-4 scroll-smooth"
      >
        {cues.map((cue, index) => {
          const isActive = index === activeIndex;
          const isCueLooping =
            isLoopingCue &&
            loopRange &&
            Math.abs(loopRange.start - cue.start) < 0.1 &&
            Math.abs(loopRange.end - cue.end) < 0.1;
          const isRevealed = !!revealedHiddenCues[cue.id];

          return (
            <div
              key={cue.id}
              data-cue-index={index}
              onClick={() => {
                onSeek(cue.start, true);
                setIsAutoScrollLocked(true);
              }}
              className={`group relative rounded-xl border p-3 transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80'
              }`}
            >
              {/* Cue Metadata & Action buttons */}
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {formatTime(cue.start)}
                  </span>
                  {isCueLooping && (
                    <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                      <Repeat className="h-3 w-3 animate-spin" />
                      Đang lặp
                    </span>
                  )}
                </div>

                {/* Quick actions for this cue */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {/* Loop cue button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleCueLoop(cue, e)}
                    className={`flex h-6 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold transition-colors ${
                      isCueLooping
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                    title="Lặp lại câu này liên tục"
                  >
                    <Repeat className="h-3 w-3" />
                    <span>Lặp</span>
                  </button>

                  {/* Play cue button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(cue.start, true);
                      setIsAutoScrollLocked(true);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-600"
                    title="Phát câu này"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* English Transcript Sentence with Word Lookup */}
              <div className="text-sm font-medium leading-relaxed sm:text-base">
                {subtitleMode === 'hidden' && !isRevealed ? (
                  <div className="flex items-center justify-between rounded-lg bg-slate-100/80 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                    <span className="tracking-widest">••••••••••••••••••••••••</span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleRevealHidden(cue.id, e)}
                      className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Hiện câu</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <WordLookupPopover
                      sentence={cue.en}
                      coreVocabulary={coreVocabulary}
                      onWordClickSeek={() => {
                        onSeek(cue.start, true);
                        setIsAutoScrollLocked(true);
                      }}
                      className={
                        isActive
                          ? 'text-slate-950 font-bold dark:text-white'
                          : 'text-slate-800 dark:text-slate-200'
                      }
                    />
                    {subtitleMode === 'hidden' && isRevealed && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleRevealHidden(cue.id, e)}
                        className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        <EyeOff className="h-3 w-3" />
                        <span>Ẩn lại</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Vietnamese Translation (shown in 'bilingual' mode) */}
              {subtitleMode === 'bilingual' && (
                <p className="mt-1 text-xs font-normal leading-normal text-slate-500 dark:text-slate-400">
                  {cue.vi}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating "⬇ Cuộn theo video" Chip when user manual scroll has paused auto-scroll */}
      {!isAutoScrollLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={handleRestoreAutoScroll}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
            <span>⬇ Cuộn theo video</span>
          </button>
        </div>
      )}
    </div>
  );
};
