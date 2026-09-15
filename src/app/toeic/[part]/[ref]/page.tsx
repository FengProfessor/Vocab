'use client';

/**
 * TOEIC Reading Player — 1 trang xử lý cả 3 dạng bài Reading:
 * part5 = Incomplete Sentences (MCQ ngữ pháp/từ vựng)
 * part6 = Text Completion (đọc đoạn văn + điền chỗ trống)
 * part7 = Reading Comprehension (đọc hiểu single/double/triple passage)
 * Decoupled from initial static bundle via dynamic import. Xong → POST roadmap progress.
 */
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { completeRoadmapStep, setRoadmapCelebrateFlag } from '@/lib/roadmap-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type {
  ToeicPart5Item,
  ToeicPart6Item,
  ToeicPart7Item,
  ToeicReadingContent,
  ToeicFlatQ,
} from '@/types/toeic';

// ── Flatten helpers ──

function part5ToQs(items: ToeicPart5Item[]): ToeicFlatQ[] {
  return items.map((item) => ({
    id: item.id,
    part: 'part5' as const,
    prompt: item.question,
    options: item.options,
    answer: item.answer,
    explain: item.explain,
  }));
}

function part6ToQs(item: ToeicPart6Item): ToeicFlatQ[] {
  return item.blanks.map((b, i) => ({
    id: `${item.id}-b${i}`,
    part: 'part6' as const,
    context: item.text,
    prompt: `${item.title} — Chỗ trống (${b.index})`,
    options: b.options,
    answer: b.answer,
    explain: b.explain,
  }));
}

function part7ToQs(item: ToeicPart7Item): ToeicFlatQ[] {
  const passage = item.passages ? item.passages.join('\n\n---\n\n') : item.passage;
  return item.questions.map((q, i) => ({
    id: `${item.id}-q${i}`,
    part: 'part7' as const,
    context: passage,
    prompt: q.q,
    options: q.options,
    answer: q.answer,
    explain: q.explain,
  }));
}

/** Tìm items theo setId */
function findBySet<T extends { setId: string }>(arr: T[], setId: string): T[] {
  return arr.filter((x) => x.setId === setId);
}

// ── Part label cho UI ──
const PART_LABEL: Record<string, string> = {
  part5: 'Part 5 — Incomplete Sentences',
  part6: 'Part 6 — Text Completion',
  part7: 'Part 7 — Reading Comprehension',
};

export function ToeicPlayerSkeleton() {
  return (
    <div
      className="mx-auto max-w-2xl p-4 space-y-5 animate-pulse"
      role="status"
      aria-busy="true"
      aria-label="Đang tải bài tập TOEIC..."
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-muted" />
        <div className="h-3 flex-1 rounded-full bg-muted" />
        <div className="w-12 h-4 rounded bg-muted" />
      </div>

      {/* Part badge skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-5 rounded-full bg-muted" />
        <div className="w-40 h-4 rounded bg-muted" />
      </div>

      {/* Passage / Context skeleton */}
      <div className="h-36 rounded-lg bg-muted/60" />

      {/* Question prompt skeleton */}
      <div className="h-6 w-3/4 rounded bg-muted" />

      {/* Options skeleton */}
      <div className="space-y-3">
        <div className="grid gap-2">
          <div className="h-12 rounded-md bg-muted/70" />
          <div className="h-12 rounded-md bg-muted/70" />
          <div className="h-12 rounded-md bg-muted/70" />
          <div className="h-12 rounded-md bg-muted/70" />
        </div>
        <div className="h-11 rounded-md bg-muted" />
      </div>
    </div>
  );
}

