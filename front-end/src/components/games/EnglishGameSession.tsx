'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { GAME_MODES, type GameMode, type GameWord } from '@/data/english-games';
import { EMPTY_GAME_RESULT, makeGameRounds, normalizeGameAnswer, scoreGameAnswer, shuffleGame, type GameResult, type GameRound } from '@/lib/english-games';

const button = 'min-h-[44px] rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-40 dark:hover:bg-slate-800';

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
      setFeedback({ correct, text: `Chưa khớp cặp. ${firstWord.word} = ${firstWord.translation}; ${secondWord.word} = ${secondWord.translation}. Ghi nhớ vị trí rồi thử lại!` });
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
    <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"><Trophy size={36} /></div>
      <div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{retry ? 'ÔN TẬP BẪY SAI HOÀN TẤT' : 'KẾT THÚC LƯỢT HUẤN LUYỆN'}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{result.correct > 0 ? 'Phản xạ chuẩn xác! 🎯' : 'Mỗi bẫy sai là một kinh nghiệm thi'}</h2>
        <p className="mt-1.5 text-xs text-slate-500">{mode === 'sprint' && seconds === 0 ? 'Hết 60 giây. Các câu chưa trả lời không bị tính điểm phạt.' : 'Bạn đã duy trì nhịp độ rèn luyện phản xạ học thuật hôm nay.'}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['Điểm phản xạ', `${result.score} pts`], [memory ? 'Ghép chính xác' : 'Số câu đúng', `${result.correct}/${result.attempts}`], ['Chuỗi combo cao nhất', result.bestCombo]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-300">{value}</div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
          </div>
        ))}
      </div>
      {mistakes.length > 0 && (
        <div className="space-y-2.5 text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Phân tích bẫy thi & Mẹo ghi nhớ</h3>
          {mistakes.map((q) => (
            <div key={q.id} className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-bold">{q.prompt}</p>
              <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">✓ Đáp án chuẩn: {q.answer}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{q.explanation}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {mistakes.length > 0 && (
          <button onClick={retryMistakes} className={`${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500`}>
            Khắc phục {mistakes.length} câu bẫy sai
          </button>
        )}
        <button onClick={onExit} className={`${button} border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200`}>
          Chọn chế độ / Ván mới
        </button>
      </div>
      <p className="text-[11px] font-mono text-slate-400">Điểm phản xạ được lưu cục bộ trên thiết bị để theo dõi tiến độ tốc độ làm bài.</p>
    </section>
  );

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center gap-3">
        <button onClick={() => setLeavePrompt(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Rời ván chơi"><ArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold sm:text-lg text-slate-900 dark:text-slate-100">{meta.emoji} {meta.title}</h1>
          <p className="text-xs font-mono text-slate-500">{retry ? 'Chế độ khắc phục bẫy · Không giới hạn thời gian' : `${completed}/${total} ${memory ? 'cặp cụm từ' : 'câu bẫy'}`}</p>
        </div>
        {mode === 'sprint' && !retry && (
          <div className={`rounded-xl px-3 py-1.5 text-center font-mono font-bold tabular-nums ${seconds <= 10 ? 'border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300' : 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300'}`} aria-label={`Còn ${seconds} giây`}>
            <span className="text-lg">{seconds}s</span>
            <p className="text-[9px] uppercase tracking-wider">{feedback || leavePrompt ? 'TẠM DỪNG' : 'CÒN LẠI'}</p>
          </div>
        )}
      </header>

      {leavePrompt && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-bold">Tạm dừng lượt huấn luyện? Điểm số của lượt chưa hoàn tất sẽ không được ghi nhận.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setLeavePrompt(false)} className={`${button} border-amber-300 bg-white dark:bg-slate-800`}>Tiếp tục rèn luyện</button>
            <button onClick={onExit} className={`${button} border-amber-300 bg-amber-600 text-white hover:bg-amber-500`}>Rời ván</button>
          </div>
        </div>
      )}

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-label="Tiến độ ván chơi" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded-full bg-indigo-600 transition-all motion-reduce:transition-none" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs font-mono font-bold">
        <span className="text-indigo-600 dark:text-indigo-300">⭐ {result.score} pts</span>
        <span className="text-orange-600 dark:text-orange-400">🔥 Streak Combo: {result.combo}</span>
      </div>

      <fieldset disabled={leavePrompt} className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {memory ? (
            <>
              <h2 className="mb-4 text-center text-xs font-semibold text-slate-500">Lật 2 thẻ: Khớp một thuật ngữ/cụm từ tiếng Anh với nghĩa tiếng Việt tương ứng</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
                {deck.map((tile, i) => {
                  const found = matched.includes(tile.pair);
                  const visible = found || flipped.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => flip(i)}
                      disabled={found || Boolean(feedback) || flipped.includes(i)}
                      aria-label={visible ? tile.text : `Lật thẻ ${i + 1}`}
                      className={`min-h-[72px] break-words rounded-xl border p-2.5 text-xs font-bold transition sm:min-h-[84px] ${
                        found
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : visible
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200'
                          : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                    >
                      {visible ? (
                        <>
                          <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider opacity-60">
                            {found ? '✓ ĐÃ KHỚP' : tile.side === 'en' ? 'ENGLISH TERM' : 'VIETNAMESE'}
                          </span>
                          {tile.text}
                        </>
                      ) : (
                        <span className="font-mono text-xl opacity-40">?</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-center font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {mode === 'detective'
                  ? 'Chạm trực tiếp vào từ ngữ bị gài bẫy ngữ pháp'
                  : mode === 'sentence'
                  ? 'Xếp các mệnh đề thành cấu trúc hoàn chỉnh'
                  : mode === 'scramble'
                  ? 'Giải mã thuật ngữ học thuật theo định nghĩa'
                  : mode === 'grammar'
                  ? 'Chọn phương án chính xác hoàn thiện cấu trúc'
                  : 'Chọn thuật ngữ tiếng Anh tương ứng'}
              </p>
              {mode !== 'detective' && (
                <h2 className="my-5 break-words text-center text-lg font-bold leading-relaxed text-slate-900 sm:text-xl dark:text-slate-100">
                  {round.prompt}
                </h2>
              )}
              {(mode === 'grammar' || mode === 'sprint') && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {round.options.map((option) => (
                    <button
                      key={option}
                      disabled={Boolean(feedback)}
                      onClick={() => answer(option)}
                      className={`${button} break-words ${
                        feedback && option === round.answer
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              {mode === 'detective' && (
                <div className="my-5 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {round.tiles.map((tile, i) => (
                    <button
                      key={i}
                      disabled={Boolean(feedback)}
                      onClick={() => answer(tile, i)}
                      className={`${button} px-2.5 py-2 ${
                        feedback && i === round.wrongIndex
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {tile}
                    </button>
                  ))}
                </div>
              )}
              {(mode === 'sentence' || mode === 'scramble') && (
                <>
                  <div className="mb-4 flex min-h-[64px] flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/20" aria-label="Cấu trúc câu đã ghép">
                    {selected.length === 0 ? (
                      <p className="text-xs text-slate-400 font-mono">Chạm các {mode === 'sentence' ? 'mệnh đề' : 'ký tự'} bên dưới để lắp ghép</p>
                    ) : (
                      selected.map((tileIndex, position) => (
                        <button
                          key={tileIndex}
                          disabled={Boolean(feedback)}
                          onClick={() => setSelected((previous) => previous.filter((_, at) => at !== position))}
                          aria-label={`Bỏ ${round.tiles[tileIndex]}`}
                          className="min-h-[40px] rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >
                          {round.tiles[tileIndex]}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                    {round.tiles.map((tile, i) => (
                      <button
                        key={i}
                        disabled={Boolean(feedback) || selected.includes(i)}
                        onClick={() => setSelected((previous) => (previous.includes(i) ? previous : [...previous, i]))}
                        className={`${button} border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200`}
                      >
                        {tile}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    <button
                      aria-label="Đặt lại các mảnh ghép"
                      disabled={Boolean(feedback) || !selected.length}
                      onClick={() => setSelected([])}
                      className={`${button} border-slate-200 dark:border-slate-700`}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      disabled={Boolean(feedback) || selected.length !== round.tiles.length}
                      onClick={() => answer(selected.map((i) => round.tiles[i]).join(mode === 'scramble' ? '' : ' '))}
                      className={`${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500`}
                    >
                      Kiểm tra cấu trúc
                    </button>
                  </div>
                </>
              )}
              {!feedback && (
                <button onClick={() => answer('', -1)} className="mx-auto mt-4 block text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:hover:text-slate-300">
                  Xem phân tích bẫy thi & Lời giải
                </button>
              )}
            </>
          )}
        </div>

        {feedback && (
          <div role="status" className={`rounded-xl border p-4 text-xs sm:text-sm leading-relaxed ${feedback.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'}`}>
            <p className="font-bold">{feedback.correct ? '✓ Chính xác! Phản xạ xuất sắc.' : 'Bẫy đề thi cần lưu ý:'}</p>
            {!memory && !feedback.correct && <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">Đáp án chuẩn: {round.answer}</p>}
            <p className="mt-1.5 text-slate-700 dark:text-slate-300">{feedback.text}</p>
            <button onClick={next} className="mt-3.5 flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500">
              {(memory ? matched.length === total : index + 1 === total) ? 'Xem bảng kết quả' : memory ? 'Ghép cặp tiếp theo' : 'Câu bẫy tiếp theo'} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </fieldset>
    </section>
  );
}
