'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Clock,
  Headphones,
  Sparkles,
  RotateCcw,
  X,
  Layers,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import {
  getListeningVideosIndex,
  getListeningAttempt,
} from '@/lib/listening';
import { getAllVideoWatchProgress } from '@/lib/listening-recommendation';
import { TopicFilterChips } from '@/components/listening/TopicFilterChips';
import { DailyRecommendedShelf } from '@/components/listening/DailyRecommendedShelf';
import { TopicVideoShelf } from '@/components/listening/TopicVideoShelf';
import type {
  DurationFilter,
  TopicFilter,
  LevelFilter,
  ListeningTopic,
  ListeningAttempt,
  VideoWatchProgress,
  ListeningVideoIndexItem,
} from '@/types/listening';

const CANONICAL_TOPICS: ListeningTopic[] = [
  'daily_life',
  'social_conversations',
  'workplace',
  'travel',
  'food_shopping',
  'science_tech_health',
  'culture',
];

const DURATION_OPTIONS: { id: DurationFilter; label: string; desc: string }[] = [
  { id: 'all', label: 'Tất cả', desc: 'Mọi thời lượng' },
  { id: 'short', label: '3-10p', desc: '> 3 đến 10 phút' },
  { id: 'medium', label: '10-25p', desc: '> 10 đến 25 phút' },
];

const CEFR_OPTIONS: { id: LevelFilter; label: string; desc: string }[] = [
  { id: 'all', label: 'Tất cả', desc: 'Mọi cấp độ' },
  { id: 'A2', label: 'A2', desc: 'Sơ cấp' },
  { id: 'B1', label: 'B1', desc: 'Trung cấp' },
  { id: 'B2', label: 'B2', desc: 'Trung cao' },
];

