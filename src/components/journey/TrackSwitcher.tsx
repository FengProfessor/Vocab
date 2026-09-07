'use client';

import React from 'react';
import { type RoadmapTrackId } from '@/lib/roadmap-client';
import { CheckCircle2, Lock } from 'lucide-react';
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
  thptStats?: TrackStats;
  className?: string;
  disabled?: boolean;
}

export function TrackSwitcher({
  currentTrack,
  onTrackChange,
  cefrStats,
  thptStats,
  className,
  disabled = false,
}: TrackSwitcherProps) {
  const activeStats = currentTrack === 'cefr' ? cefrStats : thptStats;

  const handleTrackClick = (targetTrack: RoadmapTrackId) => {
    if (disabled || targetTrack === currentTrack) return;
    onTrackChange(targetTrack);
  };

  return (
    <div className={cn('w-full space-y-3', className)} data-testid="track-switcher">
      {/* Segmented Tab Bar */}
      <div
        role="tablist"
        aria-label="Chọn lộ trình học"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-2xl shadow-xs"
      >
        {/* CEFR Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={currentTrack === 'cefr'}
          disabled={disabled}
          onClick={() => handleTrackClick('cefr')}
          className={cn(
            'min-h-[52px] sm:min-h-[56px] w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 select-none touch-manipulation',
            currentTrack === 'cefr'
              ? 'bg-background text-foreground shadow-md ring-1 ring-black/5 dark:ring-white/10 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50 opacity-85'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-xs',
                currentTrack === 'cefr'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              🌱
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight truncate">CEFR Quốc Tế</span>
                {cefrStats?.isEnrolled ? (
                  <span className="inline-flex items-center text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                    A0–B2
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
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
            <div className="shrink-0 text-right hidden xs:block">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {cefrStats.progressPct}%
              </span>
            </div>
          )}
        </button>

        {/* THPT Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={currentTrack === 'thpt'}
          disabled={disabled}
          onClick={() => handleTrackClick('thpt')}
          className={cn(
            'min-h-[52px] sm:min-h-[56px] w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 select-none touch-manipulation',
            currentTrack === 'thpt'
              ? 'bg-background text-foreground shadow-md ring-1 ring-black/5 dark:ring-white/10 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50 opacity-85'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-xs',
                currentTrack === 'thpt'
                  ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              🎓
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight truncate">THPT Quốc Gia</span>
                {thptStats?.isEnrolled ? (
                  <span className="inline-flex items-center text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                    Lớp 10–12
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
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
            <div className="shrink-0 text-right hidden xs:block">
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {thptStats.progressPct}%
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Active Track Progress Bar & Linear Unlocking Principle */}
      {activeStats && activeStats.isEnrolled && (
        <div className="rounded-xl border bg-card/60 p-3 text-xs space-y-2">
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

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                currentTrack === 'cefr'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-red-500 to-orange-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, activeStats.progressPct))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-muted-foreground/80 shrink-0" />
              Mở khóa tuyến tính khoa học: Đạt checkpoint ≥80% để mở chặng tiếp theo
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
