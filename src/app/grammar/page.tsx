'use client';
import { authFetch } from '@/lib/auth-fetch';


import { useState, useEffect, useMemo, useRef, use, Fragment } from 'react';
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
import GrammarVideoPlayer, { CURATED_GRAMMAR_VIDEOS } from '@/components/grammar/GrammarVideoPlayer';
import SvoSentenceDiagram from '@/components/grammar/SvoSentenceDiagram';
import TenseTimeline from '@/components/grammar/TenseTimeline';
import FormattedText from '@/components/grammar/FormattedText';
import HighlightedSentence from '@/components/grammar/HighlightedSentence';
import { detectGrammarKeywords } from '@/components/grammar/GrammarVisualTopicDeck';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import {
  LOCAL_GRAMMAR_PROGRESS_KEY,
  readLocalGrammarProgress,
  readLocalGrammarWrongQueue,
} from '@/lib/grammar-exercises';
import topicAssetsData from '@/data/grammar-topic-assets.json';

interface TopicProgress {
  topic_id: string;
  topic_slug?: string;
  total_lessons: number;
  completed_lessons: number;
  mastered_lessons?: number;
  accuracy: number;
  next_due_date?: string | null;
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

  // User progress & wrong-answer review queue count
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgress>>(() => readLocalGrammarProgress());
  const [wrongQueueCount, setWrongQueueCount] = useState<number>(() => readLocalGrammarWrongQueue(14).length);

