'use client';

/**
 * TOEIC Mini Test / Full Test player — gom nhiều Part thành 1 đề thi.
 * Có đồng hồ đếm ngược (optional). Chấm ≥80% mới pass (giống THPT exam).
 */
import { useMemo, useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { completeRoadmapStep, setRoadmapCelebrateFlag } from '@/lib/roadmap-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Clock, Lightbulb, Trophy } from 'lucide-react';
import Link from 'next/link';
import contentData from '@/data/toeic/content-toeic-reading-v1.json';
import type {
  ToeicReadingContent,
  ToeicFlatQ,
  ToeicMiniTest,
} from '@/types/toeic';

const content = contentData as unknown as ToeicReadingContent;

function flattenMiniTest(exam: ToeicMiniTest): ToeicFlatQ[] {
  const qs: ToeicFlatQ[] = [];
  for (const section of exam.sections) {
    for (const id of section.ids) {
      if (section.part === 'part5') {
        const item = content.part5.find((x) => x.id === id);
        if (item) {
          qs.push({
            id: item.id,
            part: 'part5',
            prompt: item.question,
            options: item.options,
            answer: item.answer,
            explain: item.explain,
          });
        }
      } else if (section.part === 'part6') {
        const item = content.part6.find((x) => x.id === id);
        if (item) {
          item.blanks.forEach((b, i) => {
            qs.push({
              id: `${item.id}-b${i}`,
              part: 'part6',
              context: item.text,
              prompt: `${item.title} — Chỗ trống (${b.index})`,
              options: b.options,
              answer: b.answer,
              explain: b.explain,
            });
          });
        }
      } else if (section.part === 'part7_single' || section.part === 'part7_double') {
        const pool = section.part === 'part7_single' ? content.part7_single : (content.part7_double ?? []);
        const item = pool.find((x) => x.id === id);
        if (item) {
          const passage = item.passages ? item.passages.join('\n\n---\n\n') : item.passage;
          item.questions.forEach((q, i) => {
            qs.push({
              id: `${item.id}-q${i}`,
              part: 'part7',
              context: passage,
              prompt: q.q,
              options: q.options,
              answer: q.answer,
              explain: q.explain,
            });
          });
        }
      }
    }
  }
  return qs;
}

const PART_LABEL: Record<string, string> = {
  part5: 'Part 5',
  part6: 'Part 6',
  part7: 'Part 7',
};

function ToeicExamInner() {
  const { examId } = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepId = searchParams.get('roadmapStep') ?? '';

  const exam = useMemo(
    () => content.mini_test.find((t) => t.id === decodeURIComponent(examId)),
    [examId],
  );

  const questions = useMemo(() => (exam ? flattenMiniTest(exam) : []), [exam]);

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(exam ? exam.timeMinutes * 60 : 0);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setTimerActive(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Player state ──
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const q = questions[index];

  const checkAnswer = (): void => {
    if (revealed || !q || picked === null) return;
    setRevealed(true);
    const pickedLetter = picked.match(/^\(([A-D])\)/)?.[1] ?? picked;
    const correctLetter = q.answer.match(/^\(([A-D])\)/)?.[1] ?? q.answer;
    if (pickedLetter === correctLetter) setCorrect((c) => c + 1);
  };

  const nextQuestion = async (): Promise<void> => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setRevealed(false);
      return;
    }
    setFinished(true);
    setTimerActive(false);
    const pct = Math.round((correct / Math.max(questions.length, 1)) * 100);
    if (stepId && pct >= 80) {
      setSubmitting(true);
      const result = await completeRoadmapStep(stepId, pct);
      setSubmitting(false);
      if (result) {
        setRoadmapCelebrateFlag(result);
        router.push('/journey');
      }
    }
  };

  const resetExam = (): void => {
    setIndex(0);
    setCorrect(0);
    setPicked(null);
    setRevealed(false);
    setFinished(false);
    setTimeLeft(exam ? exam.timeMinutes * 60 : 0);
    setTimerActive(true);
  };

  // ── Empty ──
  if (!exam || questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <p className="text-muted-foreground">Đề thi không tìm thấy.</p>
        <Link href="/toeic">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Về TOEIC
          </Button>
        </Link>
      </div>
    );
  }

  // ── Finished ──
  if (finished) {
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= 80;
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">{passed ? '🏆' : '💪'}</div>
        <h1 className="text-2xl font-bold">{passed ? 'Vượt đề TOEIC!' : 'Chưa đạt — cần ≥80%'}</h1>
        <p className="text-lg">
          Đúng <b>{correct}/{questions.length}</b> — <b>{pct}%</b>
        </p>
        {/* Score by part */}
        <div className="w-full rounded-lg bg-muted/50 p-4 text-left text-sm space-y-2">
          <p className="font-semibold">📊 Phân tích theo Part:</p>
          {(['part5', 'part6', 'part7'] as const).map((p) => {
            const partQs = questions.filter((q2) => q2.part === p);
            if (partQs.length === 0) return null;
            return (
              <p key={p} className="text-muted-foreground">
                {PART_LABEL[p]}: {partQs.length} câu
              </p>
            );
          })}
        </div>
        <div className="grid w-full gap-2">
          <Button variant="chunky" size="lg" className="w-full" onClick={resetExam}>
            {passed ? 'Làm lại lần nữa' : 'Thử lại'}
          </Button>
          {passed && stepId && (
            <Link href="/journey">
              <Button variant="outline" className="w-full" disabled={submitting}>
                Về lộ trình
              </Button>
            </Link>
          )}
          <Link href="/toeic">
            <Button variant="ghost" className="w-full">
              Về TOEIC
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Active ──
  const progressPct = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);
  const isCorrectAnswer = (() => {
    if (!revealed || !q) return false;
    const pickedLetter = picked?.match(/^\(([A-D])\)/)?.[1] ?? picked;
    const correctLetter = q.answer.match(/^\(([A-D])\)/)?.[1] ?? q.answer;
    return pickedLetter === correctLetter;
  })();

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/toeic">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-sm text-muted-foreground">{index + 1}/{questions.length}</span>
      </div>

      {/* Timer + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold">{exam.title}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-mono ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-muted-foreground'}`}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Part badge */}
      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
        TOEIC {PART_LABEL[q.part]}
      </span>

      {/* Context */}
      {q.context && (
        <Card className="border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="p-4 whitespace-pre-line text-sm leading-relaxed max-h-72 overflow-y-auto">
            {q.context}
          </CardContent>
        </Card>
      )}

      {/* Question */}
      <h1 className="text-base font-bold leading-relaxed">{q.prompt}</h1>

      {/* Options */}
      <div className="space-y-3">
        <div className="grid gap-2">
          {q.options.map((opt) => {
            const optLetter = opt.match(/^\(([A-D])\)/)?.[1] ?? opt;
            const ansLetter = q.answer.match(/^\(([A-D])\)/)?.[1] ?? q.answer;
            const isAnswer = optLetter === ansLetter;
            const isPicked = opt === picked;
            return (
              <Button
                key={opt}
                variant="outline"
                disabled={revealed && !isAnswer && !isPicked}
                className={`justify-start h-auto py-3 px-4 text-sm whitespace-normal text-left ${
                  !revealed && isPicked ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : ''
                } ${
                  revealed && isAnswer
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : ''
                } ${
                  revealed && isPicked && !isAnswer
                    ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 line-through'
                    : ''
                }`}
                onClick={() => { if (!revealed) setPicked(opt); }}
              >
                {opt}
              </Button>
            );
          })}
        </div>

        {revealed && (
          <div className={`rounded-lg p-3 text-sm flex gap-2 items-start ${
            isCorrectAnswer
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30'
              : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30'
          }`}>
            <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <span>{q.explain}</span>
          </div>
        )}

        {!revealed ? (
          <Button variant="chunky" className="w-full" disabled={picked === null} onClick={checkAnswer}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Kiểm tra
          </Button>
        ) : (
          <Button variant="chunky" className="w-full" onClick={() => void nextQuestion()}>
            {index + 1 < questions.length ? 'Câu tiếp theo →' : 'Xem kết quả'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ToeicExamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ToeicExamInner />
    </Suspense>
  );
}
