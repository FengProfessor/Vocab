'use client';

/**
 * Quiz từ vựng từ kho đã học:
 * 1) meaning — EN → chọn nghĩa VI
 * 2) cloze — điền chỗ trống từ example sẵn (không gen câu)
 * 3) mix — xen kẽ cloze khi có example, còn lại meaning
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, ChevronLeft, Loader2, RotateCcw, Volume2, X } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/auth-fetch';
import { parseIpa, speak, stopSpeak } from '@/lib/study';

const CORRECT_LS_KEY = 'verb-drill-correct-v1';
const MIN_LEARNED = 4;
const MAX_POOL = 200;

type QuizMode = 'meaning' | 'cloze' | 'mix';
type QType = 'meaning' | 'cloze';
type Phase = 'setup' | 'quiz' | 'done';

interface WordEntry {
  id?: string;
  lemma: string;
  vi: string;
  pos: string;
  ipa: string;
  example: string;
  exampleVi: string;
  reviewCount: number;
}

interface QuizQ {
  type: QType;
  lemma: string;
  /** Đáp án cần chọn (VI cho meaning, EN lemma surface cho cloze) */
  answer: string;
  pos: string;
  ipa: string;
  opts: string[];
  /** Câu example đã blank (cloze) */
  stem?: string;
  /** Surface form bị blank trong câu (có thể khác lemma: walks) */
  blankSurface?: string;
  exampleVi?: string;
}

