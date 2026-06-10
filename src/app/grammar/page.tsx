'use client';

import { useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { GrammarExercise } from '@/lib/supabase';
import {
  Brain, ChevronLeft, CheckCircle2, XCircle, Lightbulb, Loader2, RotateCcw, Home, Sparkles, Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

/**
 * Đọc câu tiếng Anh bằng Web Speech API (free, native).
 */
function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  utter.pitch = 1;
  synth.speak(utter);
}

/**
 * Render text có chứa **bold** markdown và "___" blank.
 * Không dùng react-markdown vì chỉ cần 2 features đơn giản, tránh dependency overhead.
 */
function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split theo **bold** trước
  const boldSegs = text.split(/(\*\*[^*]+\*\*)/g);
  boldSegs.forEach((seg, i) => {
    if (/^\*\*[^*]+\*\*$/.test(seg)) {
      nodes.push(
        <strong key={`b-${i}`} className="text-primary font-extrabold">
          {seg.slice(2, -2)}
        </strong>,
      );
      return;
    }
    // Trong text thường, thay "___" (3+ underscore) thành blank box visual
    const blankSegs = seg.split(/(_{3,})/g);
    blankSegs.forEach((bs, j) => {
      if (/^_{3,}$/.test(bs)) {
        nodes.push(
          <span
            key={`bl-${i}-${j}`}
            className="inline-block min-w-[3.5rem] px-2 mx-1 border-b-4 border-dashed border-primary/60 align-baseline"
            aria-label="Chỗ trống cần điền"
          />,
        );
      } else if (bs) {
        nodes.push(<span key={`t-${i}-${j}`}>{bs}</span>);
      }
    });
  });
  return nodes;
}

/**
 * Tách câu thành tokens, đánh dấu token nào nằm trong optionSet để click chọn.
 * Dùng cho error_correction UI: user click trực tiếp từ SAI trong câu.
 */
