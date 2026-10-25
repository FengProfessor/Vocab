'use client';

import React from 'react';
import { type RoadmapTrackId } from '@/lib/roadmap-client';
import { CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrackStats {
  completedUnits: number;
  totalUnits: number;
  progressPct: number;
  currentLevelTitle?: string;
  isEnrolled: boolean;
}

export interface TrackSwitcherProps {
  currentTrack: RoadmapTrackId;
  onTrackChange: (track: RoadmapTrackId) => void;
  cefrStats?: TrackStats;
  vocabStats?: TrackStats;
  thptStats?: TrackStats;
  toeicStats?: TrackStats;
  className?: string;
  disabled?: boolean;
}

export function TrackSwitcher({
  currentTrack,
  onTrackChange,
  cefrStats,
  vocabStats,
  thptStats,
  toeicStats,
  className,
  disabled = false,
}: TrackSwitcherProps) {
  const activeStats =
    currentTrack === 'vocab'
      ? vocabStats
      : currentTrack === 'cefr'
      ? cefrStats
      : currentTrack === 'toeic'
      ? toeicStats
      : thptStats;

  const handleTrackClick = (targetTrack: RoadmapTrackId) => {
    if (disabled || targetTrack === currentTrack) return;
    onTrackChange(targetTrack);
  };

  const handleTrackKeyDown = (e: React.KeyboardEvent, trackId: RoadmapTrackId) => {
    const tracks: RoadmapTrackId[] = ['vocab', 'cefr', 'thpt'];
    const idx = tracks.indexOf(trackId);
    let nextTrack: RoadmapTrackId | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextTrack = tracks[(idx + 1) % tracks.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextTrack = tracks[(idx - 1 + tracks.length) % tracks.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextTrack = tracks[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      nextTrack = tracks[tracks.length - 1];
    }
    if (nextTrack !== null) {
      handleTrackClick(nextTrack);
      const el = document.getElementById(`track-tab-${nextTrack}`);
      el?.focus();
    }
  };

  return (
    <div className={cn('w-full space-y-2.5', className)} data-testid="track-switcher">
      {/* Segmented Tab Bar */}
      <div
        role="tablist"
        aria-label="Chọn lộ trình học"
        className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-muted/30 dark:bg-muted/20 border border-border/70 rounded-md shadow-2xs"
      >
        {/* Vocab Foundation Tab */}
        <button
          key="track-tab-vocab"
          id="track-tab-vocab"
          type="button"
          role="tab"
          tabIndex={currentTrack === 'vocab' ? 0 : -1}
          aria-selected={currentTrack === 'vocab'}
          disabled={disabled}
          onClick={() => handleTrackClick('vocab')}
          onKeyDown={(e) => handleTrackKeyDown(e, 'vocab')}
          className={cn(
            'min-h-[52px] w-full text-left p-2 rounded transition-all duration-150 flex items-center justify-between gap-2.5 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            currentTrack === 'vocab'
              ? 'bg-background text-foreground shadow-2xs ring-1 ring-border/80 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/60 opacity-85'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded text-base font-medium border',
                currentTrack === 'vocab'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-muted/60 text-muted-foreground border-transparent'
              )}
            >
              🎯
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight truncate">Từ Vựng Cốt Lõi</span>
                <span className="inline-flex items-center text-[10px] font-semibold bg-amber-500/10 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  Mất gốc
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {vocabStats?.isEnrolled && vocabStats.completedUnits !== undefined
                  ? `${vocabStats.completedUnits}/${vocabStats.totalUnits} chặng`
                  : '100 Động từ · 5 Tầng'}
              </p>
            </div>
          </div>

          {vocabStats?.isEnrolled && (
            <div className="shrink-0 text-right hidden sm:block">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {vocabStats.progressPct}%
              </span>
            </div>
          )}
        </button>

        {/* CEFR Tab */}
        <button
          key="track-tab-cefr"
          id="track-tab-cefr"
          type="button"
          role="tab"
          tabIndex={currentTrack === 'cefr' ? 0 : -1}
          aria-selected={currentTrack === 'cefr'}
          disabled={disabled}
          onClick={() => handleTrackClick('cefr')}
          onKeyDown={(e) => handleTrackKeyDown(e, 'cefr')}
          className={cn(
            'min-h-[52px] w-full text-left p-2 rounded transition-all duration-150 flex items-center justify-between gap-2.5 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            currentTrack === 'cefr'
              ? 'bg-background text-foreground shadow-2xs ring-1 ring-border/80 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/60 opacity-85'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded text-base font-medium border',
                currentTrack === 'cefr'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-muted/60 text-muted-foreground border-transparent'
              )}
            >
              🌱
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight truncate">CEFR Quốc Tế</span>
                {cefrStats?.isEnrolled ? (
                  <span className="inline-flex items-center text-[10px] font-semibold bg-emerald-500/10 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    A0–B2
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                    + Thêm
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {cefrStats?.isEnrolled && cefrStats.currentLevelTitle
                  ? `${cefrStats.currentLevelTitle} · ${cefrStats.completedUnits}/${cefrStats.totalUnits} chặng`
                  : 'Giao tiếp toàn diện từ mất gốc'}
              </p>
            </div>
          </div>

          {cefrStats?.isEnrolled && (
            <div className="shrink-0 text-right hidden sm:block">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {cefrStats.progressPct}%
              </span>
            </div>
          )}
        </button>

        {/* THPT Tab */}
        <button
          key="track-tab-thpt"
          id="track-tab-thpt"
          type="button"
          role="tab"
          tabIndex={currentTrack === 'thpt' ? 0 : -1}
          aria-selected={currentTrack === 'thpt'}
          disabled={disabled}
          onClick={() => handleTrackClick('thpt')}
          onKeyDown={(e) => handleTrackKeyDown(e, 'thpt')}
          className={cn(
            'min-h-[52px] w-full text-left p-2 rounded transition-all duration-150 flex items-center justify-between gap-2.5 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            currentTrack === 'thpt'
              ? 'bg-background text-foreground shadow-2xs ring-1 ring-border/80 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/60 opacity-85'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded text-base font-medium border',
                currentTrack === 'thpt'
                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                  : 'bg-muted/60 text-muted-foreground border-transparent'
              )}
            >
              🎓
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight truncate">THPT Quốc Gia</span>
                {thptStats?.isEnrolled ? (
                  <span className="inline-flex items-center text-[10px] font-semibold bg-red-500/10 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-500/20 px-1.5 py-0.5 rounded">
                    Lớp 10–12
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                    + Thêm
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {thptStats?.isEnrolled && thptStats.currentLevelTitle
                  ? `${thptStats.currentLevelTitle} · ${thptStats.completedUnits}/${thptStats.totalUnits} chặng`
                  : 'Bám sát SGK Global Success & đề 2025'}
              </p>
            </div>
          </div>

          {thptStats?.isEnrolled && (
            <div className="shrink-0 text-right hidden sm:block">
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {thptStats.progressPct}%
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Active Track Progress Bar & Linear Unlocking Principle */}
      {activeStats && activeStats.isEnrolled && (
        <div className="rounded-md border border-border/70 bg-card/40 p-2 text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Tiến độ lộ trình hiện tại:
              <strong className="text-foreground font-bold">
                {activeStats.completedUnits}/{activeStats.totalUnits} chặng hoàn thành
              </strong>
            </span>
            <span className="font-bold text-foreground tabular-nums">
              {activeStats.progressPct}%
            </span>
          </div>

          <div className="relative h-1 w-full overflow-hidden rounded-xs bg-muted/80">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-xs',
                currentTrack === 'vocab'
                  ? 'bg-amber-500'
                  : currentTrack === 'cefr'
                  ? 'bg-emerald-500'
                  : currentTrack === 'toeic'
                  ? 'bg-blue-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, activeStats.progressPct))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              {currentTrack === 'vocab' ? (
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              ) : (
                <Lock className="w-3 h-3 text-muted-foreground/80 shrink-0" />
              )}
              {currentTrack === 'vocab'
                ? 'Lộ trình 5 Tầng Sư Phạm: 100 động từ làm mỏ neo cú pháp (S + V + O) & 5 cách luyện tập'
                : 'Mở khóa tuyến tính khoa học: Đạt checkpoint ≥80% để mở chặng tiếp theo'}
            </span>
            {activeStats.currentLevelTitle && (
              <span className="font-medium text-foreground shrink-0">
                {activeStats.currentLevelTitle}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
