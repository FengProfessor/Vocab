
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Flame,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  Undo2,
  Volume2,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  GAME_MODES,
  type GameMode,
  type GameWord,
} from '@/data/english-games';
import {
  EMPTY_GAME_RESULT,
  makeGameRounds,
  normalizeGameAnswer,
  playableWords,
  scoreGameAnswer,
  shuffleGame,
  type GameResult,
} from '@/lib/english-games';
import { playWordAudio } from '@/lib/audio';

interface MemoryCard {
  id: string;
  pairId: string;
  kind: 'word' | 'translation';
  text: string;
}

export interface EnglishGameSessionProps {
  mode: GameMode;
  words: GameWord[];
  sourceLabel: string;
  bestScore: number;
  onBack: () => void;
  onFinish: (result: GameResult) => void;
}

export function EnglishGameSession({
  mode,
  words,
  sourceLabel,
  bestScore,
  onBack,
  onFinish,
}: EnglishGameSessionProps) {
  const meta = GAME_MODES.find((item) => item.id === mode)!;
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<GameResult>(EMPTY_GAME_RESULT);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);
  const [missedNotes, setMissedNotes] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [openCards, setOpenCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const reportedRef = useRef(false);
  const flipTimerRef = useRef<number | null>(null);

  const rounds = useMemo(() => {
    void seed;
    return makeGameRounds(mode, words);
  }, [mode, seed, words]);

  const memoryCards = useMemo<MemoryCard[]>(() => {
    void seed;
    if (mode !== 'memory') return [];
    const pairs = shuffleGame(playableWords('memory', words)).slice(0, 6);
    return shuffleGame(
      pairs.flatMap((item) => [
        {
          id: `${item.id}-en`,
          pairId: item.id,
          kind: 'word' as const,
          text: item.word,
        },
        {
          id: `${item.id}-vi`,
          pairId: item.id,
          kind: 'translation' as const,
          text: item.translation,
        },
      ])
    );
  }, [mode, seed, words]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'sprint' || done) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [done, mode, seed]);

  useEffect(() => {
    if (!done || reportedRef.current) return;
    reportedRef.current = true;
    onFinish(result);
    try {
      void confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if canvas is unavailable
    }
  }, [done, onFinish, result]);

  const current = rounds[index];
  const memoryPairsTotal = memoryCards.length / 2;

  function restart() {
    if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current);
    reportedRef.current = false;
    setSeed((prev) => prev + 1);
    setIndex(0);
    setSelected([]);
    setResult(EMPTY_GAME_RESULT);
    setFeedback(null);
    setMissedNotes([]);
    setDone(false);
    setSecondsLeft(60);
    setOpenCards([]);
    setMatchedPairs([]);
    setShakeKey(0);
  }

  const recordOutcome = useCallback(
    (correct: boolean, explanation: string, wordToSpeak?: string) => {
      setResult((prev) => scoreGameAnswer(prev, correct));
      if (!correct) {
        setShakeKey((k) => k + 1);
        setMissedNotes((prev) => [...prev, explanation]);
      }
      if (wordToSpeak && /^[a-zA-Z\s-]+$/.test(wordToSpeak)) {
        playWordAudio(wordToSpeak);
      }
      setFeedback({
        correct,
        message: `${correct ? 'Chính xác! ' : 'Chưa đúng — '}${explanation}`,
      });
    },
    []
  );

  const nextRound = useCallback(() => {
    setSelected([]);
    setFeedback(null);
    if (index + 1 >= rounds.length) {
      setDone(true);
      return;
    }
    setIndex((prev) => prev + 1);
  }, [index, rounds.length]);

  const chooseOption = useCallback(
    (option: string) => {
      if (!current || feedback) return;
      const correct =
        normalizeGameAnswer(option) === normalizeGameAnswer(current.answer);
      if (mode === 'sprint') {
        setResult((prev) => scoreGameAnswer(prev, correct));
        if (!correct) {
          setShakeKey((k) => k + 1);
          setMissedNotes((prev) => [...prev, current.explanation]);
        }
        if (/^[a-zA-Z\s-]+$/.test(current.answer)) {
          playWordAudio(current.answer);
        }
        if (index + 1 >= rounds.length) {
          setDone(true);
        } else {
          setIndex((prev) => prev + 1);
        }
        return;
      }
      recordOutcome(
        correct,
        current.explanation,
        mode === 'grammar' ? undefined : current.answer
      );
    },
    [current, feedback, index, mode, recordOutcome, rounds.length]
  );

  function chooseDetectiveTile(tileIndex: number) {
    if (!current || feedback) return;
    recordOutcome(tileIndex === current.wrongIndex, current.explanation);
  }

  function submitTiles() {
    if (!current || feedback) return;
    const joiner = mode === 'scramble' ? '' : ' ';
    const built = selected.map((tileIdx) => current.tiles[tileIdx]).join(joiner);
    recordOutcome(
      normalizeGameAnswer(built) === normalizeGameAnswer(current.answer),
      current.explanation,
      mode === 'scramble' ? current.answer : undefined
    );
  }

  function flipMemoryCard(card: MemoryCard) {
    if (
      done ||
      openCards.length >= 2 ||
      openCards.includes(card.id) ||
      matchedPairs.includes(card.pairId)
    )
      return;

    if (card.kind === 'word') {
      playWordAudio(card.text);
    }

    const nextOpen = [...openCards, card.id];
    setOpenCards(nextOpen);
    if (nextOpen.length < 2) return;

    const first = memoryCards.find((item) => item.id === nextOpen[0]);
    const second = memoryCards.find((item) => item.id === nextOpen[1]);
    const matched = Boolean(
      first && second && first.pairId === second.pairId && first.id !== second.id
    );
    setResult((prev) => scoreGameAnswer(prev, matched));

    if (matched && first) {
      const nextMatched = [...matchedPairs, first.pairId];
      setMatchedPairs(nextMatched);
      setOpenCards([]);
      if (nextMatched.length >= memoryPairsTotal) setDone(true);
      return;
    }

    setShakeKey((k) => k + 1);
    flipTimerRef.current = window.setTimeout(() => setOpenCards([]), 650);
  }

  // Keyboard shortcuts [1..4] & Enter for next
  useEffect(() => {
    if (done) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (feedback && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        nextRound();
        return;
      }
      if (!feedback && (mode === 'sprint' || mode === 'grammar') && current) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1 && current.options[idx]) {
          chooseOption(current.options[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [done, feedback, mode, current, chooseOption, nextRound]);

  const progressPct = useMemo(() => {
    if (mode === 'memory') {
      return memoryPairsTotal > 0
        ? Math.round((matchedPairs.length / memoryPairsTotal) * 100)
        : 0;
    }
    return rounds.length > 0
      ? Math.min(100, Math.round(((index + 1) / rounds.length) * 100))
      : 0;
  }, [mode, matchedPairs.length, memoryPairsTotal, index, rounds.length]);

  const accuracyPct =
    result.attempts > 0
      ? Math.round((result.correct / result.attempts) * 100)
      : 100;

  if (
    (mode !== 'memory' && rounds.length === 0) ||
    (mode === 'memory' && memoryCards.length < 4)
  ) {
    return (
      <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Chưa đủ từ vựng hợp lệ để khởi tạo trò chơi này. Hãy chọn chủ đề có ít nhất 4 từ.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách trò chơi
        </button>
      </div>
    );
  }

  return (
    <div
      key={shakeKey}
      className={`rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden ${
        shakeKey > 0 && result.combo === 0 && !feedback?.correct
          ? 'animate-shake'
          : ''
      }`}
      data-testid={`active-game-session-${mode}`}
    >
      {/* Top Progress Bar */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── LIVE ARCADE HUD HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer min-h-[38px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Đổi trò chơi
          </button>
          <div className="hidden sm:block">
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              {meta.emoji} {meta.title}
            </span>
            <span className="ml-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              ({sourceLabel})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {mode === 'sprint' && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tabular-nums border ${
                secondsLeft <= 10
                  ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                  : secondsLeft <= 25
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              {secondsLeft}s
            </span>
          )}

          {/* Combo Streak Meter */}
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black tabular-nums border transition-all ${
              result.combo >= 4
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400 shadow-sm shadow-amber-500/30 scale-105'
                : result.combo >= 2
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            {result.combo >= 4
              ? `FEVER x${result.combo}`
              : `Combo x${result.combo}`}
          </span>

          {/* Live Score Pill */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-black tabular-nums shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            {result.score} PTS
          </span>
        </div>
      </div>

      {/* ── MAIN ARENA BODY ── */}
      <div className="p-5 sm:p-7 space-y-6">
        {done ? (
          <div
            className="space-y-6 text-center py-2 animate-in zoom-in-95 duration-200"
            data-testid="game-victory-screen"
          >
            <div className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg">
              <Trophy className="h-9 w-9" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {result.score > bestScore
                  ? 'Kỷ Lục Cá Nhân Mới!'
                  : 'Hoàn Thành Lượt Thi Đấu'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 pt-1">
                {result.score} Điểm
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                Đúng {result.correct}/{result.attempts} lượt ({accuracyPct}%) · Combo cao nhất x{result.bestCombo} · Kỷ lục: {Math.max(bestScore, result.score)}
              </p>
            </div>

            {missedNotes.length > 0 && (
              <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 p-4 text-left space-y-2 max-w-2xl mx-auto">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Giải Phẫu Các Điểm Cần Nhớ ({missedNotes.length})
                </h4>
                <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200 max-h-44 overflow-y-auto pr-1">
                  {missedNotes.map((note, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl bg-white/80 dark:bg-slate-900/70 p-2.5 border border-amber-200/60 dark:border-amber-900/40"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-black text-white shadow-md shadow-indigo-500/20 cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="h-4 w-4" /> Chơi Lại Lượt Mới
              </button>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer min-h-[44px]"
              >
                Chọn Trò Chơi Khác
              </button>
            </div>
          </div>
        ) : mode === 'memory' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              <span>
                Lật 2 thẻ liên tiếp để ghép đúng cặp{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  Từ Tiếng Anh (EN)
                </strong>{' '}
                và{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  Nghĩa Tiếng Việt (VI)
                </strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 tabular-nums">
                Đã ghép: {matchedPairs.length}/{memoryPairsTotal} cặp
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {memoryCards.map((card, idx) => {
                const opened =
                  openCards.includes(card.id) ||
                  matchedPairs.includes(card.pairId);
                const matched = matchedPairs.includes(card.pairId);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => flipMemoryCard(card)}
                    data-testid={`memory-card-${idx}`}
                    className={`min-h-[96px] sm:min-h-[110px] rounded-2xl border-2 p-3 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                      matched
                        ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : opened
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 shadow-md -translate-y-0.5'
                        : 'border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-100 to-slate-200/70 dark:from-slate-800 dark:to-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-500 dark:text-slate-400 hover:-translate-y-0.5'
                    }`}
                  >
                    {opened ? (
                      <>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-1.5 ${
                            card.kind === 'word'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {card.kind === 'word' ? 'EN · Từ' : 'VI · Nghĩa'}
                        </span>
                        <span className="block text-xs sm:text-sm font-black leading-snug">
                          {card.text}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shadow-2xs">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                          Chạm để lật
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Prompt Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 space-y-2 shadow-md border border-indigo-500/20">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                <span>
                  Câu {index + 1}/{rounds.length}
                </span>
                <div className="flex items-center gap-2">
                  {mode !== 'grammar' &&
                    mode !== 'detective' &&
                    current?.answer &&
                    /^[a-zA-Z\s-]+$/.test(current.answer) && (
                      <button
                        type="button"
                        onClick={() => playWordAudio(current.answer)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" /> Nghe gợi ý âm
                      </button>
                    )}
                  <span>
                    {mode === 'sprint'
                      ? 'Phản xạ nhanh (Phím 1–4)'
                      : meta.label}
                  </span>
                </div>
              </div>

              <p className="text-lg sm:text-2xl font-black leading-snug pt-1">
                {current.prompt}
              </p>
            </div>

            {/* Multiple Choice Options (Sprint & Grammar) */}
            {(mode === 'sprint' || mode === 'grammar') && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {current.options.map((option: string, optIdx: number) => {
                  const isAnswer =
                    normalizeGameAnswer(option) ===
                    normalizeGameAnswer(current.answer);
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={Boolean(feedback)}
                      data-testid={`game-option-${optIdx}`}
                      onClick={() => chooseOption(option)}
                      className={`group flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-black transition-all cursor-pointer min-h-[54px] ${
                        feedback
                          ? isAnswer
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 opacity-75'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-slate-800 dark:text-slate-100 active:scale-[0.99]'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-black shrink-0 transition-colors">
                        {optIdx + 1}
                      </span>
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tile Assembly (Scramble & Sentence) */}
            {(mode === 'scramble' || mode === 'sentence') && (
              <div className="space-y-4">
                <div className="min-h-[60px] rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/25 p-3.5 flex flex-wrap items-center gap-2">
                  {selected.length === 0 ? (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Chạm vào các mảnh bên dưới theo đúng thứ tự...
                    </span>
                  ) : (
                    <span className="text-base sm:text-lg font-black tracking-wide text-indigo-900 dark:text-indigo-200">
                      {selected
                        .map((tileIdx) => current.tiles[tileIdx])
                        .join(mode === 'scramble' ? '' : ' ')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {current.tiles.map((tile: string, tileIdx: number) => {
                    const used = selected.includes(tileIdx);
                    return (
                      <button
                        key={`${tile}-${tileIdx}`}
                        type="button"
                        disabled={used || Boolean(feedback)}
                        onClick={() =>
                          setSelected((prev) => [...prev, tileIdx])
                        }
                        className={`rounded-xl border-2 px-3.5 py-2.5 text-sm font-black transition-all cursor-pointer min-h-[44px] ${
                          used
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 scale-95 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-800 dark:text-slate-100 shadow-2xs active:scale-95'
                        }`}
                      >
                        {tile}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={selected.length === 0 || Boolean(feedback)}
                    onClick={() => setSelected((prev) => prev.slice(0, -1))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer min-h-[44px]"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Xóa 1 mảnh
                  </button>
                  <button
                    type="button"
                    disabled={
                      selected.length !== current.tiles.length ||
                      Boolean(feedback)
                    }
                    onClick={submitTiles}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs sm:text-sm font-black text-white disabled:opacity-40 shadow-sm cursor-pointer min-h-[44px]"
                  >
                    Kiểm tra đáp án
                  </button>
                </div>
              </div>
            )}

            {/* Detective Mode (Tap the Wrong Word in the Sentence) */}
            {mode === 'detective' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  🕵️ Chạm trực tiếp vào từ bị dùng sai ngữ pháp trong câu dưới đây:
                </p>
                <div className="flex flex-wrap gap-2">
                  {current.tiles.map((tile: string, tileIdx: number) => (
                    <button
                      key={`${tile}-${tileIdx}`}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => chooseDetectiveTile(tileIdx)}
                      className={`rounded-xl border-2 px-3.5 py-2.5 text-sm font-black transition-all cursor-pointer min-h-[44px] ${
                        feedback && tileIdx === current.wrongIndex
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-slate-800 dark:text-slate-100 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:scale-95'
                      }`}
                    >
                      {tile}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Banner */}
            {feedback && (
              <div
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  feedback.correct
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <p className="flex items-start gap-2 text-xs sm:text-sm font-bold leading-relaxed">
                  {feedback.correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{feedback.message}</span>
                </p>
                <button
                  type="button"
                  data-testid="game-next-btn"
                  onClick={nextRound}
                  className="shrink-0 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-black text-white dark:text-slate-900 hover:opacity-90 cursor-pointer min-h-[40px]"
                >
                  Câu tiếp theo →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
