'use client';

/**
 * Bài phát âm — dạy 1 âm/chủ điểm cho người Việt:
 * lý do khó (L1) → tip khẩu hình → từ ví dụ (audio giọng thật) → drill minimal pair nghe-chọn.
 * drillType khác minimal-pair (stress/intonation/listening) → luyện nghe theo cặp có chú thích.
 * Xong drill → POST roadmap progress (nếu mở từ lộ trình).
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { completeRoadmapStep } from '@/lib/roadmap-client';
import { playWordAudio } from '@/lib/audio';
import { speak } from '@/lib/study';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, ArrowLeft, Ear } from 'lucide-react';
import Link from 'next/link';
import pronunciationData from '@/data/pronunciation/lessons-v1.json';

interface MinimalPair { a: string; b: string; note: string }
interface Lesson {
  id: string; level: string; title: string; ipa: string;
  whyHard: string; mouthTip: string; exampleWords: string[];
  drillType: 'minimal-pair' | 'stress' | 'intonation' | 'listening';
  minimalPairs: MinimalPair[];
}

const DRILL_ROUNDS = 8;

function isPlayableWord(s: string): boolean {
  return /^[a-zA-Z' ]+$/.test(s) && s.split(' ').length <= 3;
}

export default function PronunciationLessonPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepId = searchParams.get('roadmapStep') ?? '';

  const lesson = useMemo(() => {
    const lessons = (pronunciationData as { lessons: Lesson[] }).lessons;
    return lessons.find((l) => l.id === id) ?? null;
  }, [id]);

  const [phase, setPhase] = useState<'learn' | 'drill' | 'done'>('learn');
  const [rounds, setRounds] = useState<{ pair: MinimalPair; target: string }[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canDrill = useMemo(
    () => (lesson?.minimalPairs ?? []).filter((p) => isPlayableWord(p.a) && isPlayableWord(p.b)).length >= 2,
    [lesson],
  );

  const startDrill = (): void => {
    if (!lesson) return;
    const playable = lesson.minimalPairs.filter((p) => isPlayableWord(p.a) && isPlayableWord(p.b));
    const generated: { pair: MinimalPair; target: string }[] = [];
    for (let i = 0; i < DRILL_ROUNDS; i++) {
      const pair = playable[i % playable.length];
      generated.push({ pair, target: Math.random() < 0.5 ? pair.a : pair.b });
    }
    setRounds(generated);
    setRoundIdx(0); setCorrect(0); setPicked(null);
    setPhase('drill');
  };

  const round = rounds[roundIdx];

  useEffect(() => {
    if (phase === 'drill' && round && picked === null) {
      void playWordAudio(round.target, null, 0.9);
    }
  }, [phase, round, picked]);

  const pick = (choice: string): void => {
    if (picked !== null || !round) return;
    setPicked(choice);
    if (choice === round.target) setCorrect((c) => c + 1);
  };

  const nextRound = async (): Promise<void> => {
    if (roundIdx + 1 < rounds.length) {
      setRoundIdx(roundIdx + 1);
      setPicked(null);
      return;
    }
    setPhase('done');
    if (stepId) {
      setSubmitting(true);
      const result = await completeRoadmapStep(stepId);
      setSubmitting(false);
      if (result) {
        toast.success(`+${result.xpAwarded} XP — tai bạn vừa bén hơn một bậc 👂`);
      }
    }
  };

  if (!lesson) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <p>Không tìm thấy bài phát âm.</p>
        <Link href="/journey"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Về lộ trình</Button></Link>
      </div>
    );
  }

  if (phase === 'drill' && round) {
    return (
      <div className="mx-auto max-w-lg p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setPhase('learn')}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(((roundIdx + (picked ? 1 : 0)) / rounds.length) * 100)}%` }} />
          </div>
          <span className="text-sm text-muted-foreground">{roundIdx + 1}/{rounds.length}</span>
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Nghe và chọn đúng từ:</p>
          <Button variant="outline" size="lg" onClick={() => void playWordAudio(round.target, null, 0.9)}>
            <Volume2 className="w-5 h-5 mr-2" /> Nghe lại
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[round.pair.a, round.pair.b].map((opt) => {
            const isTarget = opt === round.target;
            const isPicked = opt === picked;
            return (
              <Button key={opt} variant="outline"
                className={`h-auto py-6 text-lg font-semibold ${
                  picked !== null && isTarget ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : picked !== null && isPicked ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20'
                  : ''
                }`}
                onClick={() => pick(opt)}>
                {opt}
              </Button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="space-y-3">
            {round.pair.note && <p className="rounded-lg bg-muted p-3 text-sm text-center">{round.pair.note}</p>}
            <Button variant="chunky" className="w-full" onClick={() => void nextRound()}>
              {picked === round.target ? 'Chuẩn! Tiếp tục' : 'Hiểu rồi'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'done') {
    const pct = Math.round((correct / Math.max(rounds.length, 1)) * 100);
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">👂</div>
        <h1 className="text-2xl font-bold">Hoàn thành bài luyện tai!</h1>
        <p className="text-lg">Nghe đúng {correct}/{rounds.length} ({pct}%)</p>
        <p className="text-sm text-muted-foreground">
          {pct >= 80 ? 'Tai bạn phân biệt tốt cặp âm này rồi — cứ thế phát huy!' : 'Cặp âm này khó thật — bạn đã luyện hết bài là thắng rồi. Nghe lại từ ví dụ mỗi ngày sẽ lên nhanh.'}
        </p>
        <div className="grid w-full gap-2">
          {stepId
            ? <Link href="/journey"><Button variant="chunky" size="lg" className="w-full" disabled={submitting}>Về lộ trình</Button></Link>
            : <Button variant="chunky" size="lg" onClick={startDrill}>Luyện lại</Button>}
          {stepId && <Button variant="ghost" onClick={startDrill}>Luyện thêm lượt nữa</Button>}
        </div>
      </div>
    );
  }

  // ── Phase learn ──
  return (
    <div className="mx-auto max-w-lg p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/journey"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Lộ trình</Button></Link>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">Cấp {lesson.level}</span>
      </div>

      <div className="text-center space-y-2">
        <div className="text-5xl font-bold text-primary">{lesson.ipa}</div>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-sm font-semibold text-rose-500">Vì sao người Việt hay sai?</p>
          <p className="text-sm">{lesson.whyHard}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-sm font-semibold text-emerald-600">👄 Đặt miệng thế nào?</p>
          <p className="text-sm">{lesson.mouthTip}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Bấm nghe giọng thật, nhại theo:</p>
        <div className="flex flex-wrap gap-2">
          {lesson.exampleWords.map((w) => (
            <Button key={w} variant="outline" size="sm"
              onClick={() => { if (isPlayableWord(w)) void playWordAudio(w, null, 0.9); else speak(w, 0.9); }}>
              <Volume2 className="w-3.5 h-3.5 mr-1.5" /> {w}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Cặp âm dễ lẫn trong bài:</p>
        <div className="space-y-1.5">
          {lesson.minimalPairs.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span><b>{p.a}</b> vs <b>{p.b}</b></span>
              {isPlayableWord(p.a) && isPlayableWord(p.b) && (
                <span className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void playWordAudio(p.a, null, 0.9)}><Volume2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void playWordAudio(p.b, null, 0.9)}><Volume2 className="w-3.5 h-3.5" /></Button>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {canDrill ? (
        <Button variant="chunky" size="lg" className="w-full" onClick={startDrill}>
          <Ear className="w-5 h-5 mr-2" /> Luyện tai: nghe & chọn ({DRILL_ROUNDS} câu)
        </Button>
      ) : (
        <Button variant="chunky" size="lg" className="w-full" disabled={submitting}
          onClick={async () => {
            if (stepId) {
              setSubmitting(true);
              const result = await completeRoadmapStep(stepId);
              setSubmitting(false);
              if (result) toast.success(`+${result.xpAwarded} XP`);
            }
            router.push(stepId ? '/journey' : '/student');
          }}>
          Đã luyện xong bài này
        </Button>
      )}
    </div>
  );
}
