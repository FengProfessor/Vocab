import { ReadingApi } from '@/features/reading/api';
import { DictionaryApi } from '@/features/dictionary/api';

/**
 * /practice/reading-library — Thư viện 588 bài đọc LingoPro
 *
 * Full CEFR A1-C2 coverage, 15 Pack Themes, sources: VSTEP, TOEIC, VOA, RACE, OpenStax.
 * Instant hydration (0ms perceived latency), smooth range pagination (GEMINI.md Rule 3),
 * interactive vocabulary lookup, bilingual translation, cloze blanks, MCQ with explanations,
 * Web Speech TTS / podcast audio, and collapsible mindmap visualizer.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from '@/shared/router/navigation';
import { useSearchParams, useRouter } from '@/shared/router/navigation';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Headphones,
  Heart,
  Info,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Eye,
  EyeOff,
  Brain,
  Share2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  BookMarked,
  Library,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { PACK_THEMES, getPackTheme } from '@/lib/pack-themes';
import {
  readLibraryCache,
  writeLibraryCache,
  readLocalBookmarks,
  writeLocalBookmark,
  type CachedLibraryResponse,
} from '@/lib/reading-library-cache';
import type {
  ReadingArticle,
  CEFRLevel,
  ArticleSourceType,
  ReadingClozeBlank,
  ReadingQuestion,
  ReadingVocabularyItem,
  ReadingMindmapNode,
} from '@/types/reading-library';

// ── CEFR Badges & Source Badges Helper ──
export const CEFR_CONFIG: Record<
  CEFRLevel,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  A1: {
    label: 'A1 Sơ cấp',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    desc: 'Từ vựng cơ bản, câu ngắn, đời sống hàng ngày',
  },
  A2: {
    label: 'A2 Cơ bản',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    desc: 'Giao tiếp thông dụng, hội thoại, mua sắm',
  },
  B1: {
    label: 'B1 Trung cấp',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    desc: 'VSTEP B1 / TOEIC 450-650, môi trường, công việc',
  },
  B2: {
    label: 'B2 Độc lập',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    desc: 'VSTEP B2 / TOEIC 650-800, bài báo, lập luận',
  },
  C1: {
    label: 'C1 Cao cấp',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    desc: 'Học thuật chuyên sâu, phê bình, nghiên cứu',
  },
  C2: {
    label: 'C2 Bậc thầy',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    desc: 'Văn bản hàn lâm, giáo trình OpenStax, phân tích',
  },
};

const SOURCE_CONFIG: Record<
  ArticleSourceType,
  { label: string; tag: string; color: string }
> = {
  vstep: { label: 'VSTEP', tag: 'VSTEP B1-C1', color: 'bg-blue-600 text-white' },
  toeic: { label: 'TOEIC', tag: 'TOEIC ETS', color: 'bg-indigo-600 text-white' },
  voa: { label: 'VOA Learning', tag: 'VOA A1-B1', color: 'bg-emerald-600 text-white' },
  race: { label: 'RACE Exam', tag: 'RACE B2-C1', color: 'bg-amber-600 text-white' },
  openstax: { label: 'OpenStax', tag: 'OpenStax C2', color: 'bg-rose-600 text-white' },
  custom: { label: 'LingoPro', tag: 'Tự biên soạn', color: 'bg-slate-700 text-white' },
};

const PAGE_SIZE = 18;

// ── Speech Synthesis Utterance ──
function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.95;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  window.speechSynthesis.speak(u);
}

function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// ── Mindmap Node Component ──
function MindmapTreeItem({
  node,
  depth = 0,
}: {
  node: ReadingMindmapNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);

  const depthColors = [
    'border-indigo-500 bg-indigo-50/70 text-indigo-950 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-100',
    'border-sky-400 bg-sky-50/70 text-sky-950 dark:border-sky-600 dark:bg-sky-950/40 dark:text-sky-100',
    'border-emerald-400 bg-emerald-50/70 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100',
    'border-amber-400 bg-amber-50/70 text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100',
  ];
  const colorClass = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <div className={`space-y-1.5 ${depth > 0 ? 'ml-3 sm:ml-5 pl-2.5 sm:pl-3.5 border-l-2 border-slate-200 dark:border-slate-800' : ''}`}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`rounded-xl border p-2.5 sm:p-3 text-xs sm:text-sm transition-all shadow-2xs ${colorClass} ${
          hasChildren ? 'cursor-pointer hover:shadow-xs' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold min-w-0">
            {depth === 0 ? <Brain className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" /> : null}
            <span className="truncate">{node.label}</span>
          </div>
          {hasChildren && (
            <span className="text-slate-400 dark:text-slate-500 shrink-0">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>
        {node.details && (
          <p className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {node.details}
          </p>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="space-y-1.5 pt-0.5">
          {node.children?.map((child) => (
            <MindmapTreeItem key={child.id || child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Extract Multi-Paragraphs from Article HTML or Plaintext ──
export function getPassageParagraphs(article: ReadingArticle): string[] {
  if (!article) return [];
  // 1. If HTML passage has tags, extract paragraphs
  if (article.passage && /<\/p>|<br\s*\/?>/i.test(article.passage)) {
    const paras = article.passage
      .split(/<\/p>|<br\s*\/?>/i)
      .map((p) =>
        p
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((p) => p.length > 0);
    if (paras.length > 0) return paras;
  }
  // 2. Plain text with newlines
  const plain = article.passage_plain || article.passage || '';
  if (/\n\s*\n/.test(plain)) {
    return plain
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
  return [plain.trim()].filter(Boolean);
}

// ── Interactive Passage Word Component ──
function InteractivePassageWord({
  wordText,
  highlight,
  onLookup,
}: {
  wordText: string;
  highlight?: ReadingVocabularyItem;
  onLookup: (word: string, highlight?: ReadingVocabularyItem) => void;
}) {
  const isHighlighted = Boolean(highlight);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onLookup(wordText, highlight);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLookup(wordText, highlight);
        }
      }}
      className={`inline cursor-pointer select-text transition-colors ${
        isHighlighted
          ? 'font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/70 px-0.5 rounded-xs underline decoration-indigo-400 decoration-1 underline-offset-3 hover:bg-indigo-100 dark:hover:bg-indigo-900'
          : 'hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline decoration-indigo-300/60 underline-offset-3 text-inherit'
      }`}
      title={highlight ? `${wordText}: ${highlight.meaning_vi}` : `Bấm để tra từ: ${wordText}`}
    >
      {wordText}
    </span>
  );
}

// ── Main Page Content Component ──
function ReadingLibraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters State
  const initialLevel = searchParams.get('level') || 'all';
  const initialTheme = searchParams.get('theme') || 'all';
  const initialSource = searchParams.get('source') || 'all';
  const initialSearch = searchParams.get('q') || '';
  const initialArticleId = searchParams.get('id') || searchParams.get('article') || null;

  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);
  const [selectedTheme, setSelectedTheme] = useState<string>(initialTheme);
  const [selectedSource, setSelectedSource] = useState<string>(initialSource);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Active Reading Article State
  const [activeArticle, setActiveArticle] = useState<ReadingArticle | null>(null);
  const [exerciseTab, setExerciseTab] = useState<'mcq' | 'cloze' | 'vocab' | 'mindmap'>('mcq');
  const [mobileTab, setMobileTab] = useState<'passage' | 'exercise'>('passage');
  const [mobilePeekOpen, setMobilePeekOpen] = useState<boolean>(false);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [activeTranslation, setActiveTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Lookup Tooltip / Sheet State
  const [inspectedWord, setInspectedWord] = useState<{
    word: string;
    item?: ReadingVocabularyItem;
  } | null>(null);
  const [lookingUpWord, setLookingUpWord] = useState<string | null>(null);
  const dictCacheRef = useRef<Record<string, ReadingVocabularyItem>>({});

  // Cloze State
  const [clozeAnswers, setClozeAnswers] = useState<Record<string, string>>({});
  const [clozeRevealed, setClozeRevealed] = useState<boolean>(false);

  // MCQ State
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [mcqRevealed, setMcqRevealed] = useState<boolean>(false);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => readLocalBookmarks());

  // Cached initial snapshot for 0ms perceived latency
  const initialCached = useMemo(() => {
    return readLibraryCache({
      page: 1,
      level: initialLevel,
      theme: initialTheme,
      source: initialSource,
      search: initialSearch,
    });
  }, [initialLevel, initialTheme, initialSource, initialSearch]);

  const [articles, setArticles] = useState<ReadingArticle[]>(() => initialCached?.articles ?? []);
  const [hasMore, setHasMore] = useState<boolean>(() => initialCached?.hasMore ?? true);
  const [totalCount, setTotalCount] = useState<number | undefined>(() => initialCached?.total);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
      setTotalCount(undefined);
    }, 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch articles from API
  const fetchArticles = useCallback(
    async (page: number, level: string, theme: string, source: string, search: string) => {
      // Check cache first for 0ms transition
      const cached = readLibraryCache({ page, level, theme, source, search });
      if (cached) {
        setArticles(cached.articles);
        setHasMore(cached.hasMore);
        setTotalCount(cached.total);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));
        // GEMINI.md Rule 3: Do not send premature HEAD count on every page turn
        if (page === 1 && totalCount === undefined) {
          params.set('include_count', 'true');
        }
        if (level && level !== 'all') params.set('level', level);
        if (theme && theme !== 'all') params.set('theme', theme);
        if (source && source !== 'all') params.set('source', source);
        if (search) params.set('search', search);

        const res = await ReadingApi.getArticles(`/api/reading/articles?${params.toString()}`);
        if (!res.ok) throw new Error(`Lỗi kết nối máy chủ (${res.status})`);
        const json = await res.json();

        if (Array.isArray(json.articles)) {
          setArticles(json.articles);
          const nextHasMore = Boolean(json.pagination?.hasMore);
          const nextTotal = typeof json.pagination?.total === 'number' ? json.pagination.total : undefined;
          setHasMore(nextHasMore);
          setTotalCount(nextTotal);

          // Write back to client snapshot cache
          writeLibraryCache({
            articles: json.articles,
            hasMore: nextHasMore,
            total: nextTotal,
            page,
            level,
            theme,
            source,
            search,
            timestamp: Date.now(),
          });
        } else {
          setArticles([]);
          setHasMore(false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài đọc');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger fetch when filters or page change
  useEffect(() => {
    void fetchArticles(currentPage, selectedLevel, selectedTheme, selectedSource, debouncedSearch);
  }, [currentPage, selectedLevel, selectedTheme, selectedSource, debouncedSearch, fetchArticles]);

  // Load article by ID or Slug from URL if present
  useEffect(() => {
    if (!initialArticleId) return;
    let cancelled = false;

    async function loadInitialArticle(idOrSlug: string) {
      // Check if already in loaded articles
      const match = articles.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
      if (match) {
        setActiveArticle(match);
        setActiveTranslation(match.translation || null);
        setExerciseTab(
          match.questions && match.questions.length > 0
            ? 'mcq'
            : match.cloze?.blanks && match.cloze.blanks.length > 0
            ? 'cloze'
            : 'vocab'
        );
        return;
      }

      try {
        const res = await ReadingApi.getArticles(
          `/api/reading/articles?id=${encodeURIComponent(idOrSlug)}&slug=${encodeURIComponent(idOrSlug)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.article) {
            const art = json.article as ReadingArticle;
            setActiveArticle(art);
            setActiveTranslation(art.translation || null);
            setExerciseTab(
              art.questions && art.questions.length > 0
                ? 'mcq'
                : art.cloze?.blanks && art.cloze.blanks.length > 0
                ? 'cloze'
                : 'vocab'
            );
          }
        }
      } catch {
        // fallback
      }
    }

    void loadInitialArticle(initialArticleId);
    return () => {
      cancelled = true;
    };
  }, [initialArticleId, articles]);

  // Handle Browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const articleParam = sp.get('article') || sp.get('id');
      if (!articleParam) {
        stopSpeech();
        setIsPlayingAudio(false);
        setActiveArticle(null);
        setInspectedWord(null);
        setShowTranslation(false);
        setActiveTranslation(null);
        setIsTranslating(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load user bookmarks from server on mount
  useEffect(() => {
    let cancelled = false;
    ReadingApi.getProgress()
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.bookmarks)) {
          const s = new Set<string>(data.bookmarks);
          setBookmarks(s);
          try {
            localStorage.setItem('lp:reading_library:bookmarks_v1', JSON.stringify(Array.from(s)));
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle Select Article
  const handleSelectArticle = (art: ReadingArticle) => {
    stopSpeech();
    setIsPlayingAudio(false);
    setActiveArticle(art);
    setExerciseTab(
      art.questions && art.questions.length > 0
        ? 'mcq'
        : art.cloze?.blanks && art.cloze.blanks.length > 0
        ? 'cloze'
        : 'vocab'
    );
    setMobileTab('passage');
    setMobilePeekOpen(false);
    setShowTranslation(false);
    setActiveTranslation(art.translation || null);
    setIsTranslating(false);
    setInspectedWord(null);
    setClozeAnswers({});
    setClozeRevealed(false);
    setMcqAnswers({});
    setMcqRevealed(false);

    // Update URL shallowly and track history
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('article', art.slug || art.id);
      window.history.pushState({ article: art.slug || art.id }, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close Article Reader
  const handleCloseArticle = () => {
    stopSpeech();
    setIsPlayingAudio(false);
    setActiveArticle(null);
    setMobileTab('passage');
    setMobilePeekOpen(false);
    setInspectedWord(null);
    setShowTranslation(false);
    setActiveTranslation(null);
    setIsTranslating(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('article');
      url.searchParams.delete('id');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Toggle or Fetch Vietnamese Translation on-demand
  const handleToggleTranslation = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (activeTranslation || activeArticle?.translation) {
      setShowTranslation(true);
      return;
    }

    if (!activeArticle) return;
    setIsTranslating(true);
    try {
      const paras = getPassageParagraphs(activeArticle);
      const textToTranslate = paras.join('\n\n').slice(0, 2800);
      const res = await DictionaryApi.translate({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLang: 'en',
          targetLang: 'vi',
          extractPhrases: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const translated = json.translatedText || json.translation || json.result;
        if (translated) {
          setActiveTranslation(translated);
          setShowTranslation(true);
        }
      }
    } catch (err) {
      console.warn('[Reading Library] Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Lookup word in dictionary on demand
  const handleWordClick = async (wordText: string, highlight?: ReadingVocabularyItem) => {
    if (highlight && highlight.meaning_vi) {
      setInspectedWord({ word: wordText, item: highlight });
      return;
    }

    const clean = wordText.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').trim();
    if (!clean || clean.length < 2) return;

    if (dictCacheRef.current[clean]) {
      setInspectedWord({ word: wordText, item: dictCacheRef.current[clean] });
      return;
    }

    setInspectedWord({ word: wordText, item: undefined });
    setLookingUpWord(clean);

    try {
      const res = await DictionaryApi.lookup(`/api/dictionary/lookup?word=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const meaning =
          data.meanings?.[0]?.meaning ||
          data.definition ||
          (data.results && data.results[0]?.definition);
        const phonetic = data.ipa || data.pronunciations?.[0]?.ipa;
        const pos = data.pos || data.meanings?.[0]?.part_of_speech;

        const item: ReadingVocabularyItem = {
          word: clean,
          meaning_vi: meaning || 'Từ vựng trong ngữ cảnh bài đọc.',
          phonetic,
          pos,
        };

        if (meaning) {
          dictCacheRef.current[clean] = item;
        }
        setInspectedWord({ word: wordText, item });
      }
    } catch {
      // Keep inspectedWord with fallback
    } finally {
      setLookingUpWord(null);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (artId: string) => {
    const nextState = !bookmarks.has(artId);
    const updated = new Set(bookmarks);
    if (nextState) updated.add(artId);
    else updated.delete(artId);
    setBookmarks(updated);
    writeLocalBookmark(artId, nextState);

    try {
      await ReadingApi.submitProgress({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: artId,
          is_bookmarked: nextState,
        }),
      });
    } catch {}
  };

  // TTS Reader
  const handleTogglePlaySpeech = () => {
    if (!activeArticle) return;
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(activeArticle.passage_plain || activeArticle.passage, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  // Cloze blank answers mapping
  const clozeBlanksList: ReadingClozeBlank[] = useMemo(() => {
    if (!activeArticle?.cloze?.blanks) return [];
    return activeArticle.cloze.blanks;
  }, [activeArticle]);

  // Compute expected answer for cloze blank
  const getExpectedClozeAnswer = useCallback((blank: ReadingClozeBlank): string => {
    if (!blank) return '';
    // If answer is letter A, B, C, D
    if (typeof blank.answer === 'string' && /^[A-D]$/i.test(blank.answer)) {
      const idx = blank.answer.toUpperCase().charCodeAt(0) - 65;
      if (blank.options && blank.options[idx]) return blank.options[idx].trim();
    }
    // If answer is numeric index
    if (typeof blank.answer === 'number' && blank.options && blank.options[blank.answer]) {
      return blank.options[blank.answer].trim();
    }
    return String(blank.answer || blank.word || '').trim();
  }, []);

  // Grade Cloze
  const clozeScore = useMemo(() => {
    if (!clozeRevealed || clozeBlanksList.length === 0) return null;
    let correct = 0;
    clozeBlanksList.forEach((b) => {
      const key = String(b.id ?? b.index);
      const userChoice = (clozeAnswers[key] || '').trim().toLowerCase();
      const expected = getExpectedClozeAnswer(b).toLowerCase();
      if (userChoice && userChoice === expected) {
        correct++;
      }
    });
    return { correct, total: clozeBlanksList.length };
  }, [clozeRevealed, clozeBlanksList, clozeAnswers, getExpectedClozeAnswer]);

  // MCQ Grading
  const getExpectedMcqIndex = useCallback((q: ReadingQuestion): number => {
    if (typeof q.answer === 'number') return q.answer;
    if (typeof q.answer === 'string') {
      if (/^[A-D]$/i.test(q.answer)) {
        return q.answer.toUpperCase().charCodeAt(0) - 65;
      }
      return q.options.findIndex(
        (o) => o.trim().toLowerCase() === String(q.answer).trim().toLowerCase()
      );
    }
    return 0;
  }, []);

  const mcqScore = useMemo(() => {
    if (!mcqRevealed || !activeArticle?.questions?.length) return null;
    let correct = 0;
    activeArticle.questions.forEach((q, idx) => {
      const userChoice = mcqAnswers[q.id || idx];
      const expected = getExpectedMcqIndex(q);
      if (userChoice !== undefined && userChoice === expected) {
        correct++;
      }
    });
    return { correct, total: activeArticle.questions.length };
  }, [mcqRevealed, activeArticle, mcqAnswers, getExpectedMcqIndex]);

  // Save Progress on submit
  const handleGradeMcq = () => {
    setMcqRevealed(true);
    if (!activeArticle) return;
    const questions = activeArticle.questions || [];
    let correct = 0;
    questions.forEach((q, idx) => {
      const userChoice = mcqAnswers[q.id || idx];
      const expected = getExpectedMcqIndex(q);
      if (userChoice !== undefined && userChoice === expected) correct++;
    });

    void ReadingApi.submitProgress({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article_id: activeArticle.id,
        mcq_score: correct,
        mcq_total: questions.length,
        status: 'completed',
      }),
    });
  };

  // Render Passage text with clickable words and natural English typography
  const renderPassageParagraphs = (article: ReadingArticle) => {
    const paragraphs = getPassageParagraphs(article);

    const highlightsMap = new Map<string, ReadingVocabularyItem>();
    (article.vocabulary_highlights || []).forEach((item) => {
      if (item.word) highlightsMap.set(item.word.toLowerCase().trim(), item);
    });

    return paragraphs.map((para, pIdx) => {
      // Split paragraph by whitespace only to keep words intact
      const words = para.trim().split(/\s+/);

      return (
        <p
          key={pIdx}
          style={{
            fontSize: `calc(1.0625rem + ${fontSizeOffset}px)`,
            lineHeight: 1.8,
          }}
          className="mb-5 text-slate-850 dark:text-slate-200 font-serif tracking-normal text-left selection:bg-indigo-100 dark:selection:bg-indigo-900/60 leading-relaxed"
        >
          {words.map((chunk, wIdx) => {
            const isLast = wIdx === words.length - 1;
            // Match leading non-alphanumeric, middle word, trailing punctuation
            const match = chunk.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'-]+)([^a-zA-Z0-9]*)$/);

            if (!match) {
              return (
                <span key={wIdx}>
                  {chunk}
                  {!isLast && ' '}
                </span>
              );
            }

            const [, prefix, wordCore, suffix] = match;
            const clean = wordCore.toLowerCase();
            const highlight = highlightsMap.get(clean);

            return (
              <span key={wIdx}>
                {prefix && <span>{prefix}</span>}
                <InteractivePassageWord
                  wordText={wordCore}
                  highlight={highlight}
                  onLookup={(w, h) => void handleWordClick(w, h)}
                />
                {suffix && <span>{suffix}</span>}
                {!isLast && ' '}
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <StudentShell title="Thư viện bài đọc">
      <div className="mx-auto max-w-6xl space-y-4 px-3 py-3 pb-24 sm:px-4">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/practice"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              aria-label="Về Sử dụng từ"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Library className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Thư viện bài đọc LingoPro</span>
                </h1>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {totalCount ? `${totalCount} bài` : '588 bài chuẩn'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kho bài đọc A1–C2 chuẩn VSTEP, TOEIC, VOA, RACE, OpenStax với bản dịch & trắc nghiệm
              </p>
            </div>
          </div>

          {/* Quick Tab Switcher to Daily Reading */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold shrink-0">
            <span className="py-1 px-3 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs flex items-center gap-1">
              <Library className="h-3.5 w-3.5" />
              <span>Kho thư viện</span>
            </span>
            <Link
              href="/practice/daily-reading"
              className="py-1 px-3 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Bài đọc AI hàng ngày</span>
            </Link>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: ACTIVE ARTICLE READER (DETAIL MODE)                   */}
        {/* ============================================================== */}
        {activeArticle ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
              <button
                type="button"
                onClick={handleCloseArticle}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại thư viện</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Audio Reader / Speech Button */}
                <button
                  type="button"
                  onClick={handleTogglePlaySpeech}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                      <span>Dừng đọc</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Phát âm cả bài</span>
                    </>
                  )}
                </button>

                {/* Native audio player if available */}
                {activeArticle.audio_url && (
                  <a
                    href={activeArticle.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    <Headphones className="h-3.5 w-3.5" />
                    <span>Audio gốc</span>
                  </a>
                )}

                {/* Font Size Adjusters */}
                <div className="hidden sm:flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFontSizeOffset((p) => Math.max(-2, p - 1))}
                    className="px-2 py-1 hover:text-indigo-600 font-bold"
                    title="Giảm cỡ chữ"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeOffset((p) => Math.min(6, p + 1))}
                    className="px-2 py-1 hover:text-indigo-600 font-bold"
                    title="Tăng cỡ chữ"
                  >
                    A+
                  </button>
                </div>

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(activeArticle.id)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    bookmarks.has(activeArticle.id)
                      ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={bookmarks.has(activeArticle.id) ? 'Đã lưu yêu thích' : 'Lưu bài đọc'}
                >
                  <Heart
                    className={`h-4 w-4 ${bookmarks.has(activeArticle.id) ? 'fill-current text-rose-500' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Mobile Mode Switcher (< lg) */}
            <div className="lg:hidden flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMobileTab('passage')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mobileTab === 'passage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>📖 Bài đọc</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileTab('exercise');
                  if (!activeArticle.questions?.length && clozeBlanksList.length > 0) {
                    setExerciseTab('cloze');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mobileTab === 'exercise'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <span>🎯 Bài tập & Đáp án</span>
                {activeArticle.questions?.length > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    mobileTab === 'exercise' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}>
                    {activeArticle.questions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Split-Pane Grid: Left Passage, Right Sticky Quiz & Answers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ============================================================== */}
              {/* LEFT COLUMN: ARTICLE PASSAGE & BILINGUAL TRANSLATION           */}
              {/* ============================================================== */}
              <div
                className={`${
                  mobileTab === 'passage' ? 'space-y-4' : 'hidden lg:block lg:col-span-7 xl:col-span-7 space-y-4'
                } lg:col-span-7 xl:col-span-7`}
              >
                {/* Article Header Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Level Badge */}
                    {CEFR_CONFIG[activeArticle.cefr_level] && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          CEFR_CONFIG[activeArticle.cefr_level].bg
                        } ${CEFR_CONFIG[activeArticle.cefr_level].text} ${
                          CEFR_CONFIG[activeArticle.cefr_level].border
                        }`}
                      >
                        {activeArticle.cefr_level}
                      </span>
                    )}

                    {/* Source Badge */}
                    {SOURCE_CONFIG[activeArticle.source_type] && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          SOURCE_CONFIG[activeArticle.source_type].color
                        }`}
                      >
                        {SOURCE_CONFIG[activeArticle.source_type].tag}
                      </span>
                    )}

                    {/* Theme Badge */}
                    {(() => {
                      const theme = getPackTheme(activeArticle.theme_id);
                      return (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <span>{theme?.emoji || '📖'}</span>
                          <span>{theme?.labelVi || activeArticle.theme_id}</span>
                        </span>
                      );
                    })()}

                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {activeArticle.word_count || 120} từ · ~{activeArticle.estimated_read_minutes || 2} phút đọc
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {activeArticle.title}
                  </h2>

                  {activeArticle.summary && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                      &ldquo;{activeArticle.summary}&rdquo;
                    </p>
                  )}
                </div>

                {/* Passage Text Container */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Nhấp vào từ bất kỳ để tra nghĩa & phát âm:
                    </span>
                    {/* Vietnamese Translation Button */}
                    <button
                      type="button"
                      onClick={handleToggleTranslation}
                      disabled={isTranslating}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Đang dịch bản ngữ…</span>
                        </>
                      ) : showTranslation ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Ẩn bản dịch</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Bản dịch TV</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Formatted Paragraphs */}
                  <div className="prose dark:prose-invert max-w-none">
                    {renderPassageParagraphs(activeArticle)}
                  </div>

                  {/* Vietnamese Translation Panel */}
                  {showTranslation && (activeTranslation || activeArticle.translation) && (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-4 sm:p-5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 mb-2 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                        <Eye className="h-4 w-4" />
                        <span>Bản dịch tiếng Việt song ngữ:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed font-sans whitespace-pre-line">
                        {activeTranslation || activeArticle.translation}
                      </p>
                    </div>
                  )}

                  {/* Floating Inspected Word Box */}
                  {inspectedWord && (
                    <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/80 dark:border-indigo-900/80 dark:bg-indigo-950/50 p-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-indigo-950 dark:text-indigo-100">
                              {inspectedWord.word}
                            </span>
                            <button
                              type="button"
                              onClick={() => speakText(inspectedWord.word)}
                              className="p-1 rounded-lg hover:bg-indigo-200/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 cursor-pointer"
                              title="Phát âm"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </div>
                          {inspectedWord.item?.phonetic && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {inspectedWord.item.phonetic} {inspectedWord.item.pos ? `· (${inspectedWord.item.pos})` : ''}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectedWord(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-indigo-200/60 dark:border-indigo-900/60">
                        {lookingUpWord ? (
                          <div className="flex items-center gap-2 py-1 text-xs text-indigo-700 dark:text-indigo-300">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                            <span>Đang tra cứu từ điển…</span>
                          </div>
                        ) : inspectedWord.item?.meaning_vi ? (
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                            {inspectedWord.item.meaning_vi}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            Từ vựng trong ngữ cảnh bài đọc.
                          </p>
                        )}
                        <Link
                          href={`/dictionary?q=${encodeURIComponent(inspectedWord.word)}`}
                          target="_blank"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 underline hover:opacity-80"
                        >
                          <span>Tra cứu đầy đủ trong Từ điển</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Mobile Jump to Exercise Button */}
                  <div className="lg:hidden mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileTab('exercise');
                        setExerciseTab('mcq');
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm shadow-sm transition-all"
                    >
                      <span>🎯 Sang phần trắc nghiệm & đáp án ({activeArticle.questions?.length || 0} câu)</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* RIGHT COLUMN: STICKY COMPACT EXERCISE & ANSWERS PANE           */}
              {/* ============================================================== */}
              <div
                className={`${
                  mobileTab === 'exercise' ? 'space-y-4' : 'hidden lg:block lg:col-span-5 xl:col-span-5'
                } lg:col-span-5 xl:col-span-5`}
              >
                <div className="lg:sticky lg:top-4 max-h-[calc(100vh-2.5rem)] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  {/* Mobile Peek Accordion (< lg only) */}
                  <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2.5">
                    <button
                      type="button"
                      onClick={() => setMobilePeekOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 py-1 px-2"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Xem nhanh nội dung bài đọc</span>
                      </span>
                      {mobilePeekOpen ? (
                        <ChevronUp className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-indigo-500" />
                      )}
                    </button>
                    {mobilePeekOpen && (
                      <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto text-xs font-serif leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line animate-in fade-in duration-150">
                        {activeArticle.passage_plain || activeArticle.passage}
                      </div>
                    )}
                  </div>

                  {/* Exercise Subtabs Header */}
                  <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-50/80 dark:bg-slate-800/40 overflow-x-auto scrollbar-none shrink-0">
                    <button
                      type="button"
                      onClick={() => setExerciseTab('mcq')}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        exerciseTab === 'mcq'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>🎯 Trắc nghiệm</span>
                      {activeArticle.questions?.length > 0 && (
                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          exerciseTab === 'mcq' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {activeArticle.questions.length}
                        </span>
                      )}
                    </button>

                    {clozeBlanksList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExerciseTab('cloze')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          exerciseTab === 'cloze'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>✍️ Điền từ</span>
                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          exerciseTab === 'cloze' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {clozeBlanksList.length}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExerciseTab('vocab')}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        exerciseTab === 'vocab'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Từ vựng</span>
                      {activeArticle.vocabulary_highlights?.length > 0 && (
                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          exerciseTab === 'vocab' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {activeArticle.vocabulary_highlights.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExerciseTab('mindmap')}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        exerciseTab === 'mindmap'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      <span>Sơ đồ</span>
                    </button>
                  </div>

                  {/* Scrollable Exercise Content Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* 1. MCQ QUESTIONS WITH SIDE-BY-SIDE ANSWERS & EXPLANATIONS */}
                    {exerciseTab === 'mcq' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Câu hỏi trắc nghiệm ({activeArticle.questions?.length || 0} câu)
                          </span>
                          {mcqScore && (
                            <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Đúng {mcqScore.correct}/{mcqScore.total} ({Math.round((mcqScore.correct / mcqScore.total) * 100)}%)
                            </span>
                          )}
                        </div>

                        {(!activeArticle.questions || activeArticle.questions.length === 0) ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            Bài đọc này chưa có câu hỏi trắc nghiệm. Bạn có thể luyện điền từ hoặc tra cứu từ vựng.
                          </div>
                        ) : (
                          activeArticle.questions.map((q, qIdx) => {
                            const qKey = q.id || qIdx;
                            const selectedIdx = mcqAnswers[qKey];
                            const expectedIdx = getExpectedMcqIndex(q);
                            const isCorrect = selectedIdx !== undefined && selectedIdx === expectedIdx;

                            return (
                              <div
                                key={qKey}
                                className={`rounded-xl border p-3.5 transition-all ${
                                  mcqRevealed
                                    ? isCorrect
                                      ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20'
                                      : 'border-rose-300 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/20'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                                }`}
                              >
                                <div className="flex items-start gap-2 mb-2.5">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-950 text-[11px] font-black text-indigo-700 dark:text-indigo-300">
                                    {qIdx + 1}
                                  </span>
                                  <p className="flex-1 font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                                    {q.question}
                                  </p>
                                  {mcqRevealed && (
                                    <span className={`text-[11px] font-bold shrink-0 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {isCorrect ? '✓ Đúng' : '✗ Sai'}
                                    </span>
                                  )}
                                </div>

                                {/* Options Stack */}
                                <div className="space-y-1.5 pl-7">
                                  {q.options.map((opt, optIdx) => {
                                    const letters = ['A', 'B', 'C', 'D'];
                                    const isChosen = selectedIdx === optIdx;
                                    const isExpected = optIdx === expectedIdx;

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        disabled={mcqRevealed}
                                        onClick={() => {
                                          setMcqAnswers((prev) => ({ ...prev, [qKey]: optIdx }));
                                        }}
                                        className={`w-full flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-left transition-all ${
                                          mcqRevealed
                                            ? isExpected
                                              ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold'
                                              : isChosen
                                              ? 'border-rose-400 bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 line-through'
                                              : 'border-slate-200 dark:border-slate-800 opacity-60'
                                            : isChosen
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                                        }`}
                                      >
                                        <span
                                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                                            mcqRevealed && isExpected
                                              ? 'bg-emerald-600 text-white'
                                              : isChosen
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                          }`}
                                        >
                                          {letters[optIdx] || optIdx + 1}
                                        </span>
                                        <span className="flex-1 leading-snug">{opt}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Compact Explanation Right Beside Question */}
                                {mcqRevealed && q.explain && (
                                  <div className="mt-2.5 ml-7 rounded-lg border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/40 p-2.5 text-[11px] text-indigo-950 dark:text-indigo-200 leading-relaxed">
                                    <span className="font-bold">💡 Giải thích: </span>
                                    <span>{q.explain}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* 2. CLOZE FILL-IN-THE-BLANKS */}
                    {exerciseTab === 'cloze' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Điền từ vào chỗ trống ({clozeBlanksList.length} câu)
                          </span>
                          {clozeScore && (
                            <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Đúng {clozeScore.correct}/{clozeScore.total}
                            </span>
                          )}
                        </div>

                        {clozeBlanksList.map((blank, bIdx) => {
                          const blankKey = String(blank.id ?? blank.index);
                          const selected = clozeAnswers[blankKey] || '';
                          const expected = getExpectedClozeAnswer(blank);
                          const isCorrect = selected.trim().toLowerCase() === expected.trim().toLowerCase();

                          return (
                            <div
                              key={blankKey}
                              className={`rounded-xl border p-3 transition-all ${
                                clozeRevealed
                                  ? isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                                    : 'border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                  Vị trí ({bIdx + 1}): {blank.word ? `Từ: ${blank.word}` : `Chỗ trống ${bIdx + 1}`}
                                </span>
                                {clozeRevealed && (
                                  <span className={`text-[11px] font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isCorrect ? '✓ Đúng' : `✗ Đáp án: ${expected}`}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                {(blank.options || []).map((opt) => {
                                  const isThisOptionSelected = selected === opt;
                                  const isThisOptionCorrect = opt.trim().toLowerCase() === expected.trim().toLowerCase();

                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      disabled={clozeRevealed}
                                      onClick={() => {
                                        setClozeAnswers((prev) => ({ ...prev, [blankKey]: opt }));
                                      }}
                                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all text-left truncate ${
                                        clozeRevealed
                                          ? isThisOptionCorrect
                                            ? 'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 font-extrabold'
                                            : isThisOptionSelected
                                            ? 'border-rose-500 bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100 line-through'
                                            : 'border-slate-200 dark:border-slate-800 text-slate-400'
                                          : isThisOptionSelected
                                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {clozeRevealed && blank.explain && (
                                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-slate-200/60 dark:border-slate-800">
                                  💡 Giải thích: {blank.explain}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. VOCABULARY HIGHLIGHTS LIST */}
                    {exerciseTab === 'vocab' && (
                      <div className="space-y-3">
                        <div className="pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                          Từ vựng trọng tâm ({activeArticle.vocabulary_highlights?.length || 0} từ)
                        </div>

                        {activeArticle.vocabulary_highlights && activeArticle.vocabulary_highlights.length > 0 ? (
                          activeArticle.vocabulary_highlights.map((voc, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
                                  {voc.word}
                                </span>
                                <div className="flex items-center gap-1">
                                  {voc.pos && (
                                    <span className="rounded bg-slate-200/70 dark:bg-slate-700 px-1 py-0.2 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                                      {voc.pos}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => speakText(voc.word)}
                                    className="p-1 text-slate-400 hover:text-indigo-600"
                                    title="Phát âm"
                                  >
                                    <Volume2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {voc.phonetic && (
                                <p className="text-[10px] text-slate-400 font-mono">{voc.phonetic}</p>
                              )}
                              <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                                {voc.meaning_vi}
                              </p>
                              {voc.context_sentence && (
                                <p className="mt-1 text-[11px] text-slate-500 italic border-l-2 border-indigo-200 pl-2">
                                  &ldquo;{voc.context_sentence}&rdquo;
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 py-4 text-center">
                            Nhấp trực tiếp vào bất kỳ từ nào trên đoạn văn để tra nghĩa và phát âm.
                          </p>
                        )}
                      </div>
                    )}

                    {/* 4. MINDMAP & OUTLINE */}
                    {exerciseTab === 'mindmap' && (
                      <div className="space-y-4">
                        <div className="pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Brain className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Cấu trúc luận điểm & Ý chính</span>
                        </div>

                        {activeArticle.mindmap_data?.root ? (
                          <div className="pt-1">
                            <MindmapTreeItem node={activeArticle.mindmap_data.root} depth={0} />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30 p-3">
                              <h4 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1">
                                📌 Ý chính bài đọc
                              </h4>
                              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                                {activeArticle.summary || activeArticle.title}
                              </p>
                            </div>

                            {(() => {
                              const paras = getPassageParagraphs(activeArticle);
                              if (paras.length <= 1) return null;
                              return (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    📑 Bố cục {paras.length} đoạn văn
                                  </h4>
                                  {paras.map((p, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 text-xs"
                                    >
                                      <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                                        Đoạn {idx + 1}
                                      </span>
                                      <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2">
                                        &ldquo;{p.slice(0, 120)}...&rdquo;
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Pane Footer Actions */}
                  <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
                    {exerciseTab === 'mcq' && (
                      mcqRevealed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMcqAnswers({});
                            setMcqRevealed(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Làm lại trắc nghiệm</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGradeMcq}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Kiểm tra đáp án & Chấm điểm</span>
                        </button>
                      )
                    )}

                    {exerciseTab === 'cloze' && (
                      clozeRevealed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setClozeAnswers({});
                            setClozeRevealed(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Làm lại bài đục lỗ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setClozeRevealed(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Kiểm tra đáp án</span>
                        </button>
                      )
                    )}

                    {(exerciseTab === 'vocab' || exerciseTab === 'mindmap') && (
                      <span className="text-[11px] text-slate-500 italic">
                        Bấm vào từ khóa hoặc đoạn văn để đối chiếu.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW 2: ARTICLE BROWSER & CATALOG GRID                          */
          /* ============================================================== */
          <div className="space-y-4">
            {/* Search & Quick Filters Bar */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài đọc theo tiêu đề, từ khóa (ví dụ: coffee, market, science, climate)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* CEFR Level Filter Pills */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1.5">
                  <span>Cấp độ CEFR:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel('all');
                      setCurrentPage(1);
                      setTotalCount(undefined);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedLevel === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Tất cả cấp độ
                  </button>
                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((lvl) => {
                    const cfg = CEFR_CONFIG[lvl];
                    const isSelected = selectedLevel === lvl;

                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setSelectedLevel(lvl);
                          setCurrentPage(1);
                          setTotalCount(undefined);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.bg} ${cfg.text} border-2 ${cfg.border} ring-2 ring-indigo-400/40 shadow-xs font-black`
                            : `border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${cfg.text} hover:bg-slate-50`
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 15 Standard Themes Filter (Chips scroll) */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1.5">
                  <span>15 Chủ đề chuẩn:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTheme('all');
                      setCurrentPage(1);
                      setTotalCount(undefined);
                    }}
                    className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                      selectedTheme === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Tất cả chủ đề
                  </button>
                  {PACK_THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(theme.id);
                          setCurrentPage(1);
                          setTotalCount(undefined);
                        }}
                        className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        <span>{theme.emoji}</span>
                        <span>{theme.labelVi}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source Filters Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-slate-400 font-bold shrink-0">Nguồn:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSource('all');
                      setCurrentPage(1);
                      setTotalCount(undefined);
                    }}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                      selectedSource === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {(['vstep', 'toeic', 'voa', 'race', 'openstax'] as ArticleSourceType[]).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => {
                        setSelectedSource(src);
                        setCurrentPage(1);
                        setTotalCount(undefined);
                      }}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                        selectedSource === src
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      {SOURCE_CONFIG[src].label}
                    </button>
                  ))}
                </div>

                {/* Reset Filters */}
                {(selectedLevel !== 'all' ||
                  selectedTheme !== 'all' ||
                  selectedSource !== 'all' ||
                  searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel('all');
                      setSelectedTheme('all');
                      setSelectedSource('all');
                      setSearchQuery('');
                      setCurrentPage(1);
                      setTotalCount(undefined);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Error notice */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-center justify-between gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() =>
                    fetchArticles(currentPage, selectedLevel, selectedTheme, selectedSource, debouncedSearch)
                  }
                  className="font-bold underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span>Đang tải kho bài đọc…</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && articles.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
                <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Không tìm thấy bài đọc phù hợp
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy thử thay đổi cấp độ CEFR, từ khóa tìm kiếm hoặc bấm &ldquo;Đặt lại bộ lọc&rdquo; để xem đầy đủ 588 bài đọc.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel('all');
                    setSelectedTheme('all');
                    setSelectedSource('all');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Xem tất cả bài đọc</span>
                </button>
              </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {articles.map((art) => {
                const cefr = CEFR_CONFIG[art.cefr_level];
                const theme = getPackTheme(art.theme_id);
                const source = SOURCE_CONFIG[art.source_type];
                const isBookmarked = bookmarks.has(art.id);
                const plainPreview = (art.passage_plain || '').slice(0, 140).replace(/\s+/g, ' ');

                return (
                  <div
                    key={art.id}
                    onClick={() => handleSelectArticle(art)}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          {cefr && (
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${cefr.bg} ${cefr.text} ${cefr.border}`}
                            >
                              {art.cefr_level}
                            </span>
                          )}
                          {source && (
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${source.color}`}
                            >
                              {source.label}
                            </span>
                          )}
                        </div>

                        {/* Bookmark Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleBookmark(art.id);
                          }}
                          className={`p-1 text-slate-400 hover:text-rose-500 transition-colors ${
                            isBookmarked ? 'text-rose-500' : ''
                          }`}
                          title={isBookmarked ? 'Đã lưu' : 'Lưu bài'}
                        >
                          <Heart
                            className={`h-4 w-4 ${isBookmarked ? 'fill-current text-rose-500' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Theme Tag */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                        <span>{theme?.emoji || '📖'}</span>
                        <span>{theme?.labelVi || art.theme_id}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>

                      {/* Excerpt Snippet */}
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {plainPreview}...
                      </p>
                    </div>

                    {/* Card Footer Meta */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{art.word_count || 120} từ</span>
                        <span>•</span>
                        <span>~{art.estimated_read_minutes || 2} phút</span>
                        {art.questions && art.questions.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {art.questions.length} câu hỏi
                            </span>
                          </>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (Compliant with GEMINI.md Rule 3) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-xs">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Trang trước</span>
              </button>

              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Trang {currentPage}</span>
                {totalCount ? (
                  <span className="text-slate-400 font-normal ml-1">
                    / {Math.ceil(totalCount / PAGE_SIZE)} ({totalCount} bài)
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                disabled={!hasMore || loading}
                onClick={() => {
                  setCurrentPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <span>Trang sau</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}

export default function ReadingLibraryPage() {
  return (
    <Suspense
      fallback={
        <StudentShell title="Thư viện bài đọc">
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        </StudentShell>
      }
    >
      <ReadingLibraryContent />
    </Suspense>
  );
}

