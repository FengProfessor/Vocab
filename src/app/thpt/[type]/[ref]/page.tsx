'use client';

/**
 * THPT player — 1 trang xử lý mọi dạng bài luyện thi:
 * announcement/leaflet/cloze = đọc điền (MCQ mỗi chỗ trống)
 * reading = đọc hiểu (MCQ)
 * arrange = sắp xếp câu (bấm theo thứ tự)
 * exam = đề mini gộp nhiều dạng, chấm ≥80% mới pass.
 * Nội dung import trực tiếp từ content-v1.json (như bài phát âm). Xong → POST roadmap progress.
 */
import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { completeRoadmapStep, setRoadmapCelebrateFlag } from '@/lib/roadmap-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import contentData from '@/data/thpt/content-v1.json';

interface Blank { options: string[]; answer: string; explain: string }
interface FillItem { id: string; title: string; text: string; blanks: Blank[] }
interface ArrangeItem { id: string; prompt: string; sentences: { key: string; text: string }[]; answer: string[]; explain: string }
interface ReadingItem { id: string; title: string; passage: string; questions: { q: string; options: string[]; answer: string; explain: string }[] }
interface ExamItem { id: string; title: string; note?: string; itemRefs: { type: string; id: string }[] }
type Content = {
  announcement: FillItem[]; leaflet: FillItem[]; cloze: FillItem[];
  reading: ReadingItem[]; arrange: ArrangeItem[]; exam: ExamItem[];
};
const content = contentData as unknown as Content;

/** Một "câu hỏi phẳng" để chấm chung: prompt + options + answer + explain + ngữ cảnh. */
interface FlatQ { id: string; kind: 'mcq' | 'arrange'; context?: string; prompt: string; options?: string[]; answer: string; answerSeq?: string[]; sentences?: { key: string; text: string }[]; explain: string }

function fillToQs(item: FillItem): FlatQ[] {
  return item.blanks.map((b, i) => ({
    id: `${item.id}-b${i}`, kind: 'mcq', context: item.text,
    prompt: `Chỗ trống (${i + 1}) — ${item.title}`, options: b.options, answer: b.answer, explain: b.explain,
  }));
}
function readingToQs(item: ReadingItem): FlatQ[] {
  return item.questions.map((q, i) => ({
    id: `${item.id}-q${i}`, kind: 'mcq', context: item.passage,
    prompt: q.q, options: q.options, answer: q.answer, explain: q.explain,
  }));
}
function arrangeToQ(item: ArrangeItem): FlatQ {
  return { id: item.id, kind: 'arrange', prompt: item.prompt, sentences: item.sentences, answer: item.answer.join('-'), answerSeq: item.answer, explain: item.explain };
}

