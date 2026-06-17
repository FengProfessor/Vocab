'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { DictionaryData, DictionaryMeaning } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronLeft, Search, Loader2, Volume2, BookOpen, X, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const HISTORY_KEY = 'lingo_dict_history';
const MAX_HISTORY = 20;

// Regex phát hiện kết quả rác từ AI (từ không tồn tại)
const GARBAGE_PATTERNS = /không có trong từ điển|not a real word|word not found|không tồn tại/i;

type SourceBadge = 'Kho từ điển' | 'Wiktionary' | 'AI';

interface LookupResult {
  data: DictionaryData;
  source: SourceBadge;
  imageUrl?: string;
  /** Từ user gõ vào — luôn dùng làm heading thay vì data.word từ external */
  queriedWord: string;
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
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = lang;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(voice => voice.lang === lang);
  if (v) u.voice = v;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
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
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setWordAlreadySaved(false);
    setShowSuggest(false);

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

  /** Fetch suggestions với debounce + AbortController */
  const fetchSuggestions = useCallback((val: string) => {
    const q = val.trim().toLowerCase();

    // Hủy timer cũ
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    if (q.length < 2 || !/^[a-z' -]+$/.test(q)) {
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
    }, 250);
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
      } else if (json.alreadyExists) {
        toast.info('Từ đã có trong sổ của bạn');
        setWordAlreadySaved(true);
      } else if (json.success) {
        toast.success(`Đã lưu "${word}" vào sổ từ vựng`);
        setSavedIndexes(prev => new Set(prev).add(index));
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

  const hasPronunciations = (result?.data.pronunciations?.length ?? 0) > 0;
  const ukPron = result?.data.pronunciations?.find(p => p.region === 'UK');
  const usPron = result?.data.pronunciations?.find(p => p.region === 'US');
  const singlePron = (!ukPron && !usPron) ? (result?.data.pronunciations?.[0] ?? null) : null;
  // Luôn dùng từ user gõ làm heading — tránh headword sai từ external API
  const displayWord = result?.queriedWord ?? query;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Link href="/student" className="p-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg">Tra từ điển</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Search form + autocomplete */}
        <div className="relative mb-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSuggest(true); }}
              placeholder="Nhập từ tiếng Anh cần tra..."
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
            <span>Đang tra từ...</span>
          </div>
        )}

        {/* Error / empty state */}
        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => lookup(query)}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Result */}
        {!loading && result && (
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
                  {ukPron?.ipa && (
                    <span className="text-sm bg-muted px-2 py-0.5 rounded-full font-mono">
                      🇬🇧 /{ukPron.ipa}/
                    </span>
                  )}
                  {usPron?.ipa && (
                    <span className="text-sm bg-muted px-2 py-0.5 rounded-full font-mono">
                      🇺🇸 /{usPron.ipa}/
                    </span>
                  )}
                  {singlePron?.ipa && !ukPron && !usPron && (
                    <span className="text-sm bg-muted px-2 py-0.5 rounded-full font-mono">
                      /{singlePron.ipa}/
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
                  src={`/api/image-proxy?url=${encodeURIComponent(result.imageUrl)}`}
                  alt={displayWord}
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
                              <p className="text-xs text-muted-foreground italic mt-1">
                                &ldquo;{meaning.example}&rdquo;
                              </p>
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
  );
}