type CorrectMap = Record<string, number>;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadCorrectMap(): CorrectMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CORRECT_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: CorrectMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (k && Number.isFinite(n) && n > 0) out[k.toLowerCase()] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function saveCorrectMap(map: CorrectMap): void {
  try {
    localStorage.setItem(CORRECT_LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function tierLabel(n: number): string {
  if (n <= 0) return '0';
  if (n === 1) return '1';
  if (n === 2) return '2';
  if (n === 3) return '3';
  return '>3';
}

function tierBadgeClass(n: number): string {
  if (n <= 0) return 'bg-slate-100 text-slate-500';
  if (n === 1) return 'bg-amber-100 text-amber-800';
  if (n === 2) return 'bg-sky-100 text-sky-800';
  if (n === 3) return 'bg-violet-100 text-violet-800';
  return 'bg-emerald-100 text-emerald-800';
}

function posLabel(pos: string): { short: string; vi: string } {
  const p = String(pos || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  const map: Record<string, { short: string; vi: string }> = {
    v: { short: 'v.', vi: 'động từ' },
    verb: { short: 'v.', vi: 'động từ' },
    n: { short: 'n.', vi: 'danh từ' },
    noun: { short: 'n.', vi: 'danh từ' },
    adj: { short: 'adj.', vi: 'tính từ' },
    adjective: { short: 'adj.', vi: 'tính từ' },
    adv: { short: 'adv.', vi: 'trạng từ' },
    adverb: { short: 'adv.', vi: 'trạng từ' },
    prep: { short: 'prep.', vi: 'giới từ' },
    conj: { short: 'conj.', vi: 'liên từ' },
    pron: { short: 'pron.', vi: 'đại từ' },
    interj: { short: 'interj.', vi: 'thán từ' },
    num: { short: 'num.', vi: 'số từ' },
    phrase: { short: 'phr.', vi: 'cụm từ' },
  };
  if (map[p]) return map[p];
  if (!p) return { short: '?', vi: 'chưa rõ loại' };
  return { short: `${p}.`, vi: p };
}

function isBadTranslation(vi: string): boolean {
  return (
    !vi ||
    vi.length < 1 ||
    vi.includes('failed') ||
    vi.includes('Analyzing') ||
    vi.includes('⏳')
  );
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Blank lemma (hoặc surface gần lemma) trong example.
 * Trả null nếu không tìm thấy — không bịa câu.
 */
function blankInExample(
  example: string,
  lemma: string,
): { stem: string; surface: string } | null {
  const ex = example.trim().replace(/\s+/g, ' ');
  const L = lemma.trim();
  if (!ex || !L || ex.length < 4) return null;

  const phrase = escapeRe(L).replace(/\s+/g, '\\s+');
  // 1) cả cụm / lemma nguyên (word-ish boundary)
  const tries: RegExp[] = [
    new RegExp(`(?<![\\w'])(${phrase})(?![\\w'])`, 'i'),
    new RegExp(`(${phrase})`, 'i'),
  ];

  // 2) dạng đơn giản: lemma + s / ed / ing (động từ thường)
  if (!/\s/.test(L) && L.length >= 2) {
    const base = escapeRe(L);
    tries.push(
      new RegExp(`(?<![\\w'])(${base}(?:s|es|ed|ing|er|est)?)(?![\\w'])`, 'i'),
    );
    // y → ies
    if (L.endsWith('y') && L.length > 2) {
      const stem = escapeRe(L.slice(0, -1));
      tries.push(new RegExp(`(?<![\\w'])(${stem}ies)(?![\\w'])`, 'i'));
    }
  }

  for (const re of tries) {
    const m = ex.match(re);
    if (!m || m.index === undefined || !m[1]) continue;
    const surface = m[1];
    // tránh blank quá dài / cả câu
    if (surface.length > Math.max(L.length + 6, 24)) continue;
    const stem =
      ex.slice(0, m.index) + '______' + ex.slice(m.index + surface.length);
    // blank phải còn chữ 2 bên (hoặc 1 bên nếu đầu/cuối)
    if (stem.replace(/_/g, '').trim().length < 2) continue;
    return { stem, surface };
  }
  return null;
}

function buildOpts(answer: string, pool: string[]): string[] {
  const wrong: string[] = [];
  const seen = new Set<string>([answer.toLowerCase()]);
  for (const v of shuffle(pool)) {
    const key = v.toLowerCase();
    if (seen.has(key) || !v || v === answer) continue;
    seen.add(key);
    wrong.push(v);
    if (wrong.length >= 3) break;
  }
  let i = 0;
  while (wrong.length < 3) {
    wrong.push(`(khác ${++i})`);
  }
  return shuffle([answer, ...wrong]);
}

export default function VerbDrillPage() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<QuizMode>('mix');
  const [wordCount, setWordCount] = useState(15);
  const [queue, setQueue] = useState<QuizQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctN, setCorrectN] = useState(0);
  const [correctMap, setCorrectMap] = useState<CorrectMap>({});
  const [justHitTier, setJustHitTier] = useState<number | null>(null);

  useEffect(() => {
    setCorrectMap(loadCorrectMap());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const mapped: WordEntry[] = [];
        const seen = new Set<string>();
        let totalSaved = 0;

        for (let page = 0; page < 6; page++) {
          const offset = page * 50;
          const res = await authFetch(`/api/words?limit=50&offset=${offset}`);
          if (res.status === 401) {
            if (!cancelled) {
              setLoadErr('login');
              setWords([]);
              setSavedTotal(0);
            }
            return;
          }
          const json = (await res.json()) as {
            success?: boolean;
            total?: number;
            data?: Array<{
              id?: string;
              word?: string;
              translation?: string;
              pos?: string;
              ipa?: string;
              example?: string | null;
              example_vi?: string | null;
              reviewCount?: number;
              srs?: { review_count?: number } | null;
            }>;
            error?: string;
          };
          if (!json.success || !Array.isArray(json.data)) {
            throw new Error(json.error || 'Không tải được kho từ');
          }
          if (typeof json.total === 'number') totalSaved = json.total;

          for (const w of json.data) {
            const lemma = (w.word || '').trim();
            if (!lemma || lemma.length > 48) continue;
            const key = lemma.toLowerCase();
            if (seen.has(key)) continue;
            const vi = (w.translation || '').trim().replace(/\s+/g, ' ');
            if (isBadTranslation(vi)) continue;
            seen.add(key);
            totalSaved = Math.max(totalSaved, seen.size);
            const reviewCount = w.srs?.review_count ?? w.reviewCount ?? 0;
            if (reviewCount <= 0) continue;
            mapped.push({
              id: w.id,
              lemma,
              vi,
              pos: (w.pos || '').trim() || '',
              ipa: (w.ipa || '').trim(),
              example: (w.example || '').trim(),
              exampleVi: (w.example_vi || '').trim(),
              reviewCount,
            });
            if (mapped.length >= MAX_POOL) break;
          }
          if (json.data.length < 50 || mapped.length >= MAX_POOL) break;
        }

        if (cancelled) return;
        setWords(mapped);
        setSavedTotal(totalSaved || mapped.length);
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : 'Lỗi tải');
          setWords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Từ blank được example → cloze */
  const clozeReady = useMemo(() => {
    return words.filter((w) => blankInExample(w.example, w.lemma) != null);
  }, [words]);

  const clozeCount = clozeReady.length;
  const canMeaning = words.length >= MIN_LEARNED;
  const canCloze = clozeCount >= MIN_LEARNED;
  const canQuiz =
    mode === 'cloze' ? canCloze : mode === 'meaning' ? canMeaning : canMeaning;

  const allMeanings = useMemo(
    () => [...new Set(words.map((w) => w.vi))],
    [words],
  );
  const allLemmas = useMemo(
    () => [...new Set(words.map((w) => w.lemma))],
    [words],
  );

  const tierStats = useMemo(() => {
    const stats = { t0: 0, t1: 0, t2: 0, t3: 0, tOver: 0 };
    for (const w of words) {
      const n = correctMap[w.lemma.toLowerCase()] ?? 0;
      if (n <= 0) stats.t0 += 1;
      else if (n === 1) stats.t1 += 1;
      else if (n === 2) stats.t2 += 1;
      else if (n === 3) stats.t3 += 1;
      else stats.tOver += 1;
    }
    return stats;
  }, [words, correctMap]);

  const start = useCallback(() => {
    if (!canQuiz) return;

    let pool: WordEntry[] = [];
    if (mode === 'cloze') {
      pool = shuffle(clozeReady);
    } else if (mode === 'meaning') {
      pool = shuffle(words);
    } else {
      // mix: ưu tiên cloze-ready, bổ sung meaning-only
      pool = shuffle(words);
    }

    const n = Math.min(wordCount, pool.length);
    const pickedWords = pool.slice(0, n);

    const q: QuizQ[] = [];
    for (const w of pickedWords) {
      const blank = blankInExample(w.example, w.lemma);
      const wantCloze =
        mode === 'cloze' || (mode === 'mix' && blank != null && Math.random() < 0.55);

      if (wantCloze && blank) {
        // Đáp án = surface trong câu (walks) — opts = lemma/surface từ kho
        // Dùng surface làm answer; opts lấy lemma khác (display EN)
        const answer = blank.surface;
        // Nhiễu = lemma EN khác trong kho (không nhét lemma gốc khi surface khác — dễ oan)
        const distractorPool = allLemmas.filter(
          (L) =>
            L.toLowerCase() !== w.lemma.toLowerCase() &&
            L.toLowerCase() !== answer.toLowerCase(),
        );
        q.push({
          type: 'cloze',
          lemma: w.lemma,
          answer,
          pos: w.pos,
          ipa: w.ipa,
          stem: blank.stem,
          blankSurface: blank.surface,
          exampleVi: w.exampleVi || undefined,
          opts: buildOpts(answer, distractorPool),
        });
      } else {
        q.push({
          type: 'meaning',
          lemma: w.lemma,
          answer: w.vi,
          pos: w.pos,
          ipa: w.ipa,
          opts: buildOpts(w.vi, allMeanings),
        });
      }
    }

    if (!q.length) return;
    setQueue(shuffle(q));
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectN(0);
    setJustHitTier(null);
    setPhase('quiz');
  }, [canQuiz, mode, clozeReady, words, wordCount, allMeanings, allLemmas]);

  const current = queue[idx] ?? null;
  const currentKey = current?.lemma.toLowerCase() ?? '';
  const knownHits = currentKey ? correctMap[currentKey] ?? 0 : 0;
  const currentPos = current ? posLabel(current.pos) : null;
  const currentIpa = current?.ipa ? parseIpa(current.ipa) : '';

  useEffect(() => {
    return () => {
      stopSpeak();
    };
  }, [idx, phase]);

  const next = useCallback(() => {
    stopSpeak();
    setIdx((i) => {
      if (i + 1 >= queue.length) {
        setPhase('done');
        return i;
      }
      setPicked(null);
      setRevealed(false);
      setJustHitTier(null);
      return i + 1;
    });
  }, [queue.length]);

  const answersMatch = (pickedOpt: string, answer: string) =>
    pickedOpt.trim().toLowerCase() === answer.trim().toLowerCase();

  const onPick = (o: string) => {
    if (revealed || !current) return;
    setPicked(o);
    setRevealed(true);
    // Đúng = khớp surface blank (cloze) hoặc nghĩa VI (meaning)
    if (answersMatch(o, current.answer)) {
      setCorrectN((n) => n + 1);
      const key = current.lemma.toLowerCase();
      setCorrectMap((prev) => {
        const nextN = (prev[key] ?? 0) + 1;
        const nextMap = { ...prev, [key]: nextN };
        saveCorrectMap(nextMap);
        setJustHitTier(nextN);
        return nextMap;
      });
    } else {
      setJustHitTier(null);
    }
  };

  useEffect(() => {
    if (phase !== 'quiz' || !revealed) return;
    const t = window.setTimeout(() => {
      next();
    }, 1000);
    return () => window.clearTimeout(t);
  }, [phase, revealed, idx, next]);

  const pct = useMemo(() => {
    if (!queue.length || phase !== 'done') return 0;
    return Math.round((correctN / queue.length) * 100);
  }, [correctN, queue.length, phase]);

  const sessionTiers = useMemo(() => {
    if (phase !== 'done') return null;
    const buckets: { lemma: string; pos: string; n: number; type: QType }[] = [];
    for (const q of queue) {
      const n = correctMap[q.lemma.toLowerCase()] ?? 0;
      buckets.push({ lemma: q.lemma, pos: q.pos, n, type: q.type });
    }
    buckets.sort((a, b) => a.n - b.n || a.lemma.localeCompare(b.lemma));
    return buckets;
  }, [phase, queue, correctMap]);

  const poolSize =
    mode === 'cloze' ? clozeCount : words.length;
  const maxWords = poolSize;

  const modeMeta: Record<QuizMode, { title: string; desc: string }> = {
    meaning: {
      title: 'Chọn nghĩa',
      desc: 'EN → nghĩa VI',
    },
    cloze: {
      title: 'Điền chỗ trống',
      desc: 'Example sẵn → chọn từ EN',
    },
    mix: {
      title: 'Xen kẽ',
      desc: 'Cloze + nghĩa (ưu tiên có example)',
    },
  };

  return (
    <StudentShell title="Quiz từ vựng" contentClassName="p-0" hideMobileNav>
      <div className="mx-auto max-w-md space-y-3 px-3 py-3 pb-24">
        <div className="flex items-center gap-2">
          <Link
            href="/practice"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
          >
            <ChevronLeft className="inline h-3.5 w-3.5" />
          </Link>
          <h1 className="text-base font-black text-slate-900">Quiz từ vựng</h1>
        </div>

        {loading && (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading && loadErr === 'login' && (
          <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm font-bold text-amber-950">Đăng nhập để quiz kho từ của bạn</p>
            <p className="text-[12px] text-amber-800/80">
              Lưu từ → học flashcard → mới quiz được.
            </p>
            <Link
              href="/auth"
              className="flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
            >
              Đăng nhập
            </Link>
          </section>
        )}

        {!loading && loadErr && loadErr !== 'login' && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{loadErr}</p>
        )}

        {!loading && !loadErr && !canMeaning && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">Chưa đủ từ đã học</p>
            <p className="text-[12px] leading-relaxed text-slate-500">
              Quiz chỉ dùng từ trong <strong className="text-slate-700">kho của bạn</strong> sau khi
              đã lưu và học qua flashcard.
            </p>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-600">
              <p>
                · Đã lưu: <strong>{savedTotal}</strong>
              </p>
              <p>
                · Đã học: <strong>{words.length}</strong> / cần ≥ {MIN_LEARNED}
              </p>
              <p>
                · Có example (cloze): <strong>{clozeCount}</strong>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {savedTotal === 0 ? (
                <Link
                  href="/dictionary"
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
                >
                  Lưu từ mới
                </Link>
              ) : (
                <Link
                  href="/flashcard"
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
                >
                  Học flashcard
                </Link>
              )}
              <Link
                href="/library"
                className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem kho từ
              </Link>
            </div>
          </section>
        )}

        {!loading && !loadErr && canMeaning && phase === 'setup' && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-800">Quiz từ kho đã học</p>
            <p className="text-[12px] text-slate-500">
              {words.length} từ đã học · {clozeCount} có example (cloze) · không gen câu mới
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              {(['mix', 'cloze', 'meaning'] as QuizMode[]).map((m) => {
                const disabled = m === 'cloze' && !canCloze;
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMode(m)}
                    className={`rounded-xl border px-1.5 py-2 text-center transition ${
                      active
                        ? 'border-violet-500 bg-violet-50 text-violet-900'
                        : disabled
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                          : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
                    }`}
                  >
                    <p className="text-[11px] font-black leading-tight">{modeMeta[m].title}</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-tight opacity-80">
                      {m === 'cloze' && !canCloze
                        ? `cần ≥${MIN_LEARNED} example`
                        : modeMeta[m].desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500">
              {mode === 'cloze'
                ? 'Dùng example trong kho → blank từ → chọn A/B/C/D (EN).'
                : mode === 'mix'
                  ? 'Có example thì cloze; không có thì hỏi nghĩa VI.'
                  : 'EN + IPA → chọn nghĩa VI.'}{' '}
              Mỗi lần đúng: 1 · 2 · 3 · &gt;3
            </p>

            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className={`rounded-md px-2 py-0.5 ${tierBadgeClass(0)}`}>
                chưa: {tierStats.t0}
              </span>
              <span className={`rounded-md px-2 py-0.5 ${tierBadgeClass(1)}`}>1: {tierStats.t1}</span>
              <span className={`rounded-md px-2 py-0.5 ${tierBadgeClass(2)}`}>2: {tierStats.t2}</span>
              <span className={`rounded-md px-2 py-0.5 ${tierBadgeClass(3)}`}>3: {tierStats.t3}</span>
              <span className={`rounded-md px-2 py-0.5 ${tierBadgeClass(4)}`}>
                &gt;3: {tierStats.tOver}
              </span>
            </div>

            <label className="block text-[12px] font-semibold text-slate-600">
              Số câu mỗi lượt: {Math.min(wordCount, Math.max(maxWords, 1))}
              <input
                type="range"
                min={Math.min(MIN_LEARNED, Math.max(maxWords, 1))}
                max={Math.min(50, Math.max(maxWords, 1))}
                value={Math.min(wordCount, Math.max(maxWords, 1))}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="mt-2 w-full"
                disabled={maxWords < 1}
              />
            </label>

            {mode === 'cloze' && !canCloze ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                Cần ≥ {MIN_LEARNED} từ đã học có example chứa đúng từ đó. Hiện: {clozeCount}.
                Học thêm hoặc chọn «Chọn nghĩa» / «Xen kẽ».
              </p>
            ) : (
              <Button
                className="h-11 w-full rounded-xl bg-violet-600 text-sm font-bold hover:bg-violet-700"
                onClick={start}
                disabled={!canQuiz}
              >
                Bắt đầu · {modeMeta[mode].title}
              </Button>
            )}
          </section>
        )}

        {phase === 'quiz' && current && (
          <section className="space-y-3">
            <p className="text-center text-[12px] font-semibold text-slate-400">
              {idx + 1} / {queue.length}
              <span className="ml-2 text-emerald-600">· đúng {correctN}</span>
              <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                {current.type === 'cloze' ? 'CLOZE' : 'NGHĨA'}
              </span>
            </p>

            {current.type === 'cloze' ? (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/40 px-4 py-6 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700/80">
                  Điền vào chỗ trống
                </p>
                <p className="mt-3 text-lg font-bold leading-snug text-slate-900">
                  {current.stem}
                </p>
                {current.exampleVi && (
                  <p className="mt-2 text-[12px] font-medium italic text-slate-500">
                    {current.exampleVi}
                  </p>
                )}
                {currentPos && (
                  <p className="mt-2 text-[12px] font-semibold text-teal-800">
                    <span className="rounded-md bg-teal-100 px-2 py-0.5 font-black">
                      {currentPos.short}
                    </span>
                    <span className="ml-1.5 text-teal-700/80">{currentPos.vi}</span>
                  </p>
                )}
                {/* Sau khi trả lời: lộ lemma + IPA + nghe */}
                {revealed && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-sm font-black text-slate-800">{current.lemma}</span>
                    {currentIpa && (
                      <span className="font-mono text-xs text-slate-500">/{currentIpa}/</span>
                    )}
                    <button
                      type="button"
                      onClick={() => speak(current.lemma, 1.0)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-teal-200 bg-white text-teal-700"
                      aria-label="Nghe"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {/* Chỉ hiện từ lần 2 — lần 1 không cần chữ */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  {knownHits > 1 && !revealed && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${tierBadgeClass(knownHits)}`}
                    >
                      đã đúng {tierLabel(knownHits)} lần
                    </span>
                  )}
                  {revealed && justHitTier != null && justHitTier > 1 && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${tierBadgeClass(justHitTier)}`}
                    >
                      Đúng lần {tierLabel(justHitTier)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 py-7 text-center">
                <p className="text-3xl font-black tracking-tight text-slate-900">
                  {current.lemma}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  {currentIpa ? (
                    <p className="font-mono text-sm text-slate-500">/{currentIpa}/</p>
                  ) : (
                    <p className="text-[11px] text-slate-400">chưa có IPA</p>
                  )}
                  <button
                    type="button"
                    onClick={() => speak(current.lemma, 1.0)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-700 shadow-sm active:scale-95"
                    aria-label="Nghe phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                {currentPos && (
                  <p className="mt-2 text-[12px] font-semibold text-violet-700">
                    <span className="rounded-md bg-violet-100 px-2 py-0.5 font-black">
                      {currentPos.short}
                    </span>
                    <span className="ml-1.5 text-violet-600/80">{currentPos.vi}</span>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  {knownHits > 1 && !revealed && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${tierBadgeClass(knownHits)}`}
                    >
                      đã đúng {tierLabel(knownHits)} lần
                    </span>
                  )}
                  {revealed && justHitTier != null && justHitTier > 1 && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${tierBadgeClass(justHitTier)}`}
                    >
                      Đúng lần {tierLabel(justHitTier)}
                    </span>
                  )}
                  {revealed && justHitTier == null && knownHits > 1 && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${tierBadgeClass(knownHits)}`}
                    >
                      vẫn {tierLabel(knownHits)} lần đúng
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {current.opts.map((o, i) => {
                const label = String.fromCharCode(65 + i);
                const isAns = answersMatch(o, current.answer);
                const isPick = picked != null && answersMatch(o, picked);
                let cls =
                  'flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold ';
                if (!revealed) {
                  cls += 'border-slate-200 bg-white active:bg-violet-50';
                } else if (isAns) {
                  cls += 'border-emerald-400 bg-emerald-50 text-emerald-900';
                } else if (isPick) {
                  cls += 'border-red-300 bg-red-50 text-red-800';
                } else {
                  cls += 'border-slate-100 bg-slate-50 text-slate-400';
                }
                return (
                  <button
                    key={`${current.lemma}-${current.type}-${i}-${o}`}
                    type="button"
                    disabled={revealed}
                    onClick={() => onPick(o)}
                    className={cls}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                      {label}
                    </span>
                    <span className="min-w-0 flex-1">
                      {revealed && isAns && (
                        <Check className="mr-1 inline h-3.5 w-3.5" />
                      )}
                      {revealed && isPick && !isAns && (
                        <X className="mr-1 inline h-3.5 w-3.5" />
                      )}
                      {o}
                    </span>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <p className="text-center text-[11px] font-medium text-slate-400">
                {idx + 1 >= queue.length ? 'Sắp xem kết quả…' : 'Tự sang câu tiếp (1s)…'}
              </p>
            )}
          </section>
        )}

        {phase === 'done' && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-2xl font-black text-violet-700">{pct}%</p>
            <p className="text-sm text-slate-600">
              {correctN}/{queue.length} đúng phiên này
            </p>
            {sessionTiers && sessionTiers.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto text-left">
                <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Lượt đúng tích lũy
                </p>
                {sessionTiers.map((row) => {
                  const pl = posLabel(row.pos);
                  return (
                    <div
                      key={`${row.lemma}-${row.type}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 text-[12px]"
                    >
                      <span className="min-w-0 font-semibold text-slate-800">
                        {row.lemma}
                        <span className="ml-1 text-[10px] font-bold text-slate-400">
                          {pl.short}
                        </span>
                        <span className="ml-1 text-[9px] font-bold uppercase text-slate-300">
                          {row.type === 'cloze' ? 'cloze' : 'nghĩa'}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black ${tierBadgeClass(row.n)}`}
                      >
                        {tierLabel(row.n)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl"
                onClick={() => setPhase('setup')}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Lại
              </Button>
              <Button
                className="h-10 flex-1 rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
                onClick={start}
              >
                Chơi tiếp
              </Button>
            </div>
          </section>
        )}
      </div>
    </StudentShell>
  );
}
