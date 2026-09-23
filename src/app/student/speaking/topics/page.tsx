'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Mic,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudentShell } from '@/components/student/StudentShell';
import { allTopicLibraryItems } from '@/data/speaking/topic-library';
import {
  TOPIC_LIBRARY_CATEGORY_LABELS,
  TOPIC_LIBRARY_CATEGORY_ICONS,
  type TopicLibraryCategory,
  type TopicLibraryItem,
  type TopicLibraryCefrLevel,
} from '@/types/speaking-topic-library';

const PRIMARY_CATEGORIES: TopicLibraryCategory[] = [
  'describing',
  'daily_situations',
  'social',
  'workplace_extended',
];

const CATEGORY_DESCRIPTIONS: Record<TopicLibraryCategory, string> = {
  describing: 'Miêu tả đồ vật, con người, phong cảnh và biểu đồ đa dạng ngữ cảnh.',
  daily_situations: 'Tình huống sinh hoạt, mua sắm, nhà hàng, chỉ đường và dịch vụ.',
  social: 'Giao tiếp bạn bè, kết nối xã hội, thảo luận sở thích và cảm xúc.',
  workplace_extended: 'Môi trường làm việc, họp hành, thương thảo và phát triển nghề nghiệp.',
};

const CEFR_LEVEL_TABS: Array<{ label: string; value: 'ALL' | TopicLibraryCefrLevel }> = [
  { label: 'Tất cả cấp độ', value: 'ALL' },
  { label: 'A1 - Nhập môn', value: 'A1' },
  { label: 'A2 - Cơ bản', value: 'A2' },
  { label: 'B1 - Trung cấp', value: 'B1' },
  { label: 'B2 - Nâng cao', value: 'B2' },
];

const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80';

function resolveTopicImageUrl(topic: TopicLibraryItem): string {
  return (
    topic.imageUrl ||
    topic.keyVocabulary?.find((v) => Boolean(v.imageUrl))?.imageUrl ||
    topic.keyVocabulary?.[0]?.imageUrl ||
    FALLBACK_IMAGE_URL
  );
}

function getCefrBadgeClasses(level: TopicLibraryCefrLevel): string {
  switch (level) {
    case 'A1':
      return 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40';
    case 'A2':
      return 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40';
    case 'B1':
      return 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40';
    case 'B2':
      return 'border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40';
    default:
      return 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900';
  }
}

