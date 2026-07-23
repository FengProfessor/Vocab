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

interface DrillWord {
  id?: string;
  word: string;
  vi: string;
  pos?: string;
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
  { word: 'wake up', vi: 'thức dậy', pos: 'v' },
  { word: 'eat', vi: 'ăn', pos: 'v' },
  { word: 'go', vi: 'đi', pos: 'v' },
  { word: 'study', vi: 'học', pos: 'v' },
  { word: 'sleep', vi: 'ngủ', pos: 'v' },
  { word: 'buy', vi: 'mua', pos: 'v' },
  { word: 'drink', vi: 'uống', pos: 'v' },
  { word: 'meet', vi: 'gặp', pos: 'v' },
  { word: 'like', vi: 'thích', pos: 'v' },
  { word: 'need', vi: 'cần', pos: 'v' },
  { word: 'want', vi: 'muốn', pos: 'v' },
  { word: 'have', vi: 'có', pos: 'v' },
  { word: 'make', vi: 'làm / tạo', pos: 'v' },
  { word: 'take', vi: 'lấy / mất (thời gian)', pos: 'v' },
  { word: 'read', vi: 'đọc', pos: 'v' },
  { word: 'write', vi: 'viết', pos: 'v' },
  { word: 'play', vi: 'chơi', pos: 'v' },
  { word: 'help', vi: 'giúp', pos: 'v' },
  { word: 'finish', vi: 'hoàn thành', pos: 'v' },
  { word: 'start', vi: 'bắt đầu', pos: 'v' },
  { word: 'happy', vi: 'vui vẻ', pos: 'adj' },
  { word: 'tired', vi: 'mệt', pos: 'adj' },
  { word: 'school', vi: 'trường học', pos: 'n' },
  { word: 'friend', vi: 'bạn bè', pos: 'n' },
  { word: 'homework', vi: 'bài tập về nhà', pos: 'n' },
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

