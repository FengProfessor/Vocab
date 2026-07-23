'use client';

/**
 * Sử dụng từ / Đặt câu: chọn bulk 1–20 từ → viết VI+EN → AI full EN.
 * URL: /practice/codemix
 */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Check,
  Crown,
  Loader2,
  Search,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { usePlan } from '@/hooks/usePlan';
import { FREE_CODEMIX_UPGRADE_DAILY_LIMIT } from '@/lib/entitlement';
import {
  CODEMIX_MAX_WORDS,
  CODEMIX_MIN_WORDS,
} from '@/lib/codemix-upgrade';
import { StudentShell } from '@/components/student/StudentShell';

type Phase = 'pick' | 'write' | 'upgrade';

type MemoryBucket = 'weak' | 'learning' | 'solid';

interface DrillWord {
  id?: string;
  word: string;
  vi: string;
  pos?: string;
  review_count?: number;
  srsLevel?: number;
  stability?: number;
  isDue?: boolean;
  bucket?: MemoryBucket;
}

const BUCKET_META: Record<MemoryBucket, { label: string }> = {
  weak: { label: 'Yếu' },
  learning: { label: 'Đang nhớ' },
  solid: { label: 'Vững' },
};

function bucketForMemory(w: {
  review_count: number;
  srsLevel: number;
  stability: number;
  isDue: boolean;
}): MemoryBucket {
  if (w.review_count <= 0 || w.isDue || w.srsLevel <= 2 || w.stability < 1.5) {
    return 'weak';
  }
  if (w.srsLevel >= 5) return 'solid';
  return 'learning';
}

interface WowWord {
  word: string;
  in_sentence: string;
  pattern: string;
  why_vi: string;
  tip_vi: string;
}

interface UpgradeData {
  english: string;
  english_plain: string;
  meaning_vi: string;
  level: string;
  wow_note_vi: string;
  words: WowWord[];
}

interface QuotaInfo {
  plan?: string;
  used?: number;
  limit?: number | null;
  remaining?: number | null;
  isPro?: boolean;
  counted?: boolean;
}

