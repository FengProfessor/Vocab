'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  FileText,
  RotateCcw,
  Repeat,
  Play,
  Pause,
} from 'lucide-react';
import { SyncedTranscript } from '@/components/listening/SyncedTranscript';
import type {
  TranscriptCue,
  SubtitleDisplayMode,
  CoreVocabularyItem,
} from '@/types/listening';

export type DrawerSnapPoint = 'peek' | 'half' | 'full';

export interface MobileSubtitleDrawerProps {
  cues: TranscriptCue[];
  activeCueIndex: number;
  currentTime: number;
  onSeek: (seconds: number, playImmediate?: boolean) => void;
  subtitleMode: SubtitleDisplayMode;
  onChangeSubtitleMode?: (mode: SubtitleDisplayMode) => void;
  coreVocabulary?: CoreVocabularyItem[];
  isLoopingCue?: boolean;
  onToggleLoop?: () => void;
  loopRange?: { start: number; end: number } | null;
  onSetLoopRange?: (range: { start: number; end: number } | null) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  children?: React.ReactNode;
  defaultSnap?: DrawerSnapPoint;
  className?: string;
}

export function MobileSubtitleDrawer({
  cues,
  activeCueIndex,
  currentTime,
  onSeek,
  subtitleMode,
  onChangeSubtitleMode,
  coreVocabulary = [],
  isLoopingCue = false,
  onToggleLoop,
  loopRange = null,
  onSetLoopRange,
  isPlaying,
  onTogglePlay,
  children,
  defaultSnap = 'peek',
  className = '',
}: MobileSubtitleDrawerProps) {
  const [snap, setSnap] = useState<DrawerSnapPoint>(defaultSnap);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const activeCue = activeCueIndex >= 0 && cues[activeCueIndex] ? cues[activeCueIndex] : null;

  // Local fallback playback state detection when isPlaying prop is not explicitly passed
  const [internalPlaying, setInternalPlaying] = useState(false);
  const prevTimeRef = useRef(currentTime);
  const lastTimeChangeRef = useRef(0);

  useEffect(() => {
    if (currentTime !== prevTimeRef.current) {
      prevTimeRef.current = currentTime;
      lastTimeChangeRef.current = Date.now();
      if (!internalPlaying) {
        setInternalPlaying(true);
      }
    }
  }, [currentTime, internalPlaying]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (internalPlaying && Date.now() - lastTimeChangeRef.current > 400) {
        setInternalPlaying(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [internalPlaying]);

  const isVideoPlaying = isPlaying !== undefined ? isPlaying : internalPlaying;

  const handleTogglePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePlay) {
      onTogglePlay();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'Space',
          key: ' ',
          bubbles: true,
          cancelable: true,
        })
      );
      setInternalPlaying((prev) => !prev);
    }
  };

  // Touch gesture handling on the drag handle bar
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return;
    const delta = touchDeltaY.current;

    // Threshold for snapping
    if (delta < -40) {
      // Swiped UP -> expand
      if (snap === 'peek') setSnap('half');
      else if (snap === 'half') setSnap('full');
    } else if (delta > 40) {
      // Swiped DOWN -> collapse
      if (snap === 'full') setSnap('half');
      else if (snap === 'half') setSnap('peek');
    }

    touchStartY.current = null;
    touchDeltaY.current = 0;
  };

  // Keyboard navigation inside drawer: Escape closes to peek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && snap !== 'peek') {
        setSnap('peek');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snap]);

  const snapClasses = {
    peek: 'h-[calc(82px+env(safe-area-inset-bottom,0px))] max-h-[calc(82px+env(safe-area-inset-bottom,0px))]',
    half: 'h-[calc(52vh+env(safe-area-inset-bottom,0px))] max-h-[calc(52vh+env(safe-area-inset-bottom,0px))]',
    full: 'h-[calc(86vh+env(safe-area-inset-bottom,0px))] max-h-[calc(86vh+env(safe-area-inset-bottom,0px))]',
  };

  return (
    <>
      {/* Semi-transparent backdrop when expanded to half or full */}
      {snap !== 'peek' && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Thu nhỏ phụ đề"
          onClick={() => setSnap('peek')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setSnap('peek');
          }}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
        />
      )}

      {/* Floating Bottom Drawer */}
      <div
        ref={drawerRef}
        className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out pb-[env(safe-area-inset-bottom,0px)] dark:border-slate-800 dark:bg-slate-900/95 lg:hidden ${snapClasses[snap]} ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        data-snap={snap}
      >
        {/* Touch Handle & Snap Controls Header */}
        <div
          className="flex cursor-pointer select-none flex-col items-center border-b border-slate-100 px-3 pt-1.5 pb-2 dark:border-slate-800"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (snap === 'peek') setSnap('half');
          }}
        >
          {/* Visual pill drag handle */}
          <div className="h-1.5 w-12 rounded-full bg-slate-300 transition-colors dark:bg-slate-700" />

          {/* Controls Bar across the top of the sheet */}
          <div className="mt-1 flex w-full items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Phụ đề đồng bộ</span>
              <span className="text-[11px] font-medium text-slate-400">
                ({activeCueIndex >= 0 ? activeCueIndex + 1 : 0}/{cues.length})
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Toggle loop button if in half or full */}
              {snap !== 'peek' && onToggleLoop && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLoop();
                  }}
                  className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-all ${
                    isLoopingCue
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                  title="Lặp câu hiện tại"
                >
                  <Repeat className="h-3 w-3" />
                  <span className="hidden xs:inline">Lặp</span>
                </button>
              )}

              {/* Subtitle mode segmented picker when expanded */}
              {snap !== 'peek' && onChangeSubtitleMode && (
                <div
                  className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onChangeSubtitleMode('bilingual')}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                      subtitleMode === 'bilingual'
                        ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Song ngữ
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeSubtitleMode('en_only')}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                      subtitleMode === 'en_only'
                        ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Chỉ Anh
                  </button>
                </div>
              )}

              {/* Snap size buttons */}
              {snap === 'peek' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnap('half');
                  }}
                  className="flex h-7 items-center gap-1 rounded-lg bg-indigo-50 px-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                  title="Mở rộng phụ đề"
                >
                  <span>Mở rộng</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              ) : snap === 'half' ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setSnap('full')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    title="Toàn màn hình"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnap('peek')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    title="Thu nhỏ về dải phụ đề"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setSnap('half')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    title="Nửa màn hình"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnap('peek')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    title="Thu nhỏ về dải phụ đề"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1. Peek View Content (Compact single active cue preview) */}
        {snap === 'peek' && (
          <div
            className="flex flex-1 items-center justify-between gap-3 px-4 py-1 cursor-pointer overflow-hidden"
            onClick={() => setSnap('half')}
          >
            <div className="flex-1 min-w-0">
              {subtitleMode === 'hidden' ? (
                <p className="truncate text-xs font-semibold italic text-slate-400 dark:text-slate-500">
                  Phụ đề đang ẩn (chế độ chép chính tả) — Chạm để mở
                </p>
              ) : activeCue ? (
                <div className="space-y-0.5">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {activeCue.en}
                  </p>
                  {subtitleMode === 'bilingual' && activeCue.vi && (
                    <p className="truncate text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      {activeCue.vi}
                    </p>
                  )}
                </div>
              ) : (
                <p className="truncate text-xs italic text-slate-400 dark:text-slate-500">
                  Đang chuẩn bị đoạn tiếp theo...
                </p>
              )}
            </div>

            {/* Thumb-Zone Controls (Play/Pause & Replay) */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Quick Play/Pause button in thumb reach */}
              <button
                type="button"
                onClick={handleTogglePlayClick}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-95 ${
                  isVideoPlaying
                    ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/80'
                }`}
                title={isVideoPlaying ? 'Tạm dừng (Phím Space)' : 'Tiếp tục phát (Phím Space)'}
                aria-label={isVideoPlaying ? 'Tạm dừng phát' : 'Tiếp tục phát'}
              >
                {isVideoPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Quick replay active sentence button */}
              {activeCue && (
                <button
                  type="button"
                  onClick={() => onSeek(activeCue.start, true)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Nghe lại câu này"
                  aria-label="Nghe lại câu này"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Half or Full View Content */}
        {snap !== 'peek' && (
          <div className="flex-1 overflow-hidden p-2 sm:p-3">
            {children ? (
              children
            ) : (
              <SyncedTranscript
                cues={cues}
                currentTime={currentTime}
                onSeek={onSeek}
                coreVocabulary={coreVocabulary}
                subtitleMode={subtitleMode}
                isLoopingCue={isLoopingCue}
                onToggleLoop={onToggleLoop || (() => {})}
                loopRange={loopRange}
                onSetLoopRange={onSetLoopRange || (() => {})}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