  useEffect(() => {
    const syncLocal = () => {
      const localMap = readLocalGrammarProgress();
      setProgressMap((prev) => ({ ...prev, ...localMap }));
      setWrongQueueCount(readLocalGrammarWrongQueue(14).length);
    };

    const fetchProgress = async () => {
      const localMap = readLocalGrammarProgress();
      const localWrongLen = readLocalGrammarWrongQueue(14).length;
      if (Object.keys(localMap).length > 0) {
        setProgressMap((prev) => ({ ...prev, ...localMap }));
      }
      setWrongQueueCount(localWrongLen);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [res, reviewRes] = await Promise.all([
        authFetch('/api/grammar/progress?view=topics', {
          headers: { 'X-LingoPro-Request': '1' },
        }).catch(() => null),
        authFetch('/api/grammar/review?days=14', {
          headers: { 'X-LingoPro-Request': '1' },
        }).catch(() => null),
      ]);

      if (res?.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const merged: Record<string, TopicProgress> = { ...readLocalGrammarProgress() };
          for (const item of json.data) {
            const slug = item.topic_slug || item.topicSlug;
            if (!slug) continue;
            const completed = item.completed_lessons ?? item.learnedLessons ?? 0;
            const existingLocal = merged[slug];
            if (completed > 0 || !existingLocal) {
              const serverAcc = item.accuracy ?? item.avgMasteryScore ?? 0;
              const bestAcc = Math.max(serverAcc, existingLocal?.accuracy ?? 0);
              const serverMastered = item.mastered_lessons ?? item.masteredLessons ?? 0;
              const bestMastered = Math.max(
                serverMastered,
                existingLocal?.mastered_lessons ?? (bestAcc >= 80 ? 1 : 0),
              );
              const serverDue = item.next_due_date ?? item.nextDueDate ?? null;
              merged[slug] = {
                topic_id: item.topic_id || item.topicId || slug,
                topic_slug: slug,
                total_lessons: item.total_lessons ?? item.totalLessons ?? 1,
                completed_lessons: Math.max(completed, existingLocal?.completed_lessons ?? 0),
                mastered_lessons: bestMastered,
                accuracy: bestAcc,
                next_due_date: bestAcc >= 60 ? serverDue : (serverDue ?? existingLocal?.next_due_date ?? null),
              };
            }
          }
          setProgressMap(merged);
          try {
            localStorage.setItem(LOCAL_GRAMMAR_PROGRESS_KEY, JSON.stringify(merged));
          } catch {}
        }
      }

      if (reviewRes?.ok) {
        const revJson = await reviewRes.json();
        if (revJson?.success && typeof revJson.count === 'number') {
          const currentLocalWrongLen = readLocalGrammarWrongQueue(14).length;
          setWrongQueueCount(
            currentLocalWrongLen > 0 ? Math.max(currentLocalWrongLen, revJson.count) : revJson.count,
          );
        }
      }
    };

    fetchProgress();
    window.addEventListener('focus', syncLocal);
    return () => window.removeEventListener('focus', syncLocal);
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
  const activeStageMeta = activeLevel !== 'ALL' ? GRAMMAR_STAGES.find((s) => s.id === activeLevel) : null;

  const { learnedCount, nextRecommendedTopic } = useMemo(() => {
    let learned = 0;
    let firstDue: (typeof UNIFIED_GRAMMAR_TOPICS)[number] | null = null;
    let firstUnlearned: (typeof UNIFIED_GRAMMAR_TOPICS)[number] | null = null;
    const nowMs = Date.now();

    for (const t of UNIFIED_GRAMMAR_TOPICS) {
      const p = progressMap[t.slug];
      if (p && p.completed_lessons > 0) {
        learned += 1;
        if (!firstDue && p.next_due_date && new Date(p.next_due_date).getTime() <= nowMs) {
          firstDue = t;
        }
      } else if (!firstUnlearned) {
        firstUnlearned = t;
      }
    }

    return {
      learnedCount: learned,
      nextRecommendedTopic: firstDue || firstUnlearned || UNIFIED_GRAMMAR_TOPICS[0],
    };
  }, [progressMap]);

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-6 h-14 flex items-center shrink-0">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-2.5">
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
              className="hidden md:inline-flex min-h-[44px] items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold border border-border px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-none"
            >
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span>Lộ trình học</span>
            </Link>
            <Link
              href="/grammar/practice?mode=review"
              className="inline-flex min-h-[44px] items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold border border-border bg-card hover:bg-muted text-foreground px-2.5 sm:px-3 py-1.5 rounded-none transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="hidden sm:inline">Ôn câu sai (14 ngày)</span>
              <span className="sm:hidden">Ôn câu sai</span>
              {wrongQueueCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold tabular-nums rounded-none">
                  {wrongQueueCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Top Banner / Hero */}
      <section className="border-b border-border bg-card px-3.5 sm:px-4 py-5 sm:py-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 border border-border bg-muted/40 text-primary font-semibold rounded-none">
                Chuẩn CEFR A0 – B2
              </span>
              <span>•</span>
              <span className="tabular-nums">{UNIFIED_GRAMMAR_TOPICS.length} chủ điểm trọng tâm</span>
              {learnedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    Đã học {learnedCount}/{UNIFIED_GRAMMAR_TOPICS.length} bài
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground leading-tight">
              Lộ trình Ngữ pháp Tiếng Anh Toàn diện
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              Học tuần tự từ nền tảng ghép câu (A0) đến cấu trúc học thuật (B2) qua sơ đồ trực quan, ví dụ song ngữ có phát âm và bài tập thực hành.
            </p>
          </div>

          {/* Prominent Orientation Banner for Beginners / Next Step */}
          {nextRecommendedTopic && (
            <div className="border border-primary/40 bg-primary/5 p-3.5 sm:p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-primary">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground rounded-none">
                    {learnedCount === 0 ? 'Bắt đầu từ mất gốc (#00)' : 'Học tiếp bài tiếp theo'}
                  </span>
                  <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                    Chặng {nextRecommendedTopic.level} • #{nextRecommendedTopic.order < 10 ? '0' : ''}{nextRecommendedTopic.order}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-serif font-bold text-foreground mt-1">
                  {nextRecommendedTopic.title_vi}{' '}
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    ({nextRecommendedTopic.title})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {learnedCount === 0
                    ? 'Chưa biết bắt đầu từ đâu? Hãy học Bài #00 để nắm quy tắc ghép câu Chủ ngữ (S) + Động từ (V) + Tân ngữ (O) trước khi học các thì.'
                    : nextRecommendedTopic.summary}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(event) => {
                    theoryTriggerRef.current = event.currentTarget;
                    setSelectedTopicSlug(nextRecommendedTopic.slug);
                  }}
                  className="min-h-[44px] px-3.5 py-2 border border-border bg-card hover:bg-muted text-foreground font-mono text-xs uppercase tracking-wider font-semibold rounded-none inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{learnedCount === 0 ? 'Học bài #00' : 'Xem lý thuyết'}</span>
                </button>
                <Link
                  href={`/grammar/practice?topic=${encodeURIComponent(nextRecommendedTopic.slug)}`}
                  className="min-h-[44px] px-3.5 py-2 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-mono text-xs uppercase tracking-wider font-semibold rounded-none inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                  <span>Làm bài tập</span>
                </Link>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ điểm hoặc từ khóa (vd: to be, hiện tại đơn, bị động)..."
              className="w-full min-h-[44px] border border-border bg-background pl-10 pr-11 py-2.5 rounded-none font-mono text-base sm:text-sm focus:outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40 scrollbar-none">
            <button
              onClick={() => setActiveLevel('ALL')}
              className={`min-h-[44px] inline-flex items-center justify-center px-3 sm:px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap tabular-nums ${
                activeLevel === 'ALL'
                  ? 'border-foreground bg-foreground text-background font-bold'
                  : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả ({UNIFIED_GRAMMAR_TOPICS.length})
            </button>
            {GRAMMAR_STAGES.map((stg) => {
              const isActive = activeLevel === stg.id;
              const shortVi = stg.id === 'A0' ? 'Nền tảng' : stg.nameVi;
              return (
                <button
                  key={stg.id}
                  onClick={() => setActiveLevel(stg.id)}
                  className={`min-h-[44px] inline-flex items-center justify-center px-3 sm:px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap gap-1.5 tabular-nums ${
                    isActive
                      ? 'border-foreground bg-foreground text-background font-bold'
                      : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="font-bold">{stg.id}</span>
                  <span className="opacity-85">— {shortVi}</span>
                  <span className="text-[10px] opacity-60">({stg.topicCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Roadmap Grid */}
      <section className="max-w-5xl w-full mx-auto px-3.5 sm:px-4 py-5 sm:py-8 flex-1">
        {filteredTopics.length === 0 ? (
          <div className="border border-border p-8 sm:p-12 text-center bg-card rounded-none flex flex-col items-center justify-center gap-4">
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
              className="min-h-[44px] mt-1 border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold rounded-none hover:bg-muted"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-muted-foreground tabular-nums">
              <span>HIỂN THỊ {filteredTopics.length} / {UNIFIED_GRAMMAR_TOPICS.length} CHỦ ĐIỂM</span>
              {activeStageMeta ? (
                <span className="uppercase font-semibold text-foreground">
                  {activeStageMeta.id} — {activeStageMeta.nameVi}
                </span>
              ) : (
                <span className="hidden sm:inline uppercase">THEO THỨ TỰ TỪ CƠ BẢN ĐẾN NÂNG CAO</span>
              )}
            </div>

            {/* Stage Orientation Banner when a specific level is filtered */}
            {activeStageMeta && (
              <div className="border border-border bg-card p-3.5 sm:p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-4 border-l-primary">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    Chặng {activeStageMeta.id}: {activeStageMeta.nameVi} ({activeStageMeta.name})
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {activeStageMeta.description}
                  </p>
                </div>
                <span className="font-mono text-[11px] uppercase px-2 py-1 border border-border bg-muted/30 text-foreground shrink-0 self-start sm:self-center tabular-nums">
                  {activeStageMeta.topicCount} bài học
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTopics.map((topic, idx) => {
                const isSelected = selectedTopicSlug === topic.slug;
                const pInfo = progressMap[topic.slug];
                const isCompleted = Boolean(pInfo && pInfo.completed_lessons > 0);
                const isMastered = Boolean(
                  isCompleted && ((pInfo?.mastered_lessons ?? 0) > 0 || (pInfo?.accuracy ?? 0) >= 80),
                );
                const isDue = Boolean(
                  isCompleted && pInfo?.next_due_date && new Date(pInfo.next_due_date).getTime() <= Date.now(),
                );
                const showStageDivider =
                  activeLevel === 'ALL' &&
                  !searchQuery.trim() &&
                  (idx === 0 || filteredTopics[idx - 1].level !== topic.level);
                const stageMeta = showStageDivider
                  ? GRAMMAR_STAGES.find((s) => s.id === topic.level)
                  : null;

                return (
                  <Fragment key={topic.slug}>
                    {showStageDivider && stageMeta && (
                      <div
                        className={`col-span-full border border-border bg-muted/20 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-l-4 border-l-primary ${
                          idx > 0 ? 'mt-3 sm:mt-4' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                              Chặng {stageMeta.id} — {stageMeta.nameVi}
                            </span>
                            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-border bg-card text-muted-foreground tabular-nums">
                              {stageMeta.topicCount} chủ điểm
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {stageMeta.description}
                          </p>
                        </div>
                      </div>
                    )}

                    <div
                      className={`border p-4 sm:p-5 bg-card rounded-none transition-all flex flex-col justify-between gap-3.5 ${
                        isSelected
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border hover:border-foreground/40'
                      }`}
                    >
                      <div
                        onClick={(event) => {
                          theoryTriggerRef.current = event.currentTarget;
                          setSelectedTopicSlug(topic.slug);
                        }}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-muted-foreground tabular-nums">
                              #{topic.order < 10 ? '0' : ''}
                              {topic.order}
                            </span>
                            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border border-border bg-muted/30 rounded-none">
                              {topic.level}
                            </span>
                            {topic.order === 0 && !isCompleted && (
                              <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border border-primary/40 bg-primary/10 text-primary rounded-none">
                                Bắt đầu tại đây
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isDue ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 px-1.5 py-0.5 border border-amber-500/40 bg-amber-500/10 rounded-none"
                                title="Đến hạn ôn tập lại chủ điểm này"
                              >
                                <RotateCcw className="h-3 w-3 shrink-0" />
                                <span>Đến hạn ôn</span>
                              </span>
                            ) : isMastered ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 border border-indigo-500/40 bg-indigo-500/10 rounded-none"
                                title="Đã thành thạo chủ điểm này (≥80%)"
                              >
                                <Sparkles className="h-3 w-3 shrink-0" />
                                <span>Thành thạo</span>
                              </span>
                            ) : isCompleted ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 border border-emerald-500/30 bg-emerald-500/10 rounded-none"
                                title="Đã luyện tập chủ điểm này"
                              >
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                <span>Đã học</span>
                              </span>
                            ) : null}
                            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground tabular-nums">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{topic.estimatedMinutes}p</span>
                            </div>
                          </div>
                        </div>

                        {/* Bilingual Titles: Vietnamese prominent for instant comprehension + English standard term */}
                        <h2 className="text-base font-serif font-bold text-foreground leading-snug group-hover/card:text-primary transition-colors">
                          {topic.title_vi}
                        </h2>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5 font-medium">
                          {topic.title}
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-muted-foreground/90 mt-2 leading-relaxed line-clamp-2">
                          <FormattedText text={topic.summary} />
                        </p>
                      </div>

                      {/* Card Actions: Equal 50/50 touch targets on mobile, clean inline on desktop */}
                      <div className="pt-3 border-t border-border/40 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            theoryTriggerRef.current = event.currentTarget;
                            setSelectedTopicSlug(topic.slug);
                          }}
                          className="min-h-[44px] border border-border hover:border-foreground bg-background hover:bg-muted text-foreground px-3 py-2 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Lý thuyết</span>
                        </button>
                        <Link
                          href={`/grammar/practice?topic=${encodeURIComponent(topic.slug)}`}
                          className="min-h-[44px] bg-primary text-primary-foreground border border-primary hover:bg-primary/90 px-3 py-2 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                          <span>Luyện tập</span>
                        </Link>
                      </div>
                    </div>
                  </Fragment>
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] border border-border bg-card w-[calc(100%-0.75rem)] sm:w-[calc(100%-2rem)] max-w-4xl lg:max-w-5xl max-h-[94dvh] sm:max-h-[90dvh] lg:max-h-[90dvh] rounded-none flex flex-col shadow-2xl overflow-hidden outline-none">
            {/* Unified Modal Header: Responsive 2-row grid on mobile (full title width) & 1-row on sm:+ */}
            <div className="border-b border-border px-3 sm:px-4 py-2 sm:py-2.5 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] items-center gap-2 sm:gap-2.5 bg-muted/10 shrink-0">
              <div className="flex items-start sm:items-center gap-2 min-w-0 order-1">
                <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs uppercase text-muted-foreground shrink-0 mt-0.5 sm:mt-0">
                  <span className="font-semibold text-foreground tabular-nums">
                    #{activeTopic.order < 10 ? '0' : ''}{activeTopic.order}
                  </span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 border border-border bg-muted/50 font-bold text-primary rounded-none">
                    {activeTopic.level}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <DialogPrimitive.Title className="text-sm sm:text-base lg:text-lg font-serif font-bold text-foreground leading-snug line-clamp-2 sm:truncate">
                    {activeTopic.title_vi}
                    <span className="text-xs font-normal text-muted-foreground ml-2 font-sans hidden md:inline">
                      ({activeTopic.title})
                    </span>
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-[11px] font-mono text-muted-foreground truncate md:hidden">
                    {activeTopic.title}
                  </DialogPrimitive.Description>
                </div>
              </div>

              {/* Segmented Tab Switcher: Full width row on mobile, inline on sm+ */}
              <div className="col-span-2 sm:col-span-1 order-3 sm:order-2 grid grid-cols-2 sm:inline-flex border border-border bg-background p-0.5 font-mono text-xs rounded-none">
                <button
                  type="button"
                  aria-pressed={theoryTab === 'theory'}
                  onClick={() => setTheoryTab('theory')}
                  className={`min-h-[36px] sm:min-h-[34px] px-2.5 sm:px-3 transition-colors rounded-none font-semibold cursor-pointer text-xs ${
                    theoryTab === 'theory'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Bài học trực quan
                </button>
                <button
                  type="button"
                  aria-pressed={theoryTab !== 'theory'}
                  onClick={() => setTheoryTab('details')}
                  className={`min-h-[36px] sm:min-h-[34px] px-2.5 sm:px-3 transition-colors rounded-none font-semibold cursor-pointer text-xs ${
                    theoryTab !== 'theory'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tra cứu<span className="hidden sm:inline"> thêm</span>
                </button>
              </div>

              <DialogPrimitive.Close
                type="button"
                ref={theoryCloseRef}
                aria-label="Đóng bảng lý thuyết"
                className="order-2 sm:order-3 justify-self-end self-start sm:self-center min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center p-1.5 border border-border rounded-none hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Sub-bar for Extended Lookup when active: Touch-friendly pill tabs + synced select for accessibility */}
            {theoryTab !== 'theory' && (
              <div className="shrink-0 border-b border-border bg-muted/20 px-3 py-1.5 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {(
                    [
                      { id: 'details', label: 'Quy tắc & Mẹo', show: true },
                      { id: 'table', label: 'Bảng tóm tắt', show: true },
                      { id: 'examples', label: 'Ví dụ song ngữ', show: true },
                      {
                        id: 'media',
                        label: activeTopic.slug === 'sentence-structure-svo' ? 'Sơ đồ S+V+O' : 'Ảnh minh họa',
                        show: true,
                      },
                      {
                        id: 'video',
                        label: 'Video bài giảng',
                        show: Boolean(CURATED_GRAMMAR_VIDEOS[activeTopic.slug]),
                      },
                    ] as const
                  )
                    .filter((sub) => sub.show)
                    .map((sub) => {
                      const isSubActive = theoryTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setTheoryTab(sub.id)}
                          className={`min-h-[36px] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap border rounded-none transition-colors ${
                            isSubActive
                              ? 'border-foreground bg-foreground text-background font-bold'
                              : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                </div>
                <select
                  aria-label="Chọn tài liệu"
                  value={theoryTab}
                  onChange={(event) => setTheoryTab(event.target.value as Exclude<typeof theoryTab, 'theory'>)}
                  className="sr-only"
                >
                  <option value="details">Quy tắc và mẹo nhớ</option>
                  <option value="table">Bảng tra cứu</option>
                  <option value="examples">Ví dụ song ngữ</option>
                  <option value="media">Ảnh minh họa</option>
                  <option value="video">Video bài giảng</option>
                </select>
              </div>
            )}
            {/* Drawer Content */}
            <div ref={theoryContentRef} className="p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 text-sm">
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
                <div className="min-w-0">
                  {/* TIER 1: Hero Visual Deck (In-Place Dynamic Stage Swapping & Native Audio) */}
                  <GrammarVisualTopicDeck
                    key={activeTopic.slug}
                    topicSlug={activeTopic.slug}
                    topicTitle={activeTopic.title}
                    topicTitleVi={activeTopic.title_vi}
                    theoryData={theoryData}
                    guided
                  />
                </div>
              ) : theoryTab === 'details' ? (
                  <div className="space-y-3 pt-1">
                    {theoryData?.definition && (
                      <GrammarAccordionItem title="Khái niệm" icon={<BookOpen className="h-3.5 w-3.5 text-primary" />}>
                        <FormattedText text={theoryData.definition} />
                      </GrammarAccordionItem>
                    )}
                    {/* Sơ đồ trục thời gian trực quan cho các chủ điểm Thì (Tenses) */}
                    {Boolean(
                      theoryData?.timeline ||
                        activeTopic.slug.includes('present-') ||
                        activeTopic.slug.includes('past-') ||
                        activeTopic.slug.includes('future-') ||
                        activeTopic.slug === 'be-going-to'
                    ) && (
                      <TenseTimeline
                        lessonTitle={activeTopic.title}
                        titleVi={activeTopic.title_vi}
                        slug={activeTopic.slug}
                      />
                    )}
                    {/* 1. Bảng công thức chuẩn */}
                    {theoryData?.formula?.rows && theoryData.formula.rows.length > 0 && (
                      <GrammarAccordionItem
                        title="Công thức"
                        badge={`${theoryData.formula.rows.length} cấu trúc`}
                        icon={<TableProperties className="h-3.5 w-3.5 text-primary" />}
                        defaultOpen={true}
                      >
                        {/* Chú giải ký hiệu cho người mới bắt đầu (A0/A1) */}
                        <div className="mb-3 p-2.5 border border-border bg-muted/20 rounded-none">
                          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Chú giải ký hiệu cho người mới:
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                            <span className="px-2 py-0.5 border border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300">
                              <strong>S</strong> = Chủ ngữ (Ai / Cái gì)
                            </span>
                            <span className="px-2 py-0.5 border border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300">
                              <strong>V</strong> = Động từ (Hành động / Trạng thái)
                            </span>
                            <span className="px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                              <strong>O</strong> = Tân ngữ (Người / Vật nhận tác động)
                            </span>
                            <span className="px-2 py-0.5 border border-border bg-card text-foreground">
                              <strong>Adj</strong> = Tính từ (Đặc điểm)
                            </span>
                            <span className="px-2 py-0.5 border border-border bg-card text-foreground">
                              <strong>N</strong> = Danh từ (Sự vật / Tên gọi)
                            </span>
                          </div>
                        </div>

                        {/* Mobile stacked formula cards */}
                        <div className="sm:hidden space-y-2">
                          {theoryData.formula.rows.map((r, i) => {
                            const thirdCol =
                              (r.third || r.thirdPerson) &&
                              !String(r.third || r.thirdPerson).toLowerCase().includes('ngữ cảnh')
                                ? String(r.third || r.thirdPerson)
                                : undefined;
                            const pluralCol = r.singular && r.plural ? String(r.plural) : undefined;
                            const structText =
                              r.structure || r.base || (r['mạo_từ'] as string | undefined) || r.time || r.singular || r.rule || '—';
                            const exText =
                              r.example || theoryData.bilingual_examples?.[i]?.en || theoryData.bilingual_examples?.[0]?.en || '—';
                            return (
                              <div key={i} className="border border-border p-3 bg-muted/10 space-y-1.5 rounded-none">
                                <div className="font-mono text-xs font-bold uppercase text-primary">
                                  <FormattedText text={r.form} />
                                </div>
                                {thirdCol ? (
                                  <div className="grid grid-cols-1 gap-1.5">
                                    <div className="font-mono text-xs text-foreground bg-background px-2.5 py-1.5 border border-border/60 rounded-none break-words">
                                      <span className="text-[10px] uppercase text-muted-foreground block font-normal">I / You / We / They:</span>
                                      <span className="font-bold"><FormattedText text={r.base || r.structure || '—'} /></span>
                                    </div>
                                    <div className="font-mono text-xs text-indigo-700 dark:text-indigo-400 bg-background px-2.5 py-1.5 border border-border/60 rounded-none break-words">
                                      <span className="text-[10px] uppercase text-muted-foreground block font-normal">He / She / It:</span>
                                      <span className="font-bold"><FormattedText text={thirdCol} /></span>
                                    </div>
                                  </div>
                                ) : pluralCol ? (
                                  <div className="grid grid-cols-1 gap-1.5">
                                    <div className="font-mono text-xs text-foreground bg-background px-2.5 py-1.5 border border-border/60 rounded-none break-words">
                                      <span className="text-[10px] uppercase text-muted-foreground block font-normal">Số ít (Singular):</span>
                                      <span className="font-bold"><FormattedText text={String(r.singular)} /></span>
                                    </div>
                                    <div className="font-mono text-xs text-indigo-700 dark:text-indigo-400 bg-background px-2.5 py-1.5 border border-border/60 rounded-none break-words">
                                      <span className="text-[10px] uppercase text-muted-foreground block font-normal">Số nhiều (Plural):</span>
                                      <span className="font-bold"><FormattedText text={pluralCol} /></span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-mono text-xs font-bold text-foreground bg-background px-2.5 py-1.5 border border-border/60 rounded-none break-words">
                                    <FormattedText text={structText} />
                                  </div>
                                )}
                                {Boolean(r.note) && (
                                  <div className="text-[11px] font-mono text-primary/90 pt-0.5">
                                    Lưu ý: <FormattedText text={String(r.note)} />
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground font-sans pt-0.5">
                                  <span className="font-mono text-[10px] uppercase text-muted-foreground/80 mr-1">VD:</span>
                                  <FormattedText text={exText} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block border border-border overflow-x-auto rounded-none">
                          <table className="w-full text-left font-mono text-xs">
                            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase">
                              <tr>
                                <th className="p-2.5">Dạng</th>
                                <th className="p-2.5">Cấu trúc</th>
                                <th className="p-2.5">Ví dụ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {theoryData.formula.rows.map((r, i) => {
                                const thirdCol =
                                  (r.third || r.thirdPerson) &&
                                  !String(r.third || r.thirdPerson).toLowerCase().includes('ngữ cảnh')
                                    ? String(r.third || r.thirdPerson)
                                    : undefined;
                                const pluralCol = r.singular && r.plural ? String(r.plural) : undefined;
                                return (
                                  <tr key={i} className="hover:bg-muted/10">
                                    <td className="p-2.5 font-semibold text-primary">
                                      <FormattedText text={r.form} />
                                    </td>
                                    <td className="p-2.5 font-bold text-foreground space-y-1">
                                      {thirdCol ? (
                                        <>
                                          <div>
                                            <span className="text-muted-foreground font-normal mr-1">I/You/We/They:</span>
                                            <FormattedText text={r.base || r.structure || '—'} />
                                          </div>
                                          <div className="text-indigo-700 dark:text-indigo-400">
                                            <span className="text-muted-foreground font-normal mr-1">He/She/It:</span>
                                            <FormattedText text={thirdCol} />
                                          </div>
                                        </>
                                      ) : pluralCol ? (
                                        <>
                                          <div>
                                            <span className="text-muted-foreground font-normal mr-1">Số ít:</span>
                                            <FormattedText text={String(r.singular)} />
                                          </div>
                                          <div className="text-indigo-700 dark:text-indigo-400">
                                            <span className="text-muted-foreground font-normal mr-1">Số nhiều:</span>
                                            <FormattedText text={pluralCol} />
                                          </div>
                                        </>
                                      ) : (
                                        <FormattedText text={r.structure || r.base || (r['mạo_từ'] as string | undefined) || r.time || r.singular || r.rule || '—'} />
                                      )}
                                      {Boolean(r.note) && (
                                        <div className="text-[11px] font-normal text-muted-foreground">
                                          (<FormattedText text={String(r.note)} />)
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-muted-foreground font-sans">
                                      <FormattedText text={r.example || theoryData.bilingual_examples?.[i]?.en || theoryData.bilingual_examples?.[0]?.en || '—'} />
                                    </td>
                                  </tr>
                                );
                              })}
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
                        {/* Mobile stacked rule cards */}
                        <div className="sm:hidden space-y-2">
                          {theoryData.rules.map((r, i) => (
                            <div key={i} className="border border-border p-3 bg-muted/10 space-y-1.5 rounded-none">
                              <div className="font-mono text-xs font-semibold text-primary">
                                <FormattedText text={r.case || 'Quy tắc'} />
                              </div>
                              <div className="text-xs font-bold text-foreground leading-relaxed">
                                <FormattedText text={r.rule || '—'} />
                              </div>
                              {r.example && (
                                <div className="text-xs text-muted-foreground font-sans pt-1 border-t border-border/40">
                                  <span className="font-mono text-[10px] uppercase text-muted-foreground/80 mr-1">VD:</span>
                                  <FormattedText text={r.example} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block border border-border overflow-x-auto rounded-none">
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
                              <div className="flex items-start gap-2 font-mono text-xs text-rose-600 dark:text-rose-400">
                                <span className="font-bold shrink-0">✕ SAI:</span>
                                <span className="break-words"><FormattedText text={m.wrong} /></span>
                              </div>
                              <div className="flex items-start gap-2 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                <span className="font-bold shrink-0">✓ ĐÚNG:</span>
                                <span className="break-words"><FormattedText text={m.right} /></span>
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
                    <SvoSentenceDiagram />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Câu ví dụ đối chiếu ngữ pháp
                  </div>
                  {theoryData?.bilingual_examples && theoryData.bilingual_examples.length > 0 ? (
                    theoryData.bilingual_examples.map((ex, i) => {
                      const kw = detectGrammarKeywords(ex.en || '', activeTopic.slug, activeTopic.title);
                      return (
                        <div key={i} className="border border-border p-3.5 bg-background space-y-1.5 rounded-none flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="font-semibold text-foreground text-sm font-serif break-words">
                              <HighlightedSentence text={ex.en || ''} highlight={kw} />
                            </div>
                            <div className="text-xs text-muted-foreground break-words">
                              <FormattedText text={ex.vi || ''} />
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
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Ví dụ song ngữ đang được biên soạn chi tiết cho chủ điểm này.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer CTA - Mobile touch-friendly */}
            <div className="border-t border-border px-3 sm:px-4 py-2 bg-card flex items-center justify-between gap-2.5 shrink-0">
              <DialogPrimitive.Close
                className="min-h-[40px] sm:min-h-[38px] border border-border px-4 text-xs font-mono uppercase tracking-wider font-semibold rounded-none hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                Đóng
              </DialogPrimitive.Close>
              <Link
                href={`/grammar/practice?topic=${encodeURIComponent(activeTopic.slug)}`}
                onClick={() => grammarAudio.stopAll()}
                className="min-h-[40px] sm:min-h-[38px] flex-1 sm:flex-initial min-w-0 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 px-4 text-xs font-mono uppercase tracking-wider font-semibold rounded-none flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Luyện tập chủ điểm này</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
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