const DEMO_POOL: DrillWord[] = [
  { word: 'wake up', vi: 'thức dậy', pos: 'v', bucket: 'weak', srsLevel: 1, review_count: 0, isDue: true },
  { word: 'eat', vi: 'ăn', pos: 'v', bucket: 'weak', srsLevel: 1, review_count: 0, isDue: true },
  { word: 'go', vi: 'đi', pos: 'v', bucket: 'weak', srsLevel: 2, review_count: 1, isDue: true },
  { word: 'study', vi: 'học', pos: 'v', bucket: 'learning', srsLevel: 3, review_count: 3, isDue: false },
  { word: 'sleep', vi: 'ngủ', pos: 'v', bucket: 'learning', srsLevel: 3, review_count: 2, isDue: false },
  { word: 'buy', vi: 'mua', pos: 'v', bucket: 'learning', srsLevel: 4, review_count: 4, isDue: false },
  { word: 'drink', vi: 'uống', pos: 'v', bucket: 'solid', srsLevel: 5, review_count: 8, isDue: false },
  { word: 'meet', vi: 'gặp', pos: 'v', bucket: 'weak', srsLevel: 1, review_count: 0, isDue: true },
  { word: 'like', vi: 'thích', pos: 'v', bucket: 'solid', srsLevel: 6, review_count: 10, isDue: false },
  { word: 'need', vi: 'cần', pos: 'v', bucket: 'learning', srsLevel: 4, review_count: 5, isDue: false },
  { word: 'want', vi: 'muốn', pos: 'v', bucket: 'weak', srsLevel: 2, review_count: 1, isDue: false },
  { word: 'have', vi: 'có', pos: 'v', bucket: 'solid', srsLevel: 5, review_count: 7, isDue: false },
  { word: 'make', vi: 'làm / tạo', pos: 'v', bucket: 'learning', srsLevel: 3, review_count: 3, isDue: false },
  { word: 'take', vi: 'lấy / mất (thời gian)', pos: 'v', bucket: 'weak', srsLevel: 1, review_count: 0, isDue: true },
  { word: 'read', vi: 'đọc', pos: 'v', bucket: 'learning', srsLevel: 4, review_count: 4, isDue: false },
  { word: 'write', vi: 'viết', pos: 'v', bucket: 'weak', srsLevel: 2, review_count: 2, isDue: true },
  { word: 'play', vi: 'chơi', pos: 'v', bucket: 'solid', srsLevel: 5, review_count: 6, isDue: false },
  { word: 'help', vi: 'giúp', pos: 'v', bucket: 'learning', srsLevel: 3, review_count: 3, isDue: false },
  { word: 'finish', vi: 'hoàn thành', pos: 'v', bucket: 'weak', srsLevel: 1, review_count: 0, isDue: true },
  { word: 'start', vi: 'bắt đầu', pos: 'v', bucket: 'learning', srsLevel: 3, review_count: 2, isDue: false },
  { word: 'happy', vi: 'vui vẻ', pos: 'adj', bucket: 'solid', srsLevel: 5, review_count: 5, isDue: false },
  { word: 'tired', vi: 'mệt', pos: 'adj', bucket: 'weak', srsLevel: 2, review_count: 1, isDue: false },
  { word: 'school', vi: 'trường học', pos: 'n', bucket: 'learning', srsLevel: 4, review_count: 4, isDue: false },
  { word: 'friend', vi: 'bạn bè', pos: 'n', bucket: 'solid', srsLevel: 6, review_count: 9, isDue: false },
  { word: 'homework', vi: 'bài tập về nhà', pos: 'n', bucket: 'weak', srsLevel: 1, review_count: 0, isDue: true },
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findTargets(text: string, targets: DrillWord[]): Set<string> {
  const lower = normalize(text);
  return new Set(
    targets.filter((t) => lower.includes(normalize(t.word))).map((t) => normalize(t.word))
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wordKey(w: DrillWord): string {
  return w.id || normalize(w.word);
}

function highlightTargets(text: string, targets: string[]): ReactNode[] {
  if (!text) return [];
  const plain = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  const sorted = [...targets].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!pattern) return [plain];
  const re = new RegExp(`(${pattern})`, 'gi');
  return plain.split(re).map((part, i) => {
    const hit = sorted.some((t) => normalize(t) === normalize(part));
    if (hit) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-200/90 px-0.5 font-semibold text-amber-950"
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderAiEnglish(text: string): ReactNode[] {
  if (!text) return [];
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <mark
          key={i}
          className="rounded bg-gradient-to-r from-amber-200 to-yellow-200 px-1 py-0.5 font-bold text-amber-950 shadow-sm"
        >
          {m[1]}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function CodeMixPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <CodeMixPracticeInner />
    </Suspense>
  );
}

function CodeMixPracticeInner() {
  const { isPaid, plan, loading: planLoading } = usePlan();
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === '1';

  const [phase, setPhase] = useState<Phase>('pick');
  const [pool, setPool] = useState<DrillWord[]>(DEMO_POOL);
  const [poolSource, setPoolSource] = useState<'demo' | 'mine'>('demo');
  const [poolLoading, setPoolLoading] = useState(true);
  const [bucket, setBucket] = useState<MemoryBucket>('weak');
  const [query, setQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());

  const [codemix, setCodemix] = useState('');
  const [cmChecked, setCmChecked] = useState(false);

  const [upgrade, setUpgrade] = useState<UpgradeData | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeOffline, setUpgradeOffline] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [quotaBlocked, setQuotaBlocked] = useState(false);

  // Load từ user + SRS → bucket mức nhớ (giống luyện đọc)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolLoading(true);
      try {
        const mapped: DrillWord[] = [];
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
              isDue?: boolean;
              srsLevel?: number;
              reviewCount?: number;
              srs?: {
                stability?: number;
                review_count?: number;
              } | null;
            }>;
          };
          if (!json.success || !Array.isArray(json.data)) break;
          for (const w of json.data) {
            const word = (w.word || '').trim();
            if (!word || word.length > 40) continue;
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
            mapped.push({
              id: w.id,
              word,
              vi,
              pos: w.pos,
              review_count,
              srsLevel,
              stability,
              isDue,
              bucket: bucketForMemory({ review_count, srsLevel, stability, isDue }),
            });
            if (mapped.length >= 120) break;
          }
          if (json.data.length < 50 || mapped.length >= 120) break;
        }

        if (cancelled) return;

        if (mapped.length >= CODEMIX_MIN_WORDS) {
          setPool(mapped);
          setPoolSource('mine');
          const order: MemoryBucket[] = ['weak', 'learning', 'solid'];
          let start: MemoryBucket = 'weak';
          for (const b of order) {
            if (mapped.filter((w) => w.bucket === b).length >= CODEMIX_MIN_WORDS) {
              start = b;
              break;
            }
            if (mapped.some((w) => w.bucket === b)) start = b;
          }
          setBucket(start);
          const pre = mapped
            .filter((w) => w.bucket === start)
            .slice(0, Math.min(5, CODEMIX_MAX_WORDS));
          setSelectedKeys(new Set(pre.map(wordKey)));
          setPoolLoading(false);
          return;
        }
      } catch {
        /* fallback demo */
      }
      if (!cancelled) {
        setPool(DEMO_POOL);
        setPoolSource('demo');
        setBucket('weak');
        setSelectedKeys(
          new Set(
            DEMO_POOL.filter((w) => w.bucket === 'weak')
              .slice(0, 5)
              .map(wordKey),
          ),
        );
        setPoolLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countsByBucket = useMemo(() => {
    const c: Record<MemoryBucket, number> = { weak: 0, learning: 0, solid: 0 };
    for (const w of pool) {
      const b = w.bucket ?? 'weak';
      c[b]++;
    }
    return c;
  }, [pool]);

  const selected = useMemo(() => {
    const map = new Map(pool.map((w) => [wordKey(w), w]));
    return [...selectedKeys]
      .map((k) => map.get(k))
      .filter((w): w is DrillWord => !!w);
  }, [pool, selectedKeys]);

  const selectedCount = selected.length;
  const canStart =
    selectedCount >= CODEMIX_MIN_WORDS && selectedCount <= CODEMIX_MAX_WORDS;

  const filteredPool = useMemo(() => {
    const q = normalize(query);
    return pool.filter((w) => {
      if ((w.bucket ?? 'weak') !== bucket) return false;
      if (!q) return true;
      return (
        normalize(w.word).includes(q) ||
        normalize(w.vi).includes(q) ||
        (!!w.pos && normalize(w.pos).includes(q))
      );
    });
  }, [pool, query, bucket]);

  const toggleWord = useCallback((w: DrillWord) => {
    const k = wordKey(w);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        next.delete(k);
        return next;
      }
      if (next.size >= CODEMIX_MAX_WORDS) return prev;
      next.add(k);
      return next;
    });
  }, []);

  /** Random chỉ trong bucket đang mở */
  const pickRandom = useCallback(
    (n: number) => {
      const source = pool.filter((w) => (w.bucket ?? 'weak') === bucket);
      const take = Math.min(n, CODEMIX_MAX_WORDS, source.length);
      if (take < CODEMIX_MIN_WORDS) return;
      const picked = shuffle(source).slice(0, Math.max(CODEMIX_MIN_WORDS, take));
      setSelectedKeys(new Set(picked.map(wordKey)));
    },
    [pool, bucket],
  );

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  const switchBucket = useCallback(
    (b: MemoryBucket) => {
      setBucket(b);
      setQuery('');
      const inBucket = pool.filter((w) => (w.bucket ?? 'weak') === b);
      if (inBucket.length >= CODEMIX_MIN_WORDS) {
        setSelectedKeys(
          new Set(inBucket.slice(0, Math.min(5, CODEMIX_MAX_WORDS)).map(wordKey)),
        );
      } else {
        setSelectedKeys(new Set(inBucket.map(wordKey)));
      }
    },
    [pool],
  );

  const cmFound = useMemo(() => findTargets(codemix, selected), [codemix, selected]);

  const cmScore = useMemo(() => {
    const found = selected.filter((t) => cmFound.has(normalize(t.word)));
    const missing = selected.filter((t) => !cmFound.has(normalize(t.word)));
    const pct = selected.length
      ? Math.round((found.length / selected.length) * 100)
      : 0;
    return { found, missing, pct };
  }, [cmFound, selected]);

  // B1 pass soft: 1–2 từ = đủ hết; ≥3 từ = ~60%
  const minFoundForPass =
    selected.length <= 2
      ? selected.length
      : Math.max(1, Math.ceil(selected.length * 0.6));
  const canGoUpgrade =
    selected.length > 0 &&
    (cmScore.found.length >= minFoundForPass ||
      (cmChecked && cmScore.found.length >= Math.min(selected.length, minFoundForPass)));

  const insertWord = useCallback((w: string) => {
    setCodemix((prev) => {
      const needsSpace = prev.length > 0 && !/\s$/.test(prev);
      return prev + (needsSpace ? ' ' : '') + w + ' ';
    });
    setCmChecked(false);
  }, []);

  const runAiUpgrade = useCallback(
    async (forceOffline = false) => {
      if (selected.length < CODEMIX_MIN_WORDS) return;
      const text = codemix.trim();
      if (text.length < 12) {
        setUpgradeError('Viết đoạn có từ mục tiêu trước (ít nhất vài câu).');
        return;
      }
      setUpgradeLoading(true);
      setUpgradeError(null);
      setQuotaBlocked(false);
      try {
        const res = await authFetch('/api/practice/codemix-upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            words: selected.map((t) => ({ word: t.word, translation: t.vi })),
            level: 'A1-A2',
            offline: forceOffline,
          }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: UpgradeData;
          offline?: boolean;
          error?: string;
          message?: string;
          aiError?: string;
          quota?: QuotaInfo;
        };
        if (json.quota) setQuota(json.quota);

        if (res.status === 403 || json.error === 'CODEMIX_DAILY_LIMIT') {
          setQuotaBlocked(true);
          setUpgradeError(
            json.message ||
              `Free hết ${FREE_CODEMIX_UPGRADE_DAILY_LIMIT} lượt AI/ngày. Nâng Pro để không giới hạn.`
          );
          return;
        }
        if (!json.success || !json.data) {
          throw new Error(json.message || json.error || 'Upgrade failed');
        }
        setUpgrade(json.data);
        setUpgradeOffline(!!json.offline);
        setOpenCard(json.data.words[0]?.word ?? null);
        if (json.aiError) setUpgradeError(`AI lỗi → offline: ${json.aiError}`);
      } catch (e: unknown) {
        setUpgradeError(e instanceof Error ? e.message : 'Lỗi mạng');
      } finally {
        setUpgradeLoading(false);
      }
    },
    [codemix, selected]
  );

  const startWrite = () => {
    if (!canStart) return;
    setPhase('write');
    setCodemix('');
    setCmChecked(false);
    setUpgrade(null);
    setUpgradeError(null);
    setQuotaBlocked(false);
  };

  const goUpgrade = () => {
    setPhase('upgrade');
    setUpgrade(null);
    void runAiUpgrade(false);
  };

  const body = (
    <div className="min-h-full bg-gradient-to-b from-violet-50/80 via-white to-white text-slate-900">
      <div className="mx-auto max-w-2xl space-y-3 px-3 py-3 pb-24 sm:px-4">
        {/* Header gọn */}
        <div className="flex items-center gap-2">
          {!embed && (
            <Link
              href="/practice"
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              ←
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight">Đặt câu</h1>
              <span className="text-[11px] font-medium text-slate-400">
                {CODEMIX_MIN_WORDS}–{CODEMIX_MAX_WORDS} từ
              </span>
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
                      <Crown className="h-2.5 w-2.5" /> {plan}
                    </>
                  ) : (
                    <>
                      Free {FREE_CODEMIX_UPGRADE_DAILY_LIMIT}/ngày
                      {quota?.remaining != null ? ` · ${quota.remaining}` : ''}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stepper gọn */}
        <div className="flex gap-1 text-[11px] font-bold">
          {(
            [
              { id: 'pick' as const, label: '1. Chọn' },
              { id: 'write' as const, label: '2. Viết' },
              { id: 'upgrade' as const, label: '3. AI' },
            ] as const
          ).map((s) => {
            const active = phase === s.id;
            const done =
              (s.id === 'pick' && (phase === 'write' || phase === 'upgrade')) ||
              (s.id === 'write' && phase === 'upgrade');
            return (
              <button
                key={s.id}
                type="button"
                disabled={s.id === 'write' && !canStart && phase === 'pick'}
                onClick={() => {
                  if (s.id === 'pick') setPhase('pick');
                  if (s.id === 'write' && canStart) setPhase('write');
                  if (s.id === 'upgrade' && canGoUpgrade) setPhase('upgrade');
                }}
                className={`flex-1 rounded-lg px-1.5 py-1.5 transition ${
                  active
                    ? 'bg-violet-600 text-white'
                    : done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ═══════ PHASE PICK ═══════ */}
        {phase === 'pick' && (
          <section className="space-y-2.5">
            <p className="text-[11px] font-medium text-slate-500">
              Chọn theo mức nhớ ·{' '}
              {poolSource === 'mine' ? (
                <span className="font-semibold text-emerald-700">{pool.length} từ của bạn</span>
              ) : (
                <span className="font-semibold">pack demo · {pool.length} từ</span>
              )}
            </p>

            {/* Bucket pills */}
            <div className="grid grid-cols-3 gap-1">
              {(['weak', 'learning', 'solid'] as MemoryBucket[]).map((b) => {
                const on = bucket === b;
                const meta = BUCKET_META[b];
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => switchBucket(b)}
                    className={`rounded-lg border px-1.5 py-1.5 text-center transition ${
                      on
                        ? b === 'weak'
                          ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
                          : b === 'learning'
                            ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-200'
                            : 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200'
                        : 'border-slate-200 bg-white hover:border-violet-200'
                    }`}
                  >
                    <p className="text-[11px] font-black text-slate-800">
                      {meta.label}{' '}
                      <span
                        className={`tabular-nums ${
                          on
                            ? b === 'weak'
                              ? 'text-rose-700'
                              : b === 'learning'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {countsByBucket[b]}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Toolbar 1 dòng */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums ${
                  canStart ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {selectedCount}/{CODEMIX_MAX_WORDS}
                {!canStart && ` · ≥${CODEMIX_MIN_WORDS}`}
              </span>
              <button
                type="button"
                onClick={() => pickRandom(5)}
                disabled={countsByBucket[bucket] < CODEMIX_MIN_WORDS}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Rnd 5
              </button>
              <button
                type="button"
                onClick={() => pickRandom(10)}
                disabled={countsByBucket[bucket] < CODEMIX_MIN_WORDS}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Rnd 10
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-600"
                >
                  Xóa
                </button>
              )}
              <div className="relative ml-auto min-w-[7rem] flex-1 sm:max-w-[12rem]">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Tìm «${BUCKET_META[bucket].label}»…`}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs outline-none focus:border-violet-400"
                />
              </div>
            </div>

            {/* Đã chọn — chỉ khi có, gọn */}
            {selectedCount > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.map((w) => (
                  <button
                    key={wordKey(w)}
                    type="button"
                    onClick={() => toggleWord(w)}
                    className="inline-flex items-center gap-0.5 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    {w.word}
                    <X className="h-2.5 w-2.5 opacity-80" />
                  </button>
                ))}
              </div>
            )}

            {/* Pool chips */}
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              {poolLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                </div>
              ) : (
                <div className="flex max-h-[42vh] flex-wrap content-start gap-1.5 overflow-y-auto">
                  {filteredPool.map((w) => {
                    const k = wordKey(w);
                    const on = selectedKeys.has(k);
                    const full = !on && selectedCount >= CODEMIX_MAX_WORDS;
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={full}
                        onClick={() => toggleWord(w)}
                        className={`rounded-full border px-2 py-1 text-left text-xs transition ${
                          on
                            ? 'border-violet-500 bg-violet-600 font-semibold text-white'
                            : full
                              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-violet-300 hover:bg-violet-50'
                        }`}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {on && <Check className="h-2.5 w-2.5" />}
                          <span className="font-semibold">{w.word}</span>
                        </span>
                        <span className={`ml-1 ${on ? 'text-violet-100' : 'text-slate-400'}`}>
                          {w.vi}
                        </span>
                      </button>
                    );
                  })}
                  {filteredPool.length === 0 && (
                    <p className="w-full py-6 text-center text-xs text-slate-400">
                      Không có từ «{BUCKET_META[bucket].label}» — thử nhóm khác
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canStart}
              onClick={startWrite}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-40"
            >
              {canStart
                ? `Viết với ${selectedCount} từ →`
                : `Chọn thêm ${Math.max(0, CODEMIX_MIN_WORDS - selectedCount)} từ`}
            </button>
          </section>
        )}

        {/* ═══════ PHASE WRITE ═══════ */}
        {phase === 'write' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-slate-500">
                Viết <strong className="text-slate-700">VI</strong> + chèn EN · ≥
                {minFoundForPass}/{selectedCount} từ
              </p>
              <button
                type="button"
                onClick={() => setPhase('pick')}
                className="text-[11px] font-semibold text-violet-600 hover:underline"
              >
                Đổi từ
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.map((w) => {
                const done = cmFound.has(normalize(w.word));
                return (
                  <button
                    key={wordKey(w)}
                    type="button"
                    onClick={() => !done && insertWord(w.word)}
                    disabled={done}
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${
                      done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 line-through opacity-70'
                        : 'border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-400'
                    }`}
                  >
                    <span className="font-semibold">{w.word}</span>
                    <span className="ml-1 opacity-60">{w.vi}</span>
                  </button>
                );
              })}
            </div>

            <textarea
              value={codemix}
              onChange={(e) => {
                setCodemix(e.target.value);
                setCmChecked(false);
              }}
              rows={5}
              placeholder="Hôm nay tôi … . Sau đó tôi … ."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold tabular-nums text-slate-500">
                {cmScore.found.length}/{selectedCount}
              </span>
              <button
                type="button"
                onClick={() => setCmChecked(true)}
                disabled={!codemix.trim()}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-40"
              >
                Kiểm tra
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodemix('');
                  setCmChecked(false);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"
              >
                Xóa
              </button>
              {canGoUpgrade && (
                <button
                  type="button"
                  onClick={goUpgrade}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  AI EN →
                </button>
              )}
            </div>

            {cmChecked && (
              <div
                className={`rounded-xl border px-3 py-2 ${
                  cmScore.pct >= 60
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-amber-300 bg-amber-50'
                }`}
              >
                <p className="text-sm font-black">
                  {cmScore.found.length}/{selectedCount} · {cmScore.pct}%
                  {cmScore.missing.length > 0 && (
                    <span className="ml-2 text-xs font-semibold text-amber-900">
                      thiếu: {cmScore.missing.map((w) => w.word).join(', ')}
                    </span>
                  )}
                </p>
                {canGoUpgrade && (
                  <button
                    type="button"
                    onClick={goUpgrade}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI full EN + giải thích
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* ═══════ PHASE UPGRADE ═══════ */}
        {phase === 'upgrade' && (
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span className="font-bold text-slate-700">AI nâng · {selectedCount} từ</span>
              {isPaid ? (
                <span className="inline-flex items-center gap-0.5 text-amber-800">
                  <Crown className="h-3 w-3" /> Pro
                </span>
              ) : (
                <span>
                  Free {FREE_CODEMIX_UPGRADE_DAILY_LIMIT}/ngày
                  {quota?.remaining != null && (
                    <span className="text-emerald-700"> · còn {quota.remaining}</span>
                  )}
                  {' · '}
                  <Link href="/upgrade" className="font-semibold text-violet-600 underline">
                    Pro
                  </Link>
                </span>
              )}
              <button
                type="button"
                onClick={() => setPhase('write')}
                className="ml-auto font-semibold text-violet-600 hover:underline"
              >
                ← Sửa
              </button>
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-2.5 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">Trước</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                {highlightTargets(
                  codemix,
                  selected.map((t) => t.word),
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => void runAiUpgrade(false)}
                disabled={upgradeLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {upgradeLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                {upgradeLoading ? 'Đang viết…' : upgrade ? 'Chạy lại' : 'Chạy AI'}
              </button>
              <button
                type="button"
                onClick={() => void runAiUpgrade(true)}
                disabled={upgradeLoading}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"
              >
                Offline
              </button>
              <button
                type="button"
                onClick={() => setPhase('pick')}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"
              >
                Lượt mới
              </button>
            </div>

            {upgradeError && (
              <div
                className={`rounded-lg border px-2.5 py-2 text-xs ${
                  quotaBlocked
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <p className={quotaBlocked ? 'font-semibold text-amber-950' : ''}>
                  {upgradeError}
                </p>
                {quotaBlocked && (
                  <Link
                    href="/upgrade"
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Nâng Pro
                  </Link>
                )}
              </div>
            )}

            {upgradeLoading && !upgrade && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-violet-100 bg-white py-8">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                <p className="text-xs text-slate-500">Đang nâng {selectedCount} từ…</p>
              </div>
            )}

            {upgrade && (
              <div className="space-y-2.5">
                <div className="rounded-xl border border-emerald-300 bg-white p-3 shadow-sm">
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                      Full EN
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {upgrade.level}
                    </span>
                    {upgradeOffline && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        offline
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold leading-relaxed">
                    {renderAiEnglish(upgrade.english)}
                  </p>
                  {upgrade.meaning_vi && (
                    <p className="mt-2 border-t border-slate-100 pt-2 text-xs italic text-slate-500">
                      ↔ {upgrade.meaning_vi}
                    </p>
                  )}
                  {upgrade.wow_note_vi && (
                    <div className="mt-2 flex gap-1.5 rounded-lg bg-violet-50 px-2 py-1.5 text-xs text-violet-900">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>{upgrade.wow_note_vi}</span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Từ · cách dùng
                </p>
                <div className="space-y-1.5">
                  {upgrade.words.map((w) => {
                    const open = openCard === w.word;
                    return (
                      <button
                        key={w.word}
                        type="button"
                        onClick={() => setOpenCard(open ? null : w.word)}
                        className={`w-full rounded-xl border p-2.5 text-left transition ${
                          open
                            ? 'border-violet-300 bg-violet-50/80'
                            : 'border-slate-200 bg-white hover:border-violet-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-violet-800">{w.word}</span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900">
                            {w.pattern || '…'}
                          </span>
                        </div>
                        {w.in_sentence && (
                          <p className="mt-1 text-xs font-medium text-slate-700">
                            “{w.in_sentence.replace(/\*\*/g, '')}”
                          </p>
                        )}
                        {open && (
                          <div className="mt-2 space-y-1 border-t border-violet-100 pt-2 text-xs">
                            <p>
                              <span className="font-bold text-emerald-700">Vì sao · </span>
                              {w.why_vi}
                            </p>
                            <p>
                              <span className="font-bold text-amber-700">Tip · </span>
                              {w.tip_vi}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );

  return (
    <StudentShell title="Sử dụng từ / Đặt câu" contentClassName="p-0" hideMobileNav>
      {body}
    </StudentShell>
  );
}
