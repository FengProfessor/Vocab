'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { DictionaryData, DictionaryMeaning, WordFamilyEntry } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronLeft, Search, Loader2, Volume2, BookOpen, X, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentShell } from '@/components/student/StudentShell';
import { speak } from '@/lib/study';
import { resolveImageSrc } from '@/lib/media-url';

const HISTORY_KEY = 'lingo_dict_history';
const MAX_HISTORY = 20;

// Regex phát hiện kết quả rác từ AI (từ không tồn tại)
const GARBAGE_PATTERNS = /không có trong từ điển|not a real word|word not found|không tồn tại/i;

type SourceBadge = 'Kho từ điển' | 'Wiktionary' | 'AI' | 'Câu · giáo án' | 'Câu · AI' | 'Câu · ước lượng';

interface SentenceKernel {
  text: string;
  s: string;
  v: string;
  o?: string;
  translation_vi: string;
}

interface SentenceChunk {
  text: string;
  base: string;
  meaning_vi: string;
  pos?: string;
}

interface SentenceBuildLevel {
  level: number;
  text: string;
  slot_vi: string;
}

interface SentenceLogic {
  pattern: string;
  a: string;
  b: string;
  formula_vi: string;
}

interface SentenceAnalysis {
  sentence: string;
  translation_vi: string;
  structure?: string;
  kernel?: SentenceKernel;
  logic?: SentenceLogic;
  build_levels?: SentenceBuildLevel[];
  chunks: SentenceChunk[];
  notes?: string[];
}

interface LookupResult {
  data: DictionaryData;
  source: SourceBadge;
  imageUrl?: string;
  /** Từ user gõ vào — luôn dùng làm heading thay vì data.word từ external */
  queriedWord: string;
  /** Có khi tra cụm/câu (≥2 từ) qua ai-sentence */
  sentence?: SentenceAnalysis;
  aiSource?: 'golden' | 'ai' | 'heuristic' | string;
}

