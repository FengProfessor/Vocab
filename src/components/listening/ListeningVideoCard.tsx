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

interface ListeningVideoCardProps {
  video: ListeningVideoIndexItem;
  attempt?: ListeningAttempt | null;
  watchPercent?: number;
}

export function ListeningVideoCard({
  video,
  attempt,
  watchPercent = 0,
}: ListeningVideoCardProps) {
  const topicColor = getTopicBadgeColor(video.topic);
  const cefrStyle = getCefrBadgeStyle(video.cefrLevel);
  const TopicIcon = TOPIC_ICON_MAP[video.topic] || Headphones;
  const clampedWatch = Math.min(100, Math.max(0, watchPercent));

  const vocabList = video.coreVocabularyPreview || [];
  const totalVocabCount = video.coreVocabularyCount || vocabList.length;
  const displayVocab = vocabList.slice(0, 4);
  const extraVocabCount = totalVocabCount - displayVocab.length;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      {/* 16:9 Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* CEFR Level Badge (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-black shadow-xs ${cefrStyle.bg} ${cefrStyle.text} ${cefrStyle.border}`}
          >
            {video.cefrLevel}
          </span>
        </div>

        {/* Attempt / Watch Progress Badge (Top-Right) */}
        {attempt ? (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Đã làm ({attempt.percentScore}%)</span>
          </div>
        ) : clampedWatch > 0 ? (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
            <span>Đã xem {Math.round(clampedWatch)}%</span>
          </div>
        ) : null}

        {/* Duration Badge (Bottom-Right) */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
          <Clock className="h-3 w-3" />
          <span>{video.durationDisplay}</span>
        </div>

        {/* Watch Progress Bar (Bottom Track) */}
        {clampedWatch > 0 && (
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
        {/* Topic Badge with Icon + Channel */}
        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${topicColor.bg} ${topicColor.text} ${topicColor.border}`}
          >
            <TopicIcon className="h-3 w-3" />
            <span>{video.topicDisplay || getTopicDisplayName(video.topic)}</span>
          </span>
          <span className="truncate text-slate-400 dark:text-slate-500 font-medium max-w-[150px]">
            {video.channel}
          </span>
        </div>

        {/* 2-line clamped title */}
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 sm:text-base leading-snug">
          {video.title}
        </h3>

        {/* 2-line clamped description */}
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {video.description}
        </p>

        {/* Core Vocabulary Preview */}
        {displayVocab.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
              <span>{totalVocabCount} từ vựng trọng tâm:</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {displayVocab.map((vocab) => (
                <span
                  key={vocab}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {vocab}
                </span>
              ))}
              {extraVocabCount > 0 && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{extraVocabCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-4">
          <Link
            href={`/practice/listening/${video.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-[0.98] dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>Bắt đầu luyện nghe</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
