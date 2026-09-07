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
  CheckSquare,
  Pencil,
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
  const quizCount = video.quizCount || 4;
  const clozeCount = video.clozeCount || 4;
  const isCompleted = Boolean(attempt?.isCompleted || (attempt && attempt.percentScore >= 80));

  return (
    <Link
      href={`/practice/listening/${video.id}`}
      className="group flex flex-col cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
          isCompleted ? (
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-md bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs ring-1 ring-emerald-400/40">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Đã hoàn thành ({attempt.percentScore}%)</span>
            </div>
          ) : (
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs ring-1 ring-amber-300/40">
              <CheckCircle2 className="h-3 w-3" />
              <span>Đang luyện ({attempt.percentScore}%)</span>
            </div>
          )
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
        {/* Topic Badge with Icon + Channel Name (Full display without truncation) */}
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

        {/* Exercise Counter Pills (Quiz & Cloze) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200/70 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300">
            <CheckSquare className="h-3 w-3 text-sky-600 dark:text-sky-400" />
            <span>{quizCount} câu trắc nghiệm</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
            <Pencil className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span>{clozeCount} câu điền từ</span>
          </span>
        </div>

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

        {/* Modern Refined Bottom Action Bar (Replaces monolithic purple block) */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Headphones className="h-3.5 w-3.5 text-indigo-500" />
              <span>{video.transcriptCuesCount} đoạn phụ đề</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all duration-200 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
              <span>Luyện nghe</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
