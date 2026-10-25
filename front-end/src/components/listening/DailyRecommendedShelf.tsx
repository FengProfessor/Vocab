'use client';

import React, { useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  Flame,
  Award,
} from 'lucide-react';
import {
  getDailyRecommendedVideos,
  isVideoCompleted,
} from '@/lib/listening-recommendation';
import { ListeningVideoCard } from '@/components/listening/ListeningVideoCard';
import type {
  ListeningVideoIndexItem,
  VideoWatchProgress,
  ListeningAttempt,
} from '@/types/listening';

export interface DailyRecommendedShelfProps {
  allVideos: ListeningVideoIndexItem[];
  watchMap?: Record<string, Partial<VideoWatchProgress>>;
  attemptsMap?: Record<string, ListeningAttempt | null>;
  className?: string;
}

export function DailyRecommendedShelf({
  allVideos,
  watchMap,
  attemptsMap,
  className = '',
}: DailyRecommendedShelfProps) {
  // Synchronous date resolution with suppressHydrationWarning for zero hydration issues
  const dateDisplay = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Compute 3 daily recommendations deterministically
  const recommendedVideos = useMemo(() => {
    return getDailyRecommendedVideos(allVideos, { watchMap });
  }, [allVideos, watchMap]);

  // Track completion count of daily recommendations (0/3 to 3/3)
  const completedCount = useMemo(() => {
    return recommendedVideos.filter((video) => {
      // Check watchMap completion or attempt completion
      const attempt = attemptsMap?.[video.id];
      const hasCompletedAttempt = Boolean(
        attempt?.isCompleted || (attempt && typeof attempt.percentScore === 'number' && attempt.percentScore >= 80)
      );
      return isVideoCompleted(video.id, watchMap) || hasCompletedAttempt;
    }).length;
  }, [recommendedVideos, watchMap, attemptsMap]);

  if (recommendedVideos.length === 0) {
    return null;
  }

  const allCompleted = completedCount === 3;

  return (
    <section
      aria-label="3 Video Đề Xuất Hôm Nay"
      className={`mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 via-indigo-50/20 to-white p-5 shadow-xs dark:border-indigo-950/60 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-slate-900 sm:p-6 ${className}`}
    >
      {/* Shelf Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              3 Video Đề Xuất Hôm Nay
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Tự động gợi ý 3 video chất lượng cao từ đa dạng chuyên đề đời sống, ưu tiên video mới giúp bạn duy trì thói quen luyện nghe.
          </p>
        </div>

        {/* Status Badges: Date Badge & Completion Tracker Pill */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Current Date Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs backdrop-blur-xs dark:border-indigo-800 dark:bg-slate-800/90 dark:text-indigo-300">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span suppressHydrationWarning>Gợi ý ngày {dateDisplay || 'hôm nay'}</span>
          </div>

          {/* Completion Counter Pill */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs transition-all ${
              allCompleted
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : completedCount > 0
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {allCompleted ? (
              <>
                <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Đã hoàn thành 3/3 hôm nay • Xuất sắc!</span>
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>Đã hoàn thành {completedCount}/3 hôm nay</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3 Featured Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 sm:gap-6">
        {recommendedVideos.map((video, idx) => (
          <div key={video.id} className="flex flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                <span>Lựa chọn #{idx + 1}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {video.topicDisplay}
              </span>
            </div>
            <ListeningVideoCard
              video={video}
              attempt={attemptsMap?.[video.id]}
              watchProgress={watchMap?.[video.id]}
              watchPercent={watchMap?.[video.id]?.percent || 0}
              featuredRank={idx + 1}
              className="h-full shadow-sm hover:shadow-md"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
