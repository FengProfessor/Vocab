'use client';
import { authFetch } from '@/lib/auth-fetch';


import { useState, useEffect, useMemo, useRef, use } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Dumbbell,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lightbulb,
  AlertTriangle,
  ArrowLeftRight,
  TableProperties,
  ArrowLeft,
  Compass,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CefrLevel } from '@/lib/grammar-types';
import {
  UNIFIED_GRAMMAR_TOPICS,
  GRAMMAR_STAGES,
  getTopicBySlug,
} from '@/lib/grammar-roadmap-data';
import VettedMediaCard from '@/components/grammar/VettedMediaCard';
import GrammarReferenceTable, { type GrammarTheoryData, type FormulaRow } from '@/components/grammar/GrammarReferenceTable';
import GrammarVisualTopicDeck from '@/components/grammar/GrammarVisualTopicDeck';
import GrammarVideoPlayer from '@/components/grammar/GrammarVideoPlayer';
import FormattedText from '@/components/grammar/FormattedText';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import topicAssetsData from '@/data/grammar-topic-assets.json';

interface TopicProgress {
  topic_id: string;
  total_lessons: number;
  completed_lessons: number;
  accuracy: number;
}

interface TopicAssetItem {
  image?: string;
  imageAlt?: string;
  caption?: string;
  usageAnalysisVi?: {
    rule?: string;
    contextReason?: string;
    commonMistake?: string;
  };
  audio?: string;
}

interface TheoryData extends GrammarTheoryData {
  slug?: string;
  title?: string;
  title_vi?: string;
  level?: string;
  definition?: string;
  usage?: { label: string; en: string; vi: string }[];
  formula?: {
    rows: FormulaRow[];
    note?: string;
  };
  rules?: Array<{ case?: string; rule?: string; example?: string; [key: string]: unknown }>;
  signals?: string[];
  mistakes?: Array<{ wrong: string; right: string; why: string; [key: string]: unknown }>;
  bilingual_examples?: Array<{ en?: string; vi?: string; note?: string; annotations?: Array<{ word: string; start: number; end: number; role: string }> }>;
  tips?: string;
  comparison?: string;
  timeline?: Record<string, unknown> | null;
  [key: string]: unknown;
}

