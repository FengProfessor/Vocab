'use client';

/**
 * Quiz đơn giản: từ EN → chọn nghĩa VI (toàn bank).
 * /practice/verb-drill
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Loader2, RotateCcw, X } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';

interface DrillItem {
  lemma: string;
  type: string;
  stem: { q: string; opts: string[] };
  answer: string;
}

interface Pack {
  title: string;
  note?: string;
  lemmas: string[];
  items: DrillItem[];
  lemma_count?: number;
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

export default function VerbDrillPage() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [wordCount, setWordCount] = useState(15);
  const [queue, setQueue] = useState<DrillItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctN, setCorrectN] = useState(0);
  const [opts, setOpts] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // full bank (cùng format simple EN→VI)
        const res = await fetch(`/data/simple-vocab-quiz-all.json?v=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          // fallback pack tối
          const r2 = await fetch(`/data/tonight-verb-drill.json?v=${Date.now()}`, {
            cache: 'no-store',
          });
          if (!r2.ok) throw new Error(`HTTP ${res.status}`);
          const j2 = (await r2.json()) as Pack;
          if (!cancelled) setPack(j2);
          return;
        }
        const json = (await res.json()) as Pack;
        if (!cancelled) setPack(json);
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Lỗi tải');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWords = pack?.lemmas?.length ?? 50;

  const start = useCallback(() => {
    if (!pack?.items?.length) return;
    // Random N từ trong toàn bank
    const lemmas = shuffle(pack.lemmas).slice(0, Math.min(wordCount, pack.lemmas.length));
    const setL = new Set(lemmas.map((x) => x.toLowerCase()));
    const pool = pack.items.filter(
      (it) => it.type === 'meaning_mcq' && setL.has(it.lemma.toLowerCase()),
    );
    // 1 câu / từ
    const byL = new Map<string, DrillItem>();
    for (const it of pool) {
      const k = it.lemma.toLowerCase();
      if (!byL.has(k)) byL.set(k, it);
    }
    const q = shuffle([...byL.values()]);
    if (!q.length) return;
    setQueue(q);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectN(0);
    setOpts(shuffle(q[0].stem.opts));
    setPhase('quiz');
  }, [pack, wordCount]);

  const current = queue[idx] ?? null;

  const onPick = (o: string) => {
    if (revealed || !current) return;
    setPicked(o);
    setRevealed(true);
    if (o === current.answer) setCorrectN((n) => n + 1);
  };

  const next = () => {
    if (idx + 1 >= queue.length) {
      setPhase('done');
      return;
    }
    const n = idx + 1;
    setIdx(n);
    setPicked(null);
    setRevealed(false);
    setOpts(shuffle(queue[n].stem.opts));
  };

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
              {pack.lemma_count ?? pack.lemmas.length} từ trong bank · 1 câu / từ
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
                {current.stem.q}
              </p>
            </div>

            <div className="space-y-2">
              {opts.map((o) => {
                const isAns = o === current.answer;
                const isPick = o === picked;
                let cls = 'w-full rounded-xl border px-3 py-3 text-left text-sm font-semibold ';
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
                    key={o}
                    type="button"
                    disabled={revealed}
                    onClick={() => onPick(o)}
                    className={cls}
                  >
                    {revealed && isAns && <Check className="mr-1 inline h-3.5 w-3.5" />}
                    {revealed && isPick && !isAns && (
                      <X className="mr-1 inline h-3.5 w-3.5" />
                    )}
                    {o}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <Button
                className="h-11 w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
                onClick={next}
              >
                {idx + 1 >= queue.length ? 'Kết quả' : 'Tiếp'}
              </Button>
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
