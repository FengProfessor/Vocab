'use client';

/**
 * Luyện đọc gói từ (kiểu codemix):
 * chọn từ theo mức nhớ (yếu / đang học / vững) → chủ đề → cấp độ → Gen AI.
 * URL: /practice/pack-reading
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ChevronLeft,
  Crown,
  Loader2,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { usePlan } from '@/hooks/usePlan';
import { FREE_PACK_READING_DAILY_LIMIT } from '@/lib/entitlement';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
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
  review_count: number;
  srsLevel: number;
  stability: number;
  isDue: boolean;
  mastery: number;
  bucket: MemoryBucket;
}

/** Mức ghi nhớ — không dùng ngày lưu */
type MemoryBucket = 'weak' | 'learning' | 'solid';

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

const BUCKET_META: Record<MemoryBucket, { label: string }> = {
  weak: { label: 'Yếu' },
  learning: { label: 'Đang nhớ' },
  solid: { label: 'Vững' },
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function wordKey(w: PoolWord): string {
  return w.id || normalize(w.word);
}

/**
 * weak: chưa ôn | đến hạn | L1–2 | stability thấp
 * solid: L5–6
 * learning: còn lại
 */
function bucketForMemory(w: {
  review_count: number;
  srsLevel: number;
  stability: number;
  isDue: boolean;
}): MemoryBucket {
  if (
    w.review_count <= 0 ||
    w.isDue ||
    w.srsLevel <= 2 ||
    w.stability < 1.5
  ) {
    return 'weak';
  }
  if (w.srsLevel >= 5) return 'solid';
  return 'learning';
}

/** Parse JSON an toàn — server đôi khi trả plain text "An error occurred…" */
async function readJsonSafe(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 180);
    throw new Error(
      snippet
        ? `Lỗi server (${res.status}): ${snippet}`
        : `Lỗi server HTTP ${res.status} (không có JSON)`,
    );
  }
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
  const { isPaid, plan, loading: planLoading } = usePlan();
  const [step, setStep] = useState<Step>(1);
  const [pool, setPool] = useState<PoolWord[]>([]);
  const [poolSource, setPoolSource] = useState<'mine' | 'empty'>('empty');
  const [poolLoading, setPoolLoading] = useState(true);
  const [bucket, setBucket] = useState<MemoryBucket>('weak');
  const [query, setQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());

  const [themeId, setThemeId] = useState<string | null>(null);
  const [readingLevelId, setReadingLevelId] = useState<string>(DEFAULT_PACK_READING_LEVEL_ID);

  const [passage, setPassage] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    remaining: number | null;
    limit: number | null;
    isPro: boolean;
    provider?: string;
  } | null>(null);

  const [resultTab, setResultTab] = useState<ResultTab>('passage');
  const [qAnswers, setQAnswers] = useState<Record<number, string>>({});
  const [qRevealed, setQRevealed] = useState(false);
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [clozeRevealed, setClozeRevealed] = useState(false);

  // Load từ user + SRS (mức nhớ) — 2 trang × 50
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolLoading(true);
      try {
        const mapped: PoolWord[] = [];
        const seen = new Set<string>();

        for (const offset of [0, 50]) {
          const res = await authFetch(`/api/words?limit=50&offset=${offset}`);
          let json: {
            success?: boolean;
            data?: Array<{
              id?: string;
              word?: string;
              translation?: string;
              pos?: string;
              isDue?: boolean;
              srsLevel?: number;
              mastery?: number;
              reviewCount?: number;
              srs?: {
                stability?: number;
                review_count?: number;
                last_reviewed_at?: string | null;
              } | null;
            }>;
          };
          try {
            json = (await readJsonSafe(res)) as typeof json;
          } catch {
            break;
          }
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
            const review_count = w.srs?.review_count ?? w.reviewCount ?? 0;
            const stability = Number(w.srs?.stability ?? 0);
            const srsLevel = Number(w.srsLevel ?? 1);
            const isDue = Boolean(w.isDue);
            const mastery = Number(w.mastery ?? 0);
            const mem = { review_count, srsLevel, stability, isDue };
            mapped.push({
              id: w.id,
              word,
              translation: vi,
              pos: w.pos,
              review_count,
              srsLevel,
              stability,
              isDue,
              mastery,
              bucket: bucketForMemory(mem),
            });
          }
          if (json.data.length < 50) break;
        }

        if (cancelled) return;

        if (mapped.length > 0) {
          setPool(mapped);
          setPoolSource('mine');
          // Ưu tiên nhóm yếu
          const order: MemoryBucket[] = ['weak', 'learning', 'solid'];
          let startBucket: MemoryBucket = 'weak';
          for (const b of order) {
            if (mapped.filter((w) => w.bucket === b).length >= PACK_PASSAGE_MIN_WORDS) {
              startBucket = b;
              break;
            }
            if (mapped.filter((w) => w.bucket === b).length > 0) startBucket = b;
          }
          setBucket(startBucket);
          // Không auto-chọn — user tự chọn (+ nhóm / từng từ)
          setSelectedKeys(new Set());
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
    const c: Record<MemoryBucket, number> = { weak: 0, learning: 0, solid: 0 };
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

  const switchBucket = useCallback((b: MemoryBucket) => {
    setBucket(b);
    setQuery('');
    // Giữ selection xuyên bucket; không auto-fill nhóm mới
    setPassage(null);
  }, []);

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
    setQuotaBlocked(false);
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
      const res = await authFetch('/api/practice/pack-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          readingLevelId,
          words,
          title: selectedTheme?.labelEn ?? 'My pack',
        }),
      });
      const json = await readJsonSafe(res);
      const q = json.quota as
        | {
            remaining?: number | null;
            limit?: number | null;
            isPro?: boolean;
            provider?: string;
          }
        | undefined;
      if (q) {
        setQuotaInfo({
          remaining: q.remaining ?? null,
          limit: q.limit ?? null,
          isPro: Boolean(q.isPro),
          provider: q.provider,
        });
      }

      if (json.error === 'PACK_READING_DAILY_LIMIT' || res.status === 403) {
        setQuotaBlocked(true);
        throw new Error(
          typeof json.message === 'string'
            ? json.message
            : `Free hết ${FREE_PACK_READING_DAILY_LIMIT} lượt/ngày. Nâng Pro để Gen nhanh không giới hạn.`,
        );
      }
      if (!json.success || !json.data) {
        throw new Error(
          typeof json.error === 'string' ? json.error : 'Gen thất bại',
        );
      }
      setPassage(json.data as PassageData);
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
    <StudentShell title="Luyện đọc">
      <div className="mx-auto max-w-2xl space-y-2.5 px-3 py-3 pb-24 sm:px-4">
        {/* Header gọn */}
        <div className="flex items-center gap-2">
          <Link
            href="/practice"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-slate-600"
            aria-label="Về Sử dụng từ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base font-black text-slate-900">Luyện đọc</h1>
              {!planLoading && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                    isPaid
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {isPaid ? (
                    <>
                      <Zap className="h-2.5 w-2.5" /> Pro
                    </>
                  ) : (
                    <>
                      Free {FREE_PACK_READING_DAILY_LIMIT}/ngày
                      {quotaInfo?.remaining != null
                        ? ` · ${quotaInfo.remaining}`
                        : ''}
                    </>
                  )}
                </span>
              )}
              {!planLoading && !isPaid && (
                <Link
                  href="/upgrade?from=pack_reading"
                  className="inline-flex items-center gap-0.5 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  <Crown className="h-2.5 w-2.5" /> Pro
                </Link>
              )}
            </div>
          </div>
          <BookOpen className="h-5 w-5 shrink-0 text-teal-600" />
        </div>

        {/* Stepper: bar + label 1 dòng */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s === 1) setStep(1);
                  if (s === 2 && canGoTheme) setStep(2);
                  if (s === 3 && passage) setStep(3);
                }}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  step >= s ? 'bg-teal-500' : 'bg-slate-200'
                }`}
                aria-label={`Bước ${s}`}
              />
            ))}
          </div>
          <span className="shrink-0 text-[10px] font-bold text-slate-500">
            {step === 1 && '1. Chọn từ'}
            {step === 2 && '2. Chủ đề'}
            {step === 3 && '3. Đọc'}
          </span>
        </div>

        {error && (
          <div className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-800">
            <p className="font-semibold">{error}</p>
            {quotaBlocked && (
              <Link
                href="/upgrade?from=pack_reading"
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-bold text-white"
              >
                <Crown className="h-3 w-3" /> Nâng Pro
              </Link>
            )}
          </div>
        )}

        {/* ── Step 1: pick ── */}
        {step === 1 && (
          <div className="space-y-2.5 rounded-xl border border-teal-100 bg-white p-2.5 shadow-sm">
            {poolLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
              </div>
            ) : poolSource === 'empty' ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-3 text-xs text-amber-900">
                Chưa có từ.{' '}
                <Link href="/import" className="font-bold underline">
                  Thêm từ
                </Link>
              </div>
            ) : (
              <>
                {/* Đường dễ */}
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-2.5 py-2.5">
                  <p className="text-[12px] font-black text-teal-950">Bắt đầu nhanh</p>
                  <p className="mt-0.5 text-[11px] text-teal-800/80">
                    Gợi ý {Math.min(8, PACK_PASSAGE_MAX_WORDS)} từ yếu → chọn chủ đề → đọc.
                  </p>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700"
                    onClick={() => {
                      const order: MemoryBucket[] = ['weak', 'learning', 'solid'];
                      let b: MemoryBucket = 'weak';
                      for (const x of order) {
                        if (countsByBucket[x] >= PACK_PASSAGE_MIN_WORDS) {
                          b = x;
                          break;
                        }
                      }
                      setBucket(b);
                      const list = pool.filter((w) => w.bucket === b);
                      const take = Math.min(8, PACK_PASSAGE_MAX_WORDS, list.length);
                      setSelectedKeys(new Set(list.slice(0, take).map(wordKey)));
                      setQuery('');
                      setError(null);
                      if (take >= PACK_PASSAGE_MIN_WORDS) setStep(2);
                    }}
                  >
                    Gợi ý {Math.min(8, PACK_PASSAGE_MAX_WORDS)} từ →
                  </button>
                </div>

                <details className="rounded-lg border border-slate-200 open:bg-slate-50/50">
                  <summary className="cursor-pointer px-2.5 py-2 text-[11px] font-bold text-slate-600">
                    Tự chọn · {selectedCount} từ
                    {!wordsOk && selectedCount > 0
                      ? ` (cần ≥${PACK_PASSAGE_MIN_WORDS})`
                      : ''}
                  </summary>
                  <div className="space-y-2 border-t border-slate-100 px-2 pb-2 pt-2">
                    <div className="grid grid-cols-3 gap-1">
                      {(['weak', 'learning', 'solid'] as MemoryBucket[]).map((b) => {
                        const on = bucket === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => switchBucket(b)}
                            className={`rounded-lg border px-1 py-1.5 text-[11px] font-bold ${
                              on
                                ? b === 'weak'
                                  ? 'border-rose-400 bg-rose-50 text-rose-800'
                                  : b === 'learning'
                                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                                    : 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {BUCKET_META[b].label}{' '}
                            <span className="tabular-nums opacity-70">{countsByBucket[b]}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-teal-600"
                        onClick={selectAllVisible}
                      >
                        + cả nhóm
                      </button>
                      {selectedCount > 0 && (
                        <button
                          type="button"
                          className="text-[11px] text-slate-400"
                          onClick={clearSelection}
                        >
                          Xóa
                        </button>
                      )}
                      <div className="relative ml-auto min-w-0 flex-1 max-w-[9rem]">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Tìm…"
                          className="w-full rounded-lg border border-slate-200 bg-white py-1 pl-6 pr-2 text-[11px]"
                        />
                      </div>
                    </div>
                    <div className="max-h-[28vh] space-y-0.5 overflow-y-auto">
                      {filteredPool.length === 0 ? (
                        <p className="py-4 text-center text-[11px] text-slate-400">
                          Không có từ — thử nhóm khác
                        </p>
                      ) : (
                        filteredPool.map((w) => {
                          const on = selectedKeys.has(wordKey(w));
                          const full = !on && selectedCount >= PACK_PASSAGE_MAX_WORDS;
                          return (
                            <button
                              key={wordKey(w)}
                              type="button"
                              disabled={full}
                              onClick={() => toggleWord(w)}
                              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs ${
                                on ? 'bg-teal-50 ring-1 ring-teal-300' : full ? 'opacity-40' : ''
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  on
                                    ? 'border-teal-600 bg-teal-600 text-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {on ? <Check className="h-2.5 w-2.5" /> : null}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                <span className="font-bold text-slate-800">{w.word}</span>
                                <span className="text-slate-400"> · </span>
                                <span className="text-slate-600">{w.translation}</span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </details>
              </>
            )}

            <Button
              className="h-10 w-full rounded-xl bg-teal-600 text-sm font-bold hover:bg-teal-700"
              disabled={!canGoTheme}
              onClick={() => {
                setError(null);
                setStep(2);
              }}
            >
              Tiếp · chọn chủ đề
            </Button>
          </div>
        )}

        {/* ── Step 2: theme + level ── */}
        {step === 2 && (
          <div className="space-y-2.5 rounded-xl border border-teal-100 bg-white p-2.5 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {selected.slice(0, 10).map((w) => (
                <span
                  key={wordKey(w)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {w.word}
                </span>
              ))}
              {selected.length > 10 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  +{selected.length - 10}
                </span>
              )}
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Chủ đề
              </p>
              <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
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
                      className={`rounded-lg border px-1.5 py-1.5 text-left transition ${
                        on
                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-200'
                          : 'border-slate-200 bg-white hover:border-teal-200'
                      }`}
                    >
                      <span className="text-sm leading-none">{t.emoji}</span>
                      <p className="mt-0.5 text-[10px] font-bold leading-tight text-slate-800">
                        {t.labelVi}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Cấp độ
              </p>
              <div className="grid gap-1">
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
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                        on
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                          : 'border-slate-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <span className="text-sm">{lv.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-800">
                          {lv.labelVi}{' '}
                          <span className="font-bold text-indigo-600">{lv.cefr}</span>
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">
                          {lv.minWords}–{lv.maxWords} từ
                        </p>
                      </div>
                      {on && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-1.5">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl text-sm font-bold"
                onClick={() => setStep(1)}
              >
                ← Từ
              </Button>
              <Button
                className="h-10 flex-[1.6] rounded-xl bg-teal-600 text-sm font-bold hover:bg-teal-700"
                disabled={!canGen}
                onClick={() => void genPassage()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Đang Gen…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Gen đoạn
                  </>
                )}
              </Button>
            </div>
            {!isPaid && (
              <Link
                href="/upgrade?from=pack_reading"
                className="flex items-center justify-center gap-1 text-[10px] font-semibold text-violet-700 hover:underline"
              >
                <Crown className="h-3 w-3" />
                Pro · nhanh hơn
              </Link>
            )}
          </div>
        )}

        {/* ── Step 3: result ── */}
        {step === 3 && passage && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1">
              <Badge className="bg-teal-600 text-[10px]">
                {passage.themeLabelVi || selectedTheme?.labelVi}
              </Badge>
              <Badge className="bg-indigo-600 text-[10px]">
                {passage.level}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {passage.wordCount}w
              </Badge>
              <Badge
                variant={passage.coverage >= 0.75 ? 'default' : 'destructive'}
                className="text-[10px]"
              >
                {Math.round(passage.coverage * 100)}%
              </Badge>
            </div>

            <div className="flex gap-1">
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
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
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
              <div className="space-y-3 rounded-xl border bg-white p-3 shadow-sm">
                <h2 className="text-base font-black text-slate-900">{passage.title}</h2>
                <p className="text-sm leading-relaxed text-slate-800">
                  {highlightPassage(passage.passage)}
                </p>
                {passage.missingWords.length > 0 && (
                  <p className="text-[10px] text-amber-700">
                    Thiếu: {passage.missingWords.join(', ')}
                  </p>
                )}

                <div className="space-y-2 border-t pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Câu hỏi
                  </p>
                  {passage.questions.map((q, i) => (
                    <div key={i} className="rounded-lg border bg-slate-50/80 p-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {i + 1}. {q.q}
                      </p>
                      <div className="mt-1.5 grid gap-1">
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
                              className={`rounded-md border px-2 py-1.5 text-left text-xs ${
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
                        <p className="mt-1.5 text-[10px] text-slate-500">{q.explain}</p>
                      )}
                    </div>
                  ))}
                  {!qRevealed ? (
                    <Button
                      className="h-9 w-full rounded-lg text-xs font-bold"
                      onClick={() => setQRevealed(true)}
                    >
                      Chấm điểm
                    </Button>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                      <Check className="h-3.5 w-3.5" />
                      {qScore?.ok}/{qScore?.total} đúng
                    </p>
                  )}
                </div>
              </div>
            )}

            {resultTab === 'cloze' && (
              <div className="space-y-2.5 rounded-xl border bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-slate-400">Điền từ</p>
                <p className="text-sm leading-relaxed">
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
                    className="h-9 w-full rounded-lg text-xs font-bold"
                    onClick={() => setClozeRevealed(true)}
                  >
                    Chấm cloze
                  </Button>
                ) : (
                  <p className="text-xs font-bold text-teal-700">
                    {clozeScore?.ok}/{clozeScore?.total} chỗ đúng
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-1.5">
              <Button
                variant="outline"
                className="h-9 flex-1 rounded-lg text-xs font-bold"
                onClick={() => {
                  setStep(2);
                  setPassage(null);
                }}
              >
                Đổi theme
              </Button>
              <Button
                variant="outline"
                className="h-9 flex-1 rounded-lg text-xs font-bold"
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
          <div className="flex items-center justify-center gap-2 py-6 text-xs font-semibold text-teal-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI đang viết đoạn…
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