function GrammarAccordionItem({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-none bg-card transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full min-h-[44px] p-3.5 flex items-center justify-between text-left hover:bg-muted/20 transition-colors rounded-none"
      >
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
          {icon}
          <span>{title}</span>
          {badge && (
            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-border bg-muted/40 text-muted-foreground rounded-none ml-1">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs font-mono">
          <span className="text-[11px] hidden sm:inline">{isOpen ? 'Thu gọn' : 'Xem chi tiết'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-border/60 animate-in fade-in-50 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

type PageSearchParams = Record<string, string | string[] | undefined>;

/** Chuyển searchParams (prop của page) sang URLSearchParams, giữ nguyên param lặp lại. */
function toUrlSearchParams(params: PageSearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => sp.append(key, v));
    else if (value !== undefined) sp.append(key, value);
  }
  return sp;
}

function GrammarRoadmapContent({ queryString }: { queryString: string }) {
  const router = useRouter();
  const searchParams = useMemo(() => new URLSearchParams(queryString), [queryString]);

  // Search parameters
  const initialLevel = (searchParams.get('level') as CefrLevel) || 'ALL';
  const initialTopic = searchParams.get('topic');
  const initialSearch = searchParams.get('search') || '';

  // Transparent redirect for legacy drill params (?review=1, ?review=true, ?mode=review, ?lesson=..., ?class=...)
  useEffect(() => {
    const isReview =
      searchParams.get('review') === '1' ||
      searchParams.get('review') === 'true' ||
      searchParams.get('reviewMode') === '1' ||
      searchParams.get('mode') === 'review';
    const classroomId = searchParams.get('class') || searchParams.get('classroomId');
    const lessonId = searchParams.get('lesson') || searchParams.get('lessonId');

    if (isReview || classroomId || lessonId) {
      const p = new URLSearchParams(searchParams.toString());
      router.replace(`/grammar/practice?${p.toString()}`);
    }
  }, [searchParams, router]);

  // State
  const [activeLevel, setActiveLevel] = useState<CefrLevel | 'ALL'>(
    ['A0', 'A1', 'A2', 'B1', 'B2'].includes(initialLevel) ? initialLevel : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(initialTopic);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [theoryData, setTheoryData] = useState<TheoryData | null>(null);
  const [theoryTab, setTheoryTab] = useState<'theory' | 'details' | 'table' | 'video' | 'examples' | 'media'>('theory');
  const theoryTriggerRef = useRef<HTMLElement | null>(null);
  const theoryCloseRef = useRef<HTMLButtonElement | null>(null);
  const theoryContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => grammarAudio.stopAll(), [selectedTopicSlug]);

  useEffect(() => {
    theoryContentRef.current?.scrollTo({ top: 0 });
    grammarAudio.stopAll();
  }, [theoryTab]);

  // User progress
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgress>>({});

  useEffect(() => {
    const fetchProgress = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/grammar/progress?view=topics', {
        headers: session?.user ? { 'X-LingoPro-Request': '1' } : {},
      }).catch(() => null);

      if (res?.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const map: Record<string, TopicProgress> = {};
          for (const item of json.data) {
            if (item.topic_slug) map[item.topic_slug] = item;
          }
          setProgressMap(map);
        }
      }
    };
    fetchProgress();
  }, []);

  // Update selected topic when searchParams change
  useEffect(() => {
    if (initialTopic) {
      setSelectedTopicSlug(initialTopic);
    }
  }, [initialTopic]);

  // Fetch theory content when a topic is selected
  useEffect(() => {
    if (!selectedTopicSlug) {
      setTheoryData(null);
      return;
    }

    // Reset tab to primary theory view on every topic switch
    setTheoryTab('theory');

    let isMounted = true;
    const loadTheory = async () => {
      setTheoryLoading(true);
      try {
        // 1. Fetch comprehensive structured theory from API
        const res = await authFetch(`/api/grammar/theory?topic=${encodeURIComponent(selectedTopicSlug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data && isMounted) {
            setTheoryData(json.data);
            return;
          }
        }

        // Khi mất kết nối, chỉ dùng tóm tắt đúng chủ điểm; không gán công thức chung cho mọi bài.
        const topicObj = getTopicBySlug(selectedTopicSlug);
        if (topicObj && isMounted) {
          setTheoryData({
            definition: topicObj.summary,
          });
        }
      } catch (err) {
        console.error('[Grammar] Failed to load topic theory:', err);
        const topicObj = getTopicBySlug(selectedTopicSlug);
        if (topicObj && isMounted) setTheoryData({ definition: topicObj.summary });
      } finally {
        if (isMounted) setTheoryLoading(false);
      }
    };

    loadTheory();
    return () => {
      isMounted = false;
    };
  }, [selectedTopicSlug]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    let result = UNIFIED_GRAMMAR_TOPICS;

    if (activeLevel !== 'ALL') {
      result = result.filter((t) => t.level === activeLevel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.title_vi.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeLevel, searchQuery]);

  const activeTopic = selectedTopicSlug ? getTopicBySlug(selectedTopicSlug) : null;

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 h-12 sm:h-14 flex items-center shrink-0">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-3">
          <Link
            href="/student"
            className="inline-flex min-h-[44px] items-center gap-1.5 sm:gap-2 font-mono text-xs uppercase tracking-wider font-semibold border border-border px-2.5 sm:px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-none shrink-0"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-primary" />
            <span className="hidden sm:inline">Về Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/journey"
              className="hidden md:inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold border border-border px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-none"
            >
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span>Lộ trình học</span>
            </Link>
            <Link
              href="/grammar/practice?mode=review"
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold border border-border bg-card hover:bg-muted text-foreground px-2.5 sm:px-3 py-1.5 rounded-none transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Ôn câu sai (14 ngày)</span>
              <span className="sm:hidden">Ôn câu sai</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Top Banner / Hero */}
      <section className="border-b border-border bg-card px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 flex-wrap">
                <Link href="/student" className="hover:text-foreground hover:underline flex items-center gap-1 text-primary">
                  <ArrowLeft className="h-3 w-3" />
                  <span>Dashboard</span>
                </Link>
                <span>/</span>
                <span className="px-1.5 py-0.5 border border-border bg-muted/30 rounded-none">Lộ trình chuẩn hóa</span>
                <span>•</span>
                <span>62 Chủ điểm CEFR A0 – B2</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Lộ trình Ngữ pháp Tiếng Anh Toàn diện
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Hệ thống 62 chủ điểm ngữ pháp từ căn bản (A0) tới nâng cao học thuật (B2), xây dựng
                theo khung năng lực Châu Âu và tiêu chuẩn giảng dạy ngữ pháp ứng dụng.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên chủ điểm, quy tắc (ví dụ: to be, present simple, mệnh đề, câu chẻ)..."
              className="w-full border border-border bg-background pl-10 pr-10 py-3 rounded-none font-mono text-sm focus:outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40 scrollbar-none">
            <button
              onClick={() => setActiveLevel('ALL')}
              className={`min-h-[44px] inline-flex items-center justify-center px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap ${
                activeLevel === 'ALL'
                  ? 'border-foreground bg-foreground text-background font-bold'
                  : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả (62)
            </button>
            {GRAMMAR_STAGES.map((stg) => {
              const isActive = activeLevel === stg.id;
              return (
                <button
                  key={stg.id}
                  onClick={() => setActiveLevel(stg.id)}
                  className={`min-h-[44px] inline-flex items-center justify-center px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap gap-1.5 ${
                    isActive
                      ? 'border-foreground bg-foreground text-background font-bold'
                      : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="font-bold">{stg.id}</span>
                  <span className="hidden sm:inline opacity-80">— {stg.nameVi}</span>
                  <span className="text-[10px] opacity-60">({stg.topicCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Roadmap Grid */}
      <section className="max-w-5xl w-full mx-auto px-4 py-8 flex-1">
        {filteredTopics.length === 0 ? (
          <div className="border border-border p-12 text-center bg-card rounded-none flex flex-col items-center justify-center gap-4">
            <Search className="h-8 w-8 text-muted-foreground/40" />
            <h3 className="font-serif font-bold text-lg">Không tìm thấy chủ điểm phù hợp</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Không có chủ điểm ngữ pháp nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;. Vui lòng thử từ khóa khác.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveLevel('ALL');
              }}
              className="mt-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold rounded-none hover:bg-muted"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>HIỂN THỊ {filteredTopics.length} / 62 CHỦ ĐIỂM</span>
              {activeLevel !== 'ALL' && (
                <span className="uppercase">CẤP ĐỘ {activeLevel}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTopics.map((topic) => {
                const isSelected = selectedTopicSlug === topic.slug;
                const pInfo = progressMap[topic.slug];
                const isCompleted = pInfo && pInfo.completed_lessons > 0;

                return (
                  <div
                    key={topic.slug}
                    className={`border p-5 bg-card rounded-none transition-all flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-foreground/40'
                    }`}
                  >
                    <div
                      onClick={(event) => { theoryTriggerRef.current = event.currentTarget; setSelectedTopicSlug(topic.slug); }}
                      className="cursor-pointer group/card"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          theoryTriggerRef.current = e.currentTarget;
                          setSelectedTopicSlug(topic.slug);
                        }
                      }}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            #{topic.order < 10 ? '0' : ''}
                            {topic.order}
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border border-border bg-muted/30 rounded-none">
                            {topic.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{topic.estimatedMinutes} phút</span>
                        </div>
                      </div>

                      {/* Titles */}
                      <h2 className="text-base font-serif font-bold text-foreground leading-snug group-hover/card:text-primary transition-colors">
                        {topic.title}
                      </h2>
                      <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {topic.title_vi}
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-muted-foreground/90 mt-2.5 leading-relaxed line-clamp-2">
                        <FormattedText text={topic.summary} />
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={(event) => { theoryTriggerRef.current = event.currentTarget; setSelectedTopicSlug(topic.slug); }}
                          className="min-h-[44px] border border-border hover:border-foreground bg-background hover:bg-muted text-foreground px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span>Học lý thuyết</span>
                        </button>
                        <Link href={`/grammar/practice?topic=${encodeURIComponent(topic.slug)}`}>
                          <button className="bg-primary text-primary-foreground border border-primary hover:bg-primary/90 px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center gap-1.5 transition-colors">
                            <Dumbbell className="h-3.5 w-3.5" />
                            <span>Luyện tập</span>
                          </button>
                        </Link>
                      </div>

                      {isCompleted && (
                        <div
                          className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400"
                          title="Đã luyện tập chủ điểm này"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Đã học</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Slide-over Theory Drawer / Modal */}
      <DialogPrimitive.Root open={Boolean(selectedTopicSlug && activeTopic)} onOpenChange={(open) => { if (!open) setSelectedTopicSlug(null); }}>
        {activeTopic && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" />
          <DialogPrimitive.Popup aria-modal="true" initialFocus={theoryCloseRef} finalFocus={() => theoryTriggerRef.current?.isConnected ? theoryTriggerRef.current : true}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] border border-border bg-card w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-4xl max-h-[92dvh] sm:max-h-[85dvh] rounded-none flex flex-col shadow-2xl overflow-hidden outline-none">
            {/* Drawer Header */}
            <div className="border-b border-border p-4 sm:p-5 flex items-start justify-between gap-4 bg-muted/10 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground mb-1 flex-wrap">
                  <span>#{activeTopic.order < 10 ? '0' : ''}{activeTopic.order}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 border border-border bg-muted/40 font-bold rounded-none">
                    {activeTopic.level}
                  </span>
                </div>
                <DialogPrimitive.Title className="text-xl sm:text-2xl font-serif font-bold text-foreground break-words">
                  {activeTopic.title_vi}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {activeTopic.title}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                type="button"
                ref={theoryCloseRef}
                aria-label="Đóng bảng lý thuyết"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border border-border rounded-none hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>

            <div className="shrink-0 border-b border-border bg-muted/20 p-2 space-y-2">
              <div className="grid grid-cols-2 gap-2" aria-label="Nội dung bài học">
                <button type="button" aria-pressed={theoryTab === 'theory'} onClick={() => setTheoryTab('theory')}
                  className={`min-h-[44px] px-3 text-sm font-semibold border border-border ${theoryTab === 'theory' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}>
                  Bài học
                </button>
                <button type="button" aria-pressed={theoryTab !== 'theory'} onClick={() => setTheoryTab('details')}
                  className={`min-h-[44px] px-3 text-sm font-semibold border border-border ${theoryTab !== 'theory' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}>
                  Tra cứu thêm
                </button>
              </div>
              {theoryTab !== 'theory' && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Tài liệu</span>
                  <select aria-label="Chọn tài liệu" value={theoryTab}
                    onChange={(event) => setTheoryTab(event.target.value as Exclude<typeof theoryTab, 'theory'>)}
                    className="min-h-[44px] min-w-0 flex-1 border border-border bg-card text-foreground px-2 text-sm">
                    <option value="details">Quy tắc và mẹo nhớ</option>
                    <option value="table">Bảng tra cứu</option>
                    <option value="examples">Ví dụ song ngữ</option>
                    <option value="media">Ảnh minh họa</option>
                    <option value="video">Video bài giảng</option>
                  </select>
                </label>
              )}
            </div>
            {/* Drawer Content */}
            <div ref={theoryContentRef} className="p-3 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 text-sm space-y-4">
              {theoryLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    Đang tải bài học…
                  </span>
                </div>
              ) : theoryTab === 'video' ? (
                <GrammarVideoPlayer
                  topicSlug={activeTopic.slug}
                  topicTitle={activeTopic.title}
                  topicTitleVi={activeTopic.title_vi}
                />
              ) : theoryTab === 'table' ? (
                <GrammarReferenceTable
                  topicSlug={activeTopic.slug}
                  topicTitle={activeTopic.title}
                  topicTitleVi={activeTopic.title_vi}
                  topicSummary={activeTopic.summary}
                  theoryData={theoryData}
                />
              ) : theoryTab === 'theory' ? (
                <div className="space-y-3.5">
                  <div className="border-l-2 border-primary bg-muted/15 p-2.5 sm:p-3 text-xs sm:text-sm leading-relaxed text-foreground rounded-none">
                    <FormattedText text={activeTopic.summary} />
                  </div>
                  {/* TIER 1: Hero Visual Deck (In-Place Dynamic Stage Swapping & Native Audio) */}
                  <div className="min-w-0">
                    <GrammarVisualTopicDeck
                      key={activeTopic.slug}
                      topicSlug={activeTopic.slug}
                      topicTitle={activeTopic.title}
                      topicTitleVi={activeTopic.title_vi}
                      theoryData={theoryData}
                      guided
                    />
                  </div>
                </div>
              ) : theoryTab === 'details' ? (
                  <div className="space-y-3 pt-1">
                    {theoryData?.definition && (
                      <GrammarAccordionItem title="Khái niệm" icon={<BookOpen className="h-3.5 w-3.5 text-primary" />}>
                        <FormattedText text={theoryData.definition} />
                      </GrammarAccordionItem>
                    )}
                    {/* 1. Bảng công thức chuẩn */}
                    {theoryData?.formula?.rows && theoryData.formula.rows.length > 0 && (
                      <GrammarAccordionItem
                        title="Công thức"
                        badge={`${theoryData.formula.rows.length} cấu trúc`}
                        icon={<TableProperties className="h-3.5 w-3.5 text-primary" />}
                        defaultOpen={false}
                      >
                        <div className="border border-border overflow-x-auto rounded-none">
                          <table className="w-full text-left font-mono text-xs">
                            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase">
                              <tr>
                                <th className="p-2.5">Dạng</th>
                                <th className="p-2.5">Cấu trúc</th>
                                <th className="p-2.5">Ví dụ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {theoryData.formula.rows.map((r, i) => (
                                <tr key={i} className="hover:bg-muted/10">
                                  <td className="p-2.5 font-semibold text-primary">
                                    <FormattedText text={r.form} />
                                  </td>
                                  <td className="p-2.5 font-bold text-foreground">
                                    <FormattedText text={r.structure || r.base || (r['mạo_từ'] as string | undefined) || r.time || r.singular || r.rule || '—'} />
                                  </td>
                                  <td className="p-2.5 text-muted-foreground font-sans">
                                    <FormattedText text={r.example || theoryData.bilingual_examples?.[i]?.en || theoryData.bilingual_examples?.[0]?.en || '—'} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </GrammarAccordionItem>
                    )}

                    {/* Dấu hiệu nhận biết */}
                    {theoryData?.signals && theoryData.signals.length > 0 && (
                      <GrammarAccordionItem
                        title="Dấu hiệu nhận biết"
                        badge={`${theoryData.signals.length} từ / cụm từ`}
                        icon={<Clock className="h-3.5 w-3.5 text-primary" />}
                        defaultOpen={false}
                      >
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Các trạng từ, liên từ và dấu hiệu thời gian nhận diện nhanh khi làm bài:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {theoryData.signals.map((sig, idx) => (
                              <span
                                key={idx}
                                className="font-mono text-xs font-semibold px-2.5 py-1 border border-border bg-muted/20 text-foreground rounded-none"
                              >
                                <FormattedText text={typeof sig === 'string' ? sig : JSON.stringify(sig)} />
                              </span>
                            ))}
                          </div>
                        </div>
                      </GrammarAccordionItem>
                    )}

                    {/* Quy tắc ngữ pháp chi tiết */}
                    {theoryData?.rules && theoryData.rules.length > 0 && (
                      <GrammarAccordionItem
                        title="Quy tắc chi tiết"
                        badge={`${theoryData.rules.length} quy tắc`}
                        icon={<BookOpen className="h-3.5 w-3.5 text-primary" />}
                        defaultOpen={false}
                      >
                        <div className="border border-border overflow-x-auto rounded-none">
                          <table className="w-full text-left font-mono text-xs">
                            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase">
                              <tr>
                                <th className="p-2.5">Trường hợp</th>
                                <th className="p-2.5">Quy tắc biến đổi</th>
                                <th className="p-2.5">Ví dụ minh họa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {theoryData.rules.map((r, i) => (
                                <tr key={i} className="hover:bg-muted/10">
                                  <td className="p-2.5 font-semibold text-primary">
                                    <FormattedText text={r.case || 'Quy tắc'} />
                                  </td>
                                  <td className="p-2.5 font-bold text-foreground">
                                    <FormattedText text={r.rule || '—'} />
                                  </td>
                                  <td className="p-2.5 text-muted-foreground font-sans">
                                    <FormattedText text={r.example || '—'} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </GrammarAccordionItem>
                    )}

                    {/* 2. Quy tắc & Ngữ cảnh áp dụng */}
                    {theoryData?.usage && theoryData.usage.length > 0 && (
                      <GrammarAccordionItem
                        title="Cách dùng"
                        badge={`${theoryData.usage.length} ngữ cảnh`}
                        icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                        defaultOpen={false}
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {theoryData.usage.map((u, i) => (
                            <div key={i} className="border border-border p-3 bg-muted/10 flex flex-col gap-1 rounded-none">
                              <span className="font-mono text-xs font-semibold text-primary">
                                <FormattedText text={u.label} />
                              </span>
                              <span className="font-medium text-foreground">
                                <FormattedText text={u.en} />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                <FormattedText text={u.vi} />
                              </span>
                            </div>
                          ))}
                        </div>
                      </GrammarAccordionItem>
                    )}

                    {/* 3. Đối chiếu & Phân biệt cấu trúc */}
                    {theoryData?.comparison && (
                      <GrammarAccordionItem
                        title="Phân biệt"
                        icon={<ArrowLeftRight className="h-3.5 w-3.5 text-primary" />}
                        defaultOpen={false}
                      >
                        <div className="border border-border p-4 bg-muted/10 text-foreground/90 leading-relaxed text-sm rounded-none">
                          <FormattedText text={theoryData.comparison} />
                        </div>
                      </GrammarAccordionItem>
                    )}

                    {/* 4. Lưu ý trọng tâm & Mẹo ghi nhớ */}
                    {theoryData?.tips && (
                      <GrammarAccordionItem
                        title="Mẹo nhớ"
                        icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
                        defaultOpen={false}
                      >
                        <div className="border border-border p-4 bg-muted/10 text-foreground/90 leading-relaxed text-sm rounded-none">
                          <FormattedText text={theoryData.tips} />
                        </div>
                      </GrammarAccordionItem>
                    )}

                    {/* 5. Lỗi sai thường gặp & Cách khắc phục */}
                    {theoryData?.mistakes && theoryData.mistakes.length > 0 && (
                      <GrammarAccordionItem
                        title="Lỗi thường gặp"
                        badge={`${theoryData.mistakes.length} lỗi`}
                        icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        defaultOpen={false}
                      >
                        <div className="space-y-2">
                          {theoryData.mistakes.map((m, i) => (
                            <div key={i} className="border border-border p-3 bg-muted/10 space-y-1 rounded-none">
                              <div className="flex items-center gap-2 font-mono text-xs text-red-600 dark:text-red-400">
                                <span className="font-bold shrink-0">✕ SAI:</span>
                                <span><FormattedText text={m.wrong} /></span>
                              </div>
                              <div className="flex items-center gap-2 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                <span className="font-bold shrink-0">✓ ĐÚNG:</span>
                                <span><FormattedText text={m.right} /></span>
                              </div>
                              {m.why && (
                                <div className="text-xs text-muted-foreground pt-1 border-t border-border/40 font-sans">
                                  <FormattedText text={m.why} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </GrammarAccordionItem>
                    )}
                  </div>
              ) : theoryTab === 'media' ? (
                <div className="space-y-4">
                  {((topicAssetsData as Record<string, TopicAssetItem[]>)[activeTopic.slug] || []).length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {((topicAssetsData as Record<string, TopicAssetItem[]>)[activeTopic.slug] || []).map((asset, i) => (
                        <VettedMediaCard
                          key={i}
                          imageUrl={asset.image}
                          imageAlt={asset.imageAlt || asset.caption}
                          caption={asset.caption}
                          rule={asset.usageAnalysisVi?.rule}
                          contextReason={asset.usageAnalysisVi?.contextReason}
                          commonMistake={asset.usageAnalysisVi?.commonMistake}
                          sceneTitle={`Minh họa thực tế #${i + 1}`}
                          audioUrl={asset.audio}
                          initialExpanded={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-border p-8 text-center text-muted-foreground bg-muted/10 font-mono text-xs rounded-none">
                      Chưa có hình ảnh minh họa cho chủ điểm này.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Câu ví dụ đối chiếu ngữ pháp
                  </div>
                  {theoryData?.bilingual_examples && theoryData.bilingual_examples.length > 0 ? (
                    theoryData.bilingual_examples.map((ex, i) => (
                      <div key={i} className="border border-border p-3.5 bg-background space-y-1.5 rounded-none flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="font-semibold text-foreground text-sm font-serif">
                            <FormattedText text={ex.en} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <FormattedText text={ex.vi} />
                          </div>
                          {ex.note && (
                            <div className="text-[11px] font-mono text-primary/80 pt-1 border-t border-border/40 mt-1">
                              Ghi chú: <FormattedText text={ex.note} />
                            </div>
                          )}
                        </div>
                        {ex.en && (
                          <button
                            type="button"
                            onClick={() => {
                              if (ex.en) grammarAudio.play(`bilingual-${i}`, ex.en);
                            }}
                            aria-label={`Nghe phát âm: ${ex.en}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-none transition-colors"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Ví dụ song ngữ đang được biên soạn chi tiết cho chủ điểm này.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer CTA */}
            <div className="border-t border-border p-3 bg-card flex items-center justify-between gap-2 shrink-0">
              <DialogPrimitive.Close
                className="min-h-[44px] border border-border px-3 text-sm font-semibold rounded-none hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              >
                Đóng
              </DialogPrimitive.Close>
              <Link href={`/grammar/practice?topic=${encodeURIComponent(activeTopic.slug)}`} onClick={() => grammarAudio.stopAll()}
                className="min-h-[44px] min-w-0 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 px-4 text-sm font-semibold rounded-none flex items-center justify-center gap-2">
                <span>Luyện tập</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
        )}
      </DialogPrimitive.Root>
    </main>
  );
}

// searchParams đọc qua prop của page (thay vì useSearchParams + Suspense):
// useSearchParams trong route tĩnh khiến Next bail-out sang client-side rendering → HTML SSR chỉ có
// spinner, tiêu đề/đoạn mô tả (LCP) chỉ hiện sau khi tải + hydrate JS (~4s trên mobile 4G).
export default function GrammarPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const queryString = toUrlSearchParams(use(searchParams)).toString();
  return <GrammarRoadmapContent queryString={queryString} />;
}
