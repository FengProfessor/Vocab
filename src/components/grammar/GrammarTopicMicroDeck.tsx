'use client';

import { useMemo, useState } from 'react';
import { Volume2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import type { GrammarLesson } from '@/lib/supabase';
import { speak } from '@/lib/study';
import topicAssets from '@/data/grammar-topic-assets.json';

type Usage = { icon?: string; label?: string; en?: string; vi?: string };

export default function GrammarTopicMicroDeck({ lesson, level, onComplete, onBack, onNext, nextTopicTitle, onOpenTheory, saving }: {
  lesson: GrammarLesson;
  level: string;
  onComplete: (accuracy: number) => Promise<boolean>;
  onBack: () => void;
  onNext: (() => void) | null;
  nextTopicTitle: string | null;
  onOpenTheory: () => void;
  saving: boolean;
}) {
  const cards = useMemo(() => (lesson.sections?.usage ?? [])
    .filter((item): item is Usage & { en: string; vi: string } => Boolean(item.en && item.vi))
    .slice(0, lesson.sections?.mistakes?.length ?? 0), [lesson.sections]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'meaning' | 'grammar'>('meaning');
  const [selected, setSelected] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [correctCards, setCorrectCards] = useState<number[]>([]);
  const current = cards[index];
  const slug = lesson.topic?.slug ?? '';
  const assets: Record<string, { image: string | null; audio: string | null }[]> = topicAssets;
  const media = assets[slug]?.[index];
  const mistake = lesson.sections?.mistakes?.[index];
  const choices = useMemo(() => {
    if (!current) return [];
    const others = cards.filter((_, itemIndex) => itemIndex !== index).map((item) => item.vi);
    return [current.vi, ...others.slice(0, 2)].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [cards, current, index]);
  if (!current) return null;
  const answer = phase === 'meaning' ? current.vi : mistake?.right ?? '';
  const correct = selected === answer;
  const allDone = correctCards.length === cards.length;

  function choose(choice: string) {
    setSelected(choice);
    if (choice !== answer) setErrors((count) => count + 1);
    if (phase === 'grammar' && choice === mistake?.right && !correctCards.includes(index)) setCorrectCards((done) => [...done, index]);
  }

  function nextCard() {
    setIndex(index + 1);
    setPhase('meaning');
    setSelected(null);
  }

  function play() {
    if (media?.audio) {
      void new Audio(media.audio).play().catch(() => { void speak(current.en, 0.85); });
      return;
    }
    void speak(current.en, 0.85);
  }

  return <main className="min-h-dvh bg-[#faf8f2] px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div className="mx-auto max-w-3xl space-y-5">
      <button type="button" onClick={onBack} className="text-sm text-emerald-800 underline dark:text-emerald-300">← Lộ trình ngữ pháp</button>
      <header className="space-y-2">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{level} · {lesson.topic?.title_vi || lesson.title}</p>
        <h1 className="text-2xl font-bold">Học qua tình huống</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{cards.length} thẻ ngắn · nghe, hiểu nghĩa, chọn câu đúng ngữ pháp.</p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-label={`Đã làm ${correctCards.length} trên ${cards.length} thẻ`}><div className="h-full bg-emerald-600" style={{ width: `${correctCards.length / cards.length * 100}%` }} /></div>
      </header>
      <nav className="flex flex-wrap gap-2" aria-label="Chọn thẻ học">
        {cards.map((card, cardIndex) => <button key={`${card.en}-${cardIndex}`} type="button" onClick={() => { setIndex(cardIndex); setPhase('meaning'); setSelected(null); }} aria-current={index === cardIndex ? 'step' : undefined} className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-semibold ${index === cardIndex ? 'border-emerald-700 bg-emerald-700 text-white' : correctCards.includes(cardIndex) ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'}`}>{correctCards.includes(cardIndex) ? <CheckCircle2 size={16} /> : cardIndex + 1}</button>)}
      </nav>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-emerald-50 px-6 py-5 dark:bg-emerald-950/40"><p className="text-sm text-emerald-800 dark:text-emerald-200">Thẻ {index + 1}/{cards.length}</p><h2 className="text-xl font-bold">{current.label || lesson.title}</h2></div>
        <div className="space-y-5 p-6">
          <div className="flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-sky-50 to-emerald-100 text-7xl dark:from-amber-950 dark:via-slate-800 dark:to-emerald-950" role="img" aria-label={`Minh họa: ${current.label || current.vi}`}>
            {media?.image ? <Image src={media.image} alt="" width={120} height={120} className="h-28 w-28 object-contain" /> : current.icon || '💬'}
          </div>
          <div className="flex items-center gap-3"><button type="button" onClick={play} aria-label={`Nghe ${current.en}`} className="rounded-full bg-emerald-700 p-3 text-white hover:bg-emerald-800"><Volume2 /></button><p className="text-xl font-bold">{current.en}</p></div>
          <div className="border-t border-slate-200 pt-5 dark:border-slate-700"><h3 className="mb-3 font-semibold">{phase === 'meaning' ? 'Câu này có nghĩa gì?' : 'Câu nào đúng ngữ pháp?'}</h3><div className="grid gap-2">{(phase === 'meaning' ? choices : mistake ? (index % 2 === 0 ? [mistake.wrong ?? '', mistake.right ?? ''] : [mistake.right ?? '', mistake.wrong ?? '']) : []).map((choice) => <button key={choice} type="button" onClick={() => choose(choice)} className={`rounded-xl border px-4 py-3 text-left font-medium ${selected === choice ? correct ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200 hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-400'}`}>{choice}</button>)}</div></div>
          {selected && <p role="status" className={`rounded-xl p-3 text-sm ${correct ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>{phase === 'meaning' ? correct ? `Đúng. ${current.vi}` : 'Chưa đúng. Đọc lại câu và nghe thêm lần nữa.' : correct ? `Đúng. ${mistake?.why || 'Hãy so sánh với câu sai để ghi nhớ quy tắc.'}` : 'Chưa đúng. Xem lại điểm ngữ pháp của thẻ.'}</p>}
          {phase === 'meaning' && correct && <button type="button" onClick={() => { setPhase('grammar'); setSelected(null); }} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Luyện câu đúng →</button>}
          {phase === 'grammar' && correct && index < cards.length - 1 && <button type="button" onClick={nextCard} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Thẻ tiếp theo →</button>}
          {allDone && (submitted
            ? <div className="space-y-2"><p role="status" className="text-sm font-semibold text-emerald-700">Đã lưu tiến độ.</p>{onNext && <button type="button" onClick={onNext} className="block rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Tiếp: {nextTopicTitle} →</button>}<button type="button" onClick={onBack} className="text-sm text-emerald-800 underline dark:text-emerald-300">Về lộ trình</button></div>
            : <button type="button" disabled={saving} onClick={() => { void onComplete((cards.length * 2) / (cards.length * 2 + errors)).then(setSubmitted); }} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Hoàn thành chủ đề →</button>)}
        </div>
      </section>
      <button type="button" onClick={onOpenTheory} className="text-sm text-emerald-800 underline dark:text-emerald-300">Xem lý thuyết và bài tập đầy đủ</button>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">Hình <a href="https://openmoji.org/" target="_blank" rel="noopener noreferrer" className="underline">OpenMoji</a> · CC BY-SA 4.0. Âm thanh giọng tổng hợp tiếng Anh.</p>
    </div>
  </main>;
}
