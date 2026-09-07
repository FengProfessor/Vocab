'use client';

/**
 * Checkpoint chặng (Milestone 4 Upgrade)
 * Đánh giá đa chiều kỹ năng (Từ vựng, Ngữ pháp, Phát âm, Đọc hiểu).
 * Đánh giá bằng evaluateDiagnostic() từ @/lib/roadmap-assessment.
 * Lưu trữ mọi lượt làm bài (kể cả chưa đạt) vào /api/roadmap/assessment.
 * Hiển thị báo cáo chẩn đoán DiagnosticReportCard kèm link ôn tập 1-click.
 * Pass ≥80% → unlock chặng sau, lưu tiến độ và chúc mừng vượt chặng.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { completeRoadmapStep, setRoadmapCelebrateFlag } from '@/lib/roadmap-client';
import { playWordAudio } from '@/lib/audio';
import { judgeAnswer } from '@/lib/study';
import {
  evaluateDiagnostic,
  getDiagnosticStorageKey,
  type DiagnosticQuestion,
  type DiagnosticReport,
  type AssessmentSkill,
} from '@/lib/roadmap-assessment';
import { DiagnosticReportCard } from '@/components/journey/assessment/DiagnosticReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, ArrowLeft, Loader2, Sparkles, Flag } from 'lucide-react';
import Link from 'next/link';

interface CheckpointQuestion {
  id: string;
  type:
    | 'meaning-to-word'
    | 'word-to-meaning'
    | 'typing'
    | 'grammar-mcq'
    | 'minimal-pair'
    | 'listening-choice';
  prompt: string;
  audioWord?: string;
  options?: string[];
  answer: string;
  explanation?: string;
  skill?: AssessmentSkill;
  subSkill?: string;
  conceptRef?: string;
  conceptName?: string;
  sourceStepId?: string;
  sourceStepTitle?: string;
  sourceUrl?: string;
}

export default function CheckpointPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepId = searchParams.get('roadmapStep') ?? '';

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<CheckpointQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const answersRef = useRef<Record<string, string>>({});

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await authFetch(`/api/roadmap/checkpoint?unit=${encodeURIComponent(unitId)}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { title: string; questions: CheckpointQuestion[] };
        error?: string;
      };
      if (!json.success || !json.data) throw new Error(json.error || 'Không tải được checkpoint');
      setTitle(json.data.title);
      setQuestions(json.data.questions);
      setIndex(0);
      setAnswers({});
      answersRef.current = {};
      setPicked(null);
      setTyped('');
      setRevealed(false);
      setFinished(false);
      setDiagnosticReport(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // "Làm lại" từ event handler: nạp bộ câu hỏi mới
  const reload = useCallback((): void => {
    setLoading(true);
    void load();
  }, [load]);

  const q = questions[index];
  const isAudioQ = q?.type === 'minimal-pair' || q?.type === 'listening-choice';

  // Tự phát audio khi vào câu nghe
  useEffect(() => {
    if (q && isAudioQ && q.audioWord && !revealed) void playWordAudio(q.audioWord);
  }, [q, isAudioQ, revealed]);

  const submitAnswer = (value: string): void => {
    if (revealed || !q) return;
    setPicked(value);
    setRevealed(true);
    const updatedAnswers = { ...answersRef.current, [q.id]: value };
    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);
  };

  const next = async (): Promise<void> => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setTyped('');
      setRevealed(false);
      return;
    }

    // Chuyển toàn bộ câu hỏi sang định dạng DiagnosticQuestion chuẩn hóa
    const currentAnswers = answersRef.current;
    const diagnosticQuestions: DiagnosticQuestion[] = questions.map((item) => {
      let derivedSkill: AssessmentSkill = 'vocab';
      if (item.skill) {
        derivedSkill = item.skill;
      } else if (item.type === 'grammar-mcq') {
        derivedSkill = 'grammar';
      } else if (item.type === 'minimal-pair') {
        derivedSkill = 'pronunciation';
      }

      return {
        id: item.id,
        skill: derivedSkill,
        subSkill: item.subSkill,
        conceptRef: item.conceptRef || item.id,
        conceptName: item.conceptName || item.prompt,
        sourceStepId: item.sourceStepId || stepId,
        sourceStepTitle: item.sourceStepTitle || title || 'Bài học liên quan',
        sourceUrl: item.sourceUrl || `/journey?step=${encodeURIComponent(item.sourceStepId || stepId)}`,
        prompt: item.prompt,
        audioWord: item.audioWord,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
      };
    });

    // Đánh giá bằng công cụ chẩn đoán đa chiều
    const report = evaluateDiagnostic({
      questions: diagnosticQuestions,
      answers: currentAnswers,
      metadata: {
        stepId,
        targetId: unitId,
        type: 'checkpoint',
        passThresholdPct: 80,
      },
    });

    setDiagnosticReport(report);
    setFinished(true);

    // Lưu kết quả vào cơ sở dữ liệu qua /api/roadmap/assessment
    try {
      setSubmitting(true);
      await authFetch('/api/roadmap/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: unitId,
          stepId,
          tier: 'checkpoint',
          score: report.scorePct,
          passed: report.passed,
          details: report,
        }),
      });

      // Lưu cache offline vào localStorage
      try {
        const cacheKey = getDiagnosticStorageKey('current', unitId);
        localStorage.setItem(cacheKey, JSON.stringify(report));
      } catch {
        /* ignore localStorage quota */
      }

      // Nếu đạt >= 80%, ghi nhận hoàn thành bước checkpoint và chặng
      if (report.passed && stepId) {
        const result = await completeRoadmapStep(stepId, report.scorePct);
        if (result) {
          setRoadmapCelebrateFlag(result);
          toast.success(`Chúc mừng! Bạn đạt ${report.scorePct}% và đã vượt chặng thành công!`);
        }
      }
    } catch (err) {
      console.error('[Checkpoint] Failed to persist assessment attempt:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Đang chuẩn bị bộ câu hỏi chẩn đoán chặng...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4 pt-16">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-xl">
          ⚠️
        </div>
        <h2 className="text-lg font-bold">Chưa có dữ liệu câu hỏi cho chặng này</h2>
        <p className="text-sm text-muted-foreground">
          Nội dung đang được cập nhật. Bạn vui lòng quay lại sau nhé.
        </p>
        <Link href="/journey">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Về lộ trình
          </Button>
        </Link>
      </div>
    );
  }

  // Màn hình hoàn thành: hiển thị thẻ báo cáo chẩn đoán chuyên sâu DiagnosticReportCard
  if (finished && diagnosticReport) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/journey">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="w-4 h-4" /> Về lộ trình
              </Button>
            </Link>
            <span className="text-xs text-muted-foreground font-semibold">
              Checkpoint: {title}
            </span>
          </div>

          <DiagnosticReportCard
            report={diagnosticReport}
            onRetry={reload}
            onContinue={() => router.push('/journey')}
          />
        </div>
      </div>
    );
  }

  // Tiến trình làm bài (mistake-safe)
  const progressPct = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header thanh tiến trình */}
        <div className="flex items-center gap-3">
          <Link href="/journey">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            {index + 1}/{questions.length}
          </span>
        </div>

        {/* Tiêu đề chặng & thẻ kỹ năng */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-primary">
            <Flag className="w-3.5 h-3.5" /> {title}
          </span>
          {q.skill && (
            <span className="px-2 py-0.5 rounded-full bg-muted font-medium uppercase text-[10px]">
              {q.skill === 'vocab'
                ? 'Từ vựng'
                : q.skill === 'grammar'
                ? 'Ngữ pháp'
                : q.skill === 'pronunciation'
                ? 'Phát âm'
                : 'Đọc hiểu'}
            </span>
          )}
        </div>

        {/* Tiêu đề câu hỏi */}
        <h1 className="text-lg font-bold leading-relaxed">
          {q.prompt?.trim()
            ? q.prompt
            : q.type === 'typing'
            ? 'Gõ từ tiếng Anh đúng'
            : isAudioQ
            ? 'Nghe và chọn đáp án đúng'
            : 'Chọn đáp án đúng'}
        </h1>

        {/* Nút nghe lại nếu là câu hỏi audio */}
        {isAudioQ && q.audioWord && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void playWordAudio(q.audioWord!)}
            className="gap-2"
          >
            <Volume2 className="w-4 h-4 text-primary" /> Nghe lại phát âm
          </Button>
        )}

        {/* Dạng gõ từ */}
        {q.type === 'typing' ? (
          <div className="space-y-3">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Gõ từ tiếng Anh..."
              disabled={revealed}
              className="h-12 text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && typed.trim()) submitAnswer(typed);
              }}
            />
            {!revealed && (
              <Button
                variant="chunky"
                className="w-full"
                disabled={!typed.trim()}
                onClick={() => submitAnswer(typed)}
              >
                Kiểm tra câu trả lời
              </Button>
            )}
          </div>
        ) : (
          /* Dạng trắc nghiệm */
          <div className="grid gap-2.5">
            {(q.options ?? []).map((opt) => {
              const isAnswer = opt === q.answer;
              const isPicked = opt === picked;
              return (
                <Button
                  key={opt}
                  variant="outline"
                  disabled={revealed && !isAnswer && !isPicked}
                  className={`justify-start h-auto py-3.5 px-4 text-base whitespace-normal font-normal text-left transition-all ${
                    revealed && isAnswer
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : revealed && isPicked
                      ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => submitAnswer(opt)}
                >
                  {opt}
                </Button>
              );
            })}
          </div>
        )}

        {/* Khối phản hồi & giải thích sau khi trả lời */}
        {revealed && (
          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {q.type === 'typing' && (
              <p className="text-sm">
                Đáp án: <b className="text-emerald-600">{q.answer}</b>
              </p>
            )}
            {q.explanation && (
              <div className="rounded-xl bg-muted/70 border p-3.5 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Giải thích: </span>
                {q.explanation}
              </div>
            )}
            <Button
              variant="chunky"
              className="w-full"
              disabled={submitting}
              onClick={() => void next()}
            >
              {index + 1 < questions.length
                ? picked === q.answer ||
                  (q.type === 'typing' && judgeAnswer(typed, q.answer) !== 'wrong')
                  ? 'Tiếp tục'
                  : 'Hiểu rồi'
                : 'Xem Báo cáo Chẩn đoán Chặng'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}