export default function ListeningLibraryPage() {
  // 1. High-Performance Lightweight Index Loading (148 KB for 200 videos, <80ms)
  const allVideos = useMemo(() => getListeningVideosIndex(), []);

  // Filter States
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Watch Progress & Completion State (SSR-safe hydration)
  const [watchProgressMap, setWatchProgressMap] = useState<Record<string, VideoWatchProgress>>({});
  const [attemptsMap, setAttemptsMap] = useState<Record<string, ListeningAttempt | null>>({});

  // Asynchronously load user attempts & watch progress from localStorage on mount (zero hydration mismatch)
  useEffect(() => {
    const progress = getAllVideoWatchProgress();
    const attempts: Record<string, ListeningAttempt | null> = {};
    for (const v of allVideos) {
      attempts[v.id] = getListeningAttempt(v.id);
    }
    const timer = setTimeout(() => {
      setWatchProgressMap(progress);
      setAttemptsMap(attempts);
    }, 0);

    // Live update listeners for cross-tab or player completion events
    const handleWatchUpdate = () => {
      setWatchProgressMap(getAllVideoWatchProgress());
    };
    const handleAttemptUpdate = () => {
      const updatedAttempts: Record<string, ListeningAttempt | null> = {};
      for (const v of allVideos) {
        updatedAttempts[v.id] = getListeningAttempt(v.id);
      }
      setAttemptsMap(updatedAttempts);
    };

    window.addEventListener('lingo_listening_watch_updated', handleWatchUpdate);
    window.addEventListener('lingo_listening_attempt_completed', handleAttemptUpdate);
    window.addEventListener('storage', handleWatchUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('lingo_listening_watch_updated', handleWatchUpdate);
      window.removeEventListener('lingo_listening_attempt_completed', handleAttemptUpdate);
      window.removeEventListener('storage', handleWatchUpdate);
    };
  }, [allVideos]);

  // Compute topic counts for all 7 categories (+ all)
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allVideos.length,
    };
    for (const v of allVideos) {
      const topicKey = v.topic === 'social_stories' ? 'culture' : v.topic;
      counts[topicKey] = (counts[topicKey] || 0) + 1;
    }
    return counts;
  }, [allVideos]);

  // Instant filter execution
  const filteredVideos = useMemo(() => {
    return allVideos.filter((item) => {
      // Duration filter
      if (durationFilter !== 'all' && item.durationCategory !== durationFilter) {
        return false;
      }

      // Topic filter (7 categories + alias mapping)
      if (topicFilter !== 'all') {
        if (topicFilter === 'culture') {
          if (item.topic !== 'culture' && item.topic !== 'social_stories') return false;
        } else if (item.topic !== topicFilter) {
          return false;
        }
      }

      // CEFR Level filter
      if (levelFilter !== 'all' && item.cefrLevel !== levelFilter) {
        return false;
      }

      // Instant search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchChannel = item.channel.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTopic = item.topicDisplay.toLowerCase().includes(q);
        const matchVocab = item.coreVocabularyPreview.some((w) => w.toLowerCase().includes(q));

        if (!matchTitle && !matchChannel && !matchDesc && !matchTopic && !matchVocab) {
          return false;
        }
      }

      return true;
    });
  }, [allVideos, durationFilter, topicFilter, levelFilter, searchQuery]);

  // Group filtered videos by the 7 canonical life topics
  const videosByTopic = useMemo(() => {
    const map: Record<ListeningTopic, ListeningVideoIndexItem[]> = {
      daily_life: [],
      social_conversations: [],
      workplace: [],
      travel: [],
      food_shopping: [],
      science_tech_health: [],
      culture: [],
      social_stories: [],
    };
    for (const video of filteredVideos) {
      const topicKey = video.topic === 'social_stories' ? 'culture' : video.topic;
      if (map[topicKey]) {
        map[topicKey].push(video);
      }
    }
    return map;
  }, [filteredVideos]);

  // Reset all filters
  const handleResetFilters = () => {
    setDurationFilter('all');
    setTopicFilter('all');
    setLevelFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    durationFilter !== 'all' ||
    topicFilter !== 'all' ||
    levelFilter !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <StudentShell title="Luyện nghe Video" requireAuth={false}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-24">
        {/* Page Hero Header */}
        <div className="mb-6 rounded-2xl bg-linear-to-r from-indigo-950 via-indigo-900 to-sky-950 p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-xs">
                <Headphones className="h-3.5 w-3.5 text-indigo-300" />
                <span>200 Video Bản Ngữ • 7 Chuyên Đề Đời Sống</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Luyện Nghe Tiếng Anh Qua Video Đời Sống
              </h1>
              <p className="mt-2 text-xs font-normal text-indigo-100/90 sm:text-sm leading-relaxed max-w-xl">
                Luyện nghe ngấm tự nhiên với phụ đề song ngữ tương tác chuẩn xác từng giây. Tích hợp lặp câu A-B, 1 chạm tra từ lưu ôn tập FSRS và bài tập nghe hiểu có mốc dẫn chứng.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center backdrop-blur-xs">
                <p className="text-[10px] uppercase font-bold text-indigo-200">Kho video</p>
                <p className="text-xl font-black text-white">{allVideos.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center backdrop-blur-xs">
                <p className="text-[10px] uppercase font-bold text-indigo-200">Phù hợp</p>
                <p className="text-xl font-black text-white">{filteredVideos.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Priority Featured Shelf: "3 Video Đề Xuất Hôm Nay" */}
        <DailyRecommendedShelf
          allVideos={allVideos}
          watchMap={watchProgressMap}
          attemptsMap={attemptsMap}
        />

        {/* Filter Controls Toolbar */}
        <div className="mb-8 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          {/* Top Row: Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề video, kênh YouTube, chủ đề hoặc từ vựng..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Middle Row: Topic Filter Chips with counts */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                7 Chuyên đề đời sống (200 video tuyển chọn)
              </span>
            </div>
            <TopicFilterChips
              selectedTopic={topicFilter}
              onSelectTopic={setTopicFilter}
              topicCounts={topicCounts}
            />
          </div>

          {/* Secondary Quick Filters: Duration & CEFR Level */}
          <div className="grid gap-3 pt-3 border-t border-slate-100 sm:grid-cols-2 dark:border-slate-800">
            {/* Quick Duration Filters */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Thời lượng video</span>
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDurationFilter(opt.id)}
                    className={`rounded-lg py-1.5 text-center text-xs font-bold transition-all ${
                      durationFilter === opt.id
                        ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick CEFR Level Filters */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Cấp độ CEFR</span>
              </label>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {CEFR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLevelFilter(opt.id)}
                    className={`rounded-lg py-1.5 text-center text-xs font-bold transition-all ${
                      levelFilter === opt.id
                        ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Prompt & Reset Button */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800">
              <span>
                Đang lọc:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {filteredVideos.length} / {allVideos.length}
                </strong>{' '}
                video phù hợp
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại tất cả bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Topic Shelves Rows */}
        {filteredVideos.length > 0 ? (
          <div className="space-y-2">
            {CANONICAL_TOPICS.map((topic) => {
              const topicVideos = videosByTopic[topic] || [];
              if (topicVideos.length === 0) {
                return null;
              }
              return (
                <TopicVideoShelf
                  key={topic}
                  id={`shelf-${topic}`}
                  topic={topic}
                  videos={topicVideos}
                  watchMap={watchProgressMap}
                  attemptsMap={attemptsMap}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State when no videos match active filters */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Headphones className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Không tìm thấy video phù hợp
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Không có video nào khớp với các tiêu chí bộ lọc của bạn. Hãy thử chọn chủ đề khác hoặc xóa từ khóa tìm kiếm.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
