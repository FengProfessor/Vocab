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
          // Không auto-chọn — user tự chọn (hoặc Rnd 5/10)
          setSelectedKeys(new Set());
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
        setSelectedKeys(new Set());
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

  const switchBucket = useCallback((b: MemoryBucket) => {
    setBucket(b);
    setQuery('');
    // Giữ selection xuyên bucket (từ đã chọn vẫn hiện chip); không auto-fill nhóm mới
  }, []);

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
            words: selected.map((t) => ({
              word: t.word,
              translation: t.vi,
              pos: t.pos,
            })),
            // A2 base; backend/prompt được phép nâng B1 nếu từ khó (academic…)
            level: 'A2',
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
        // Không auto-mở card — tránh ngợp; HS tự bấm từ muốn xem
        setOpenCard(null);
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

  /** Luyện ngay: lấy 5 từ (ưu tiên nhóm đang mở / yếu) rồi vào viết */
  const startEasy = useCallback(() => {
    const order: MemoryBucket[] = [bucket, 'weak', 'learning', 'solid'];
    let source: DrillWord[] = [];
    for (const b of order) {
      const list = pool.filter((w) => (w.bucket ?? 'weak') === b);
      if (list.length >= CODEMIX_MIN_WORDS) {
        source = list;
        setBucket(b);
        break;
      }
    }
    if (source.length < CODEMIX_MIN_WORDS) source = pool;
    const take = Math.min(5, CODEMIX_MAX_WORDS, source.length);
    if (take < CODEMIX_MIN_WORDS) return;
    const picked = shuffle(source).slice(0, take);
    setSelectedKeys(new Set(picked.map(wordKey)));
    setQuery('');
    setPhase('write');
    setCodemix('');
    setCmChecked(false);
    setUpgrade(null);
    setUpgradeError(null);
    setQuotaBlocked(false);
  }, [bucket, pool]);

  const body = (
    <div className="min-h-full bg-gradient-to-b from-violet-50/80 via-white to-white text-slate-900">
      <div className="mx-auto max-w-lg space-y-3 px-3 py-3 pb-24 sm:px-4">
        {/* Header tối giản */}
        <div className="flex items-center gap-2">
          {!embed && (
            <Link
              href="/practice"
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
            >
              ←
            </Link>
          )}
          <h1 className="text-base font-black tracking-tight">Đặt câu</h1>
          {!planLoading && !isPaid && (
            <span className="ml-auto text-[10px] font-semibold text-slate-400">
              Free {FREE_CODEMIX_UPGRADE_DAILY_LIMIT}/ngày
              {quota?.remaining != null ? ` · còn ${quota.remaining}` : ''}
            </span>
          )}
        </div>

        {/* 3 bước — chữ thường, ít kỹ thuật */}
        <div className="flex gap-1 text-[11px] font-bold">
          {(
            [
              { id: 'pick' as const, label: 'Chọn từ' },
              { id: 'write' as const, label: 'Viết câu' },
              { id: 'upgrade' as const, label: 'Xem EN' },
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
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ═══════ PHASE PICK ═══════ */}
        {phase === 'pick' && (
          <section className="space-y-3">
            {/* Đường dễ: 1 nút lớn */}
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-3 shadow-sm">
              <p className="text-sm font-black text-violet-950">Bắt đầu nhanh</p>
              <p className="mt-0.5 text-[11px] leading-snug text-violet-800/80">
                App chọn giúp 5 từ (ưu tiên nhóm Yếu) → bạn chỉ việc viết câu.
              </p>
              <button
                type="button"
                disabled={poolLoading || pool.length < CODEMIX_MIN_WORDS}
                onClick={startEasy}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                Luyện ngay · 5 từ
              </button>
            </div>

            <details className="group rounded-xl border border-slate-200 bg-white open:shadow-sm">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-bold text-slate-600 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex w-full items-center justify-between">
                  Tự chọn từ
                  <span className="text-[10px] font-semibold text-slate-400 group-open:hidden">
                    mở
                  </span>
                  <span className="hidden text-[10px] font-semibold text-slate-400 group-open:inline">
                    đóng
                  </span>
                </span>
              </summary>
              <div className="space-y-2 border-t border-slate-100 px-2.5 pb-2.5 pt-2">
                <div className="grid grid-cols-3 gap-1">
                  {(['weak', 'learning', 'solid'] as MemoryBucket[]).map((b) => {
                    const on = bucket === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => switchBucket(b)}
                        className={`rounded-lg border px-1 py-1.5 text-center text-[11px] font-bold ${
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
                  <span className="text-[11px] font-bold tabular-nums text-slate-500">
                    {selectedCount} đã chọn
                  </span>
                  <button
                    type="button"
                    onClick={() => pickRandom(5)}
                    disabled={countsByBucket[bucket] < CODEMIX_MIN_WORDS}
                    className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
                  >
                    Ngẫu nhiên 5
                  </button>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-[11px] text-slate-400"
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
                      className="w-full rounded-lg border border-slate-200 py-1 pl-6 pr-2 text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex max-h-[32vh] flex-wrap content-start gap-1.5 overflow-y-auto rounded-lg bg-slate-50/80 p-1.5">
                  {poolLoading ? (
                    <p className="w-full py-6 text-center text-xs text-slate-400">Đang tải…</p>
                  ) : filteredPool.length === 0 ? (
                    <p className="w-full py-6 text-center text-xs text-slate-400">
                      Không có từ — thử nhóm khác
                    </p>
                  ) : (
                    filteredPool.map((w) => {
                      const k = wordKey(w);
                      const on = selectedKeys.has(k);
                      const full = !on && selectedCount >= CODEMIX_MAX_WORDS;
                      return (
                        <button
                          key={k}
                          type="button"
                          disabled={full}
                          onClick={() => toggleWord(w)}
                          className={`rounded-full border px-2 py-1 text-xs ${
                            on
                              ? 'border-violet-500 bg-violet-600 font-semibold text-white'
                              : full
                                ? 'opacity-30'
                                : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          {on && <Check className="mr-0.5 inline h-2.5 w-2.5" />}
                          <span className="font-semibold">{w.word}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canStart}
                  onClick={startWrite}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {canStart ? `Viết với ${selectedCount} từ →` : 'Chạm từ để chọn'}
                </button>
              </div>
            </details>
          </section>
        )}

        {/* ═══════ PHASE WRITE ═══════ */}
        {phase === 'write' && (
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Viết câu của bạn</p>
                <p className="text-[11px] text-slate-500">
                  Tiếng Việt + chạm từ để chèn · cần khoảng {minFoundForPass}/{selectedCount} từ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhase('pick')}
                className="shrink-0 text-[11px] font-semibold text-violet-600"
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
                    className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
                      done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 line-through opacity-60'
                        : 'border-violet-300 bg-violet-50 text-violet-900 active:scale-95'
                    }`}
                  >
                    {w.word}
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
              rows={4}
              placeholder="Ví dụ: Hôm nay tôi wake up lúc 6 giờ rồi eat bánh mì…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />

            <p className="text-center text-[11px] font-semibold tabular-nums text-slate-500">
              Đã dùng {cmScore.found.length}/{selectedCount} từ
              {cmScore.missing.length > 0 && cmScore.found.length > 0 && (
                <span className="font-normal text-slate-400">
                  {' '}
                  · còn: {cmScore.missing.map((w) => w.word).join(', ')}
                </span>
              )}
            </p>

            <button
              type="button"
              disabled={!canGoUpgrade}
              onClick={goUpgrade}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-40"
            >
              <Wand2 className="h-4 w-4" />
              {canGoUpgrade
                ? 'Xem bản tiếng Anh'
                : `Chèn thêm ${Math.max(0, minFoundForPass - cmScore.found.length)} từ`}
            </button>
          </section>
        )}

        {/* ═══════ PHASE UPGRADE ═══════ */}
        {phase === 'upgrade' && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">Bản tiếng Anh</p>
              <button
                type="button"
                onClick={() => setPhase('write')}
                className="ml-auto text-[11px] font-semibold text-violet-600"
              >
                ← Sửa câu
              </button>
            </div>

            {upgradeError && (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${
                  quotaBlocked
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <p className="font-semibold">{upgradeError}</p>
                {quotaBlocked && (
                  <Link
                    href="/upgrade"
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white"
                  >
                    <Crown className="h-3.5 w-3.5" /> Nâng Pro
                  </Link>
                )}
              </div>
            )}

            {upgradeLoading && !upgrade && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-violet-100 bg-white py-10">
                <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
                <p className="text-xs text-slate-500">Đang viết bản tiếng Anh…</p>
              </div>
            )}

            {upgrade && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-sm">
                  <p className="text-[15px] font-semibold leading-relaxed text-slate-900">
                    {renderAiEnglish(upgrade.english)}
                  </p>
                  {upgrade.meaning_vi && (
                    <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-500">
                      {upgrade.meaning_vi}
                    </p>
                  )}
                  {upgrade.wow_note_vi && (
                    <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-2 text-xs leading-snug text-violet-900">
                      💡 {upgrade.wow_note_vi}
                    </p>
                  )}
                </div>

                {upgrade.words.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold text-slate-400">
                      Bấm từ để xem cách dùng
                    </p>
                    <div className="space-y-1.5">
                      {upgrade.words.map((w) => {
                        const open = openCard === w.word;
                        return (
                          <button
                            key={w.word}
                            type="button"
                            onClick={() => setOpenCard(open ? null : w.word)}
                            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                              open
                                ? 'border-violet-300 bg-violet-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-black text-violet-800">
                                {w.word}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {open ? 'đóng' : 'mở'}
                              </span>
                            </div>
                            {open && (
                              <div className="mt-2 space-y-1.5 border-t border-violet-100 pt-2 text-xs leading-relaxed text-slate-700">
                                {w.pattern && (
                                  <p className="font-mono text-[11px] font-semibold text-amber-800">
                                    {w.pattern}
                                  </p>
                                )}
                                {w.in_sentence && (
                                  <p className="text-slate-600">
                                    “{w.in_sentence.replace(/\*\*/g, '')}”
                                  </p>
                                )}
                                {w.why_vi && <p>{w.why_vi}</p>}
                                {w.tip_vi && (
                                  <p className="text-amber-900/90">Tip: {w.tip_vi}</p>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void runAiUpgrade(false)}
                    disabled={upgradeLoading}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50"
                  >
                    {upgradeLoading ? '…' : 'Viết lại EN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('pick')}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white"
                  >
                    Lượt mới
                  </button>
                </div>
              </div>
            )}

            {!upgrade && !upgradeLoading && !upgradeError && (
              <button
                type="button"
                onClick={() => void runAiUpgrade(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white"
              >
                <Wand2 className="h-4 w-4" /> Xem bản tiếng Anh
              </button>
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
