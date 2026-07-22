'use client';

/**
 * Luyện đọc gói từ (kiểu codemix):
 * chọn từ kho user theo tuổi 1–3 / 3–7 / >7 ngày → chủ đề → cấp độ → Gen AI.
 * URL: /practice/pack-reading
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ChevronLeft,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PACK_THEMES, type PackTheme } from '@/lib/pack-themes';
import {
  PACK_READING_LEVELS,
  DEFAULT_PACK_READING_LEVEL_ID,
  type PackReadingLevel,
} from '@/lib/pack-levels';
import {
  PACK_PASSAGE_MAX_WORDS,
  PACK_PASSAGE_MIN_WORDS,
} from '@/lib/pack-passage';

interface PoolWord {
  id?: string;
  word: string;
  translation: string;
  pos?: string;
  /** Ngày tham chiếu “học/lưu” (created_at) */
  created_at?: string;
  last_reviewed_at?: string | null;
  review_count?: number;
  /** Số ngày kể từ created_at */
  ageDays: number;
  bucket: AgeBucket;
}

type AgeBucket = 'd1_3' | 'd3_7' | 'd7_plus';

interface PassageQuestion {
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

interface PassageData {
  title: string;
  passage: string;
  passagePlain: string;
  level: string;
  themeId?: string;
  themeLabelVi?: string;
  readingLevelId?: string;
  readingLevelLabelVi?: string;
  wordCount: number;
  usedWords: string[];
  missingWords: string[];
  coverage: number;
  questions: PassageQuestion[];
  cloze: {
    text: string;
    blanks: { id: number; answer: string; options: string[] }[];
  };
  meta: { attempts: number; providerNote: string };
}

type Step = 1 | 2 | 3;
type ResultTab = 'passage' | 'cloze';

const BUCKET_META: Record<
  AgeBucket,
  { label: string; hint: string; minDays: number; maxDays: number | null }
> = {
  d1_3: { label: '1–3 ngày', hint: 'Mới lưu / mới học', minDays: 0, maxDays: 3 },
  d3_7: { label: '3–7 ngày', hint: 'Đang làm quen', minDays: 3, maxDays: 7 },
  d7_plus: { label: 'Trên 7 ngày', hint: 'Ôn lại sâu', minDays: 7, maxDays: null },
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function wordKey(w: PoolWord): string {
  return w.id || normalize(w.word);
}

function daysSince(iso: string | null | undefined, now: number): number {
  if (!iso) return 9999;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 9999;
  return Math.max(0, Math.floor((now - t) / (24 * 60 * 60 * 1000)));
}

/** 0–3 → d1_3 · >3 và ≤7 → d3_7 · >7 → d7_plus */
function bucketForDays(days: number): AgeBucket {
  if (days <= 3) return 'd1_3';
  if (days <= 7) return 'd3_7';
  return 'd7_plus';
}

function highlightPassage(md: string): ReactNode[] {
  const parts = md.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-200/90 px-0.5 font-semibold text-amber-950 dark:bg-amber-500/30 dark:text-amber-100"
        >
          {m[1]}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderClozeText(
  text: string,
  blanks: { id: number; answer: string; options: string[] }[],
  answers: Record<number, string>,
  onPick: (id: number, value: string) => void,
  revealed: boolean,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    const id = Number(match[1]);
    const blank = blanks.find((b) => b.id === id) ?? blanks[id];
    const selected = answers[id] ?? '';
    const correct = blank?.answer?.toLowerCase() === selected.toLowerCase();
    nodes.push(
      <span key={key++} className="mx-0.5 my-1 inline-flex flex-col align-middle">
        <select
          className={`min-w-[7rem] rounded border px-2 py-1 text-sm ${
            revealed
              ? correct
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-red-400 bg-red-50'
              : 'border-border bg-background'
          }`}
          value={selected}
          onChange={(e) => onPick(id, e.target.value)}
          disabled={revealed}
        >
          <option value="">— chọn —</option>
          {(blank?.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return nodes;
}

function PackReadingInner() {
  const [step, setStep] = useState<Step>(1);
  const [pool, setPool] = useState<PoolWord[]>([]);
  const [poolSource, setPoolSource] = useState<'mine' | 'empty'>('empty');
  const [poolLoading, setPoolLoading] = useState(true);
  const [bucket, setBucket] = useState<AgeBucket>('d1_3');
  const [query, setQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());

  const [themeId, setThemeId] = useState<string | null>(null);
  const [readingLevelId, setReadingLevelId] = useState<string>(DEFAULT_PACK_READING_LEVEL_ID);

  const [passage, setPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultTab, setResultTab] = useState<ResultTab>('passage');
  const [qAnswers, setQAnswers] = useState<Record<number, string>>({});
  const [qRevealed, setQRevealed] = useState(false);
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [clozeRevealed, setClozeRevealed] = useState(false);

  // Load từ user (+ created_at, SRS) — 2 trang × 50
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolLoading(true);
      try {
        const now = Date.now();
        const mapped: PoolWord[] = [];
        const seen = new Set<string>();

        for (const offset of [0, 50]) {
          const res = await authFetch(`/api/words?limit=50&offset=${offset}`);
          const json = (await res.json()) as {
            success?: boolean;
            data?: Array<{
              id?: string;
              word?: string;
              translation?: string;
              pos?: string;
              created_at?: string;
              srs?: {
                last_reviewed_at?: string | null;
                review_count?: number;
              } | null;
              reviewCount?: number;
            }>;
          };
          if (!json.success || !Array.isArray(json.data)) break;
          for (const w of json.data) {
            const word = (w.word || '').trim();
            if (!word || word.length > 50) continue;
            const key = normalize(word);
            if (seen.has(key)) continue;
            seen.add(key);
            const vi = (w.translation || '').trim();
            if (!vi || vi.includes('failed') || vi.includes('Analyzing') || vi.includes('⏳')) {
              continue;
            }
            const ageDays = daysSince(w.created_at, now);
            mapped.push({
              id: w.id,
              word,
              translation: vi,
              pos: w.pos,
              created_at: w.created_at,
              last_reviewed_at: w.srs?.last_reviewed_at ?? null,
              review_count: w.srs?.review_count ?? w.reviewCount ?? 0,
              ageDays,
              bucket: bucketForDays(ageDays),
            });
          }
          if (json.data.length < 50) break;
        }

        if (cancelled) return;

        if (mapped.length > 0) {
          setPool(mapped);
          setPoolSource('mine');
          // Ưu tiên bucket có đủ từ; preselect tối đa 12
          const order: AgeBucket[] = ['d1_3', 'd3_7', 'd7_plus'];
          let startBucket: AgeBucket = 'd1_3';
          for (const b of order) {
            if (mapped.filter((w) => w.bucket === b).length >= PACK_PASSAGE_MIN_WORDS) {
              startBucket = b;
              break;
            }
            if (mapped.filter((w) => w.bucket === b).length > 0) startBucket = b;
          }
          setBucket(startBucket);
          const pre = mapped
            .filter((w) => w.bucket === startBucket)
            .slice(0, Math.min(12, PACK_PASSAGE_MAX_WORDS));
          setSelectedKeys(new Set(pre.map(wordKey)));
        } else {
          setPool([]);
          setPoolSource('empty');
          setSelectedKeys(new Set());
        }
      } catch {
        if (!cancelled) {
          setPool([]);
          setPoolSource('empty');
        }
      } finally {
        if (!cancelled) setPoolLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countsByBucket = useMemo(() => {
    const c: Record<AgeBucket, number> = { d1_3: 0, d3_7: 0, d7_plus: 0 };
    for (const w of pool) c[w.bucket]++;
    return c;
  }, [pool]);

  const filteredPool = useMemo(() => {
    const q = normalize(query);
    return pool.filter((w) => {
      if (w.bucket !== bucket) return false;
      if (!q) return true;
      return (
        normalize(w.word).includes(q) ||
        normalize(w.translation).includes(q) ||
        (!!w.pos && normalize(w.pos).includes(q))
      );
    });
  }, [pool, bucket, query]);

  const selected = useMemo(() => {
    const map = new Map(pool.map((w) => [wordKey(w), w]));
    return [...selectedKeys]
      .map((k) => map.get(k))
      .filter((w): w is PoolWord => !!w);
  }, [pool, selectedKeys]);

  const selectedCount = selected.length;
  const wordsOk =
    selectedCount >= PACK_PASSAGE_MIN_WORDS && selectedCount <= PACK_PASSAGE_MAX_WORDS;

  const selectedTheme: PackTheme | null = useMemo(
    () => PACK_THEMES.find((t) => t.id === themeId) ?? null,
    [themeId],
  );

  const selectedLevel: PackReadingLevel | null = useMemo(
    () => PACK_READING_LEVELS.find((l) => l.id === readingLevelId) ?? null,
    [readingLevelId],
  );

  const canGoTheme = wordsOk;
  const canGen = wordsOk && !!themeId && !!readingLevelId && !loading;

  const toggleWord = useCallback((w: PoolWord) => {
    const k = wordKey(w);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else {
        if (next.size >= PACK_PASSAGE_MAX_WORDS) return prev;
        next.add(k);
      }
      return next;
    });
    setPassage(null);
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const w of filteredPool) {
        if (next.size >= PACK_PASSAGE_MAX_WORDS) break;
        next.add(wordKey(w));
      }
      return next;
    });
    setPassage(null);
  }, [filteredPool]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    setPassage(null);
  }, []);

  const switchBucket = useCallback(
    (b: AgeBucket) => {
      setBucket(b);
      setQuery('');
      // Gợi ý chọn lại trong bucket mới (không xóa chọn cũ — user có thể trộn bucket)
      const inBucket = pool.filter((w) => w.bucket === b);
      if (inBucket.length >= PACK_PASSAGE_MIN_WORDS) {
        setSelectedKeys(
          new Set(
            inBucket.slice(0, Math.min(12, PACK_PASSAGE_MAX_WORDS)).map(wordKey),
          ),
        );
      }
      setPassage(null);
    },
    [pool],
  );

  const genPassage = useCallback(async () => {
    if (!themeId) {
      setError('Chọn chủ đề trước khi Gen AI.');
      return;
    }
    if (!readingLevelId) {
      setError('Chọn cấp độ bài đọc trước khi Gen AI.');
      return;
    }
    if (!wordsOk) {
      setError(`Chọn ${PACK_PASSAGE_MIN_WORDS}–${PACK_PASSAGE_MAX_WORDS} từ.`);
      return;
    }
    setLoading(true);
    setError(null);
    setPassage(null);
    setQAnswers({});
    setQRevealed(false);
    setClozeAnswers({});
    setClozeRevealed(false);
    setResultTab('passage');
    try {
      const words = selected.map((w) => ({
        word: w.word,
        translation: w.translation,
        pos: w.pos,
      }));
      const res = await fetch('/api/practice/pack-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          readingLevelId,
          words,
          title: selectedTheme?.labelEn ?? 'My pack',
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: PassageData;
      };
      if (!json.success || !json.data) throw new Error(json.error || 'Gen failed');
      setPassage(json.data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [themeId, readingLevelId, wordsOk, selected, selectedTheme]);

  const qScore = useMemo(() => {
    if (!passage || !qRevealed) return null;
    let ok = 0;
    passage.questions.forEach((q, i) => {
      if ((qAnswers[i] || '').trim() === q.answer.trim()) ok++;
    });
    return { ok, total: passage.questions.length };
  }, [passage, qAnswers, qRevealed]);

  const clozeScore = useMemo(() => {
    if (!passage || !clozeRevealed) return null;
    let ok = 0;
    passage.cloze.blanks.forEach((b) => {
      if ((clozeAnswers[b.id] || '').toLowerCase() === b.answer.toLowerCase()) ok++;
    });
    return { ok, total: passage.cloze.blanks.length };
  }, [passage, clozeAnswers, clozeRevealed]);

  return (
    <StudentShell title="Luyện đọc gói từ">
      <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 pb-24 sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/student"
            className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-slate-600 shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-slate-900">Luyện đọc gói từ</h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Chọn từ theo ngày học → chủ đề → cấp độ → Gen AI
            </p>
          </div>
          <BookOpen className="h-6 w-6 text-teal-600" />
        </div>

        <div className="flex gap-1">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (s === 1) setStep(1);
                if (s === 2 && canGoTheme) setStep(2);
                if (s === 3 && passage) setStep(3);
              }}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= s ? 'bg-teal-500' : 'bg-slate-200'
              }`}
              aria-label={`Bước ${s}`}
            />
          ))}
        </div>
        <p className="text-center text-[11px] font-bold text-slate-500">
          {step === 1 && 'B1 · Chọn từ theo tuổi học'}
          {step === 2 && 'B2 · Chủ đề + cấp độ đọc'}
          {step === 3 && 'B3 · Đọc & trả lời'}
        </p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Step 1: pick words by age ── */}
        {step === 1 && (
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">1. Chọn từ trong kho</CardTitle>
              <p className="text-xs text-muted-foreground">
                Lọc theo ngày <strong>lưu từ</strong> · chọn{' '}
                {PACK_PASSAGE_MIN_WORDS}–{PACK_PASSAGE_MAX_WORDS} từ (giống Đặt câu)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {poolLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Đang tải từ của bạn…
                </div>
              ) : poolSource === 'empty' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-900">
                  Chưa có từ trong kho (hoặc chưa đăng nhập).{' '}
                  <Link href="/import" className="font-bold underline">
                    Thêm từ
                  </Link>{' '}
                  rồi quay lại.
                </div>
              ) : (
                <>
                  {/* Age buckets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['d1_3', 'd3_7', 'd7_plus'] as AgeBucket[]).map((b) => {
                      const on = bucket === b;
                      const meta = BUCKET_META[b];
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => switchBucket(b)}
                          className={`rounded-2xl border px-2 py-2.5 text-center transition-all ${
                            on
                              ? 'border-teal-500 bg-teal-50 shadow ring-2 ring-teal-200'
                              : 'border-slate-200 bg-white hover:border-teal-200'
                          }`}
                        >
                          <p className="text-xs font-black text-slate-800">{meta.label}</p>
                          <p className="text-[10px] font-medium text-slate-400">{meta.hint}</p>
                          <p
                            className={`mt-0.5 text-sm font-black tabular-nums ${
                              on ? 'text-teal-700' : 'text-slate-500'
                            }`}
                          >
                            {countsByBucket[b]}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm trong nhóm này…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span
                      className={
                        wordsOk ? 'text-emerald-600' : 'text-amber-600'
                      }
                    >
                      Đã chọn {selectedCount}/{PACK_PASSAGE_MAX_WORDS}
                      {!wordsOk && ` · cần ≥${PACK_PASSAGE_MIN_WORDS}`}
                    </span>
                    <button
                      type="button"
                      className="text-teal-600 underline"
                      onClick={selectAllVisible}
                    >
                      Chọn thêm nhóm này
                    </button>
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        className="text-slate-400 underline"
                        onClick={clearSelection}
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>

                  {/* Selected chips */}
                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-teal-100 bg-teal-50/50 p-2">
                      {selected.map((w) => (
                        <button
                          key={wordKey(w)}
                          type="button"
                          onClick={() => toggleWord(w)}
                          className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white"
                        >
                          {w.word}
                          <X className="h-3 w-3 opacity-80" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Word list */}
                  <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-1">
                    {filteredPool.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-slate-400">
                        Không có từ trong nhóm «{BUCKET_META[bucket].label}».
                        Thử nhóm khác.
                      </p>
                    ) : (
                      filteredPool.map((w) => {
                        const on = selectedKeys.has(wordKey(w));
                        const full =
                          !on && selectedCount >= PACK_PASSAGE_MAX_WORDS;
                        return (
                          <button
                            key={wordKey(w)}
                            type="button"
                            disabled={full}
                            onClick={() => toggleWord(w)}
                            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                              on
                                ? 'bg-teal-50 ring-1 ring-teal-300'
                                : full
                                  ? 'opacity-40'
                                  : 'hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                                on
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {on ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800">{w.word}</span>
                              <span className="text-slate-400"> · </span>
                              <span className="text-slate-600">{w.translation}</span>
                            </span>
                            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-400">
                              {w.ageDays === 0 ? 'hôm nay' : `${w.ageDays}d`}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <p className="text-[10px] font-medium text-slate-400">
                    {pool.length} từ trong kho · tuổi = ngày kể từ khi lưu từ
                  </p>
                </>
              )}

              <Button
                className="h-12 w-full rounded-xl bg-teal-600 font-black hover:bg-teal-700"
                disabled={!canGoTheme}
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
              >
                Tiếp · Chủ đề & cấp độ
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: theme + level ── */}
        {step === 2 && (
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">2. Chủ đề & cấp độ đọc</CardTitle>
              <p className="text-xs text-muted-foreground">
                Chủ đề bao trùm <strong>tất cả</strong> {selectedCount} từ đã chọn · cấp
                độ quyết định độ dài/khó
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {selected.slice(0, 12).map((w) => (
                  <Badge key={wordKey(w)} variant="outline" className="text-[10px]">
                    {w.word}
                  </Badge>
                ))}
                {selected.length > 12 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{selected.length - 12}
                  </Badge>
                )}
              </div>

              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Chủ đề
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PACK_THEMES.map((t) => {
                    const on = themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setThemeId(t.id);
                          setPassage(null);
                        }}
                        className={`rounded-2xl border px-2.5 py-3 text-left transition-all ${
                          on
                            ? 'border-teal-500 bg-teal-50 shadow-md ring-2 ring-teal-200'
                            : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                        }`}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <p className="mt-1 text-xs font-black leading-snug text-slate-800">
                          {t.labelVi}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Cấp độ bài đọc
                </p>
                <div className="grid gap-2">
                  {PACK_READING_LEVELS.map((lv) => {
                    const on = readingLevelId === lv.id;
                    return (
                      <button
                        key={lv.id}
                        type="button"
                        onClick={() => {
                          setReadingLevelId(lv.id);
                          setPassage(null);
                        }}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition-all ${
                          on
                            ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
                            : 'border-slate-200 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{lv.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800">
                              {lv.labelVi}{' '}
                              <span className="font-bold text-indigo-600">{lv.cefr}</span>
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              {lv.minWords}–{lv.maxWords} từ · {lv.hintVi}
                            </p>
                          </div>
                          {on && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-12 flex-1 rounded-xl font-bold"
                  onClick={() => setStep(1)}
                >
                  Quay lại
                </Button>
                <Button
                  className="h-12 flex-[1.4] rounded-xl bg-teal-600 font-black hover:bg-teal-700"
                  disabled={!canGen}
                  onClick={() => void genPassage()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang Gen AI…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gen AI đoạn đọc
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-[10px] font-medium text-slate-400">
                Chỉ tốn quota khi bấm Gen
                {selectedTheme && selectedLevel
                  ? ` · ${selectedTheme.labelVi} · ${selectedLevel.cefr}`
                  : ''}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: result ── */}
        {step === 3 && passage && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-teal-600">
                {passage.themeLabelVi || selectedTheme?.labelVi}
              </Badge>
              <Badge className="bg-indigo-600">
                {passage.readingLevelLabelVi || selectedLevel?.labelVi} · {passage.level}
              </Badge>
              <Badge variant="outline">{passage.wordCount} words</Badge>
              <Badge
                variant={passage.coverage >= 0.75 ? 'default' : 'destructive'}
              >
                coverage {Math.round(passage.coverage * 100)}%
              </Badge>
            </div>

            <div className="flex gap-2">
              {(
                [
                  ['passage', 'Đọc + hỏi'],
                  ['cloze', 'Điền từ'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setResultTab(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${
                    resultTab === id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {resultTab === 'passage' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{passage.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[15px] leading-relaxed text-slate-800">
                    {highlightPassage(passage.passage)}
                  </p>
                  {passage.missingWords.length > 0 && (
                    <p className="text-[11px] text-amber-700">
                      Thiếu trong đoạn: {passage.missingWords.join(', ')}
                    </p>
                  )}

                  <div className="space-y-3 border-t pt-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Câu hỏi
                    </p>
                    {passage.questions.map((q, i) => (
                      <div key={i} className="rounded-xl border bg-slate-50/80 p-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {i + 1}. {q.q}
                        </p>
                        <div className="mt-2 grid gap-1.5">
                          {q.options.map((opt) => {
                            const sel = qAnswers[i] === opt;
                            const show = qRevealed;
                            const correct = opt === q.answer;
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={qRevealed}
                                onClick={() =>
                                  setQAnswers((prev) => ({ ...prev, [i]: opt }))
                                }
                                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                                  show && correct
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : show && sel && !correct
                                      ? 'border-red-300 bg-red-50'
                                      : sel
                                        ? 'border-teal-400 bg-teal-50'
                                        : 'border-slate-200 bg-white'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {qRevealed && q.explain && (
                          <p className="mt-2 text-xs text-slate-500">{q.explain}</p>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      {!qRevealed ? (
                        <Button
                          className="flex-1 rounded-xl font-bold"
                          onClick={() => setQRevealed(true)}
                        >
                          Chấm điểm
                        </Button>
                      ) : (
                        <p className="flex flex-1 items-center gap-2 text-sm font-bold text-teal-700">
                          <Check className="h-4 w-4" />
                          {qScore?.ok}/{qScore?.total} đúng
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {resultTab === 'cloze' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Điền từ vào đoạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-[15px] leading-relaxed">
                    {renderClozeText(
                      passage.cloze.text,
                      passage.cloze.blanks,
                      clozeAnswers,
                      (id, value) =>
                        setClozeAnswers((prev) => ({ ...prev, [id]: value })),
                      clozeRevealed,
                    )}
                  </p>
                  {!clozeRevealed ? (
                    <Button
                      className="w-full rounded-xl font-bold"
                      onClick={() => setClozeRevealed(true)}
                    >
                      Chấm cloze
                    </Button>
                  ) : (
                    <p className="text-sm font-bold text-teal-700">
                      {clozeScore?.ok}/{clozeScore?.total} chỗ đúng
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold"
                onClick={() => {
                  setStep(2);
                  setPassage(null);
                }}
              >
                Đổi theme / level
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold"
                onClick={() => {
                  setStep(1);
                  setPassage(null);
                }}
              >
                Đổi từ
              </Button>
            </div>
          </div>
        )}

        {loading && step === 2 && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-teal-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            AI đang viết đoạn theo chủ đề & cấp độ…
          </div>
        )}
      </div>
    </StudentShell>
  );
}

export default function PackReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải…
        </div>
      }
    >
      <PackReadingInner />
    </Suspense>
  );
}
