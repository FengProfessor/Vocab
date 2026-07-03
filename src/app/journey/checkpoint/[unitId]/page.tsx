'use client';

/**
 * Checkpoint chặng — quiz tổng hợp trộn loại câu (vocab 2 chiều, typing,
 * grammar, nghe-chọn, minimal pair). Pass ≥80% → unlock chặng sau.
 * Progress bar vẫn nhích khi sai (mistake-safe — nghiên cứu engagement).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { completeRoadmapStep } from '@/lib/roadmap-client';
import { playWordAudio } from '@/lib/audio';
import { judgeAnswer } from '@/lib/study';
import { encouragement } from '@/lib/encouragement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CheckpointQuestion {
  id: string;
  type: 'meaning-to-word' | 'word-to-meaning' | 'typing' | 'grammar-mcq' | 'minimal-pair' | 'listening-choice';
  prompt: string;
  audioWord?: string;
  options?: string[];
  answer: string;
  explanation?: string;
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
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const correctRef = useRef(0);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await authFetch(`/api/roadmap/checkpoint?unit=${encodeURIComponent(unitId)}`);
      const json = await res.json() as { success: boolean; data?: { title: string; questions: CheckpointQuestion[] }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error || 'Không tải được checkpoint');
      setTitle(json.data.title);
      setQuestions(json.data.questions);
      setIndex(0); setCorrect(0); correctRef.current = 0;
      setPicked(null); setTyped(''); setRevealed(false); setFinished(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // "Làm lại" từ event handler: bật loading rồi nạp bộ câu hỏi mới
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
    const isCorrect = q.type === 'typing'
      ? judgeAnswer(value, q.answer) !== 'wrong'
      : value === q.answer;
    setPicked(value);
    setRevealed(true);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      correctRef.current += 1;
    }
  };

  const next = async (): Promise<void> => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null); setTyped(''); setRevealed(false);
      return;
    }
    setFinished(true);
    const scorePct = Math.round((correctRef.current / questions.length) * 100);
    if (scorePct >= 80 && stepId) {
      setSubmitting(true);
      const result = await completeRoadmapStep(stepId, scorePct);
      setSubmitting(false);
      if (result) {
        sessionStorage.setItem('roadmap_celebrate', result.levelCompleted ? 'level' : 'unit');
        router.push('/journey');
        return;
      }
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang lắp câu hỏi...</div>;
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <p>Chặng này chưa có đủ dữ liệu câu hỏi.</p>
        <Link href="/journey"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Về lộ trình</Button></Link>
      </div>
    );
  }

  if (finished) {
    const scorePct = Math.round((correct / questions.length) * 100);
    const passed = scorePct >= 80;
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">{passed ? '🏁' : '💪'}</div>
        <h1 className="text-2xl font-bold">{passed ? 'Vượt chặng!' : 'Suýt nữa rồi!'}</h1>
        <p className="text-lg">Đúng {correct}/{questions.length} — <b>{scorePct}%</b> {passed ? '(≥80% đạt)' : '(cần ≥80%)'}</p>
        <p className="text-muted-foreground text-sm">
          {passed ? encouragement('unit_complete') : encouragement('many_wrong')}
        </p>
        <div className="grid w-full gap-2">
          {passed
            ? <Button variant="chunky" size="lg" disabled={submitting} onClick={() => void next()}>Nhận thưởng & mở chặng mới</Button>
            : <Button variant="chunky" size="lg" onClick={reload}>Làm lại (câu hỏi mới)</Button>}
          <Link href="/journey"><Button variant="ghost" className="w-full">Về lộ trình</Button></Link>
        </div>
      </div>
    );
  }

  // Progress vẫn nhích khi sai — không để user cảm giác kẹt
  const progressPct = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-lg p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/journey"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-sm text-muted-foreground">{index + 1}/{questions.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>

      <h1 className="text-xl font-bold">{q.prompt}</h1>
      {isAudioQ && q.audioWord && (
        <Button variant="outline" onClick={() => void playWordAudio(q.audioWord!)}>
          <Volume2 className="w-4 h-4 mr-2" /> Nghe lại
        </Button>
      )}

      {q.type === 'typing' ? (
        <div className="space-y-3">
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Gõ từ tiếng Anh..."
            disabled={revealed}
            onKeyDown={(e) => { if (e.key === 'Enter' && typed.trim()) submitAnswer(typed); }} />
          {!revealed && <Button variant="chunky" className="w-full" disabled={!typed.trim()} onClick={() => submitAnswer(typed)}>Kiểm tra</Button>}
        </div>
      ) : (
        <div className="grid gap-3">
          {(q.options ?? []).map((opt) => {
            const isAnswer = opt === q.answer;
            const isPicked = opt === picked;
            return (
              <Button key={opt} variant="outline" disabled={revealed && !isAnswer && !isPicked}
                className={`justify-start h-auto py-3 text-base whitespace-normal ${
                  revealed && isAnswer ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : revealed && isPicked ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20'
                  : ''
                }`}
                onClick={() => submitAnswer(opt)}>
                {opt}
              </Button>
            );
          })}
        </div>
      )}

      {revealed && (
        <div className="space-y-3">
          {q.type === 'typing' && (
            <p className="text-sm">Đáp án: <b>{q.answer}</b></p>
          )}
          {q.explanation && <p className="rounded-lg bg-muted p-3 text-sm">{q.explanation}</p>}
          <Button variant="chunky" className="w-full" onClick={() => void next()}>
            {picked === q.answer || (q.type === 'typing' && judgeAnswer(typed, q.answer) !== 'wrong') ? 'Tiếp tục' : 'Hiểu rồi'}
          </Button>
        </div>
      )}
    </div>
  );
}
