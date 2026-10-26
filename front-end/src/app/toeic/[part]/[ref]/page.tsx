
/**
 * TOEIC Reading Player — 1 trang xử lý cả 3 dạng bài Reading:
 * part5 = Incomplete Sentences (MCQ ngữ pháp/từ vựng)
 * part6 = Text Completion (đọc đoạn văn + điền chỗ trống)
 * part7 = Reading Comprehension (đọc hiểu single/double/triple passage)
 * Decoupled from initial static bundle via dynamic import. Xong → POST roadmap progress.
 */
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from '@/shared/router/navigation';
import { completeRoadmapStep, setRoadmapCelebrateFlag } from '@/lib/roadmap-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Lightbulb, BookOpen, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Link from '@/shared/router/navigation';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';
import { stripHtmlTags } from '@/components/toeic/ToeicSplitPane';
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
    answer: item.answer || 'A',
    explain: item.explain || '',
  }));
}

function part6ToQs(item: ToeicPart6Item): ToeicFlatQ[] {
  return item.blanks.map((b, i) => ({
    id: `${item.id}-b${i}`,
    part: 'part6' as const,
    context: item.text,
    prompt: `${item.title} — Chỗ trống (${b.index})`,
    options: b.options,
    answer: b.answer || 'A',
    explain: b.explain || '',
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
    answer: q.answer || 'A',
    explain: q.explain || '',
  }));
}

/** Tìm items theo setId */
function findBySet<T extends { setId: string }>(arr: T[], setId: string): T[] {
  return arr.filter((x) => x.setId === setId);
}

function extractOptionLetter(str: string): string {
  return str.match(/^[\(\[]?([A-D])[.\)\]\s]?/i)?.[1]?.toUpperCase() ?? str.trim().toUpperCase();
}

function isOptionMatch(opt: string, answer: string): boolean {
  const optLetter = extractOptionLetter(opt);
  const ansLetter = extractOptionLetter(answer);
  return optLetter === ansLetter || opt.trim().toLowerCase() === answer.trim().toLowerCase();
}

// ── Part label cho UI ──
const PART_LABEL: Record<string, string> = {
  part5: 'Part 5 — Incomplete Sentences',
  part6: 'Part 6 — Text Completion',
  part7: 'Part 7 — Reading Comprehension',
};