interface TopicCardProps {
  topic: TopicLibraryItem;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic }) => {
  const [imageSrc, setImageSrc] = useState<string>(() => resolveTopicImageUrl(topic));

  const handleImageError = useCallback(() => {
    setImageSrc(FALLBACK_IMAGE_URL);
  }, []);

  const vocabCount = topic.keyVocabulary?.length || 0;

  return (
    <Link
      href={`/student/speaking/topics/${topic.id}`}
      className="group flex flex-col w-[260px] sm:w-[285px] shrink-0 snap-start border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none hover:border-slate-400 dark:hover:border-slate-600 transition-colors rounded-none"
      title={`${topic.titleEn} - ${topic.titleVi}`}
    >
      {/* 16:9 Image Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 rounded-none">
        <img
          src={imageSrc}
          alt={topic.titleEn}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102 rounded-none"
          loading="lazy"
          onError={handleImageError}
        />

        {/* Monospace CEFR Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              'font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border rounded-none',
              getCefrBadgeClasses(topic.level)
            )}
          >
            {topic.level}
          </span>
        </div>

        {/* Subcategory Label */}
        {topic.subcategory && (
          <div className="absolute top-2 right-2 max-w-[130px] truncate">
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-slate-700/80 bg-slate-900/80 text-slate-200 backdrop-blur-xs rounded-none block truncate">
              {topic.subcategory}
            </span>
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {topic.titleEn}
            </h4>
            {topic.icon && <span className="text-xs shrink-0 select-none">{topic.icon}</span>}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {topic.titleVi}
          </p>

          {topic.situationVi && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">
              {topic.situationVi}
            </p>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span>{vocabCount} từ vựng</span>
          <span className="uppercase font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
            Luyện nói <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};

interface CategoryCarouselProps {
  category: TopicLibraryCategory;
  topics: TopicLibraryItem[];
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ category, topics }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const label = TOPIC_LIBRARY_CATEGORY_LABELS[category] || category;
  const icon = TOPIC_LIBRARY_CATEGORY_ICONS[category] || '📁';
  const description = CATEGORY_DESCRIPTIONS[category];

  return (
    <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none shadow-none p-4 sm:p-5">
      {/* Category Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base select-none">{icon}</span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
              {label}
            </h3>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
              {topics.length} chủ đề
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Desktop Left/Right Scroll Buttons */}
        {topics.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors rounded-none shadow-none"
              aria-label={`Cuộn sang trái ${label}`}
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors rounded-none shadow-none"
              aria-label={`Cuộn sang phải ${label}`}
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Carousel */}
      {topics.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none py-1 px-0.5 [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-none bg-slate-50/50 dark:bg-slate-950/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Không có chủ đề nào phù hợp với bộ lọc trong danh mục này.
          </p>
        </div>
      )}
    </section>
  );
};

export default function SpeakingTopicLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | TopicLibraryCefrLevel>('ALL');

  // Filter topics based on search query and CEFR level
  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allTopicLibraryItems.filter((item) => {
      const matchLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      if (!matchLevel) return false;

      if (!q) return true;

      const inEn = item.titleEn?.toLowerCase().includes(q);
      const inVi = item.titleVi?.toLowerCase().includes(q);
      const inSub = item.subcategory?.toLowerCase().includes(q);
      const inSituation = item.situationVi?.toLowerCase().includes(q);
      const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      const inVocab = item.keyVocabulary?.some(
        (v) => v.term.toLowerCase().includes(q) || v.meaningVi.toLowerCase().includes(q)
      );

      return inEn || inVi || inSub || inSituation || inTags || inVocab;
    });
  }, [searchQuery, selectedLevel]);

  // Group filtered topics into the 4 primary categories
  const topicsByCategory = useMemo(() => {
    const grouped: Record<TopicLibraryCategory, TopicLibraryItem[]> = {
      describing: [],
      daily_situations: [],
      social: [],
      workplace_extended: [],
    };

    filteredTopics.forEach((item) => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });

    return grouped;
  }, [filteredTopics]);

  // Summary statistics
  const totalTopics = allTopicLibraryItems.length;
  const matchCount = filteredTopics.length;
  const isFiltering = searchQuery.trim() !== '' || selectedLevel !== 'ALL';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedLevel('ALL');
  }, []);

  return (
    <StudentShell
      title="Thư Viện Chủ Đề Nói (250+ Topics)"
      contentClassName="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Breadcrumb Navigation */}
        <nav
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono"
          aria-label="Breadcrumb"
        >
          <Link
            href="/student/speaking"
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            Luyện nói AI
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold">
            Thư viện chủ đề
          </span>
        </nav>

        {/* Dashboard Header Banner */}
        <header className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none shadow-none p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl select-none">🎙️</span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Thư Viện Chủ Đề Nói Tiếng Anh
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Kho tài nguyên 229+ kịch bản hội thoại thực tế được làm giàu toàn diện với hình ảnh trực quan,
                cặp từ vựng then chốt, cụm hành động song ngữ và dàn bài phản xạ giao tiếp theo chuẩn CEFR (A1 - B2).
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 pt-2 lg:pt-0">
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-none text-center">
                <span className="block font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {totalTopics}
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  Chủ đề
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-none text-center">
                <span className="block font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  4
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  Danh mục
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-none text-center">
                <span className="block font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  A1-B2
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  Cấp độ
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-none text-center">
                <span className="block font-mono text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  100%
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  Hình ảnh
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Search & Filter Toolbar */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm chủ đề, từ vựng (ví dụ: coffee, interview, airport)..."
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 dark:focus:border-slate-300 rounded-none shadow-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* CEFR Level Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CEFR_LEVEL_TABS.map((tab) => {
                const isActive = selectedLevel === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedLevel(tab.value)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-mono transition-colors border rounded-none shadow-none',
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Status Indicator */}
          {isFiltering && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>
                Tìm thấy <strong>{matchCount}</strong> / {totalTopics} chủ đề phù hợp
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-indigo-600 dark:text-indigo-400 hover:underline uppercase text-[11px] font-bold"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </header>

        {/* 4 Category Carousel Rows */}
        <div className="space-y-6 sm:space-y-8">
          {PRIMARY_CATEGORIES.map((catKey) => {
            const catTopics = topicsByCategory[catKey] || [];
            return <CategoryCarousel key={catKey} category={catKey} topics={catTopics} />;
          })}
        </div>

        {/* Global Empty State */}
        {matchCount === 0 && (
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none shadow-none p-12 text-center">
            <Compass className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Không tìm thấy chủ đề nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Không có kịch bản nào khớp với từ khóa &ldquo;{searchQuery}&rdquo; ở cấp độ đã chọn.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-4 py-2 border border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-mono uppercase tracking-wider rounded-none shadow-none hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Xóa bộ lọc và xem tất cả
            </button>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