  // Load từ thật của user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolLoading(true);
      try {
        // API cap limit ≤ 50/page
        const res = await authFetch('/api/words?limit=50');
        const json = (await res.json()) as {
          success?: boolean;
          data?: Array<{
            id?: string;
            word?: string;
            translation?: string;
            pos?: string;
          }>;
        };
        if (cancelled) return;
        if (json.success && Array.isArray(json.data) && json.data.length >= CODEMIX_MIN_WORDS) {
          const mapped: DrillWord[] = [];
          const seen = new Set<string>();
          for (const w of json.data) {
            const word = (w.word || '').trim();
            if (!word || word.length > 40) continue;
            const key = normalize(word);
            if (seen.has(key)) continue;
            seen.add(key);
            const vi = (w.translation || '').trim();
            if (!vi || vi.includes('failed') || vi.includes('Analyzing')) continue;
            mapped.push({
              id: w.id,
              word,
              vi,
              pos: w.pos,
            });
            if (mapped.length >= 120) break;
          }
          if (mapped.length >= CODEMIX_MIN_WORDS) {
            setPool(mapped);
            setPoolSource('mine');
            // preselect first 5
            // Preselect tối đa 5 (gợi ý A1); min chọn = 1
            setSelectedKeys(new Set(mapped.slice(0, Math.min(5, mapped.length)).map(wordKey)));
            setPoolLoading(false);
            return;
          }
        }
      } catch {
        /* fallback demo */
      }
      if (!cancelled) {
        setPool(DEMO_POOL);
        setPoolSource('demo');
        setSelectedKeys(new Set(DEMO_POOL.slice(0, 5).map(wordKey)));
        setPoolLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!q) return pool;
    return pool.filter(
      (w) =>
        normalize(w.word).includes(q) ||
        normalize(w.vi).includes(q) ||
        (w.pos && normalize(w.pos).includes(q))
    );
  }, [pool, query]);

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

  const pickRandom = useCallback(
    (n: number) => {
      const take = Math.min(n, CODEMIX_MAX_WORDS, pool.length);
      const picked = shuffle(pool).slice(0, Math.max(CODEMIX_MIN_WORDS, take));
      setSelectedKeys(new Set(picked.map(wordKey)));
    },
    [pool]
  );

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

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
    <div className="min-h-full bg-gradient-to-b from-violet-50 via-white to-amber-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
              LingoPro · Practice
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Sử dụng từ / Đặt câu
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Chọn {CODEMIX_MIN_WORDS}–{CODEMIX_MAX_WORDS} từ / lượt
              {!planLoading && (
                <span
                  className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isPaid
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {isPaid ? (
                    <>
                      <Crown className="h-3 w-3" /> {plan} · AI ∞
                    </>
                  ) : (
                    <>
                      Free · {FREE_CODEMIX_UPGRADE_DAILY_LIMIT}/ngày
                      {quota?.remaining != null ? ` · còn ${quota.remaining}` : ''}
                    </>
                  )}
                </span>
              )}
            </p>
          </div>
          {!embed && (
            <Link
              href="/practice"
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              ← Dashboard
            </Link>
          )}
        </div>

        {/* Stepper */}
        <div className="mb-5 flex items-center gap-1.5 text-[11px] font-bold sm:gap-2 sm:text-xs">
          {(
            [
              { id: 'pick' as const, label: '1. Chọn từ' },
              { id: 'write' as const, label: '2. Đặt câu' },
              { id: 'upgrade' as const, label: '3. AI EN' },
            ] as const
          ).map((s, i) => {
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
                className={`flex-1 rounded-xl px-2 py-2 ring-1 transition ${
                  active
                    ? 'bg-violet-600 text-white ring-violet-600'
                    : done
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                      : 'bg-white text-slate-500 ring-slate-200'
                }`}
              >
                {s.label}
                {i < 2 && <span className="sr-only"> →</span>}
              </button>
            );
          })}
        </div>

        {/* ═══════ PHASE PICK ═══════ */}
        {phase === 'pick' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
              <p className="text-sm font-semibold text-violet-900">
                Chọn bulk <span className="text-violet-600">{CODEMIX_MIN_WORDS}–{CODEMIX_MAX_WORDS}</span>{' '}
                từ cho 1 lượt
              </p>
              <p className="mt-1 text-xs text-violet-800/70">
                Nguồn:{' '}
                {poolSource === 'mine' ? (
                  <span className="font-bold text-emerald-700">từ của bạn</span>
                ) : (
                  <span className="font-bold">pack demo</span>
                )}{' '}
                · {pool.length} từ · gợi ý A1: 5–8 · tối thiểu 1
              </p>
            </div>

            {/* Counter + actions */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-black ${
                  canStart
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {selectedCount}/{CODEMIX_MAX_WORDS}
                <span className="ml-1 font-semibold opacity-70">
                  (min {CODEMIX_MIN_WORDS})
                </span>
              </span>
              <button
                type="button"
                onClick={() => pickRandom(5)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Random 5
              </button>
              <button
                type="button"
                onClick={() => pickRandom(10)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Random 10
              </button>
              <button
                type="button"
                onClick={() => pickRandom(CODEMIX_MAX_WORDS)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Random 20
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500"
              >
                Xóa chọn
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm từ / nghĩa…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {/* Selected strip */}
            {selectedCount > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Đã chọn ({selectedCount})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((w) => (
                    <button
                      key={wordKey(w)}
                      type="button"
                      onClick={() => toggleWord(w)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      {w.word}
                      <X className="h-3 w-3 opacity-80" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pool */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {poolLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải từ…
                </div>
              ) : (
                <div className="flex max-h-[50vh] flex-wrap content-start gap-2 overflow-y-auto p-1">
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
                        className={`rounded-full border px-3 py-1.5 text-left text-sm transition ${
                          on
                            ? 'border-violet-500 bg-violet-600 font-semibold text-white shadow'
                            : full
                              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-violet-300 hover:bg-violet-50'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {on && <Check className="h-3 w-3" />}
                          <span className="font-semibold">{w.word}</span>
                        </span>
                        <span className={`ml-1.5 text-xs ${on ? 'text-violet-100' : 'text-slate-400'}`}>
                          {w.vi}
                        </span>
                      </button>
                    );
                  })}
                  {filteredPool.length === 0 && (
                    <p className="w-full py-8 text-center text-sm text-slate-400">
                      Không thấy từ khớp
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canStart}
              onClick={startWrite}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-40"
            >
              {canStart
                ? `Bắt đầu viết · ${selectedCount} từ →`
                : `Chọn thêm ${Math.max(0, CODEMIX_MIN_WORDS - selectedCount)} từ`}
            </button>
          </section>
        )}

        {/* ═══════ PHASE WRITE ═══════ */}
        {phase === 'write' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Viết đoạn <span className="underline">tiếng Việt</span>, chèn đủ{' '}
                <span className="text-violet-700">{selectedCount} từ EN</span> đã chọn.
              </p>
              <p className="mt-1 text-xs text-amber-800/80">
                Tap chip để chèn · cần ≥ {minFoundForPass}/{selectedCount} từ để mở AI
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Từ mục tiêu ({cmScore.found.length}/{selectedCount})
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('pick')}
                  className="text-xs font-medium text-violet-600 hover:underline"
                >
                  Đổi bộ từ
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.map((w) => {
                  const done = cmFound.has(normalize(w.word));
                  return (
                    <button
                      key={wordKey(w)}
                      type="button"
                      onClick={() => !done && insertWord(w.word)}
                      disabled={done}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                        done
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 line-through opacity-70'
                          : 'border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-400'
                      }`}
                    >
                      <span className="font-semibold">{w.word}</span>
                      <span className="ml-1 text-xs opacity-60">{w.vi}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <textarea
                value={codemix}
                onChange={(e) => {
                  setCodemix(e.target.value);
                  setCmChecked(false);
                }}
                rows={6}
                placeholder="Hôm nay tôi … . Sau đó tôi … ."
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base leading-relaxed outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
              {codemix.trim() && (
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                  <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">Preview</p>
                  {highlightTargets(
                    codemix,
                    selected.map((t) => t.word)
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCmChecked(true)}
                disabled={!codemix.trim()}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-40"
              >
                Kiểm tra
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodemix('');
                  setCmChecked(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                Xóa
              </button>
              {canGoUpgrade && (
                <button
                  type="button"
                  onClick={goUpgrade}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700"
                >
                  <Wand2 className="h-4 w-4" />
                  AI nâng cấp EN →
                </button>
              )}
            </div>

            {cmChecked && (
              <div
                className={`rounded-2xl border p-4 ${
                  cmScore.pct >= 60
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-amber-300 bg-amber-50'
                }`}
              >
                <p className="text-lg font-black">
                  {cmScore.found.length}/{selectedCount} từ · {cmScore.pct}%
                </p>
                {cmScore.missing.length > 0 && (
                  <p className="mt-1 text-sm text-amber-900">
                    ✗ Thiếu: {cmScore.missing.map((w) => w.word).join(', ')}
                  </p>
                )}
                {canGoUpgrade && (
                  <button
                    type="button"
                    onClick={goUpgrade}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 py-3 text-sm font-bold text-white shadow-md"
                  >
                    <Sparkles className="h-4 w-4" />
                    Wow · AI full EN + giải thích ({selectedCount} từ)
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* ═══════ PHASE UPGRADE ═══════ */}
        {phase === 'upgrade' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-violet-900">
                <Sparkles className="h-4 w-4 text-violet-600" />
                AI nâng đoạn · {selectedCount} target
              </p>
              <p className="mt-2 text-[11px] font-semibold text-violet-700/90">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-amber-800">
                    <Crown className="h-3 w-3" /> Pro · ∞ lượt
                  </span>
                ) : (
                  <>
                    Free: {FREE_CODEMIX_UPGRADE_DAILY_LIMIT}/ngày
                    {quota?.remaining != null && (
                      <span className="ml-1 text-emerald-700">· còn {quota.remaining}</span>
                    )}
                    {' · '}
                    <Link href="/upgrade" className="underline">
                      Pro = ∞
                    </Link>
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4">
              <div className="mb-1 flex justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-400">Trước · đoạn của bạn</p>
                <button
                  type="button"
                  onClick={() => setPhase('write')}
                  className="text-xs font-medium text-violet-600 hover:underline"
                >
                  ← Sửa đoạn
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {highlightTargets(
                  codemix,
                  selected.map((t) => t.word)
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void runAiUpgrade(false)}
                disabled={upgradeLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-60"
              >
                {upgradeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {upgradeLoading ? 'AI đang viết…' : upgrade ? 'Chạy lại AI' : 'Chạy AI'}
              </button>
              <button
                type="button"
                onClick={() => void runAiUpgrade(true)}
                disabled={upgradeLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                Mẫu offline (0 lượt)
              </button>
              <button
                type="button"
                onClick={() => setPhase('pick')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                Lượt mới
              </button>
            </div>

            {upgradeError && (
              <div
                className={`rounded-xl border px-3 py-3 text-sm ${
                  quotaBlocked
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-violet-50'
                    : 'border-amber-200 bg-amber-50 text-xs text-amber-900'
                }`}
              >
                <p className={quotaBlocked ? 'font-semibold text-amber-950' : ''}>
                  {upgradeError}
                </p>
                {quotaBlocked && (
                  <Link
                    href="/upgrade"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white shadow"
                  >
                    <Crown className="h-4 w-4" />
                    Nâng Pro · AI không giới hạn
                  </Link>
                )}
              </div>
            )}

            {upgradeLoading && !upgrade && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-violet-100 bg-white py-12 shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm font-medium text-slate-500">
                  Đang nâng {selectedCount} từ sang English…
                </p>
              </div>
            )}

            {upgrade && (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-emerald-300 bg-white p-5 shadow-md ring-2 ring-emerald-100">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white">
                      Full EN
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {upgrade.level}
                    </span>
                    {upgradeOffline && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        offline
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-semibold leading-relaxed sm:text-xl">
                    {renderAiEnglish(upgrade.english)}
                  </p>
                  {upgrade.meaning_vi && (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-sm italic text-slate-500">
                      ↔ {upgrade.meaning_vi}
                    </p>
                  )}
                  {upgrade.wow_note_vi && (
                    <div className="mt-3 flex gap-2 rounded-xl bg-gradient-to-r from-violet-50 to-amber-50 px-3 py-2.5 text-sm text-violet-900">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{upgrade.wow_note_vi}</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Từ này dùng như vậy
                  </p>
                  <div className="space-y-2">
                    {upgrade.words.map((w) => {
                      const open = openCard === w.word;
                      return (
                        <button
                          key={w.word}
                          type="button"
                          onClick={() => setOpenCard(open ? null : w.word)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            open
                              ? 'border-violet-300 bg-violet-50/80 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-black text-violet-800">{w.word}</span>
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-900">
                              {w.pattern || '…'}
                            </span>
                          </div>
                          {w.in_sentence && (
                            <p className="mt-1.5 text-sm font-medium text-slate-700">
                              “{w.in_sentence.replace(/\*\*/g, '')}”
                            </p>
                          )}
                          {open && (
                            <div className="mt-3 space-y-2 border-t border-violet-100 pt-3 text-sm">
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
              </div>
            )}
          </section>
        )}

        <p className="mt-10 text-center text-[11px] text-slate-400">
          /practice/codemix · {CODEMIX_MIN_WORDS}–{CODEMIX_MAX_WORDS} từ/lượt · Free{' '}
          {FREE_CODEMIX_UPGRADE_DAILY_LIMIT} AI/ngày
        </p>
      </div>
    </div>
  );

  return (
    <StudentShell title="Sử dụng từ / Đặt câu" contentClassName="p-0" hideMobileNav>
      {body}
    </StudentShell>
  );
}
