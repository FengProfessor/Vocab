'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
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
  getTopicDisplayName,
} from '@/lib/listening';
import { reorderShelfVideos } from '@/lib/listening-recommendation';
import { ListeningVideoCard } from '@/components/listening/ListeningVideoCard';
import type {
  ListeningVideoIndexItem,
  ListeningTopic,
  VideoWatchProgress,
  ListeningAttempt,
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

export interface TopicVideoShelfProps {
  topic: ListeningTopic;
  videos: ListeningVideoIndexItem[];
  watchMap?: Record<string, Partial<VideoWatchProgress>>;
  attemptsMap?: Record<string, ListeningAttempt | null>;
  title?: string;
  id?: string;
  className?: string;
}

export function TopicVideoShelf({
  topic,
  videos,
  watchMap,
  attemptsMap,
  title,
  id,
  className = '',
}: TopicVideoShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const TopicIcon = TOPIC_ICON_MAP[topic] || Headphones;
  const badgeColor = getTopicBadgeColor(topic);
  const displayName = title || getTopicDisplayName(topic);

  // Dynamically reorder videos: unwatched / in-progress first, completed moved to tail
  const orderedVideos = useMemo(() => {
    return reorderShelfVideos(videos, watchMap, { inProgressFirst: true });
  }, [videos, watchMap]);

  // Check scroll boundary status
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll, orderedVideos.length]);

  // Handle smooth horizontal scrolling
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(300, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Hide empty shelves automatically when filtered
  if (!orderedVideos || orderedVideos.length === 0) {
    return null;
  }

  return (
    <section
      id={id || `shelf-${topic}`}
      aria-label={`Chuyên đề ${displayName}`}
      className={`mb-8 sm:mb-10 ${className}`}
    >
      {/* Shelf Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-2xs ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
          >
            <TopicIcon className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {displayName}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {orderedVideos.length} video
            </span>
          </div>
        </div>

        {/* Circular Desktop Left/Right Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label={`Cuộn sang trái chuyên đề ${displayName}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label={`Cuộn sang phải chuyên đề ${displayName}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Snap Scroll Track with Fade Masks */}
      <div className="relative">
        {/* Left edge gradient fade mask */}
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-linear-to-r from-white dark:from-slate-900 to-transparent z-10 transition-opacity duration-200"
            aria-hidden="true"
          />
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none py-1.5 px-0.5 [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {orderedVideos.map((video) => (
            <div
              key={video.id}
              className="w-[78vw] sm:w-[300px] md:w-[340px] shrink-0 snap-start"
            >
              <ListeningVideoCard
                video={video}
                attempt={attemptsMap?.[video.id]}
                watchProgress={watchMap?.[video.id]}
                watchPercent={watchMap?.[video.id]?.percent || 0}
                className="h-full shadow-2xs hover:shadow-md"
              />
            </div>
          ))}
        </div>

        {/* Right edge gradient fade mask */}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-linear-to-l from-white dark:from-slate-900 to-transparent z-10 transition-opacity duration-200"
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}
