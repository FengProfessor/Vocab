'use client';

/**
 * Drill động từ tối nay — bank pre-gen (meaning + l2 + colo sạch).
 * URL: /practice/verb-drill
 * Không cloze/error (phase 2 AG).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Loader2, RotateCcw, X } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';

type ItemType = 'meaning_mcq' | 'l2_to_en' | 'collocation_mcq';

interface DrillItem {
  lemma: string;
  pos?: string;
  sense_vi?: string;
  type: ItemType;
  stem: { q: string; opts: string[] };
  answer: string;
  explain_vi?: string;
}

interface Pack {
  title: string;
  note?: string;
  lemmas: string[];
  items: DrillItem[];
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

function typeLabel(t: ItemType): string {
  if (t === 'meaning_mcq') return 'Nghĩa';
  if (t === 'l2_to_en') return 'VI → EN';
  return 'Cụm từ';
}

export default function VerbDrillPage() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [wordCount, setWordCount] = useState(10);
  const [qCount, setQCount] = useState(12);
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
        const res = await fetch('/data/tonight-verb-drill.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Pack;
        if (!cancelled) setPack(json);
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : 'Không tải được bank');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWords = pack?.lemmas?.length ?? 40;

  const start = useCallback(() => {
    if (!pack?.items?.length) return;
    const lemmas = pack.lemmas.slice(0, Math.min(wordCount, pack.lemmas.length));
    const setL = new Set(lemmas);
    const pool = pack.items.filter((it) => setL.has(it.lemma.toLowerCase()) || setL.has(it.lemma));
    // Ưu tiên mỗi lemma 1 meaning + trộn thêm
    const byL = new Map<string, DrillItem[]>();
    for (const it of pool) {
      const k = it.lemma.toLowerCase();
      if (!byL.has(k)) byL.set(k, []);
      byL.get(k)!.push(it);
    }
    const seeded: DrillItem[] = [];
    for (const [, list] of byL) {
      const meaning = list.find((x) => x.type === 'meaning_mcq');
      if (meaning) seeded.push(meaning);
      else if (list[0]) seeded.push(list[0]);
    }
    const rest = shuffle(pool.filter((it) => !seeded.includes(it)));
    const q = shuffle([...seeded, ...rest]).slice(0, Math.min(qCount, seeded.length + rest.length));
    if (q.length < 1) return;
    setQueue(q);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectN(0);
    setOpts(shuffle(q[0].stem.opts));
    setPhase('quiz');
  }, [pack, wordCount, qCount]);

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
    <StudentShell title="Drill động từ" contentClassName="p-0" hideMobileNav>
      <div className="mx-auto max-w-lg space-y-3 px-3 py-3 pb-24 sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/practice"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
          >
            <ChevronLeft className="inline h-3.5 w-3.5" /> Practice
          </Link>
          <h1 className="text-base font-black text-slate-900">Drill động từ</h1>
        </div>

        {loadErr && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            Lỗi tải bank: {loadErr}. Chạy <code className="font-mono">node scripts/build-tonight-verb-drill.mjs</code>
          </div>
        )}

        {!pack && !loadErr && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
          </div>
        )}

        {pack && phase === 'setup' && (
          <section className="space-y-3 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
            <p className="text-sm font-bold text-slate-800">{pack.title}</p>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {pack.note || 'Nghĩa · VI→EN · Cụm từ. Phù hợp dạy/luyện tối nay.'}
            </p>
            <p className="text-[11px] font-semibold text-emerald-700">
              Bank: {pack.lemmas.length} động từ · {pack.items.length} câu (đã lọc)
            </p>

            <label className="block text-[11px] font-bold text-slate-600">
              Số từ (top tần suất)
              <input
                type="range"
                min={5}
                max={Math.min(40, maxWords)}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="mt-1 w-full"
              />
              <span className="tabular-nums text-violet-700">{wordCount} từ</span>
            </label>

            <label className="block text-[11px] font-bold text-slate-600">
              Số câu hỏi
              <input
                type="range"
                min={5}
                max={30}
                value={qCount}
                onChange={(e) => setQCount(Number(e.target.value))}
                className="mt-1 w-full"
              />
              <span className="tabular-nums text-violet-700">{qCount} câu</span>
            </label>

            <p className="text-[10px] text-slate-400">
              Ví dụ từ: {pack.lemmas.slice(0, 8).join(', ')}…
            </p>

            <Button
              className="h-11 w-full rounded-xl bg-violet-600 text-sm font-bold hover:bg-violet-700"
              onClick={start}
            >
              Bắt đầu luyện
            </Button>
          </section>
        )}

        {phase === 'quiz' && current && (
          <section className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>
                Câu {idx + 1}/{queue.length}
              </span>
              <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-800">
                {typeLabel(current.type)} · {current.lemma}
              </span>
              <span className="tabular-nums text-emerald-700">✓ {correctN}</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[15px] font-bold leading-snug text-slate-900">{current.stem.q}</p>
              {current.sense_vi && current.type !== 'meaning_mcq' && (
                <p className="mt-1 text-[11px] text-slate-400">Gợi ý: {current.sense_vi}</p>
              )}
            </div>

            <div className="space-y-1.5">
              {opts.map((o) => {
                const isAns = o === current.answer;
                const isPick = o === picked;
                let cls =
                  'w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ';
                if (!revealed) {
                  cls += 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50';
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
                    <span className="inline-flex items-center gap-1.5">
                      {revealed && isAns && <Check className="h-3.5 w-3.5" />}
                      {revealed && isPick && !isAns && <X className="h-3.5 w-3.5" />}
                      {o}
                    </span>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="space-y-2">
                {current.explain_vi && (
                  <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-950">
                    {current.explain_vi}
                  </p>
                )}
                <Button
                  className="h-10 w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
                  onClick={next}
                >
                  {idx + 1 >= queue.length ? 'Xem kết quả' : 'Câu tiếp →'}
                </Button>
              </div>
            )}
          </section>
        )}

        {phase === 'done' && (
          <section className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-4 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">Xong!</p>
            <p className="text-3xl font-black tabular-nums text-violet-700">{pct}%</p>
            <p className="text-sm text-slate-600">
              Đúng <span className="font-bold text-emerald-700">{correctN}</span> / {queue.length}{' '}
              câu
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl"
                onClick={() => setPhase('setup')}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Cài lại
              </Button>
              <Button
                className="h-10 flex-1 rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
                onClick={start}
              >
                Luyện tiếp
              </Button>
            </div>
            <Link href="/practice" className="block text-[11px] font-semibold text-slate-500">
              ← Hub Sử dụng từ
            </Link>
          </section>
        )}
      </div>
    </StudentShell>
  );
}
