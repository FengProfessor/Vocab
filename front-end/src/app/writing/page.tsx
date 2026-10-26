import { VocabApi } from '@/features/vocab/api';
import { authService } from '@/features/auth/session';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from '@/shared/router/navigation';
import { supabase, type SRSProgress } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Loader2,
  RotateCcw,
  Pencil,
  ArrowRight,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import Link from '@/shared/router/navigation';
import { toast } from 'sonner';
import {
  levenshtein,
  verdictToQuality,
  parseIpa,
  canAutoFocus,
  speak,
  type Verdict,
} from '@/lib/study';
import { stopWordAudio } from '@/lib/audio';
import { StudentShell } from '@/components/student/StudentShell';

interface WordItem {
  id: string;
  word: string;
  translation: string;
  ipa: string;
  pos: string;
  example: string;
  image_url?: string;
  isDue: boolean;
  reviewCount: number;
  srsLevel: number;
  mastery: number;
  srs: SRSProgress | null;
}

function WritingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassroomId = searchParams.get('class');

  const [userId, setUserId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(initialClassroomId);
  const queueRef = useRef<WordItem[]>([]);
  const [current, setCurrent] = useState<WordItem | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [done, setDone] = useState(false);

  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [results, setResults] = useState({ correct: 0, close: 0, wrong: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceFn = useRef<(() => void) | null>(null);
  const lastSubmitAtRef = useRef<number>(0);

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

        const url = classroomId
          ? `/api/words?classroomId=${classroomId}&filter=review&limit=30`
          : `/api/words?filter=review&limit=30`;

        const res = await VocabApi.getWords(url);
        const data = await res.json();

        if (data.success && data.data) {
          if (!classroomId && data.classroomId) setClassroomId(data.classroomId);

          const all: WordItem[] = data.data;
          const due = all.filter(
            (w) =>
              w.word &&
              w.translation &&
              !w.translation.includes('failed') &&
              !w.translation.includes('Analyzing'),
          );

          if (due.length === 0) {
            setIsLoading(false);
            return;
          }

          queueRef.current = [...due];
          setCurrent(due[0] || null);
          setTotal(due.length);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Writing] Load failed:', msg);
        toast.error('Không tải được danh sách từ.');
      } finally {
        setIsLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassroomId]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      stopWordAudio();
    };
  }, []);

  const goNext = useCallback(
    (wasWrong = false) => {
      advanceFn.current = null;
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
      stopWordAudio();

      const head = queueRef.current[0];
      const newQueue = queueRef.current.slice(1);
      if (wasWrong && head) newQueue.push(head);
      queueRef.current = newQueue;
      setCurrent(newQueue[0] || null);
      if (newQueue.length === 0) setDone(true);
      if (!wasWrong) setProgress((p) => Math.min(p + 1, total));
      setInput('');
      setVerdict(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [total],
  );

  const skipWait = useCallback(() => {
    if (verdict === null) return;
    if (Date.now() - lastSubmitAtRef.current < 350) return;
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    advanceFn.current?.();
  }, [verdict]);

  const handleSubmit = useCallback(() => {
    if (!current || !userId || verdict !== null) return;

    const guess = input.trim().toLowerCase();
    if (!guess) return;
    const answer = current.word.trim().toLowerCase();

    lastSubmitAtRef.current = Date.now();
    let v: Verdict;
    if (guess === answer) v = 'correct';
    else if (levenshtein(guess, answer) <= 2) v = 'close';
    else v = 'wrong';

    setVerdict(v);
    setResults((prev) => ({
      correct: v === 'correct' ? prev.correct + 1 : prev.correct,
      close: v === 'close' ? prev.close + 1 : prev.close,
      wrong: v === 'wrong' ? prev.wrong + 1 : prev.wrong,
    }));

    const quality = verdictToQuality(v);
    VocabApi.submitSrsReview({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: current.id, quality }),
    }).catch((err) => console.error('[Writing] Failed to save SRS:', err));

    const advance = () => {
      if (advanceFn.current !== advance) return;
      advanceFn.current = null;
      goNext(v === 'wrong');
    };
    advanceFn.current = advance;

    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    speak(current.word, 1.0);
  }, [current, userId, verdict, input, goNext]);

  useEffect(() => {
    if (!done || !userId) return;
    (async () => {
      try {
        await VocabApi.saveQuizResult({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classroomId,
            score: results.correct,
            totalQuestions: total,
            quizType: 'vocabulary',
          }),
        });
      } catch (err) {
        console.error('[Writing] Failed to save session:', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (verdict === null) handleSubmit();
      else skipWait();
    } else if (e.key === ' ' && verdict !== null) {
      e.preventDefault();
      e.stopPropagation();
      skipWait();
    }
  };

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (verdict === null || done || isLoading || !current) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        skipWait();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [verdict, done, isLoading, current, skipWait]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Đang chuẩn bị bài luyện gõ từ...
          </p>
        </div>
      </div>
    );
  }

  // Không có từ due
  if (!current && !done) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 p-6 font-sans text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 shadow-sm">
          <Sparkles className="h-10 w-10" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Không có từ cần ôn gõ hôm nay
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Bạn đã hoàn thành toàn bộ danh sách từ đến hạn. Hãy học từ mới hoặc quay lại sau nhé!
          </p>
        </div>
        <Button
          variant="outline"
          className="h-12 px-6 rounded-2xl font-bold border-slate-200 dark:border-slate-800"
          onClick={() => router.push('/student')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Về trang chủ
        </Button>
      </div>
    );
  }

  // Summary
  if (done) {
    const accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 p-6 font-sans">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/60 text-amber-500 shadow-sm">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hoàn thành phiên luyện gõ!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
            Độ chính xác chính tả: <span className="text-indigo-600 dark:text-indigo-400 font-black">{accuracy}%</span>
          </p>
        </div>

        <Card className="w-full max-w-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                {
                  label: 'Chính xác',
                  val: results.correct,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/50',
                },
                {
                  label: 'Gần đúng',
                  val: results.close,
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50',
                },
                {
                  label: 'Cần ôn lại',
                  val: results.wrong,
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/50',
                },
              ].map((r) => (
                <div key={r.label} className={`${r.bg} border rounded-2xl p-3.5`}>
                  <div className={`text-2xl font-black tabular-nums ${r.color}`}>{r.val}</div>
                  <div className={`text-[10px] uppercase font-extrabold tracking-wider ${r.color} mt-0.5`}>
                    {r.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl font-bold border-slate-200 dark:border-slate-800"
            onClick={() => router.push('/student')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button
            className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Luyện lại
          </Button>
        </div>
      </div>
    );
  }

  const word = current!;

  const cardTone =
    verdict === 'correct'
      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
      : verdict === 'close'
        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20'
        : verdict === 'wrong'
          ? 'border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20'
          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900';

  const inputTone =
    verdict === 'correct'
      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
      : verdict === 'close'
        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
        : verdict === 'wrong'
          ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 animate-shake'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:border-indigo-500';

  return (
    <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sub-header */}
      <div className="mx-auto w-full max-w-xl px-4 pt-4 sm:pt-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Link
            href="/review"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Trung tâm ôn tập
          </Link>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200">
            <Pencil className="h-3.5 w-3.5 text-indigo-500" /> Luyện gõ chính tả
          </div>
          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black text-white tabular-nums">
            {Math.min(progress + 1, total)} / {total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
            style={{ width: `${(progress / Math.max(1, total)) * 100}%` }}
          />
        </div>
      </div>

      {/* Studio Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-6">
        <Card
          className={`relative w-full max-w-xl border-2 rounded-3xl p-6 sm:p-10 text-center shadow-sm transition-colors duration-300 ${cardTone}`}
        >
          <CardContent className="p-0 w-full flex flex-col items-center gap-5">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full">
                Gõ từ tiếng Anh tương ứng
              </Badge>
              {verdict !== null && (
                <button
                  type="button"
                  onClick={() => speak(word.word, 1.0)}
                  aria-label="Nghe phát âm"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 hover:scale-105 transition-transform cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Prompt: nghĩa tiếng Việt */}
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white break-words w-full px-2">
              {word.translation}
            </h2>

            {/* Hint: POS + IPA */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {word.pos && (
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-lg">
                  {word.pos}
                </Badge>
              )}
              {word.ipa && (
                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                  {parseIpa(word.ipa)}
                </span>
              )}
            </div>

            {/* Input */}
            <div className="w-full mt-1">
              <input
                ref={inputRef}
                type="text"
                autoFocus={canAutoFocus()}
                value={input}
                readOnly={verdict !== null}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập từ tiếng Anh..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={`w-full text-center text-xl sm:text-3xl font-black p-4 rounded-2xl border-2 focus:outline-none transition-colors read-only:opacity-95 ${inputTone}`}
              />
            </div>

            {/* Feedback */}
            {verdict !== null && (
              <div
                className="w-full rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-pointer"
                onClick={skipWait}
              >
                {verdict === 'correct' && (
                  <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>
                      Chính xác! <span className="underline">{word.word}</span>
                    </span>
                  </p>
                )}
                {verdict === 'close' && (
                  <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>
                      Gần đúng! Đáp án chuẩn: <span className="underline">{word.word}</span>
                    </span>
                  </p>
                )}
                {verdict === 'wrong' && (
                  <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <span>
                      Chưa đúng! Đáp án: <span className="underline">{word.word}</span>
                    </span>
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Nhấn <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> hoặc <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Space</kbd> để sang từ tiếp theo
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="w-full max-w-xl">
          {verdict === null ? (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Kiểm tra đáp án
            </button>
          ) : (
            <button
              onClick={skipWait}
              className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-base shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Tiếp theo <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WritingPage() {
  return (
    <StudentShell title="Luyện gõ từ vựng" contentClassName="p-0" hideMobileNav>
      <Suspense
        fallback={
          <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        }
      >
        <WritingContent />
      </Suspense>
    </StudentShell>
  );
}