export default function ThptPlayerPage() {
  const { type, ref } = useParams<{ type: string; ref: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepId = searchParams.get('roadmapStep') ?? '';

  const { title, questions, note } = useMemo(() => {
    if (type === 'exam') {
      const exam = content.exam.find((e) => e.id === ref);
      if (!exam) return { title: '', questions: [] as FlatQ[], note: undefined };
      const qs: FlatQ[] = [];
      for (const r of exam.itemRefs) {
        if (r.type === 'reading') { const it = content.reading.find((x) => x.id === r.id); if (it) qs.push(...readingToQs(it)); }
        else if (r.type === 'arrange') { const it = content.arrange.find((x) => x.id === r.id); if (it) qs.push(arrangeToQ(it)); }
        else { const list = (content as unknown as Record<string, FillItem[]>)[r.type]; const it = list?.find((x) => x.id === r.id); if (it) qs.push(...fillToQs(it)); }
      }
      return { title: exam.title, questions: qs, note: exam.note };
    }
    if (type === 'reading') { const it = content.reading.find((x) => x.id === ref); return { title: it?.title ?? '', questions: it ? readingToQs(it) : [], note: undefined }; }
    if (type === 'arrange') { const it = content.arrange.find((x) => x.id === ref); return { title: 'Sắp xếp đoạn', questions: it ? [arrangeToQ(it)] : [], note: undefined }; }
    const list = (content as unknown as Record<string, FillItem[]>)[type];
    const it = list?.find((x) => x.id === ref);
    return { title: it?.title ?? '', questions: it ? fillToQs(it) : [], note: undefined };
  }, [type, ref]);

  const isExam = type === 'exam';
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [seq, setSeq] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const q = questions[index];

  const gradeCurrent = (): boolean => {
    if (!q) return false;
    if (q.kind === 'arrange') return seq.join('-') === q.answer;
    return picked === q.answer;
  };

  const reveal = (): void => {
    if (revealed || !q) return;
    if (q.kind === 'arrange' && seq.length !== (q.sentences?.length ?? 0)) return;
    if (q.kind === 'mcq' && picked === null) return;
    setRevealed(true);
    if (gradeCurrent()) setCorrect((c) => c + 1);
  };

  const next = async (): Promise<void> => {
    if (index + 1 < questions.length) {
      setIndex(index + 1); setPicked(null); setSeq([]); setRevealed(false);
      return;
    }
    setFinished(true);
    const pct = Math.round((correct / Math.max(questions.length, 1)) * 100);
    // Đề mini cần ≥80% mới ghi hoàn thành; các bài luyện lẻ luôn ghi hoàn thành.
    if (stepId && (!isExam || pct >= 80)) {
      setSubmitting(true);
      const result = await completeRoadmapStep(stepId, isExam ? pct : undefined);
      setSubmitting(false);
      if (result) { setRoadmapCelebrateFlag(result); router.push('/journey'); }
    }
  };

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <p>Nội dung bài này chưa sẵn sàng.</p>
        <Link href="/journey"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Về lộ trình</Button></Link>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correct / questions.length) * 100);
    const passed = !isExam || pct >= 80;
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">{passed ? '🎉' : '💪'}</div>
        <h1 className="text-2xl font-bold">{isExam ? (passed ? 'Vượt đề mini!' : 'Chưa đạt') : 'Hoàn thành bài!'}</h1>
        <p className="text-lg">Đúng {correct}/{questions.length} — <b>{pct}%</b>{isExam ? (passed ? ' (≥80% đạt)' : ' (cần ≥80%)') : ''}</p>
        <div className="grid w-full gap-2">
          {passed && stepId
            ? <Link href="/journey"><Button variant="chunky" size="lg" className="w-full" disabled={submitting}>Về lộ trình</Button></Link>
            : <Button variant="chunky" size="lg" onClick={() => { setIndex(0); setCorrect(0); setPicked(null); setSeq([]); setRevealed(false); setFinished(false); }}>Làm lại</Button>}
          <Link href="/journey"><Button variant="ghost" className="w-full">Về lộ trình</Button></Link>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-lg p-4 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/journey"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} /></div>
        <span className="text-sm text-muted-foreground">{index + 1}/{questions.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">{title}{note ? ` · ${note}` : ''}</p>

      {q.context && (
        <Card><CardContent className="p-4 whitespace-pre-line text-sm leading-relaxed">{q.context}</CardContent></Card>
      )}
      <h1 className="text-base font-bold">
        {q.prompt?.trim()
          ? q.prompt
          : q.kind === 'arrange'
            ? 'Sắp xếp các câu theo thứ tự đúng'
            : 'Chọn đáp án đúng cho chỗ trống / câu hỏi'}
      </h1>

      {q.kind === 'arrange' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Bấm các câu theo đúng thứ tự:</p>
          <div className="space-y-2">
            {q.sentences!.map((s) => {
              const order = seq.indexOf(s.key);
              const used = order >= 0;
              return (
                <button key={s.key} disabled={revealed}
                  onClick={() => setSeq((prev) => used ? prev.filter((k) => k !== s.key) : [...prev, s.key])}
                  className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm ${used ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${used ? 'bg-primary text-white' : 'bg-muted'}`}>{used ? order + 1 : ''}</span>
                  <span>{s.text}</span>
                </button>
              );
            })}
          </div>
          {revealed && (
            <p className="rounded-lg bg-muted p-3 text-sm">Đáp án đúng: <b>{q.answerSeq!.join(' → ')}</b><br />{q.explain}</p>
          )}
          {!revealed
            ? <Button variant="chunky" className="w-full" disabled={seq.length !== q.sentences!.length} onClick={reveal}>Kiểm tra</Button>
            : <Button variant="chunky" className="w-full" onClick={() => void next()}>{index + 1 < questions.length ? 'Tiếp tục' : 'Xong'}</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2">
            {q.options!.map((opt) => {
              const isAnswer = opt === q.answer;
              const isPicked = opt === picked;
              return (
                <Button key={opt} variant="outline" disabled={revealed && !isAnswer && !isPicked}
                  className={`justify-start h-auto py-3 text-sm whitespace-normal ${revealed && isAnswer ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : revealed && isPicked ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20' : ''}`}
                  onClick={() => { if (!revealed) { setPicked(opt); } }}>
                  {opt}
                </Button>
              );
            })}
          </div>
          {revealed && <p className="rounded-lg bg-muted p-3 text-sm">{q.explain}</p>}
          {!revealed
            ? <Button variant="chunky" className="w-full" disabled={picked === null} onClick={reveal}><CheckCircle2 className="w-4 h-4 mr-2" /> Kiểm tra</Button>
            : <Button variant="chunky" className="w-full" onClick={() => void next()}>{index + 1 < questions.length ? 'Tiếp tục' : 'Xong'}</Button>}
        </div>
      )}
    </div>
  );
}
