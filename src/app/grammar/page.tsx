'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Info,
  Loader2,
  PlayCircle,
  Lightbulb,
  AlertTriangle,
  ArrowLeftRight,
  TableProperties,
  FileText,
  Image as ImageIcon,
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
import GrammarVideoPlayer from '@/components/grammar/GrammarVideoPlayer';
import FormattedText from '@/components/grammar/FormattedText';
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

function GrammarRoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [theoryTab, setTheoryTab] = useState<'theory' | 'table' | 'video' | 'examples' | 'media'>('theory');

  // User progress
  const [_userId, setUserId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgress>>({});

  useEffect(() => {
    const fetchProgress = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/grammar/progress?view=topics', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
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

    let isMounted = true;
    const loadTheory = async () => {
      setTheoryLoading(true);
      try {
        // 1. Fetch comprehensive structured theory from API
        const res = await fetch(`/api/grammar/theory?topic=${encodeURIComponent(selectedTopicSlug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data && isMounted) {
            setTheoryData(json.data);
            return;
          }
        }

        // 2. Fallback if API fails or offline
        const topicObj = getTopicBySlug(selectedTopicSlug);
        if (topicObj && isMounted) {
          setTheoryData({
            definition: topicObj.summary,
            usage: [
              { label: 'Quy tắc trọng tâm', en: topicObj.title, vi: topicObj.title_vi },
              { label: 'Cấp độ tiêu chuẩn', en: `CEFR Level: ${topicObj.level}`, vi: topicObj.stageLabel },
              { label: 'Thời lượng khuyến nghị', en: `${topicObj.estimatedMinutes} minutes`, vi: `Khoảng ${topicObj.estimatedMinutes} phút học tập tập trung` },
            ],
            formula: {
              rows: [
                { form: 'Khẳng định (+)', structure: 'Subject + Verb + Object / Complement', example: 'She learns English every day.' },
                { form: 'Phủ định (-)', structure: 'Subject + Auxiliary + not + Verb', example: 'She does not skip lessons.' },
                { form: 'Nghi vấn (?)', structure: 'Auxiliary + Subject + Verb...?', example: 'Does she understand the concept?' },
              ],
            },
            bilingual_examples: [
              {
                en: `Mastering ${topicObj.title} provides a solid linguistic foundation.`,
                vi: `Nắm vững ${topicObj.title_vi} tạo nền tảng ngôn ngữ vững chắc cho giao tiếp học thuật và đời sống.`,
                note: `Cấp độ CEFR: ${topicObj.level} • Khung bài học chuẩn hóa`,
              },
            ],
          });
        }
      } catch (err) {
        console.error('Failed to load topic theory:', err);
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
      {/* Top Banner / Hero */}
      <section className="border-b border-border bg-card px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
                <span className="px-1.5 py-0.5 border border-border bg-muted/30">Lộ trình chuẩn hóa</span>
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

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/grammar/practice?mode=review">
                <button className="border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center gap-2 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  Ôn câu sai (14 ngày)
                </button>
              </Link>
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
              className={`px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap ${
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
                  className={`px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium rounded-none border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            #{topic.order < 10 ? '0' : ''}
                            {topic.order}
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border border-border bg-muted/30">
                            {topic.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{topic.estimatedMinutes} phút</span>
                        </div>
                      </div>

                      {/* Titles */}
                      <h2 className="text-base font-serif font-bold text-foreground leading-snug">
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
                          onClick={() => setSelectedTopicSlug(topic.slug)}
                          className="border border-border hover:border-foreground bg-background hover:bg-muted text-foreground px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center gap-1.5 transition-colors"
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
      {selectedTopicSlug && activeTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-background/80 backdrop-blur-sm">
          <div className="border border-border bg-card w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] rounded-none flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Drawer Header */}
            <div className="border-b border-border p-4 sm:p-6 flex items-start justify-between gap-4 bg-muted/10 shrink-0">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground mb-1">
                  <span>#{activeTopic.order < 10 ? '0' : ''}{activeTopic.order}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 border border-border bg-muted/40 font-bold">
                    {activeTopic.level}
                  </span>
                  <span>•</span>
                  <span>{activeTopic.stageLabel}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  {activeTopic.title}
                </h2>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {activeTopic.title_vi}
                </div>
              </div>
              <button
                onClick={() => setSelectedTopicSlug(null)}
                className="p-1.5 border border-border rounded-none hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Theory Tabs */}
            <div className="shrink-0 border-b border-border bg-muted/20 flex overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setTheoryTab('theory')}
                className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-r border-border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  theoryTab === 'theory'
                    ? 'bg-card text-foreground font-bold border-b-2 border-b-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-b-transparent'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Lý thuyết cốt lõi</span>
              </button>
              <button
                type="button"
                onClick={() => setTheoryTab('table')}
                className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-r border-border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  theoryTab === 'table'
                    ? 'bg-card text-foreground font-bold border-b-2 border-b-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-b-transparent'
                }`}
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span>Bảng tra cứu</span>
              </button>
              <button
                type="button"
                onClick={() => setTheoryTab('examples')}
                className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-r border-border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  theoryTab === 'examples'
                    ? 'bg-card text-foreground font-bold border-b-2 border-b-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-b-transparent'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ví dụ song ngữ</span>
              </button>
              <button
                type="button"
                onClick={() => setTheoryTab('media')}
                className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-r border-border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  theoryTab === 'media'
                    ? 'bg-card text-foreground font-bold border-b-2 border-b-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-b-transparent'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Hình ảnh thực tế ({((topicAssetsData as Record<string, TopicAssetItem[]>)[activeTopic.slug] || []).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTheoryTab('video')}
                className={`py-3 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-r border-border inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  theoryTab === 'video'
                    ? 'bg-card text-foreground font-bold border-b-2 border-b-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-b-transparent'
                }`}
              >
                <PlayCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>Video bài giảng</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 text-sm space-y-6">
              {theoryLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    Đang nạp dữ liệu bài học...
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
                <>
                  {/* Definition */}
                  <div className="border border-border p-4 bg-background">
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      Định nghĩa & Bản chất
                    </div>
                    <p className="text-foreground leading-relaxed mt-1 font-serif text-base">
                      <FormattedText text={theoryData?.definition || activeTopic.summary} />
                    </p>
                  </div>

                  {/* Usage Points */}
                  {theoryData?.usage && theoryData.usage.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Quy tắc & Ngữ cảnh áp dụng
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {theoryData.usage.map((u, i) => (
                          <div key={i} className="border border-border p-3 bg-muted/10 flex flex-col gap-1">
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
                    </div>
                  )}

                  {/* Formulas */}
                  {theoryData?.formula?.rows && theoryData.formula.rows.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Bảng công thức chuẩn
                      </div>
                      <div className="border border-border overflow-x-auto">
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
                    </div>
                  )}

                  {/* Comparison / Distinction */}
                  {theoryData?.comparison && (
                    <div className="border border-border p-4 bg-muted/10 space-y-1.5">
                      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                        Đối chiếu & Phân biệt cấu trúc
                      </div>
                      <div className="text-foreground/90 leading-relaxed text-sm">
                        <FormattedText text={theoryData.comparison} />
                      </div>
                    </div>
                  )}

                  {/* Core Tips & Focus Notes */}
                  {theoryData?.tips && (
                    <div className="border border-border p-4 bg-muted/10 space-y-1.5">
                      <div className="font-mono text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        Lưu ý trọng tâm
                      </div>
                      <div className="text-foreground/90 leading-relaxed text-sm">
                        <FormattedText text={theoryData.tips} />
                      </div>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {theoryData?.mistakes && theoryData.mistakes.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        Lỗi sai thường gặp & Cách khắc phục
                      </div>
                      <div className="space-y-2">
                        {theoryData.mistakes.map((m, i) => (
                          <div key={i} className="border border-border p-3 bg-muted/10 space-y-1">
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
                    </div>
                  )}
                </>
              ) : theoryTab === 'media' ? (
                <div className="space-y-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
                    <span>Hình ảnh & Tình huống thực tế</span>
                  </div>
                  {((topicAssetsData as Record<string, TopicAssetItem[]>)[activeTopic.slug] || []).length > 0 ? (
                    ((topicAssetsData as Record<string, TopicAssetItem[]>)[activeTopic.slug] || []).map((asset, i) => (
                      <VettedMediaCard
                        key={i}
                        imageUrl={asset.image}
                        imageAlt={asset.imageAlt}
                        caption={asset.caption}
                        rule={asset.usageAnalysisVi?.rule}
                        contextReason={asset.usageAnalysisVi?.contextReason}
                        commonMistake={asset.usageAnalysisVi?.commonMistake}
                        audioUrl={asset.audio}
                        initialExpanded={true}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-4">
                      Tư liệu trực quan cho chủ điểm này đang được chuẩn hóa bổ sung.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Câu ví dụ đối chiếu ngữ pháp
                  </div>
                  {theoryData?.bilingual_examples && theoryData.bilingual_examples.length > 0 ? (
                    theoryData.bilingual_examples.map((ex, i) => (
                      <div key={i} className="border border-border p-3.5 bg-background space-y-1">
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
            <div className="border-t border-border p-4 bg-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedTopicSlug(null)}
                className="border border-border px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold rounded-none hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              >
                Đóng
              </button>
              <Link href={`/grammar/practice?topic=${encodeURIComponent(activeTopic.slug)}`} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-primary text-primary-foreground border border-primary hover:bg-primary/90 px-5 sm:px-6 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold rounded-none flex items-center justify-center gap-2">
                  <span>Bắt đầu luyện tập</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function GrammarPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Đang tải lộ trình ngữ pháp...
            </span>
          </div>
        </main>
      }
    >
      <GrammarRoadmapContent />
    </Suspense>
  );
}
