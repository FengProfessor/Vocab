'use client';

/**
 * Quiz đơn giản: từ EN → chọn nghĩa VI.
 * Bank chỉ có lemma + vi; 3 nhiễu + thứ tự ABCD random lúc runtime.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Loader2, RotateCcw, X } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';

interface WordEntry {
  lemma: string;
  vi: string;
}

interface Pack {
  title: string;
  note?: string;
  lemmas?: string[];
  words?: WordEntry[];
  /** legacy: items with stem.opts */
  items?: {
    lemma: string;
    stem: { q: string; opts: string[] };
    answer: string;
  }[];
  lemma_count?: number;
  randomize_options?: boolean;
}

interface QuizQ {
  lemma: string;
  answer: string;
  opts: string[];
}

type Phase = 'setup' | 'quiz' | 'done';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 nghĩa nhiễu random từ pool (khác đáp án) + xáo 4 lựa chọn */
function buildOpts(answer: string, allMeanings: string[]): string[] {
  const pool = shuffle(allMeanings.filter((v) => v !== answer));
  const wrong: string[] = [];
  const seen = new Set<string>([answer]);
  for (const v of pool) {
    if (seen.has(v)) continue;
    seen.add(v);
    wrong.push(v);
    if (wrong.length >= 3) break;
  }
  let i = 0;
  while (wrong.length < 3) {
    wrong.push(`(khác ${++i})`);
  }
  return shuffle([answer, ...wrong]);
}

function normalizePack(raw: Pack): { title: string; words: WordEntry[] } {
  if (raw.words?.length) {
    return {
      title: raw.title || 'Quiz từ vựng',
      words: raw.words.map((w) => ({ lemma: w.lemma, vi: w.vi })),
    };
  }
  // legacy items → words
  const words: WordEntry[] = [];
  const seen = new Set<string>();
  for (const it of raw.items || []) {
    const L = it.lemma.toLowerCase();
    if (seen.has(L)) continue;
    seen.add(L);
    words.push({ lemma: it.lemma, vi: it.answer });
  }
  return { title: raw.title || 'Quiz từ vựng', words };
}

export default function VerbDrillPage() {
  const [pack, setPack] = useState<{ title: string; words: WordEntry[] } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [wordCount, setWordCount] = useState(15);
  const [queue, setQueue] = useState<QuizQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctN, setCorrectN] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const urls = [
          `/data/simple-vocab-quiz-all.json?v=${Date.now()}`,
          `/data/tonight-verb-drill.json?v=${Date.now()}`,
        ];
        let raw: Pack | null = null;
        for (const url of urls) {
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            raw = (await res.json()) as Pack;
            break;
          }
        }
        if (!raw) throw new Error('Không tải được bank');
        if (!cancelled) setPack(normalizePack(raw));
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Lỗi tải');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWords = pack?.words.length ?? 50;
  const allMeanings = useMemo(
    () => (pack ? [...new Set(pack.words.map((w) => w.vi))] : []),
    [pack],
  );

  const start = useCallback(() => {
    if (!pack?.words.length) return;
    const pickedWords = shuffle(pack.words).slice(0, Math.min(wordCount, pack.words.length));
    const q: QuizQ[] = pickedWords.map((w) => ({
      lemma: w.lemma,
      answer: w.vi,
      // Random nhiễu + random thứ tự mỗi lần start / mỗi câu
      opts: buildOpts(w.vi, allMeanings),
    }));
    const queueShuffled = shuffle(q);
    setQueue(queueShuffled);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectN(0);
    setPhase('quiz');
  }, [pack, wordCount, allMeanings]);

  const current = queue[idx] ?? null;

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= queue.length) {
        setPhase('done');
        return i;
      }
      setPicked(null);
      setRevealed(false);
      return i + 1;
    });
  }, [queue.length]);

  const onPick = (o: string) => {
    if (revealed || !current) return;
    setPicked(o);
    setRevealed(true);
    if (o === current.answer) setCorrectN((n) => n + 1);
  };

  // Tự next sau 1.5s khi đã chọn đáp án
  useEffect(() => {
    if (phase !== 'quiz' || !revealed) return;
    const t = window.setTimeout(() => {
      next();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [phase, revealed, idx, next]);

  const pct = useMemo(() => {
    if (!queue.length || phase !== 'done') return 0;
    return Math.round((correctN / queue.length) * 100);
  }, [correctN, queue.length, phase]);

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

        {loadErr && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{loadErr}</p>
        )}

        {!pack && !loadErr && (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {pack && phase === 'setup' && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-800">Từ tiếng Anh → chọn nghĩa</p>
            <p className="text-[12px] text-slate-500">
              {pack.words.length} từ · đáp án A/B/C/D random mỗi lần
            </p>
            <label className="block text-[12px] font-semibold text-slate-600">
              Số từ mỗi lượt: {Math.min(wordCount, maxWords)}
              <input
                type="range"
                min={5}
                max={Math.min(50, maxWords)}
                value={Math.min(wordCount, maxWords)}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <Button
              className="h-11 w-full rounded-xl bg-violet-600 text-sm font-bold hover:bg-violet-700"
              onClick={start}
            >
              Bắt đầu
            </Button>
          </section>
        )}

        {phase === 'quiz' && current && (
          <section className="space-y-3">
            <p className="text-center text-[12px] font-semibold text-slate-400">
              {idx + 1} / {queue.length}
              <span className="ml-2 text-emerald-600">· đúng {correctN}</span>
            </p>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/50 py-8 text-center">
              <p className="text-3xl font-black tracking-tight text-slate-900">
                {current.lemma}
              </p>
            </div>

            <div className="space-y-2">
              {current.opts.map((o, i) => {
                const label = String.fromCharCode(65 + i); // A B C D
                const isAns = o === current.answer;
                const isPick = o === picked;
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
                    key={`${current.lemma}-${i}-${o}`}
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
                {idx + 1 >= queue.length ? 'Sắp xem kết quả…' : 'Tự sang câu tiếp (1.5s)…'}
              </p>
            )}
          </section>
        )}

        {phase === 'done' && (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-2xl font-black text-violet-700">{pct}%</p>
            <p className="text-sm text-slate-600">
              {correctN}/{queue.length} đúng
            </p>
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
