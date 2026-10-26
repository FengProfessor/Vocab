import { VocabApi } from '@/features/vocab/api';
import { authService } from '@/features/auth/session';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from '@/shared/router/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Lightbulb,
  Zap,
  ArrowRight,
  Trophy,
  Volume2,
} from 'lucide-react';
import Link from '@/shared/router/navigation';
import { toast } from 'sonner';
import { XP_PER_CORRECT_QUIZ } from '@/lib/gamification';
import { StudentShell } from '@/components/student/StudentShell';
import { parseIpa, speak } from '@/lib/study';

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

function buildChoices(correct: WordItem, all: WordItem[], mode: QuizMode): string[] {
  if (mode === 'meaning_to_word') {
    const others = shuffle(all.filter((w) => w.id !== correct.id))
      .slice(0, 3)
      .map((w) => w.word);
    return shuffle([correct.word, ...others]);
  } else {
    const others = shuffle(all.filter((w) => w.id !== correct.id))
      .slice(0, 3)
      .map((w) => w.translation);
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
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);

  const advanceRef = useRef<(() => void) | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current && words.length) {
      setChoices(buildChoices(current, words, mode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await authService.getUser();
        if (error) return;
        if (!user) {
          router.replace('/auth');
          return;
        }
        setUserId(user.id);

        const url = classroomId ? `/api/words?classroomId=${classroomId}` : `/api/words`;
        const res = await VocabApi.getWords(url);
        const data = await res.json();

        if (data.success && data.data?.length >= 2) {
          if (!classroomId && data.classroomId) setClassroomId(data.classroomId);

          const all: WordItem[] = data.data;
          const readyWords = all.filter(
            (w) =>
              w.translation &&
              !w.translation.includes('failed') &&
              !w.translation.includes('Analyzing'),
          );

          if (readyWords.length < 2) {
            toast.error(
              'Cần ít nhất 2 từ đã được AI phân tích để làm Quiz. Hãy thêm từ mới trước nhé!',
            );
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
        toast.error('Không tải được bài trắc nghiệm.');
      } finally {
        setIsLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassroomId]);

  const handleSelect = useCallback(
    async (choice: string, choiceIdx: number) => {
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

      const delay = isCorrect ? 1200 : 3500;

      const advance = async () => {
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
        setProgress((prev) => prev + 1);

        if (newQueue.length === 0) {
          const totalXp = newScore.correct * XP_PER_CORRECT_QUIZ;
          setXpEarned(totalXp);

          try {
            await VocabApi.saveQuizResult({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                classroomId: classroomId || initialClassroomId,
                score: newScore.correct,
                totalQuestions: total,
                quizType: 'vocabulary',
                wordIds: words.map((w) => w.id),
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
    },
    [selected, current, mode, score, queue, words, classroomId, initialClassroomId, total],
  );

  const skipNext = useCallback(() => {
    void advanceRef.current?.();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (done || isLoading || !current) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < choices.length && !selected) {
          void handleSelect(choices[idx], idx);
        }
      }

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
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-violet-600 dark:text-violet-400 animate-spin" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Đang khởi tạo câu hỏi trắc nghiệm...
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 p-6 font-sans">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200/70 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 shadow-sm">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Hoàn thành bài Quiz!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Phản xạ từ vựng của bạn đang tiến bộ mỗi ngày.
          </p>
        </div>

        <Card className="w-full max-w-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-4xl font-black text-violet-600 dark:text-violet-400 tabular-nums">
                {accuracy}%
              </div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                Độ chính xác
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {score.correct}/{total}
              </div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                Câu đúng
              </div>
            </div>
          </div>

          {xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="font-black text-amber-700 dark:text-amber-300 text-base">
                +{xpEarned} XP Thưởng
              </span>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(score.correct / Math.max(1, total)) * 100}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${(score.wrong / Math.max(1, total)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">
                {score.correct} Đúng
              </span>
              <span className="text-rose-600 dark:text-rose-400">{score.wrong} Sai</span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link href="/student" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <Button
            className="flex-1 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-sm"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Làm đề mới
          </Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 font-sans text-center">
        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/60 border border-violet-200/70 dark:border-violet-800/60 rounded-3xl flex items-center justify-center mb-4 mx-auto">
          <Brain className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Chưa đủ từ vựng để tạo Quiz
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6 text-sm">
          Bạn cần có ít nhất 2 từ vựng trong sổ từ để bắt đầu bài kiểm tra phản xạ.
        </p>
        <Link href="/student">
          <Button className="h-12 px-6 rounded-2xl font-bold bg-violet-600 hover:bg-violet-500 text-white">
            Về trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  const correctChoice = getCorrectChoice(current, mode);

  return (
    <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Bar */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-4 sm:pt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Thoát
          </Link>

          {/* Segmented Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('meaning_to_word')}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                mode === 'meaning_to_word'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nghĩa → Từ
            </button>
            <button
              type="button"
              onClick={() => setMode('word_to_meaning')}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                mode === 'word_to_meaning'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Từ → Nghĩa
            </button>
          </div>

          <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white tabular-nums">
            {progress + 1} / {total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 transition-all duration-500 rounded-full"
            style={{ width: `${(progress / Math.max(1, total)) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Quiz Arena */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl space-y-5">
          {/* Question Card */}
          <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm text-center p-7 sm:p-10 relative">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase text-violet-600 dark:text-violet-400 tracking-wider mb-3">
              <span>
                {mode === 'meaning_to_word'
                  ? 'Chọn từ tiếng Anh tương ứng'
                  : 'Chọn nghĩa tiếng Việt đúng'}
              </span>
              {(mode === 'word_to_meaning' || selected) && (
                <button
                  type="button"
                  onClick={() => speak(current.word, 1.0)}
                  aria-label="Phát âm từ"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300 hover:scale-105 transition-transform cursor-pointer"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white break-words w-full mb-4">
              {mode === 'meaning_to_word'
                ? current.translation?.trim() || '(Chọn từ tiếng Anh đúng)'
                : current.word}
            </h2>

            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {current.pos && (
                <Badge className="bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
                  {current.pos}
                </Badge>
              )}
              {mode === 'word_to_meaning' && current.ipa && (
                <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-mono">
                  {parseIpa(current.ipa)}
                </span>
              )}
            </div>
          </Card>

          {/* 2x2 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            {choices.map((choice, i) => {
              const isCorrect = choice === correctChoice;
              const isSelected = selected === choice;
              const isShaking = shakingIdx === i;

              let btnClasses =
                'group relative min-h-[72px] px-5 py-4 rounded-2xl text-sm sm:text-base font-bold transition-all duration-200 border-2 flex items-center justify-between gap-3 text-left cursor-pointer ';

              if (selected) {
                if (isCorrect) {
                  btnClasses +=
                    'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm ';
                } else if (isSelected) {
                  btnClasses +=
                    'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200 ';
                } else {
                  btnClasses +=
                    'opacity-45 border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 ';
                }
              } else {
                btnClasses +=
                  'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-sm ';
              }

              if (isShaking) {
                btnClasses += 'animate-shake ';
              }

              return (
                <button
                  key={`${choice}-${i}`}
                  disabled={!!selected}
                  onClick={() => void handleSelect(choice, i)}
                  className={btnClasses}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition-colors ${
                        selected && isCorrect
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : selected && isSelected
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:border-violet-400 group-hover:text-violet-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="leading-snug break-words">{choice}</span>
                  </div>

                  {selected && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {selected && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Keyboard Hint / Next Button */}
          <div className="flex flex-col items-center gap-3 pt-1">
            {!selected ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Mẹo: Nhấn phím số{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  1
                </kbd>
                –
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  4
                </kbd>{' '}
                trên bàn phím để chọn nhanh
              </p>
            ) : (
              <button
                type="button"
                onClick={skipNext}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold px-5 py-2.5 shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Câu tiếp theo <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Explanation Panel */}
            {showExplanation && current.explanation && (
              <div className="w-full rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {current.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <StudentShell title="Trắc nghiệm phản xạ" contentClassName="p-0" hideMobileNav>
      <Suspense
        fallback={
          <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />
          </div>
        }
      >
        <QuizContent />
      </Suspense>
    </StudentShell>
  );
}
