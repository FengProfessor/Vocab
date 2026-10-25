'use client';

import React, { useRef } from 'react';
import {
  Headphones,
  Sun,
  MessageSquare,
  Briefcase,
  Compass,
  ShoppingBag,
  Activity,
  Globe,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import type { TopicFilter, ListeningTopic } from '@/types/listening';

export interface TopicChipConfig {
  id: TopicFilter;
  label: string;
  topic?: ListeningTopic;
}

export const TOPIC_CHIP_CONFIGS: TopicChipConfig[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'daily_life', label: 'Đời sống', topic: 'daily_life' },
  { id: 'social_conversations', label: 'Giao tiếp', topic: 'social_conversations' },
  { id: 'workplace', label: 'Công việc', topic: 'workplace' },
  { id: 'travel', label: 'Du lịch', topic: 'travel' },
  { id: 'food_shopping', label: 'Ẩm thực & Mua sắm', topic: 'food_shopping' },
  { id: 'science_tech_health', label: 'Khoa học & Sức khỏe', topic: 'science_tech_health' },
  { id: 'culture', label: 'Văn hóa & TED', topic: 'culture' },
];

const TOPIC_ICON_MAP: Record<TopicFilter, LucideIcon> = {
  all: Headphones,
  daily_life: Sun,
  social_conversations: MessageSquare,
  workplace: Briefcase,
  travel: Compass,
  food_shopping: ShoppingBag,
  science_tech_health: Activity,
  culture: Globe,
  social_stories: Globe,
};

interface TopicFilterChipsProps {
  selectedTopic: TopicFilter;
  onSelectTopic: (topic: TopicFilter) => void;
  topicCounts?: Record<string, number>;
}

export function TopicFilterChips({
  selectedTopic,
  onSelectTopic,
  topicCounts = {},
}: TopicFilterChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Optional Left Scroll Arrow for Desktop */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Cuộn trái"
        className="hidden sm:flex mr-1.5 h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 shadow-xs backdrop-blur-xs transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Horizontal Scrollable Chips Row */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 items-center gap-2 overflow-x-auto py-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {TOPIC_CHIP_CONFIGS.map((chip) => {
          const isSelected = selectedTopic === chip.id;
          const Icon = TOPIC_ICON_MAP[chip.id] || Headphones;
          const count = topicCounts[chip.id];

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectTopic(chip.id)}
              className={`group inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30 dark:bg-indigo-500'
                  : 'border border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
                  isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
                }`}
              />
              <span>{chip.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black transition-colors ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/90 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Optional Right Scroll Arrow for Desktop */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Cuộn phải"
        className="hidden sm:flex ml-1.5 h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 shadow-xs backdrop-blur-xs transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
