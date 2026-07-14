'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, ChevronLeft, CheckCircle2, XCircle, Loader2, RotateCcw, Lightbulb, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { XP_PER_CORRECT_QUIZ } from '@/lib/gamification';
import { StudentShell } from '@/components/student/StudentShell';

// Quiz mode: 'meaning_to_word' = thấy nghĩa → chọn từ tiếng Anh
//            'word_to_meaning' = thấy từ tiếng Anh → chọn nghĩa tiếng Việt
type QuizMode = 'meaning_to_word' | 'word_to_meaning';

interface WordItem {
  id: string;
  word: string;
  translation: string;
  ipa: string;
  pos: string;
  explanation?: string;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function parseIpa(raw?: string): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed.uk || parsed.us || (Object.values(parsed)[0] as string) || raw;
  } catch { return raw; }
}

function buildChoices(correct: WordItem, all: WordItem[], mode: QuizMode): string[] {
  if (mode === 'meaning_to_word') {
    // Choices là các từ tiếng Anh
    const others = shuffle(all.filter(w => w.id !== correct.id))
      .slice(0, 3)
      .map(w => w.word);
    return shuffle([correct.word, ...others]);
  } else {
    // Choices là nghĩa tiếng Việt
    const others = shuffle(all.filter(w => w.id !== correct.id))
      .slice(0, 3)
      .map(w => w.translation);
    return shuffle([correct.translation, ...others]);
  }
}

