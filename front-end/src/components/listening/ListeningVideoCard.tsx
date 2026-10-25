'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  Headphones,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sun,
  MessageSquare,
  Briefcase,
  Compass,
  ShoppingBag,
  Activity,
  Globe,
  Play,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  getTopicBadgeColor,
  getCefrBadgeStyle,
  getTopicDisplayName,
} from '@/lib/listening';
import type {
  ListeningVideoIndexItem,
  ListeningAttempt,
  ListeningTopic,
  VideoWatchProgress,
} from '@/types/listening';

const TOPIC_ICON_MAP: Record<ListeningTopic, LucideIcon> = {
  daily_life: Sun,
  social_conversations: MessageSquare,
  workplace: Briefcase,
  travel: Compass,
  food_shopping: ShoppingBag,
  science_tech_health: Activity,
  culture: Globe,
  social_stories: Globe,
};

export interface ListeningVideoCardProps {
  video: ListeningVideoIndexItem;
  attempt?: ListeningAttempt | null;
  watchPercent?: number;
  watchProgress?: Partial<VideoWatchProgress> | null;
  featuredRank?: number;
  className?: string;
}

export function ListeningVideoCard({
  video,
  attempt,
  watchPercent = 0,
  watchProgress,
  featuredRank,
  className = '',
}: ListeningVideoCardProps) {
  const topicColor = getTopicBadgeColor(video.topic);
  const cefrStyle = getCefrBadgeStyle(video.cefrLevel);
  const TopicIcon = TOPIC_ICON_MAP[video.topic] || Headphones;

  // Resolve watch percentage and status
  const rawPercent =
    typeof watchProgress?.percent === 'number'
      ? watchProgress.percent
      : watchPercent;
  const clampedWatch = Math.min(100, Math.max(0, rawPercent));

  // Completion invariant: marked complete, or >=90% watch, or attempt completed / >=80%
  const isAttemptCompleted = Boolean(
    attempt?.isCompleted || (attempt && typeof attempt.percentScore === 'number' && attempt.percentScore >= 80)
  );
  const isCompleted = Boolean(
    watchProgress?.completed === true ||
    clampedWatch >= 90 ||
    isAttemptCompleted
  );

  // In-progress: not completed, and >=5% watched
  const isInProgress = !isCompleted && clampedWatch >= 5;

  const vocabList = video.coreVocabularyPreview || [];
  const totalVocabCount = video.coreVocabularyCount || vocabList.length;
  const displayVocab = vocabList.slice(0, 4);
  const extraVocabCount = totalVocabCount - displayVocab.length;

  return (
    <Link
      href={`/practice/listening/${video.id}`}
      className={`group flex flex-col cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
        isCompleted
          ? 'border-emerald-500/60 ring-1 ring-emerald-400/40 opacity-80 hover:opacity-100 transition-opacity dark:border-emerald-500/50'
          : isInProgress
          ? 'border-indigo-300 hover:border-indigo-500 dark:border-indigo-900/70 dark:hover:border-indigo-500'
          : 'border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-600'
      } ${className}`}
    >
      {/* 16:9 Thumbnail Container with Play Overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition-all duration-200 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Featured Rank & CEFR Level Badge (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {featuredRank !== undefined && (
            <span className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-black text-white shadow-md ring-1 ring-amber-400/50">
              <Sparkles className="h-3 w-3" />
              <span>#{featuredRank}</span>
            </span>
          )}
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-black shadow-xs ${cefrStyle.bg} ${cefrStyle.text} ${cefrStyle.border}`}
          >
            {video.cefrLevel}
          </span>
        </div>

        {/* Watch Status & Attempt Badge (Top-Right) */}
        {isCompleted ? (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-md bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs ring-1 ring-emerald-400/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {attempt && typeof attempt.percentScore === 'number'
                ? `Đã hoàn thành (${attempt.percentScore}%)`
                : 'Đã hoàn thành'}
            </span>
          </div>
        ) : isInProgress ? (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-indigo-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs ring-1 ring-indigo-400/40">
            <span>Đang xem {Math.round(clampedWatch)}%</span>
          </div>
        ) : attempt && typeof attempt.percentScore === 'number' ? (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs ring-1 ring-amber-300/40">
            <CheckCircle2 className="h-3 w-3" />
            <span>Đã làm ({attempt.percentScore}%)</span>
          </div>
        ) : null}

        {/* Duration Badge (Bottom-Right) */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
          <Clock className="h-3 w-3" />
          <span>{video.durationDisplay}</span>
        </div>

        {/* Thumbnail Progress Bar (Bottom Track for In-Progress videos) */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-black/50">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${clampedWatch}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Topic Badge with Icon + Channel Name */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold shrink-0 ${topicColor.bg} ${topicColor.text} ${topicColor.border}`}
          >
            <TopicIcon className="h-3 w-3" />
            <span>{video.topicDisplay || getTopicDisplayName(video.topic)}</span>
          </span>
          <span className="text-[11px] font-medium text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
            {video.channel}
          </span>
        </div>

        {/* 2-line clamped title with consistent height across cards */}
        <h3 className="line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 sm:text-base leading-snug">
          {video.title}
        </h3>

        {/* 2-line clamped description */}
        <p className="mt-1.5 line-clamp-2 min-h-[2rem] text-xs text-slate-500 leading-relaxed dark:text-slate-400">
          {video.description}
        </p>
        {/* Core Vocabulary Preview */}
        {displayVocab.length > 0 && (
          <div className="mt-3.5 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <BookOpen className="h-3 w-3 text-indigo-500" />
              <span>{totalVocabCount} từ vựng trọng tâm:</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {displayVocab.map((vocab) => (
                <span
                  key={vocab}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {vocab}
                </span>
              ))}
              {extraVocabCount > 0 && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{extraVocabCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Action Button based on Watch State (Unwatched, In-Progress, Completed) */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Headphones className="h-3.5 w-3.5 text-indigo-500" />
              <span>{video.transcriptCuesCount} đoạn phụ đề</span>
            </div>

            {isCompleted ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:group-hover:bg-emerald-600 dark:group-hover:text-white">
                <span>Xem lại</span>
                <RotateCcw className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-45" />
              </div>
            ) : isInProgress ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all duration-200 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
                <span>Xem tiếp</span>
                <Play className="h-3.5 w-3.5 fill-current transition-transform duration-200 group-hover:scale-110" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all duration-200 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
                <span>Luyện nghe</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