function isMultiWord(s: string): boolean {
  return s.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function looksVietnameseText(s: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
}

function isEnglishBone(s: string): boolean {
  const t = s.trim();
  if (!t || looksVietnameseText(t)) return false;
  return /^[A-Za-z][A-Za-z'’\-\s]{0,100}$/.test(t);
}

function sentenceSourceBadge(aiSource?: string): SourceBadge {
  if (aiSource === 'golden') return 'Câu · giáo án';
  if (aiSource === 'heuristic') return 'Câu · ước lượng';
  return 'Câu · AI';
}

function getHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function pushHistory(word: string) {
  const prev = getHistory().filter(w => w !== word);
  const next = [word, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function clearHistory() {
  localStorage.setItem(HISTORY_KEY, '[]');
}

function speakWord(word: string, lang: 'en-GB' | 'en-US') {
  // Dùng pick voice EN tường minh (tránh giọng Việt trên locale vi-VN)
  speak(word, 1.0, lang);
}

/** Chuẩn hóa familyWords (string cũ hoặc object mới) → WordFamilyEntry[]. Parse "word (pos)" nếu là string. */
function normalizeFamilyWords(raw: DictionaryData['familyWords']): WordFamilyEntry[] {
  if (!raw?.length) return [];
  return raw.map((item): WordFamilyEntry => {
    if (typeof item === 'string') {
      const m = item.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      return m ? { word: m[1].trim(), pos: m[2].trim() } : { word: item.trim() };
    }
    return item;
  }).filter(e => e.word);
}

/** Bỏ slash bao ngoài — DB đôi khi lưu `/ˈ…/` trong khi UI bọc thêm `/{ipa}/` → //…// */
function formatIpa(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.trim().replace(/^\/+|\/+$/g, '').trim();
}

/** Kiểm tra data có phải kết quả rác không (IPA placeholder hoặc nghĩa bịa) */
function isGarbageResult(data: DictionaryData): boolean {
  // IPA chứa "[" → placeholder như "[word not found]"
  const firstIpa = data.pronunciations?.[0]?.ipa ?? '';
  if (firstIpa.includes('[')) return true;

  // Kiểm tra mọi definition xem có text rác không
  const allDefs = data.results?.flatMap(r => r.meanings?.map(m => m.definition ?? '') ?? []) ?? [];
  if (allDefs.some(d => GARBAGE_PATTERNS.test(d))) return true;

  return false;
}

export default function DictionaryPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  // Track saved state per meaning index
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const [savingIndexes, setSavingIndexes] = useState<Set<number>>(new Set());
  // Trạng thái toàn bộ từ đã có trong sổ (không phân biệt meaning index)
  const [wordAlreadySaved, setWordAlreadySaved] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedSuggestIdx, setSelectedSuggestIdx] = useState(-1);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
    })();
    setHistory(getHistory());
  }, []);

  // Reset saved state when result changes
  useEffect(() => {
    setSavedIndexes(new Set());
    setSavingIndexes(new Set());
  }, [result]);

  /** Kiểm tra từ đã có trong sổ user chưa (gọi sau khi có kết quả tra) */
  const checkWordSaved = useCallback(async (word: string) => {
    setWordAlreadySaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Lấy personal classroom của user
      const { data: cls } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', session.user.id)
        .eq('name', '__personal__')
        .maybeSingle();

      if (!cls?.id) return;

      const { data: existing } = await supabase
        .from('words')
        .select('id')
        .eq('classroom_id', cls.id)
        .ilike('word', word.trim())
        .maybeSingle();

      if (existing?.id) setWordAlreadySaved(true);
    } catch {
      // không chặn UX nếu check fail
    }
  }, []);

  const lookup = useCallback(async (word: string) => {
    const raw = word.trim();
    if (!raw) return;
    // Câu/cụm: giữ nguyên hoa thường; từ đơn: lower
    const isSentence = isMultiWord(raw);
    const trimmed = isSentence ? raw.slice(0, 400) : raw.toLowerCase();

    setLoading(true);
    setResult(null);
    setError(null);
    setWordAlreadySaved(false);
    setShowSuggest(false);

    // ── ≥2 từ → rã câu (giống Desktop) ──
    if (isSentence) {
      try {
        const res = await authFetch('/api/dictionary/ai-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence: trimmed }),
          signal: AbortSignal.timeout(28000),
        });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          code?: string;
          analysis?: SentenceAnalysis;
          data?: { sentenceAnalysis?: SentenceAnalysis } & DictionaryData;
          aiSource?: string;
        };
        if (res.status === 403 && json.code === 'PRO_REQUIRED') {
          toast.error('Cần gói Pro để tra câu AI');
          setError('Tra câu cần gói Pro. Nâng cấp để bóc xương S–V–O.');
          setLoading(false);
          return;
        }
        if (res.status === 429) {
          toast.error('AI đang bận, chờ chút rồi thử lại');
          setError('Quá nhiều yêu cầu tra câu — thử lại sau.');
          setLoading(false);
          return;
        }
        if (res.ok && json.success) {
          const analysis =
            json.analysis
            || json.data?.sentenceAnalysis
            || null;
          if (analysis?.kernel || analysis?.translation_vi) {
            const r: LookupResult = {
              data: (json.data as DictionaryData) || { word: trimmed },
              source: sentenceSourceBadge(json.aiSource),
              queriedWord: trimmed,
              sentence: analysis,
              aiSource: json.aiSource,
            };
            setResult(r);
            pushHistory(trimmed);
            setHistory(getHistory());
            setLoading(false);
            return;
          }
        }
        setError(json.error || `Không phân tích được câu: "${trimmed.slice(0, 60)}…"`);
        setLoading(false);
        return;
      } catch {
        setError('Lỗi mạng khi tra câu — thử lại.');
        setLoading(false);
        return;
      }
    }

    // ── Từ đơn: DB → external → AI ──
    // Tier 1: local dictionary
    try {
      const res = await fetch(
        `/api/dictionary/lookup?word=${encodeURIComponent(trimmed)}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          const data: DictionaryData = json;
          if (!isGarbageResult(data)) {
            const imageUrl: string | undefined = json.image_url;
            const r = { data, source: 'Kho từ điển' as SourceBadge, imageUrl, queriedWord: trimmed };
            setResult(r);
            pushHistory(trimmed);
            setHistory(getHistory());
            setLoading(false);
            void checkWordSaved(trimmed);
            return;
          }
        }
      }
    } catch {
      // fall through
    }

    // Tier 2: external (dict.minhqnd proxy)
    try {
      const res = await fetch(
        `/api/dictionary/external?word=${encodeURIComponent(trimmed)}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && (json.results?.length > 0 || json.pronunciations?.length > 0)) {
          const data: DictionaryData = json;
          if (!isGarbageResult(data)) {
            // queriedWord = từ user gõ — KHÔNG dùng data.word từ external (tránh headword sai)
            const r = { data, source: 'Wiktionary' as SourceBadge, queriedWord: trimmed };
            setResult(r);
            pushHistory(trimmed);
            setHistory(getHistory());
            setLoading(false);
            void checkWordSaved(trimmed);
            return;
          }
        }
      }
    } catch {
      // fall through
    }

    // Tier 3: AI lookup
    try {
      const res = await authFetch('/api/dictionary/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: trimmed }),
        signal: AbortSignal.timeout(12000),
      });
      if (res.status === 429) {
        toast.error('AI đang bận, chờ chút rồi thử lại');
        setError(`Không tìm được nghĩa cho "${trimmed}"`);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const data: DictionaryData = json.data;
          // Phòng thủ phía client: lọc kết quả rác từ AI tier
          if (!isGarbageResult(data)) {
            const r = { data, source: 'AI' as SourceBadge, queriedWord: trimmed };
            setResult(r);
            pushHistory(trimmed);
            setHistory(getHistory());
            setLoading(false);
            void checkWordSaved(trimmed);
            return;
          }
        }
      }
    } catch {
      // fall through
    }

    setError(`Không tìm được nghĩa cho "${trimmed}"`);
    setLoading(false);
  }, [checkWordSaved]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggest && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestIdx(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggest(false);
        setSelectedSuggestIdx(-1);
        return;
      }
      if (e.key === 'Enter' && selectedSuggestIdx >= 0) {
        e.preventDefault();
        const chosen = suggestions[selectedSuggestIdx];
        setQuery(chosen);
        setShowSuggest(false);
        setSelectedSuggestIdx(-1);
        void lookup(chosen);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      lookup(query);
    }
  };

  /** Fetch suggestions với debounce + AbortController — chỉ từ đơn */
  const fetchSuggestions = useCallback((val: string) => {
    const q = val.trim().toLowerCase();

    // Hủy timer cũ
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    // Câu/cụm ≥2 từ: không gợi ý autocomplete
    if (isMultiWord(q) || q.length < 2 || !/^[a-z' -]+$/.test(q)) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }

    suggestTimerRef.current = setTimeout(async () => {
      // Hủy request cũ
      suggestAbortRef.current?.abort();
      const ctrl = new AbortController();
      suggestAbortRef.current = ctrl;

      try {
        const res = await fetch(
          `/api/dictionary/suggest?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) { setSuggestions([]); setShowSuggest(false); return; }
        const json = await res.json() as { success: boolean; suggestions?: string[] };
        if (json.success && json.suggestions && json.suggestions.length > 0) {
          setSuggestions(json.suggestions);
          setShowSuggest(true);
          setSelectedSuggestIdx(-1);
        } else {
          setSuggestions([]);
          setShowSuggest(false);
        }
      } catch {
        // AbortError hoặc network error — bỏ qua
      }
    }, 400); // debounce dài hơn → bớt /api/dictionary/suggest (Vercel functions)
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
  };

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSaveMeaning = async (meaning: DictionaryMeaning, index: number) => {
    if (!result) return;
    const word = result.queriedWord;
    const translation = meaning.definition ?? '';
    if (!translation) return;

    setSavingIndexes(prev => new Set(prev).add(index));
    try {
      const res = await authFetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, translation }),
      });
      const json = await res.json();
      if (res.status === 429) {
        toast.error('Quá nhiều yêu cầu, thử lại sau');
      } else if (json.error === 'FREE_WORD_LIMIT' || (res.status === 403 && json.error === 'FREE_WORD_LIMIT')) {
        const { requestUpsell, upsellFromWordLimitError } = await import('@/lib/upsell');
        requestUpsell(upsellFromWordLimitError(json));
        toast.error(json.message ?? 'Đã đủ hạn mức lưu từ tháng này');
      } else if (json.alreadyExists) {
        toast.info('Từ đã có trong sổ của bạn');
        setWordAlreadySaved(true);
      } else if (json.success) {
        toast.success(`Đã lưu "${word}" vào sổ từ vựng`);
        setSavedIndexes(prev => new Set(prev).add(index));
        // Soft near-limit khi còn ≤50 (từ mốc 150)
        if (
          typeof json.wordQuota?.used === 'number' &&
          typeof json.wordQuota?.limit === 'number' &&
          json.wordQuota.used >= 150
        ) {
          const { requestUpsell } = await import('@/lib/upsell');
          requestUpsell({
            reason: json.wordQuota.remaining <= 0 ? 'word_limit' : 'word_near_limit',
            used: json.wordQuota.used,
            limit: json.wordQuota.limit,
            remaining: json.wordQuota.remaining ?? 0,
          });
        }
      } else {
        toast.error(json.error ?? 'Lưu thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối, thử lại');
    } finally {
      setSavingIndexes(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  // Collect all meanings flat with global index
  const allMeanings: Array<{ pos: string; meaning: DictionaryMeaning; globalIndex: number }> = [];
  let globalIdx = 0;
  const grouped: Record<string, Array<{ meaning: DictionaryMeaning; globalIndex: number }>> = {};
  if (result?.data.results) {
    for (const resEntry of result.data.results) {
      for (const meaning of resEntry.meanings ?? []) {
        const pos = meaning.pos ?? 'other';
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push({ meaning, globalIndex: globalIdx });
        allMeanings.push({ pos, meaning, globalIndex: globalIdx });
        globalIdx++;
      }
    }
  }

  const familyWords = normalizeFamilyWords(result?.data.familyWords);
  const hasPronunciations = (result?.data.pronunciations?.length ?? 0) > 0;
  const ukPron = result?.data.pronunciations?.find(p => p.region === 'UK');
  const usPron = result?.data.pronunciations?.find(p => p.region === 'US');
  const singlePron = (!ukPron && !usPron) ? (result?.data.pronunciations?.[0] ?? null) : null;
  // Luôn dùng từ user gõ làm heading — tránh headword sai từ external API
  const displayWord = result?.queriedWord ?? query;
  const sentence = result?.sentence;
  const kernel = sentence?.kernel;
  const showSvo =
    Boolean(kernel?.s && kernel?.v && isEnglishBone(kernel.s) && isEnglishBone(kernel.v));
  const buildLevels = [...(sentence?.build_levels || [])]
    .filter((l) => l.text?.trim() && !(looksVietnameseText(l.text) && !/[A-Za-z]{3,}/.test(l.text)))
    .sort((a, b) => a.level - b.level);
  const sentenceChunks = (sentence?.chunks || [])
    .filter((c) => isEnglishBone(c.base || c.text || ''))
    .slice(0, 6);

  return (
    <StudentShell title="Tra từ điển" contentClassName="p-0">
      <div className="w-full min-w-0 min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-[62px] z-30 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur min-w-0 max-w-full">
        <Link href="/student" className="p-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg">Tra từ / câu</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 min-w-0">
        {/* Search form + autocomplete */}
        <div className="relative mb-6" data-onboarding="dict-search">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSuggest(true); }}
              placeholder="Từ đơn · hoặc dán cả câu để bóc xương S–V–O"
              className="flex-1 h-12 px-4 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              variant="chunky"
              size="lg"
              disabled={loading || query.trim().length === 0}
              className="h-12 px-4"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </Button>
          </form>

          {/* Autocomplete dropdown */}
          {showSuggest && suggestions.length > 0 && !loading && (
            <div
              ref={suggestRef}
              className="absolute left-0 right-12 top-[calc(100%+4px)] z-[9999] bg-background border border-border rounded-xl shadow-lg overflow-hidden"
            >
              {suggestions.map((word, idx) => (
                <button
                  key={word}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // tránh blur input trước khi click
                    setQuery(word);
                    setShowSuggest(false);
                    setSelectedSuggestIdx(-1);
                    void lookup(word);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    idx === selectedSuggestIdx ? 'bg-muted' : ''
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{isMultiWord(query) ? 'Đang bóc xương câu...' : 'Đang tra từ...'}</span>
          </div>
        )}

        {/* Error / empty state */}
        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            {/Pro/i.test(error) && (
              <Link
                href="/upgrade"
                className="inline-flex mb-3 h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                Nâng Pro
              </Link>
            )}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => lookup(query)}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Result — CÂU (SVO) */}
        {!loading && result?.sentence && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  result.aiSource === 'golden'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                    : result.aiSource === 'heuristic'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
                }`}
              >
                {result.source}
              </span>
              {sentence?.structure && (
                <span className="text-xs text-muted-foreground font-medium">{sentence.structure}</span>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">EN</p>
                <p className="text-base font-semibold leading-snug">{sentence?.sentence || displayWord}</p>
                {showSvo && kernel && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => { setQuery(kernel.s); void lookup(kernel.s); }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-sm"
                    >
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">S</span>
                      <strong>{kernel.s}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQuery(kernel.v); void lookup(kernel.v); }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/60 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 text-sm"
                    >
                      <span className="text-[10px] font-black text-sky-700 dark:text-sky-300">V</span>
                      <strong>{kernel.v}</strong>
                    </button>
                    {kernel.o && isEnglishBone(kernel.o) && (
                      <button
                        type="button"
                        onClick={() => { setQuery(kernel.o!); void lookup(kernel.o!); }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-sm"
                      >
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-300">O</span>
                        <strong>{kernel.o}</strong>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="border-t border-border/60 pt-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">VI · gist</p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {sentence?.translation_vi
                    || kernel?.translation_vi
                    || sentence?.logic?.formula_vi
                    || '—'}
                </p>
              </div>
            </div>

            {sentence?.logic && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-1">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300">{sentence.logic.pattern}</p>
                <p className="text-sm">
                  <span className="font-semibold">A</span> {sentence.logic.a}
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="font-semibold">B</span> {sentence.logic.b}
                </p>
                <p className="text-sm text-muted-foreground">{sentence.logic.formula_vi}</p>
              </div>
            )}

            {buildLevels.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground italic mb-2 font-semibold">
                  Xây lại từng lớp
                </h2>
                <div className="space-y-2">
                  {buildLevels.map((lvl) => (
                    <div
                      key={`L${lvl.level}-${lvl.text.slice(0, 24)}`}
                      className="rounded-xl border border-border/50 bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-muted">L{lvl.level}</span>
                        <span className="text-[11px] text-muted-foreground">{lvl.slot_vi}</span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{lvl.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentenceChunks.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground italic mb-2 font-semibold">
                  Chunk học được
                </h2>
                <div className="flex flex-wrap gap-2">
                  {sentenceChunks.map((c, i) => (
                    <button
                      key={`${c.base}-${i}`}
                      type="button"
                      onClick={() => { setQuery(c.base); void lookup(c.base); }}
                      className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-left hover:bg-muted transition-colors max-w-full"
                      title={c.meaning_vi}
                    >
                      <span className="font-semibold text-sm block">{c.base}</span>
                      {c.meaning_vi && c.meaning_vi !== '—' && (
                        <span className="text-xs text-muted-foreground">{c.meaning_vi}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sentence?.notes && sentence.notes.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                {sentence.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}

            <p className="text-[11px] text-muted-foreground">
              Tip: bấm chip S/V/O hoặc chunk để tra từ đơn. Copy nhanh ngoài trình duyệt → dùng Desktop.
            </p>
          </div>
        )}

        {/* Result — TỪ ĐƠN */}
        {!loading && result && !result.sentence && (
          <div className="space-y-4">
            {/* Word header */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-black">{displayWord}</h1>
                  {/* Source badge */}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {result.source}
                  </span>
                  {/* Badge từ đã lưu */}
                  {wordAlreadySaved && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Đã có trong sổ
                    </span>
                  )}
                </div>

                {/* Pronunciation chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {formatIpa(ukPron?.ipa) && (
                    <span className="text-sm bg-muted px-2 py-0.5 rounded-full font-mono">
                      🇬🇧 /{formatIpa(ukPron?.ipa)}/
                    </span>
                  )}
                  {formatIpa(usPron?.ipa) && (
                    <span className="text-sm bg-muted px-2 py-0.5 rounded-full font-mono">
                      🇺🇸 /{formatIpa(usPron?.ipa)}/
                    </span>
                  )}
                  {formatIpa(singlePron?.ipa) && !ukPron && !usPron && (
                    <span className="text-sm bg-muted px-2 py-0.5 rounded-full font-mono">
                      /{formatIpa(singlePron?.ipa)}/
                    </span>
                  )}
                  {/* Speaker buttons — always show */}
                  <button
                    onClick={() => speakWord(displayWord, 'en-GB')}
                    title="Phát âm UK"
                    className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span className="sr-only">UK</span>
                  </button>
                  <button
                    onClick={() => speakWord(displayWord, 'en-US')}
                    title="Phát âm US"
                    className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                    type="button"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span className="text-xs">US</span>
                  </button>
                </div>
              </div>

              {/* Image */}
              {result.imageUrl && (
                <img
                  src={resolveImageSrc(result.imageUrl)}
                  alt={displayWord}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              )}
            </div>

            {/* Meanings grouped by POS */}
            {Object.keys(grouped).length > 0 && (
              <div className="space-y-4">
                {Object.entries(grouped).map(([pos, items]) => (
                  <div key={pos}>
                    <h2 className="text-xs uppercase tracking-widest text-muted-foreground italic mb-2 font-semibold">
                      {pos}
                    </h2>
                    <div className="space-y-2">
                      {items.map(({ meaning, globalIndex }, i) => (
                        <div
                          key={globalIndex}
                          className="bg-muted/40 rounded-xl p-3 flex gap-3 items-start border border-border/50"
                        >
                          <span className="text-xs font-bold text-muted-foreground mt-0.5 min-w-[1.2rem]">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-snug">{meaning.definition}</p>
                            {meaning.example && (
                              <div className="mt-1">
                                <p className="text-xs text-muted-foreground italic">
                                  &ldquo;{meaning.example}&rdquo;
                                </p>
                                {meaning.example_vi && (
                                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                                    {meaning.example_vi}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Nút lưu: disabled nếu từ đã có trong sổ (toàn bộ) hoặc meaning cụ thể đã lưu */}
                          <Button
                            variant={(savedIndexes.has(globalIndex) || wordAlreadySaved) ? 'outline' : 'chunky'}
                            size="sm"
                            disabled={savedIndexes.has(globalIndex) || savingIndexes.has(globalIndex) || wordAlreadySaved}
                            onClick={() => handleSaveMeaning(meaning, globalIndex)}
                            className="shrink-0 text-xs"
                          >
                            {savingIndexes.has(globalIndex) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (savedIndexes.has(globalIndex) || wordAlreadySaved) ? (
                              <><CheckCircle2 className="h-3 w-3" /> Đã lưu</>
                            ) : (
                              <>＋ Lưu</>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Synonyms / Antonyms */}
            {((result.data.synonyms?.length ?? 0) > 0 || (result.data.antonyms?.length ?? 0) > 0) && (
              <div className="flex flex-col gap-3">
                {(result.data.synonyms?.length ?? 0) > 0 && (
                  <div>
                    <h2 className="text-xs uppercase tracking-widest text-muted-foreground italic mb-2 font-semibold">
                      Đồng nghĩa
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {result.data.synonyms!.slice(0, 8).map((s, i) => (
                        <button
                          key={`syn-${i}`}
                          type="button"
                          onClick={() => { setQuery(s); lookup(s); }}
                          className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm hover:opacity-80 transition-opacity"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(result.data.antonyms?.length ?? 0) > 0 && (
                  <div>
                    <h2 className="text-xs uppercase tracking-widest text-muted-foreground italic mb-2 font-semibold">
                      Trái nghĩa
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {result.data.antonyms!.slice(0, 8).map((s, i) => (
                        <button
                          key={`ant-${i}`}
                          type="button"
                          onClick={() => { setQuery(s); lookup(s); }}
                          className="px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm hover:opacity-80 transition-opacity"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Word family — các từ phái sinh kèm nghĩa */}
            {familyWords.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground italic mb-2 font-semibold">
                  Họ từ vựng
                </h2>
                <div className="space-y-2">
                  {familyWords.map((fw, i) => (
                    <button
                      key={`${fw.word}-${i}`}
                      type="button"
                      onClick={() => { setQuery(fw.word); lookup(fw.word); }}
                      className="w-full bg-muted/40 rounded-xl p-3 flex gap-3 items-center border border-border/50 text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm">{fw.word}</span>
                        {fw.pos && (
                          <span className="text-xs text-muted-foreground italic ml-2">{fw.pos}</span>
                        )}
                        {fw.meaning && (
                          <p className="text-sm text-muted-foreground leading-snug mt-0.5">{fw.meaning}</p>
                        )}
                      </div>
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No meanings fallback */}
            {Object.keys(grouped).length === 0 && hasPronunciations && (
              <p className="text-muted-foreground text-sm">Chỉ tìm được phát âm, không có nghĩa.</p>
            )}
          </div>
        )}

        {/* History — show when no result and not loading */}
        {!loading && !result && !error && history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground">Đã tra gần đây</p>
              <button
                type="button"
                onClick={() => { clearHistory(); setHistory([]); }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Xóa lịch sử
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map(word => (
                <button
                  key={word}
                  type="button"
                  onClick={() => { setQuery(word); lookup(word); }}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </StudentShell>
  );
}