function ToeicPlayerInner() {
  const { part, ref } = useParams<{ part: string; ref: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepId = searchParams.get('roadmapStep') ?? '';

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<ToeicFlatQ[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadQuestions() {
      setLoading(true);
      try {
        const mod = await import('@/data/toeic/content-toeic-reading-v1.json');
        const content = mod.default as unknown as ToeicReadingContent;

        if (isCancelled) return;

        const partKey = (part || '').replace('-', '');
        const decodedRef = decodeURIComponent(ref || '');

        if (partKey === 'part5') {
          const items = findBySet(content.part5 || [], decodedRef);
          if (items.length > 0) {
            setTitle(PART_LABEL.part5);
            setQuestions(part5ToQs(items));
          } else {
            setTitle('');
            setQuestions([]);
          }
        } else if (partKey === 'part6') {
          const items = findBySet(content.part6 || [], decodedRef);
          if (items.length > 0) {
            setTitle(PART_LABEL.part6);
            setQuestions(items.flatMap(part6ToQs));
          } else {
            setTitle('');
            setQuestions([]);
          }
        } else if (partKey === 'part7') {
          const singles = findBySet(content.part7_single || [], decodedRef);
          const doubles = findBySet(content.part7_double ?? [], decodedRef);
          const all = [...singles, ...doubles];
          if (all.length > 0) {
            setTitle(PART_LABEL.part7);
            setQuestions(all.flatMap(part7ToQs));
          } else {
            setTitle('');
            setQuestions([]);
          }
        } else {
          setTitle('');
          setQuestions([]);
        }
      } catch (err) {
        console.error('[ToeicPlayer] Failed to load reading dataset dynamically:', err);
        if (!isCancelled) {
          setTitle('');
          setQuestions([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      isCancelled = true;
    };
  }, [part, ref]);

  // ── Player state ──
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Loading skeleton state ──
  if (loading) {
    return <ToeicPlayerSkeleton />;
  }

  // ── Empty state (only after loading completed with 0 questions) ──
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Nội dung bài này chưa sẵn sàng.</p>
        <Link href="/toeic">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Về TOEIC
          </Button>
        </Link>
      </div>
    );
  }

  const q = questions[index];

  const checkAnswer = (): void => {
    if (revealed || !q || picked === null) return;
    setRevealed(true);
    // So sánh: answer có thể là "A" hoặc "(A) by" — ta check cả 2 format
    const pickedLetter = picked.match(/^\(([A-D])\)/)?.[1] ?? picked;
    const correctLetter = q.answer.match(/^\(([A-D])\)/)?.[1] ?? q.answer;
    if (pickedLetter === correctLetter) {
      setCorrect((c) => c + 1);
    }
  };

  const nextQuestion = async (): Promise<void> => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setRevealed(false);
      return;
    }
    // Hết câu hỏi
    setFinished(true);
    const pct = Math.round((correct / Math.max(questions.length, 1)) * 100);
    if (stepId) {
      setSubmitting(true);
      const result = await completeRoadmapStep(stepId, pct);
      setSubmitting(false);
      if (result) {
        setRoadmapCelebrateFlag(result);
        router.push('/journey');
      }
    }
  };

  const resetDrill = (): void => {
    setIndex(0);
    setCorrect(0);
    setPicked(null);
    setRevealed(false);
    setFinished(false);
  };

  // ── Finished state ──
  if (finished) {
    const pct = Math.round((correct / questions.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚';
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">{emoji}</div>
        <h1 className="text-2xl font-bold">
          {pct >= 80 ? 'Xuất sắc!' : pct >= 50 ? 'Khá tốt!' : 'Cần luyện thêm!'}
        </h1>
        <p className="text-lg">
          Đúng <b>{correct}/{questions.length}</b> — <b>{pct}%</b>
        </p>
        {/* Phân tích theo Part */}
        <div className="w-full rounded-lg bg-muted/50 p-4 text-left text-sm space-y-1">
          <p className="font-semibold text-muted-foreground">Phân tích:</p>
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
          {stepId ? (
            <Link href="/journey">
              <Button variant="chunky" size="lg" className="w-full" disabled={submitting}>
                Về lộ trình
              </Button>
            </Link>
          ) : (
            <Link href="/toeic">
              <Button variant="chunky" size="lg" className="w-full">
                Về TOEIC
              </Button>
            </Link>
          )}
          <Button variant="outline" className="w-full" onClick={resetDrill}>
            Làm lại
          </Button>
        </div>
      </div>
    );
  }

  // ── Active question ──
  const progressPct = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);
  const isCorrect = (() => {
    if (!revealed || !q) return false;
    const pickedLetter = picked?.match(/^\(([A-D])\)/)?.[1] ?? picked;
    const correctLetter = q.answer.match(/^\(([A-D])\)/)?.[1] ?? q.answer;
    return pickedLetter === correctLetter;
  })();

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-5">
      {/* Header + progress bar */}
      <div className="flex items-center gap-3">
        <Link href={stepId ? '/journey' : '/toeic'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* Part badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
          TOEIC {q.part === 'part5' ? 'Part 5' : q.part === 'part6' ? 'Part 6' : 'Part 7'}
        </span>
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>

      {/* Passage / Context */}
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
                  !revealed && isPicked
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : ''
                } ${
                  revealed && isAnswer
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : ''
                } ${
                  revealed && isPicked && !isAnswer
                    ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 line-through'
                    : ''
                }`}
                onClick={() => {
                  if (!revealed) setPicked(opt);
                }}
              >
                {opt}
              </Button>
            );
          })}
        </div>

        {/* Explain */}
        {revealed && (
          <div
            className={`rounded-lg p-3 text-sm flex gap-2 items-start ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30'
                : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30'
            }`}
          >
            <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <span>{q.explain}</span>
          </div>
        )}

        {/* Action button */}
        {!revealed ? (
          <Button
            variant="chunky"
            className="w-full"
            disabled={picked === null}
            onClick={checkAnswer}
          >
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

export default function ToeicPartPage() {
  return (
    <Suspense fallback={<ToeicPlayerSkeleton />}>
      <ToeicPlayerInner />
    </Suspense>
  );
}