interface QuestionAttemptState {
  picked: string;
  revealed: boolean;
  isCorrect: boolean;
}

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
  const storageKey = `toeic_part_drill_${part || ''}_${decodeURIComponent(ref || '')}`;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<ToeicFlatQ[]>([]);

  // ── Player state ──
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answersMap, setAnswersMap] = useState<Record<string, QuestionAttemptState>>({});
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        let loadedQs: ToeicFlatQ[] = [];

        if (partKey === 'part5') {
          const items = findBySet(content.part5 || [], decodedRef);
          if (items.length > 0) {
            setTitle(PART_LABEL.part5);
            loadedQs = part5ToQs(items);
          } else {
            setTitle('');
          }
        } else if (partKey === 'part6') {
          const items = findBySet(content.part6 || [], decodedRef);
          if (items.length > 0) {
            setTitle(PART_LABEL.part6);
            loadedQs = items.flatMap(part6ToQs);
          } else {
            setTitle('');
          }
        } else if (partKey === 'part7') {
          const singles = findBySet(content.part7_single || [], decodedRef);
          const doubles = findBySet(content.part7_double ?? [], decodedRef);
          const all = [...singles, ...doubles];
          if (all.length > 0) {
            setTitle(PART_LABEL.part7);
            loadedQs = all.flatMap(part7ToQs);
          } else {
            setTitle('');
          }
        } else {
          setTitle('');
        }

        setQuestions(loadedQs);

        // Khôi phục tiến trình làm dở từ sessionStorage / localStorage
        if (loadedQs.length > 0 && typeof window !== 'undefined') {
          try {
            const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
            if (raw) {
              const saved = JSON.parse(raw);
              if (saved && typeof saved === 'object') {
                const restoredMap: Record<string, QuestionAttemptState> =
                  saved.answersMap && typeof saved.answersMap === 'object' ? saved.answersMap : {};
                const restoredIdx =
                  typeof saved.index === 'number' && saved.index >= 0 && saved.index < loadedQs.length
                    ? saved.index
                    : 0;
                setAnswersMap(restoredMap);
                setIndex(restoredIdx);
                const currentQ = loadedQs[restoredIdx];
                if (currentQ && restoredMap[currentQ.id]) {
                  setPicked(restoredMap[currentQ.id].picked);
                  setRevealed(restoredMap[currentQ.id].revealed);
                }
              }
            }
          } catch {
            // ignore
          }
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
  }, [part, ref, storageKey]);

  // Tự động lưu tiến trình vào sessionStorage & localStorage
  useEffect(() => {
    if (loading || questions.length === 0 || finished) return;
    try {
      const payload = JSON.stringify({
        index,
        answersMap,
        updatedAt: Date.now(),
      });
      sessionStorage.setItem(storageKey, payload);
      localStorage.setItem(storageKey, payload);
    } catch {
      // ignore
    }
  }, [index, answersMap, loading, questions.length, finished, storageKey]);

  const correct = useMemo(
    () => Object.values(answersMap).filter((a) => a.revealed && a.isCorrect).length,
    [answersMap]
  );

  const navigateToQuestion = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= questions.length) return;
      setIndex(targetIdx);
      const targetQ = questions[targetIdx];
      const existing = targetQ ? answersMap[targetQ.id] : undefined;
      if (existing) {
        setPicked(existing.picked);
        setRevealed(existing.revealed);
      } else {
        setPicked(null);
        setRevealed(false);
      }
    },
    [questions, answersMap]
  );

  const q = questions[index];

  const checkAnswer = useCallback((): void => {
    if (revealed || !q || picked === null) return;
    const isCorrectAns = isOptionMatch(picked, q.answer);
    setRevealed(true);
    setAnswersMap((prev) => ({
      ...prev,
      [q.id]: {
        picked,
        revealed: true,
        isCorrect: isCorrectAns,
      },
    }));
  }, [revealed, q, picked]);

  const nextQuestion = useCallback(async (): Promise<void> => {
    if (index + 1 < questions.length) {
      navigateToQuestion(index + 1);
      return;
    }
    // Hết câu hỏi
    setFinished(true);
    try {
      sessionStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
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
  }, [index, questions.length, navigateToQuestion, storageKey, correct, stepId, router]);

  // Phím tắt bàn phím: 1-4 / A-D để chọn đáp án, Enter / Space để kiểm tra hoặc sang câu tiếp, Mũi tên trái/phải để chuyển câu
  useEffect(() => {
    if (loading || finished || !q) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toUpperCase();
      if (!revealed) {
        const optionIdx =
          key === '1' || key === 'A'
            ? 0
            : key === '2' || key === 'B'
              ? 1
              : key === '3' || key === 'C'
                ? 2
                : key === '4' || key === 'D'
                  ? 3
                  : -1;
        if (optionIdx >= 0 && optionIdx < q.options.length) {
          e.preventDefault();
          setPicked(q.options[optionIdx]);
          return;
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (!revealed && picked !== null) {
          e.preventDefault();
          checkAnswer();
        } else if (revealed) {
          e.preventDefault();
          void nextQuestion();
        }
        return;
      }

      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        navigateToQuestion(index - 1);
      } else if (e.key === 'ArrowRight' && index + 1 < questions.length) {
        e.preventDefault();
        navigateToQuestion(index + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, finished, q, revealed, picked, index, questions.length, checkAnswer, nextQuestion, navigateToQuestion]);

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

  const resetDrill = (): void => {
    try {
      sessionStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setIndex(0);
    setAnswersMap({});
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
        <div className="w-full rounded-lg bg-muted/50 p-4 text-left text-sm space-y-1.5">
          <p className="font-semibold text-muted-foreground">Phân tích theo phần:</p>
          {(['part5', 'part6', 'part7'] as const).map((p) => {
            const partQs = questions.filter((q2) => q2.part === p);
            if (partQs.length === 0) return null;
            const partCorrect = partQs.filter((q2) => answersMap[q2.id]?.isCorrect).length;
            const partPct = Math.round((partCorrect / partQs.length) * 100);
            return (
              <p key={p} className="text-muted-foreground flex items-center justify-between">
                <span>{PART_LABEL[p]}:</span>
                <span className="font-mono font-semibold text-foreground">
                  {partCorrect}/{partQs.length} câu đúng ({partPct}%)
                </span>
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
  const answeredCount = Object.values(answersMap).filter((a) => a.revealed).length;
  const progressPct = Math.round((Math.max(answeredCount, index + (revealed ? 1 : 0)) / questions.length) * 100);
  const isCorrect = revealed && q && picked ? isOptionMatch(picked, q.answer) : false;

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      {/* Header + progress bar */}
      <div className="flex items-center gap-3">
        <Link href={stepId ? '/journey' : '/toeic'}>
          <Button variant="ghost" size="icon" title="Quay lại">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
          {index + 1}/{questions.length}
        </span>
        {answeredCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDrill}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Làm lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Làm lại
          </Button>
        )}
      </div>

      {/* Question Strip — nhảy nhanh giữa các câu trong bộ bài */}
      {questions.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {questions.map((itemQ, idx) => {
            const st = answersMap[itemQ.id];
            const isCurrent = idx === index;
            let pillClass =
              'border-slate-200 dark:border-slate-800 bg-background text-muted-foreground hover:bg-muted';
            if (st?.revealed) {
              pillClass = st.isCorrect
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold';
            }
            if (isCurrent) {
              pillClass += ' ring-2 ring-primary ring-offset-1 font-bold';
            }
            return (
              <button
                key={itemQ.id}
                type="button"
                onClick={() => navigateToQuestion(idx)}
                className={`h-7 min-w-[28px] px-1.5 rounded text-xs font-mono border transition-all shrink-0 cursor-pointer ${pillClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Part badge + keyboard hint */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            TOEIC {q.part === 'part5' ? 'Part 5' : q.part === 'part6' ? 'Part 6' : 'Part 7'}
          </span>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        <span className="hidden sm:inline text-[11px] font-mono text-muted-foreground">
          Phím tắt: 1–4 / A–D chọn • Enter kiểm tra/tiếp
        </span>
      </div>

      {/* Passage / Context */}
      {q.context && (
        <Card className="border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="p-4 whitespace-pre-line text-sm leading-relaxed max-h-72 overflow-y-auto">
            <ExamInteractiveText text={stripHtmlTags(q.context)} enabled={revealed} />
          </CardContent>
        </Card>
      )}

      {/* Question */}
      <h1 className="text-base font-bold leading-relaxed">
        <ExamInteractiveText text={stripHtmlTags(q.prompt)} enabled={revealed} />
      </h1>

      {/* Options — 2x2 Grid (1 2 / 3 4) on Mobile */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">
          {q.options.map((opt) => {
            const isAnswer = isOptionMatch(opt, q.answer);
            const isPicked = opt === picked;

            return (
              <Button
                key={opt}
                variant="outline"
                className={`justify-start h-auto py-2.5 px-3 text-xs sm:text-sm whitespace-normal text-left ${
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
                } ${
                  revealed && !isAnswer && !isPicked
                    ? 'opacity-60 cursor-default'
                    : ''
                }`}
                onClick={() => {
                  if (!revealed) setPicked(opt);
                }}
              >
                <ExamInteractiveText text={stripHtmlTags(opt)} enabled={revealed} />
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
            <div className="flex-1 leading-relaxed">
              <p>{stripHtmlTags(q.explain)}</p>
            </div>
          </div>
        )}

        {/* Action buttons + Prev/Next navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            disabled={index === 0}
            onClick={() => navigateToQuestion(index - 1)}
            className="px-3 shrink-0"
            title="Câu trước (←)"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Trước
          </Button>

          {!revealed ? (
            <Button
              variant="chunky"
              className="flex-1"
              disabled={picked === null}
              onClick={checkAnswer}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Kiểm tra
            </Button>
          ) : (
            <Button variant="chunky" className="flex-1" onClick={() => void nextQuestion()}>
              {index + 1 < questions.length ? (
                <>
                  Câu tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                'Xem kết quả'
              )}
            </Button>
          )}
        </div>
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
