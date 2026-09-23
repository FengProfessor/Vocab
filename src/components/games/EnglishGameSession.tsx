'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { GAME_MODES, type GameMode, type GameWord } from '@/data/english-games';
import { EMPTY_GAME_RESULT, makeGameRounds, normalizeGameAnswer, scoreGameAnswer, shuffleGame, type GameResult, type GameRound } from '@/lib/english-games';

const button = 'min-h-12 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 disabled:translate-y-0 disabled:opacity-40';

interface Props {
  mode: GameMode;
  words: GameWord[];
  onExit: () => void;
  onRecord: (mode: GameMode, score: number) => void;
}

export function EnglishGameSession({ mode, words, onExit, onRecord }: Props) {
  const meta = GAME_MODES.find((item) => item.id === mode)!;
  const [rounds, setRounds] = useState(() => makeGameRounds(mode, words));
  const [memoryWords] = useState(() => shuffleGame(words).slice(0, 6));
  const [deck] = useState(() => shuffleGame(memoryWords.flatMap((w) => [
    { pair: w.id, text: w.word, side: 'en' }, { pair: w.id, text: w.translation, side: 'vi' },
  ])));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [result, setResult] = useState<GameResult>({ ...EMPTY_GAME_RESULT });
  const [mistakes, setMistakes] = useState<GameRound[]>([]);
  const [done, setDone] = useState(false);
  const [retry, setRetry] = useState(false);
  const [leavePrompt, setLeavePrompt] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const remaining = useRef(60_000);
  const locked = useRef(false);
  const saved = useRef(false);
  const round = rounds[index];
  const memory = mode === 'memory';
  const completed = memory ? matched.length : index + Number(feedback !== null);
  const total = memory ? memoryWords.length : rounds.length;

  useEffect(() => {
    if (mode !== 'sprint' || done || feedback || leavePrompt || retry) return;
    // Dùng thời gian thực để chuyển tab không làm đồng hồ chạy chậm; tạm dừng ở lời giải.
    const started = Date.now();
    const budget = remaining.current;
    const timer = window.setInterval(() => {
      const left = Math.max(0, budget - (Date.now() - started));
      remaining.current = left;
      setSeconds(Math.ceil(left / 1000));
      if (left === 0) { locked.current = true; setDone(true); }
    }, 100);
    return () => {
      remaining.current = Math.max(0, budget - (Date.now() - started));
      window.clearInterval(timer);
    };
  }, [mode, done, feedback, leavePrompt, retry]);

  useEffect(() => {
    if (done && !retry && !saved.current) {
      saved.current = true;
      onRecord(mode, result.score);
    }
  }, [done, retry, mode, result.score, onRecord]);

  function answer(value: string, tokenIndex?: number) {
    if (locked.current || done || !round) return;
    locked.current = true;
    if (mode === 'sprint' && !retry && remaining.current <= 0) { setDone(true); return; }
    const correct = mode === 'detective' ? tokenIndex === round.wrongIndex : normalizeGameAnswer(value) === normalizeGameAnswer(round.answer);
    setResult((previous) => scoreGameAnswer(previous, correct));
    if (!correct) setMistakes((previous) => [...previous, round]);
    setFeedback({ correct, text: round.explanation });
  }

  function flip(tileIndex: number) {
    if (locked.current || done || flipped.includes(tileIndex) || matched.includes(deck[tileIndex].pair)) return;
    const next = [...flipped, tileIndex];
    setFlipped(next);
    if (next.length !== 2) return;
    locked.current = true;
    const first = deck[next[0]];
    const second = deck[next[1]];
    const correct = first.pair === second.pair;
    setResult((previous) => scoreGameAnswer(previous, correct));
    if (correct) {
      setMatched((previous) => [...previous, first.pair]);
      const word = memoryWords.find((w) => w.id === first.pair)!;
      setFeedback({ correct, text: `${word.word} = ${word.translation}.${word.example ? ` ${word.example}` : ''}` });
    } else {
      const firstWord = memoryWords.find((w) => w.id === first.pair)!;
      const secondWord = memoryWords.find((w) => w.id === second.pair)!;
      setFeedback({ correct, text: `Hai thẻ chưa khớp. ${firstWord.word} = ${firstWord.translation}; ${secondWord.word} = ${secondWord.translation}. Ghi nhớ vị trí rồi thử lại nhé!` });
    }
  }

  function next() {
    if (memory ? matched.length === memoryWords.length : index + 1 >= rounds.length) { setDone(true); return; }
    if (!memory) setIndex((previous) => previous + 1);
    setFlipped([]);
    setSelected([]);
    setFeedback(null);
    locked.current = false;
  }

  function retryMistakes() {
    setRounds(shuffleGame(mistakes));
    setMistakes([]);
    setIndex(0);
    setSelected([]);
    setFeedback(null);
    setResult({ ...EMPTY_GAME_RESULT });
    setRetry(true);
    setDone(false);
    locked.current = false;
  }

  if (done) return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-indigo-100 bg-white p-5 text-center shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600"><Trophy size={42} /></div>
      <div><p className="text-xs font-black uppercase tracking-widest text-indigo-500">{retry ? 'Ôn lại hoàn tất' : 'Kết thúc ván chơi'}</p><h2 className="mt-2 text-3xl font-black">{result.correct > 0 ? 'Thêm một bước tiến! 🎉' : 'Mỗi lần thử là một lần học'}</h2><p className="mt-2 text-sm text-slate-500">{mode === 'sprint' && seconds === 0 ? 'Hết giờ! Câu chưa trả lời không tính sai.' : 'Bạn đã dành thời gian cho tiếng Anh hôm nay.'}</p></div>
      <div className="grid grid-cols-3 gap-2">
        {[['Điểm game', result.score], [memory ? 'Lượt ghép đúng' : 'Trả lời đúng', `${result.correct}/${result.attempts}`], ['Combo tốt nhất', result.bestCombo]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><div className="text-2xl font-black text-indigo-600 dark:text-indigo-300">{value}</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</div></div>)}
      </div>
      {mistakes.length > 0 && <div className="space-y-3 text-left"><h3 className="font-bold">Mang theo mẹo nhớ</h3>{mistakes.map((q) => <div key={q.id} className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{q.prompt}</p><p className="mt-1 font-semibold">✓ {q.answer}</p><p className="mt-1">{q.explanation}</p></div>)}</div>}
      <div className="flex flex-wrap justify-center gap-3">
        {mistakes.length > 0 && <button onClick={retryMistakes} className={`${button} border-indigo-600 bg-indigo-600 text-white`}>Ôn lại {mistakes.length} câu sai</button>}
        <button onClick={onExit} className={`${button} border-slate-200 dark:border-slate-700`}>Chọn game / chơi ván mới</button>
      </div>
      <p className="text-xs text-slate-500">Điểm game riêng, không cộng XP hay thay đổi lịch ôn từ vựng.</p>
    </section>
  );

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-center gap-3">
        <button onClick={() => setLeavePrompt(true)} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700" aria-label="Rời ván chơi"><ArrowLeft size={20} /></button>
        <div className="min-w-0 flex-1"><h1 className="text-lg font-black sm:text-xl">{meta.emoji} {meta.title}</h1><p className="text-xs text-slate-500">{retry ? 'Ôn câu sai · Không giới hạn thời gian' : `${completed}/${total} ${memory ? 'cặp' : 'câu'}`}</p></div>
        {mode === 'sprint' && !retry && <div className={`rounded-xl px-3 py-2 text-center font-black tabular-nums ${seconds <= 10 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`} aria-label={`Còn ${seconds} giây`}><span className="text-xl">{seconds}s</span><p className="text-[10px]">{feedback || leavePrompt ? 'TẠM DỪNG' : 'CÒN LẠI'}</p></div>}
      </header>
      {leavePrompt && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">Rời ván này? Điểm của ván chưa hoàn thành sẽ không được lưu.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setLeavePrompt(false)} className={`${button} border-amber-300`}>Tiếp tục chơi</button><button onClick={onExit} className={`${button} border-amber-300`}>Rời ván</button></div></div>}
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-label="Tiến độ ván chơi" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}><div className="h-full rounded-full bg-indigo-500 transition-all motion-reduce:transition-none" style={{ width: `${total ? completed / total * 100 : 0}%` }} /></div>
      <div className="flex items-center justify-between text-sm font-bold"><span className="text-indigo-600 dark:text-indigo-300">⭐ {result.score} điểm</span><span className="text-orange-600 dark:text-orange-300">🔥 Combo {result.combo}</span></div>
      <fieldset disabled={leavePrompt} className="min-w-0 space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7 dark:border-slate-700 dark:bg-slate-900">
          {memory ? <>
            <h2 className="mb-5 text-center text-sm font-semibold text-slate-500">Lật 2 thẻ: một từ tiếng Anh + một nghĩa tiếng Việt</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">{deck.map((tile, i) => {
              const found = matched.includes(tile.pair);
              const visible = found || flipped.includes(i);
              return <button key={i} onClick={() => flip(i)} disabled={found || Boolean(feedback) || flipped.includes(i)} aria-label={visible ? tile.text : `Lật thẻ ${i + 1}`} className={`min-h-24 break-words rounded-2xl border-2 p-2 text-sm font-bold transition sm:min-h-28 ${found ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : visible ? 'border-indigo-400 bg-indigo-50 text-indigo-900' : 'border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-500'}`}>{visible ? <><span className="mb-1 block text-[10px] uppercase opacity-60">{found ? '✓ Đã ghép' : tile.side === 'en' ? 'English' : 'Tiếng Việt'}</span>{tile.text}</> : <span className="text-3xl">?</span>}</button>;
            })}</div>
          </> : <>
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">{mode === 'detective' ? 'Chạm vào từ dùng sai' : mode === 'sentence' ? 'Xếp câu theo nghĩa gợi ý' : mode === 'scramble' ? 'Từ bí mật có nghĩa là' : mode === 'grammar' ? 'Chọn mảnh ghép còn thiếu' : 'Chọn từ tiếng Anh đúng'}</p>
            {mode !== 'detective' && <h2 className="my-6 break-words text-center text-xl font-bold leading-relaxed sm:text-2xl">{round.prompt}</h2>}
            {(mode === 'grammar' || mode === 'sprint') && <div className="grid gap-3 sm:grid-cols-2">{round.options.map((option) => <button key={option} disabled={Boolean(feedback)} onClick={() => answer(option)} className={`${button} break-words ${feedback && option === round.answer ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>{option}</button>)}</div>}
            {mode === 'detective' && <div className="my-6 flex flex-wrap justify-center gap-2">{round.tiles.map((tile, i) => <button key={i} disabled={Boolean(feedback)} onClick={() => answer(tile, i)} className={`${button} ${feedback && i === round.wrongIndex ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-slate-200 dark:border-slate-700'}`}>{tile}</button>)}</div>}
            {(mode === 'sentence' || mode === 'scramble') && <>
              <div className="mb-5 flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20" aria-label="Câu trả lời đã ghép">
                {selected.length === 0 ? <p className="text-sm text-slate-400">Chạm các {mode === 'sentence' ? 'từ' : 'chữ cái'} bên dưới để ghép</p> : selected.map((tileIndex, position) => <button key={tileIndex} disabled={Boolean(feedback)} onClick={() => setSelected((previous) => previous.filter((_, at) => at !== position))} aria-label={`Bỏ ${round.tiles[tileIndex]}`} className="min-h-11 min-w-11 rounded-xl bg-indigo-600 px-3 py-2 font-bold text-white">{round.tiles[tileIndex]}</button>)}
              </div>
              <div className="flex flex-wrap justify-center gap-2">{round.tiles.map((tile, i) => <button key={i} disabled={Boolean(feedback) || selected.includes(i)} onClick={() => setSelected((previous) => previous.includes(i) ? previous : [...previous, i])} className={`${button} min-w-12 border-slate-200 dark:border-slate-700`}>{tile}</button>)}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-3"><button aria-label="Xóa các mảnh đã chọn" disabled={Boolean(feedback) || !selected.length} onClick={() => setSelected([])} className={`${button} border-slate-200 dark:border-slate-700`}><RotateCcw size={18} /></button><button disabled={Boolean(feedback) || selected.length !== round.tiles.length} onClick={() => answer(selected.map((i) => round.tiles[i]).join(mode === 'scramble' ? '' : ' '))} className={`${button} border-indigo-600 bg-indigo-600 text-white`}>Kiểm tra đáp án</button></div>
              <p className="mt-3 text-center text-xs text-slate-500">{mode === 'sentence' ? 'Bắt đầu bằng từ viết hoa, đặt cụm thời gian ở cuối. ' : ''}Chạm mảnh đã ghép để bỏ và chọn lại.</p>
            </>}
            {!feedback && <button onClick={() => answer('', -1)} className="mx-auto mt-5 block rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 underline underline-offset-4">Chưa biết · Xem lời giải</button>}
          </>}
        </div>
        {feedback && <div role="status" className={`rounded-2xl border p-5 ${feedback.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}><p className="font-black">{feedback.correct ? '✓ Chính xác! Giữ nhịp nào.' : 'Mình học lại chỗ này nhé!'}</p>{!memory && !feedback.correct && <p className="mt-2 font-bold">Đáp án: {round.answer}</p>}<p className="mt-2 text-sm leading-relaxed">{feedback.text}</p><button onClick={next} className="mt-4 flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">{(memory ? matched.length === total : index + 1 === total) ? 'Xem kết quả' : memory ? 'Lật tiếp' : 'Câu tiếp theo'} <ArrowRight size={16} /></button></div>}
      </fieldset>
    </section>
  );
}