function getCorrectChoice(item: WordItem, mode: QuizMode): string {
  return mode === 'meaning_to_word' ? item.word : item.translation;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassroomId = searchParams.get('class');

  const [, setUserId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(initialClassroomId);
  const [words, setWords] = useState<WordItem[]>([]);
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [current, setCurrent] = useState<WordItem | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [mode, setMode] = useState<QuizMode>('meaning_to_word');
  // shakingIdx: index của button đang shake khi chọn sai
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);
  // advanceRef giữ hàm chuyển câu hiện tại — nút "Tiếp theo" và setTimeout dùng chung,
  // identity check chống double-advance (bấm nút xong timeout vẫn bắn)
  const advanceRef = useRef<(() => void) | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rebuild choices khi đổi mode
  useEffect(() => {
    if (current && words.length) {
      setChoices(buildChoices(current, words, mode));
    }
  }, [mode]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth'); return; }
        setUserId(user.id);

        const url = classroomId
          ? `/api/words?classroomId=${classroomId}`
          : `/api/words`;

        const res = await authFetch(url);
        const data = await res.json();

        if (data.success && data.data?.length >= 2) {
          if (!classroomId && data.classroomId) setClassroomId(data.classroomId);

          const all: WordItem[] = data.data;
          const readyWords = all.filter(w =>
            w.translation &&
            !w.translation.includes('failed') &&
            !w.translation.includes('Analyzing')
          );

          if (readyWords.length < 2) {
            toast.error('Cần ít nhất 2 từ đã được AI phân tích để làm Quiz. Hãy Retry AI trước nhé!');
            setIsLoading(false);
            return;
          }

          const quizQueue = shuffle(readyWords).slice(0, 20);
          setWords(readyWords);
          setQueue(quizQueue);
          setTotal(quizQueue.length);
          setCurrent(quizQueue[0]);
          setChoices(buildChoices(quizQueue[0], readyWords, mode));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Quiz] Load failed:', msg);
        toast.error('Failed to load quiz.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [initialClassroomId]);

  const handleSelect = useCallback(async (choice: string, choiceIdx: number) => {
    if (selected || !current) return;
    setSelected(choice);
    const correct = getCorrectChoice(current, mode);
    const isCorrect = choice === correct;

    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      wrong: score.wrong + (isCorrect ? 0 : 1),
    };
    setScore(newScore);
    setShowExplanation(true);

    if (!isCorrect) {
      setShakingIdx(choiceIdx);
      setTimeout(() => setShakingIdx(null), 600);
    }

    // Sai → giữ feedback lâu hơn để kịp đọc giải thích; nút "Tiếp theo" cho phép bỏ chờ
    const delay = isCorrect ? 1200 : 3500;

    const advance = async () => {
      // Chống double-advance: chỉ hàm đang giữ ref mới được chạy (timeout vs nút Tiếp theo)
      if (advanceRef.current !== advance) return;
      advanceRef.current = null;
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      const nextWord = newQueue[0] || null;
      setCurrent(nextWord);
      if (nextWord) setChoices(buildChoices(nextWord, words, mode));
      setSelected(null);
      setShowExplanation(false);
      setShakingIdx(null);
      setProgress(prev => prev + 1);

      if (newQueue.length === 0) {
        const totalXp = newScore.correct * XP_PER_CORRECT_QUIZ;
        setXpEarned(totalXp);

        // Lưu kết quả qua API chuẩn (có XP award)
        try {
          await authFetch('/api/quiz/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classroomId: classroomId || initialClassroomId,
              score: newScore.correct,
              totalQuestions: total,
              quizType: 'vocabulary',
            }),
          });
        } catch (err) {
          console.error('[Quiz] Save failed:', err);
        }
        setDone(true);
      }
    };

    advanceRef.current = advance;
    advanceTimerRef.current = setTimeout(advance, delay);
  }, [selected, current, mode, score, queue, words, classroomId, initialClassroomId, total]);

  /** Bỏ chờ auto-advance — gọi từ nút "Tiếp theo" hoặc phím Enter/Space */
  const skipNext = useCallback(() => {
    void advanceRef.current?.();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (done || isLoading || !current) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (idx < choices.length && !selected) {
          handleSelect(choices[idx], idx);
        }
      }

      // Đã chọn đáp án → Enter/Space bỏ chờ, chuyển câu ngay
      if (selected && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        skipNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [done, isLoading, current, choices, selected, handleSelect, skipNext]);

  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-violet-400 font-bold animate-pulse text-lg">Generating quiz...</p>
        </div>
      </div>
    );
  }

  if (done) {
    const emoji = accuracy >= 90 ? '🦁' : accuracy >= 80 ? '🦊' : accuracy >= 60 ? '🐼' : '🐢';
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-slate-900 p-8 font-sans text-white">
        <div className="text-center space-y-4">
          <div className="text-8xl mb-6">{emoji}</div>
          <h1 className="text-4xl font-black tracking-tight">Quiz Complete!</h1>
          <p className="text-slate-400 text-lg">Your knowledge is growing.</p>
        </div>

        <Card className="w-full max-w-sm border border-slate-700 bg-slate-800 rounded-3xl overflow-hidden p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-4xl font-black text-violet-400">{accuracy}%</div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Accuracy</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">{score.correct}/{total}</div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Score</div>
            </div>
          </div>

          {/* XP earned */}
          {xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
              <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="font-black text-yellow-300 text-lg">+{xpEarned} XP</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(score.correct / total) * 100}%` }} />
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${(score.wrong / total) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <span className="text-emerald-400">{score.correct} Correct</span>
              <span className="text-rose-400">{score.wrong} Wrong</span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link href="/student" className="flex-1">
            <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800">
              <ChevronLeft className="mr-2 h-5 w-5" /> Dashboard
            </Button>
          </Link>
          <Button
            className="flex-1 h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-900/50 transition-all active:scale-95"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Retake
          </Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-8 bg-slate-900 font-sans text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <Brain className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Not enough words</h2>
        <p className="text-slate-400 max-w-xs mx-auto mb-8">You need at least 2 words in your library to start a quiz.</p>
        <Link href="/student">
          <Button className="h-14 px-8 rounded-2xl font-black bg-violet-600">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const correctChoice = getCorrectChoice(current, mode);

  return (
    <div className="min-h-dvh flex flex-col bg-slate-900 font-sans text-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-[62px] z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md sm:p-6">
        <Link href="/student">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-violet-400 font-bold rounded-xl transition-colors">
            <ChevronLeft className="h-5 w-5" /> Quit
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-black text-white">
          <Brain className="h-6 w-6 text-violet-400" />
          <span className="tracking-tight">MINIQUIZ</span>
        </div>
        <div className="px-4 py-1.5 bg-violet-600 text-white rounded-full text-xs font-black tracking-widest uppercase">
          {progress + 1} / {total}
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 py-3">
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all duration-700 rounded-full"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center px-6 pb-2">
        <div className="flex bg-slate-800 rounded-full p-1 gap-1 text-xs font-black">
          <button
            onClick={() => setMode('meaning_to_word')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              mode === 'meaning_to_word'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nghĩa → Từ
          </button>
          <button
            onClick={() => setMode('word_to_meaning')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              mode === 'word_to_meaning'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Từ → Nghĩa
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-8">
        {/* Question card */}
        <Card className="w-full max-w-lg border border-slate-700 bg-slate-800 rounded-[32px] shadow-2xl text-center p-10 relative">
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] whitespace-nowrap">
            {mode === 'meaning_to_word' ? 'Chọn từ tiếng Anh đúng' : 'Chọn nghĩa đúng'}
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white break-words w-full mb-5 mt-4">
            {mode === 'meaning_to_word' ? current.translation : current.word}
          </h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {current.pos && (
              <Badge className="bg-violet-900/50 text-violet-300 border border-violet-700/50 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                {current.pos}
              </Badge>
            )}
            {mode === 'word_to_meaning' && current.ipa && (
              <span className="text-lg text-slate-400 font-mono tracking-wider">{parseIpa(current.ipa)}</span>
            )}
          </div>
        </Card>

        {/* Answer choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {choices.map((choice, i) => {
            const isCorrect = choice === correctChoice;
            const isSelected = selected === choice;
            const isShaking = shakingIdx === i;

            let btnClasses = 'h-auto min-h-[72px] px-5 py-4 rounded-2xl text-base font-bold transition-all duration-300 border-2 relative ';

            if (selected) {
              if (isCorrect) {
                btnClasses += 'bg-emerald-900/50 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-900/30 scale-[1.03] z-10 ';
              } else if (isSelected) {
                btnClasses += 'bg-rose-900/50 border-rose-500 text-rose-300 ';
              } else {
                btnClasses += 'opacity-30 border-transparent bg-transparent text-slate-500 ';
              }
            } else {
              btnClasses += 'bg-slate-800 border-slate-700 text-slate-200 hover:border-violet-500 hover:bg-slate-700 hover:scale-[1.02] shadow-sm ';
            }

            if (isShaking) {
              btnClasses += 'animate-shake ';
            }

            return (
              <button
                key={`${choice}-${i}`}
                disabled={!!selected}
                onClick={() => handleSelect(choice, i)}
                className={btnClasses}
              >
                {/* Keyboard hint badge */}
                {!selected && (
                  <span className="absolute top-2 left-3 text-[10px] font-black text-slate-600 bg-slate-700 rounded px-1">{i + 1}</span>
                )}
                <span className="flex items-center justify-center gap-2 text-center leading-snug">
                  {choice}
                  {selected && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 animate-in zoom-in-50 duration-300" />
                  )}
                  {selected && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 animate-in zoom-in-50 duration-300" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        {!selected && (
          <p className="text-[11px] text-slate-600 font-medium">
            Bấm phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">4</kbd> để chọn
          </p>
        )}

        {/* Explanation panel */}
        {showExplanation && current.explanation && (
          <div className="w-full max-w-lg bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300 leading-relaxed">{current.explanation}</p>
            </div>
          </div>
        )}

        {/* Nút Tiếp theo — bỏ chờ auto-advance */}
        {selected && (
          <button
            type="button"
            onClick={skipNext}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full px-5 py-2.5 transition-colors animate-in fade-in duration-500"
          >
            Tiếp theo <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <StudentShell title="Mini Quiz" contentClassName="p-0" hideMobileNav>
      <Suspense fallback={
        <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-900">
          <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
        </div>
      }>
        <QuizContent />
      </Suspense>
    </StudentShell>
  );
}
