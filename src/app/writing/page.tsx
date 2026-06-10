'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, type SRSProgress } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Loader2, RotateCcw, Pencil, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { levenshtein, verdictToQuality, parseIpa, canAutoFocus, speak, type Verdict } from '@/lib/study';

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

const NEXT_DELAY_MS = 1500;  // delay tự chuyển khi đúng
const WRONG_DELAY_MS = 2400; // sai → đợi lâu hơn để kịp nhìn đáp án

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

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }
        setUserId(user.id);

        // Từ đã học & đến hạn (server lọc toàn bộ srs_progress, không kẹt pagination)
        const url = classroomId
          ? `/api/words?classroomId=${classroomId}&filter=review`
          : `/api/words?filter=review`;

        const res = await authFetch(url);
        const data = await res.json();

        if (data.success && data.data) {
          if (!classroomId && data.classroomId) setClassroomId(data.classroomId);

          const all: WordItem[] = data.data;
          // Server đã lọc từ đến hạn (filter=review); chỉ loại từ chưa enrich xong
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
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassroomId]);

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // wasWrong: từ sai quay lại cuối hàng để luyện lại (như flashcard); không tính tiến độ.
  const goNext = useCallback((wasWrong = false) => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }

    const head = queueRef.current[0];
    const newQueue = queueRef.current.slice(1);
    if (wasWrong && head) newQueue.push(head);
    queueRef.current = newQueue;
    setCurrent(newQueue[0] || null);
    if (newQueue.length === 0) setDone(true);
    if (!wasWrong) setProgress((p) => Math.min(p + 1, total));
    setInput('');
    setVerdict(null);
    // Refocus input cho từ tiếp theo
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [total]);

  // Bỏ qua thời gian đợi và chuyển đến từ tiếp theo (phải khai báo SAU goNext — tránh TDZ)
  const skipWait = useCallback(() => {
    if (verdict === null) return; // Chỉ skip khi đã chấm xong
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    goNext(verdict === 'wrong');
  }, [verdict, goNext]);

  const handleSubmit = useCallback(() => {
    if (!current || !userId || verdict !== null) return;

    const guess = input.trim().toLowerCase();
    if (!guess) return;
    const answer = current.word.trim().toLowerCase();

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
    // Phát âm từ vừa chấm để củng cố nghe (đồng bộ với LearnMode)
    speak(current.word, 1.0);

    // Background SRS sync (fire-and-forget)
    const quality = verdictToQuality(v);
    authFetch('/api/words/srs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: current.id, quality }),
    }).catch((err) => console.error('[Writing] Failed to save SRS:', err));

    // Auto next: sai → quay lại cuối hàng + đợi lâu hơn để nhìn đáp án
    advanceTimer.current = setTimeout(
      () => goNext(v === 'wrong'),
      v === 'correct' ? NEXT_DELAY_MS : WRONG_DELAY_MS,
    );
  }, [current, userId, verdict, input, goNext]);

  // Lưu session accuracy khi xong
  useEffect(() => {
    if (!done || !userId) return;
    (async () => {
      try {
        await authFetch('/api/quiz/save', {
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
      if (verdict === null) handleSubmit();
      else skipWait(); // Nhấn Enter khi đã chấm → bỏ qua đợi, tiếp theo ngay
    } else if (e.key === ' ' && verdict !== null) {
      e.preventDefault();
      skipWait(); // Nhấn Space khi đã chấm → bỏ qua đợi
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/40 font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-600 font-bold animate-pulse text-lg">Đang chuẩn bị...</p>
        </div>
      </div>
    );
  }

  // Không có từ due
  if (!current && !done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans">
        <div className="text-center space-y-3">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Không có từ cần ôn</h1>
          <p className="text-slate-500 text-lg font-medium">Hôm nay bạn đã luyện hết rồi!</p>
        </div>
        <Button
          variant="outline"
          className="h-14 px-8 rounded-2xl font-bold border-2 hover:bg-slate-50 transition-all"
          onClick={() => router.push('/student')}
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Về dashboard
        </Button>
      </div>
    );
  }

  // Summary
  if (done) {
    const accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans">
        <div className="text-center space-y-3">
          <div className="text-7xl mb-4 animate-bounce">🥳</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hoàn thành!</h1>
          <p className="text-slate-500 text-lg font-medium">Độ chính xác: {accuracy}%</p>
        </div>

        <Card className="w-full max-w-sm border-none shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Đúng', val: results.correct, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Gần đúng', val: results.close, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Sai', val: results.wrong, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((r) => (
                <div key={r.label} className={`${r.bg} rounded-2xl p-4`}>
                  <div className={`text-2xl font-black ${r.color}`}>{r.val}</div>
                  <div className={`text-[10px] uppercase font-black tracking-widest ${r.color} mt-1 opacity-70`}>
                    {r.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${accuracy}%` }} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-2xl font-bold border-2 hover:bg-slate-50 transition-all"
            onClick={() => router.push('/student')}
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Dashboard
          </Button>
          <Button
            className="flex-1 h-14 rounded-2xl bg-primary hover:brightness-110 text-white font-bold shadow-lg border-b-4 border-primary/60 active:translate-y-0.5 active:border-b-0 transition-all"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Luyện lại
          </Button>
        </div>
      </div>
    );
  }

  // current chắc chắn tồn tại tại đây
  const word = current!;

  // Màu nền card theo verdict
  const cardBg =
    verdict === 'correct'
      ? 'bg-emerald-50 border-emerald-300'
      : verdict === 'close'
        ? 'bg-amber-50 border-amber-300'
        : verdict === 'wrong'
          ? 'bg-rose-50 border-rose-300'
          : 'bg-white border-slate-200';

  const inputBorder =
    verdict === 'correct'
      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
      : verdict === 'close'
        ? 'border-amber-400 bg-amber-50 text-amber-700'
        : verdict === 'wrong'
          ? 'border-rose-400 bg-rose-50 text-rose-700 animate-shake'
          : 'border-slate-200 bg-slate-50 focus:border-indigo-500';

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 font-sans">
      <header className="flex items-center justify-between p-4 sm:p-6 bg-white/50 backdrop-blur-md sticky top-0 z-10 gap-3">
        <Link href="/student">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-primary font-bold rounded-xl transition-colors"
          >
            <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-black text-slate-700">
          <Pencil className="h-4 w-4 text-indigo-500" /> Writing Practice
        </div>
        <div className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-black tracking-widest">
          {Math.min(progress + 1, total)} / {total}
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 mt-2">
        <div className="h-2.5 w-full bg-white rounded-full overflow-hidden shadow-sm border border-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <Card
          className={`relative w-full max-w-[480px] border-2 shadow-2xl shadow-indigo-100 flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-[40px] border-b-8 transition-colors duration-300 ${cardBg}`}
        >
          <CardContent className="p-0 w-full flex flex-col items-center gap-5">
            <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              ✍️ Gõ từ tiếng Anh
            </Badge>

            {/* Prompt: nghĩa tiếng Việt */}
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 break-words w-full px-2">
              {word.translation}
            </h2>

            {/* Hint: IPA + POS */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {word.pos && (
                <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase tracking-widest px-3">
                  {word.pos}
                </Badge>
              )}
              {word.ipa && <p className="text-sm font-mono text-slate-400">{parseIpa(word.ipa)}</p>}
            </div>

            {/* Input */}
            <div className="w-full mt-2">
              <input
                ref={inputRef}
                type="text"
                autoFocus={canAutoFocus()}
                value={input}
                readOnly={verdict !== null}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Gõ từ tiếng Anh..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={`w-full text-center text-2xl sm:text-3xl font-black p-4 rounded-2xl border-4 focus:outline-none transition-colors read-only:opacity-90 ${inputBorder}`}
              />
            </div>

            {/* Feedback */}
            {verdict !== null && (
              <div
                className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer"
                onClick={skipWait}
              >
                {verdict === 'correct' && (
                  <p className="text-lg font-black text-emerald-600">
                    ✓ Chính xác! <span className="underline decoration-emerald-400">{word.word}</span>
                  </p>
                )}
                {verdict === 'close' && (
                  <p className="text-lg font-black text-amber-600">
                    Gần đúng! Đáp án:{' '}
                    <span className="underline decoration-amber-400">{word.word}</span>
                  </p>
                )}
                {verdict === 'wrong' && (
                  <p className="text-lg font-black text-rose-600">
                    ✗ Đáp án: <span className="underline decoration-rose-400">{word.word}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Nhấn Enter hoặc chạm để tiếp tục →</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action button */}
        <div className="w-full max-w-[480px]">
          {verdict === null ? (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-full h-16 rounded-[28px] bg-indigo-600 border-b-4 border-indigo-800 text-white font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={() => goNext(verdict === 'wrong')}
              className="w-full h-16 rounded-[28px] bg-white border-b-4 border-slate-200 text-slate-800 font-black text-lg shadow-sm hover:bg-slate-50 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2"
            >
              Tiếp theo <ArrowRight className="h-5 w-5" />
              <span className="text-[10px] font-bold text-slate-400 normal-case">(Space / Enter)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WritingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      }
    >
      <WritingContent />
    </Suspense>
  );
}