function ErrorCorrectionSentence({
  sentence,
  options,
  selected,
  correctAnswer,
  onSelect,
}: {
  sentence: string;
  options: string[];
  selected: string | null;
  correctAnswer: string;
  onSelect: (token: string) => void;
}) {
  // Bóc prefix "Find the error: " nếu có
  const cleanSentence = sentence.replace(/^find\s+the\s+error:\s*/i, '');
  // Split giữ punctuation và whitespace
  const tokens = cleanSentence.split(/(\s+|[,.!?;:"])/);
  const optionSet = new Set(options);
  const clickedFirstIdx = new Map<string, number>();
  tokens.forEach((tok, i) => {
    if (optionSet.has(tok) && !clickedFirstIdx.has(tok)) clickedFirstIdx.set(tok, i);
  });

  return (
    <p className="text-xl font-semibold text-foreground leading-loose">
      {tokens.map((tok, i) => {
        const isClickable = optionSet.has(tok) && clickedFirstIdx.get(tok) === i;
        if (!isClickable) return <span key={i}>{tok}</span>;

        const isSel = selected === tok;
        const isCorrect = tok === correctAnswer;
        let cn = 'inline-block mx-0.5 px-1.5 py-0.5 rounded-md border-b-2 transition-all ';
        if (selected) {
          if (isCorrect) cn += 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold ';
          else if (isSel) cn += 'bg-red-100 border-red-500 text-red-900 line-through ';
          else cn += 'opacity-40 border-transparent ';
        } else {
          cn += 'border-dashed border-primary/50 hover:bg-primary/10 hover:border-primary cursor-pointer ';
        }
        return (
          <button
            key={i}
            className={cn}
            disabled={!!selected}
            onClick={() => onSelect(tok)}
            type="button"
          >
            {tok}
          </button>
        );
      })}
    </p>
  );
}

// Animate progress bar width: dùng inline style transition, không cần thư viện
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="px-4 sm:px-8 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          Câu {current} / {total}
        </span>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Flash overlay — hiện brief khi đúng/sai
function FeedbackFlash({ type }: { type: 'correct' | 'wrong' | null }) {
  if (!type) return null;
  return (
    <div
      className={[
        'fixed inset-0 pointer-events-none z-50 transition-opacity duration-300',
        type === 'correct' ? 'bg-emerald-400/20' : 'bg-red-400/20',
      ].join(' ')}
    />
  );
}

// Score card hiển thị khi done
function ScoreCard({
  correct,
  total,
  onRetry,
  backHref,
}: {
  correct: number;
  total: number;
  onRetry: () => void;
  backHref: string;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const emoji = accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎯' : '💪';
  const label = accuracy >= 80 ? 'Xuất sắc!' : accuracy >= 60 ? 'Khá tốt!' : 'Cố lên!';

  // Vẽ vòng tròn accuracy bằng SVG stroke-dashoffset
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (accuracy / 100) * circumference;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-primary/5 to-muted/40 p-6">
      {/* Hero */}
      <div className="text-center">
        <div className="text-6xl mb-3">{emoji}</div>
        <h1 className="text-3xl font-bold mb-1">Grammar Drill Complete!</h1>
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>

      {/* Accuracy ring + stats */}
      <div className="bg-background border rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center gap-5">
        {/* SVG ring */}
        <div className="relative flex items-center justify-center">
          <svg width="100" height="100" className="-rotate-90">
            <circle cx="50" cy="50" r={r} stroke="currentColor" strokeWidth="8" fill="none"
              className="text-muted" />
            <circle
              cx="50" cy="50" r={r}
              stroke="currentColor" strokeWidth="8" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={accuracy >= 60 ? 'text-emerald-500' : 'text-red-500'}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <span className="absolute text-2xl font-bold">{accuracy}%</span>
        </div>

        {/* Correct / Wrong */}
        <div className="grid grid-cols-2 gap-4 w-full text-center">
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-600">{correct}</div>
            <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đúng
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-red-600">{total - correct}</div>
            <div className="text-xs text-red-700 font-semibold mt-1 flex items-center justify-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Sai
            </div>
          </div>
        </div>

        {/* Accuracy bar */}
        <div className="w-full">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${accuracy}%`,
                backgroundColor: accuracy >= 60 ? 'var(--color-emerald-500, #10b981)' : 'var(--color-red-500, #ef4444)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm">
        <Link href={backHref} className="flex-1">
          <button className="w-full border rounded-xl px-4 py-3 font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm">
            <Home className="h-4 w-4" /> Về trang học
          </button>
        </Link>
        <button
          onClick={onRetry}
          className="flex-1 bg-primary text-white rounded-xl px-4 py-3 font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <RotateCcw className="h-4 w-4" /> Làm lại
        </button>
      </div>
    </main>
  );
}

function GrammarContent() {
  const searchParams = useSearchParams();
  const classroomId = searchParams.get('class');
  const lessonId = searchParams.get('lesson');
  const reviewMode = searchParams.get('review') === '1';

  const [exercises, setExercises] = useState<GrammarExercise[]>([]);
  const [current, setCurrent] = useState<GrammarExercise | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [userId, setUserId] = useState<string | null>(null);
  // flash: null | 'correct' | 'wrong' — tự tắt sau 400ms
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nguồn exercises thô (chưa shuffle) để có thể reset
  const rawExercises = useRef<GrammarExercise[]>([]);
  // State cho AI quiz generation (student self-practice)
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Mode 1: review câu sai
      if (reviewMode) {
        if (!user) {
          toast.error('Cần đăng nhập để ôn câu sai.');
          setIsLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/grammar/review?days=14', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          rawExercises.current = data.data;
          startSession(data.data);
        } else {
          toast.success('Tuyệt vời! Bạn không có câu sai nào trong 14 ngày qua.');
        }
        setIsLoading(false);
        return;
      }

      // Mode 2: drill theo classroom / lesson
      if (!classroomId && !lessonId) { setIsLoading(false); return; }

      const params = new URLSearchParams();
      if (classroomId) params.set('classroomId', classroomId);
      if (lessonId) params.set('lessonId', lessonId);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/grammar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        rawExercises.current = data.data;
        startSession(data.data);
      } else {
        toast.error('Chưa có bài tập grammar cho lớp này.');
      }
      setIsLoading(false);
    };
    init();
  }, [classroomId, lessonId, reviewMode]);

  const startSession = (source: GrammarExercise[]) => {
    const shuffled = [...source].sort(() => Math.random() - 0.5).slice(0, 10);
    setExercises(shuffled);
    setCurrent(shuffled[0]);
    setQIndex(0);
    setSelected(null);
    setShowExplanation(false);
    setScore({ correct: 0, wrong: 0 });
    setDone(false);
    setStartTime(Date.now());
    setFlash(null);
  };

  const handleRetry = () => {
    startSession(rawExercises.current);
  };

  /**
   * Gọi AI tạo 5 câu hỏi quiz từ bài học (student self-practice, không cần classroom).
   * Route /api/grammar/quiz trả về QuizQuestion[] không lưu DB.
   */
  const generateAIQuiz = async () => {
    if (!lessonId) return;
    setGeneratingQuiz(true);
    try {
      // Gửi kèm token để server resolve gói (gate Premium khi đã bật enforcement)
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/grammar/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ lessonId }),
      });
      const data = await res.json() as { success: boolean; data?: GrammarExercise[]; error?: string; upgradeTo?: string };

      // Bị chặn vì chưa đủ gói → upsell thay vì báo lỗi chung
      if (res.status === 403 || data.error === 'premium_required') {
        track('premium_gate_hit', { feature: 'grammar_ai', upgradeTo: data.upgradeTo ?? 'premium' });
        toast.error('Tính năng AI tạo bài tập ngữ pháp thuộc gói Premium. Nâng cấp để dùng nhé!');
        return;
      }

      if (data.success && data.data && data.data.length > 0) {
        rawExercises.current = data.data;
        startSession(data.data);
        track('grammar_quiz_generated', { lessonId, count: data.data.length });
        toast.success('Đã tạo bài tập! Bắt đầu thôi!');
      } else {
        toast.error(data.error ?? 'Không thể tạo bài tập. Thử lại sau.');
      }
    } catch {
      toast.error('Lỗi kết nối. Thử lại sau.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const triggerFlash = (type: 'correct' | 'wrong') => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(type);
    flashTimer.current = setTimeout(() => setFlash(null), 400);
  };

  const handleAnswer = async (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setShowExplanation(true);
    const isCorrect = choice === current?.correct_answer;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
    triggerFlash(isCorrect ? 'correct' : 'wrong');

    // Lưu kết quả vào Supabase — chỉ khi exercise có UUID thật (không phải AI-generated "ai-0", "ai-1")
    const isRealUuid = current && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current.id);
    if (userId && current && isRealUuid) {
      await supabase.from('grammar_results').insert({
        user_id: userId,
        exercise_id: current.id,
        chosen_answer: choice,
        time_taken_ms: Date.now() - startTime,
      });
    }
  };

  const submitGrammarProgress = async (finalCorrect: number, total: number) => {
    if (!lessonId || !userId) return;
    const accuracy = total > 0 ? finalCorrect / total : 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/grammar/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ lessonId, accuracy }),
      });
    } catch {
      /* bỏ qua lỗi — không chặn UI */
    }
  };

  const handleNext = () => {
    const nextIdx = qIndex + 1;
    if (nextIdx >= exercises.length) {
      // Tính score cuối từ state hiện tại (đã updated trong handleAnswer)
      setDone(true);
      const total = score.correct + score.wrong;
      submitGrammarProgress(score.correct, total);
      track('grammar_quiz_completed', {
        correct: score.correct,
        total,
        accuracy: total > 0 ? Math.round((score.correct / total) * 100) : 0,
        mode: reviewMode ? 'review' : lessonId ? 'lesson' : 'classroom',
      });
    } else {
      setQIndex(nextIdx);
      setCurrent(exercises[nextIdx]);
      setSelected(null);
      setShowExplanation(false);
      setStartTime(Date.now());
    }
  };

  /* ── Loading ──────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Đang tải bài tập...</p>
        </div>
      </main>
    );
  }

  /* ── Empty state ──────────────────────────────────────────── */
  if ((!classroomId && !lessonId && !reviewMode) || exercises.length === 0) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-muted/40 p-6">
        <Brain className="h-16 w-16 text-muted-foreground/20" />
        <h2 className="text-xl font-bold">
          {reviewMode ? 'Không có câu sai để ôn' : 'Chưa có bài tập'}
        </h2>
        {reviewMode ? (
          <>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              Bạn chưa làm sai câu nào trong 14 ngày qua. Tuyệt vời! 🎉
            </p>
            <Link href="/grammar/learn">
              <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                Học bài mới
              </button>
            </Link>
          </>
        ) : lessonId ? (
          <>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              Bài học này chưa có câu hỏi. Dùng AI để tạo 5 câu hỏi từ nội dung bài ngay bây giờ!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={generateAIQuiz}
                disabled={generatingQuiz}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generatingQuiz ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo bài tập...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> AI Tạo bài tập</>
                )}
              </button>
              <Link href="/grammar/learn">
                <button className="w-full border px-6 py-3 rounded-xl font-semibold hover:bg-muted transition-colors text-sm">
                  ← Quay lại
                </button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              Giáo viên chưa tạo bài tập grammar cho lớp này.
            </p>
            <Link href="/student">
              <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                Về Dashboard
              </button>
            </Link>
          </>
        )}
      </main>
    );
  }

  /* ── Done / Score card ────────────────────────────────────── */
  if (done) {
    return (
      <ScoreCard
        correct={score.correct}
        total={score.correct + score.wrong}
        onRetry={handleRetry}
        backHref={reviewMode ? '/grammar/learn' : lessonId ? '/grammar/learn' : '/student'}
      />
    );
  }

  if (!current) return null;

  /* ── Quiz ─────────────────────────────────────────────────── */
  return (
    <main className="min-h-dvh flex flex-col bg-gradient-to-br from-primary/5 to-muted/40">
      {/* Flash overlay */}
      <FeedbackFlash type={flash} />

      {/* Header */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link href={reviewMode || lessonId ? '/grammar/learn' : '/student'}>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </Link>
        <h1 className="flex items-center gap-2 font-bold text-primary text-base">
          <Brain className="h-5 w-5" /> {reviewMode ? 'Ôn câu sai' : 'Grammar Drill'}
        </h1>
        {/* Score badges */}
        <div className="flex gap-2">
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> {score.correct}
          </span>
          <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> {score.wrong}
          </span>
        </div>
      </header>

      {/* Progress bar — tính dựa trên câu đã làm xong (sau khi selected) */}
      <ProgressBar
        current={selected ? qIndex + 1 : qIndex}
        total={exercises.length}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-5">
        {/* Question card */}
        <div
          className={[
            'w-full max-w-lg bg-background border rounded-2xl p-6 shadow-2xl shadow-primary/10 transition-all duration-300',
            selected
              ? selected === current.correct_answer
                ? 'border-emerald-400 shadow-emerald-100'
                : 'border-red-300 shadow-red-100'
              : '',
          ].join(' ')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                {current.topic} · {current.level}
                {current.type === 'error_correction' && ' · TÌM LỖI'}
                {current.type === 'fill_blank' && ' · ĐIỀN CHỖ TRỐNG'}
              </p>
              <button
                type="button"
                onClick={() => {
                  const textToRead = current.question
                    .replace(/^find\s+the\s+error:\s*/i, '')
                    .replace(/_{2,}/g, 'something')
                    .replace(/\*\*([^*]+)\*\*/g, '$1');
                  speakEnglish(textToRead);
                }}
                className="h-6 w-6 flex items-center justify-center rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                title="Nghe phát âm câu hỏi"
              >
                <Volume2 className="h-3 w-3" />
              </button>
            </div>
            {/* Feedback icon ngay trên card */}
            {selected && (
              <span className={[
                'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg',
                selected === current.correct_answer
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700',
              ].join(' ')}>
                {selected === current.correct_answer
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Đúng!</>
                  : <><XCircle className="h-3.5 w-3.5" /> Sai</>}
              </span>
            )}
          </div>

          {current.type === 'error_correction' ? (
            <>
              <p className="text-xs text-muted-foreground mb-2 italic">
                🔍 Click vào từ <b>SAI</b> trong câu dưới đây:
              </p>
              <ErrorCorrectionSentence
                sentence={current.question}
                options={current.options}
                selected={selected}
                correctAnswer={current.correct_answer}
                onSelect={handleAnswer}
              />
            </>
          ) : (
            <p className="text-lg font-bold text-foreground leading-relaxed">
              {renderRichText(current.question)}
            </p>
          )}
        </div>

        {/* Choices — chỉ hiển thị cho multiple_choice và fill_blank, không cho error_correction */}
        {current.type !== 'error_correction' && (
          <div className="grid grid-cols-1 gap-3 w-full max-w-lg">
            {current.options.map((opt, i) => {
              const isCorrect = opt === current.correct_answer;
              const isSelected = selected === opt;
              let cn = 'w-full text-left h-auto py-4 px-5 rounded-xl border text-sm font-medium transition-all duration-200 ';
              if (selected) {
                if (isCorrect) {
                  cn += 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm ';
                } else if (isSelected) {
                  cn += 'bg-red-50 border-red-400 text-red-800 ';
                } else {
                  cn += 'opacity-40 border-muted bg-background ';
                }
              } else {
                cn += 'bg-background hover:bg-primary/5 hover:border-primary/40 border-muted hover:shadow-sm cursor-pointer ';
              }

              return (
                <button
                  key={`${opt}-${i}`}
                  className={cn}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selected}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {selected && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    {selected && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Explanation — sau khi đã chọn, ưu tiên hiển thị comparison nếu sai */}
        {showExplanation && selected && (
          <div className="w-full max-w-lg space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* So sánh đáp án của bạn vs đáp án đúng — chỉ khi sai */}
            {selected !== current.correct_answer && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Bạn chọn
                    </p>
                    <p className="font-mono bg-white border border-red-200 rounded-lg px-2 py-1 text-red-900 break-words">
                      {selected}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đáp án đúng
                    </p>
                    <p className="font-mono bg-white border border-emerald-200 rounded-lg px-2 py-1 text-emerald-900 break-words">
                      {current.correct_answer}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lý giải ngữ pháp — luôn hiển thị nếu có explanation */}
            {current.explanation && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 mb-1">
                      {selected === current.correct_answer ? 'Vì sao đúng' : 'Phân tích'}
                    </p>
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                      {current.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next button — chỉ hiện sau khi đã chọn */}
        {selected && (
          <button
            onClick={handleNext}
            className="w-full max-w-lg bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 active:translate-y-0.5 transition-all animate-in fade-in duration-300"
          >
            {qIndex + 1 >= exercises.length ? 'Xem kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </main>
  );
}

export default function GrammarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <GrammarContent />
    </Suspense>
  );
}
