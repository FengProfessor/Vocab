'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, type SRSProgress } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Volume2, Snail, ArrowRight, RotateCcw, BookOpen, GraduationCap, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { speak, judgeAnswer, verdictToQuality, parseIpa, type Verdict } from '@/lib/study';

interface WordItem {
  id: string;
  word: string;
  translation: string;
  ipa: string;
  pos: string;
  example: string;
  image_url?: string;
  reviewCount: number;
  srsLevel: number;
  isDue: boolean;
  srs: SRSProgress | null;
}

const NEW_BATCH = 8;       // số từ mới mỗi phiên học
const NEXT_DELAY_MS = 1400; // delay tự chuyển sau khi chấm recall

type Phase = 'loading' | 'empty' | 'ready' | 'introduce' | 'recall' | 'done';

export function LearnMode({ classroomId: initialClassroomId }: { classroomId: string | null }) {
  const router = useRouter();
  const [classroomId, setClassroomId] = useState<string | null>(initialClassroomId);
  const [phase, setPhase] = useState<Phase>('loading');
  const [batch, setBatch] = useState<WordItem[]>([]);
  const [remainingNew, setRemainingNew] = useState(0);

  // Introduce
  const [introIndex, setIntroIndex] = useState(0);

  // Recall
  const [recallIndex, setRecallIndex] = useState(0);
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [results, setResults] = useState({ correct: 0, close: 0, wrong: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load từ mới (chưa học) đã enrich ──
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { router.push('/auth'); return; }

        const url = initialClassroomId
          ? `/api/words?classroomId=${initialClassroomId}&limit=300`
          : `/api/words?limit=300`;
        const res = await authFetch(url);
        const data = await res.json();

        if (data.success && data.data) {
          if (!initialClassroomId && data.classroomId) setClassroomId(data.classroomId);
          const all: WordItem[] = data.data;
          const fresh = all.filter(
            (w) =>
              w.reviewCount === 0 &&
              w.word &&
              w.translation &&
              !w.translation.includes('failed') &&
              !w.translation.includes('Analyzing') &&
              !w.translation.includes('⏳'),
          );
          if (fresh.length === 0) { setPhase('empty'); return; }
          setBatch(fresh.slice(0, NEW_BATCH));
          setRemainingNew(Math.max(0, fresh.length - NEW_BATCH));
          setPhase('ready');
        } else {
          setPhase('empty');
        }
      } catch (err) {
        console.error('[Learn] Load failed:', err);
        toast.error('Không tải được từ mới.');
        setPhase('empty');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassroomId]);

  // Tự phát âm khi đổi thẻ ở bước Giới thiệu
  useEffect(() => {
    if (phase === 'introduce' && batch[introIndex]) {
      speak(batch[introIndex].word, 1.0);
    }
  }, [phase, introIndex, batch]);

  // Cleanup timer
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const startSession = () => {
    setPhase('introduce');
    setIntroIndex(0);
  };

  const nextIntro = () => {
    if (introIndex + 1 >= batch.length) {
      // Sang bước Nhớ lại
      setPhase('recall');
      setRecallIndex(0);
      setInput('');
      setVerdict(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setIntroIndex((i) => i + 1);
    }
  };

  const recallWord = batch[recallIndex];

  const goNextRecall = useCallback(() => {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    if (recallIndex + 1 >= batch.length) {
      setPhase('done');
    } else {
      setRecallIndex((i) => i + 1);
      setInput('');
      setVerdict(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [recallIndex, batch.length]);

  const submitRecall = useCallback(() => {
    if (!recallWord || verdict !== null) return;
    const guess = input.trim();
    if (!guess) return;
    const v = judgeAnswer(guess, recallWord.word);
    setVerdict(v);
    setResults((p) => ({
      correct: v === 'correct' ? p.correct + 1 : p.correct,
      close: v === 'close' ? p.close + 1 : p.close,
      wrong: v === 'wrong' ? p.wrong + 1 : p.wrong,
    }));
    speak(recallWord.word, 1.0);

    // Ghi SRS (fire-and-forget) → FSRS lên lịch learning step
    authFetch('/api/words/srs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: recallWord.id, quality: verdictToQuality(v) }),
    }).catch((err) => console.error('[Learn] save SRS failed:', err));

    advanceTimer.current = setTimeout(goNextRecall, NEXT_DELAY_MS);
  }, [recallWord, verdict, input, goNextRecall]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (verdict === null) submitRecall(); else goNextRecall();
    } else if (e.key === ' ' && verdict !== null) {
      e.preventDefault();
      goNextRecall();
    }
  };

  // Lưu accuracy phiên khi xong
  useEffect(() => {
    if (phase !== 'done') return;
    authFetch('/api/quiz/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classroomId,
        score: results.correct,
        totalQuestions: batch.length,
        quizType: 'vocabulary',
      }),
    }).catch((err) => console.error('[Learn] save session failed:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ═══════════ RENDER ═══════════

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-600 font-bold animate-pulse">Đang chuẩn bị bài học...</p>
        </div>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans">
        <div className="text-center space-y-3">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Hết từ mới rồi!</h1>
          <p className="text-slate-500 text-lg font-medium">Bạn đã học hết các từ chưa thuộc. Giờ chuyển sang ôn tập nhé.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="h-14 px-7 rounded-2xl font-bold border-2" onClick={() => router.push('/student')}>
            <ChevronLeft className="mr-2 h-5 w-5" /> Dashboard
          </Button>
          <Button
            className="h-14 px-7 rounded-2xl bg-primary text-white font-bold border-b-4 border-primary/60 active:translate-y-0.5 active:border-b-0"
            onClick={() => router.push(classroomId ? `/flashcard?class=${classroomId}` : '/flashcard')}
          >
            <GraduationCap className="mr-2 h-5 w-5" /> Ôn tập ngay
          </Button>
        </div>
      </div>
    );
  }

  // Màn bắt đầu — cần 1 cú chạm để mở khoá audio (autoplay policy)
  if (phase === 'ready') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black">
          <Sparkles className="h-4 w-4" /> Phiên học mới
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Học {batch.length} từ mới</h1>
          <p className="text-slate-500 font-medium max-w-sm">
            Xem từ, nghĩa và nghe phát âm trước. Sau đó điền lại để kiểm tra trí nhớ ngay.
          </p>
        </div>
        <Button
          onClick={startSession}
          className="h-16 px-10 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-200 border-b-4 border-indigo-800 active:translate-y-0.5 active:border-b-0"
        >
          <BookOpen className="mr-2 h-6 w-6" /> Bắt đầu học
        </Button>
        <Link href="/student" className="text-sm font-bold text-slate-400 hover:text-slate-600">← Về Dashboard</Link>
      </div>
    );
  }

  // ── Bước GIỚI THIỆU ──
  if (phase === 'introduce') {
    const w = batch[introIndex];
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Header label="Học từ mới" badge={`${introIndex + 1} / ${batch.length}`} />
        <ProgressBar value={(introIndex / batch.length) * 100} />

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <Card className="w-full max-w-[440px] border-none shadow-2xl shadow-indigo-100 rounded-[40px] bg-white border-b-8 border-slate-200">
            <CardContent className="p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
              <Badge className="bg-amber-50 text-amber-600 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                📖 Làm quen
              </Badge>

              {w.image_url && (
                <div className="w-full h-40 rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                  <img src={w.image_url} alt={w.word} loading="lazy" decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              <h2 className="text-5xl font-black tracking-tight text-slate-900 break-words w-full">{w.word}</h2>
              {w.ipa && <p className="text-lg font-mono text-slate-400">{parseIpa(w.ipa)}</p>}

              <div className="flex items-center gap-3">
                <button onClick={() => speak(w.word, 1.0)}
                  className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-indigo-200">
                  <Volume2 className="h-7 w-7 text-indigo-600" />
                </button>
                <button onClick={() => speak(w.word, 0.6)} title="Phát âm chậm"
                  className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-amber-200">
                  <Snail className="h-7 w-7 text-amber-600" />
                </button>
              </div>

              <div className="w-full border-t border-slate-100 pt-4 space-y-3">
                <p className="text-2xl font-black text-indigo-600">{w.translation}</p>
                {w.pos && (
                  <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase tracking-widest px-3">{w.pos}</Badge>
                )}
                {w.example && (
                  <p className="text-sm font-medium text-slate-500 italic border-l-4 border-slate-200 pl-3 text-left">
                    &quot;{w.example}&quot;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="w-full max-w-[440px]">
            <button onClick={nextIntro}
              className="w-full h-16 rounded-[28px] bg-indigo-600 border-b-4 border-indigo-800 text-white font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2">
              {introIndex + 1 >= batch.length ? 'Kiểm tra trí nhớ' : 'Tiếp'} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Bước NHỚ LẠI ──
  if (phase === 'recall' && recallWord) {
    const cardBg =
      verdict === 'correct' ? 'bg-emerald-50 border-emerald-300'
        : verdict === 'close' ? 'bg-amber-50 border-amber-300'
          : verdict === 'wrong' ? 'bg-rose-50 border-rose-300'
            : 'bg-white border-slate-200';
    const inputBorder =
      verdict === 'correct' ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
        : verdict === 'close' ? 'border-amber-400 bg-amber-50 text-amber-700'
          : verdict === 'wrong' ? 'border-rose-400 bg-rose-50 text-rose-700 animate-shake'
            : 'border-slate-200 bg-slate-50 focus:border-indigo-500';

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Header label="Nhớ lại" badge={`${recallIndex + 1} / ${batch.length}`} />
        <ProgressBar value={(recallIndex / batch.length) * 100} />

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <Card className={`w-full max-w-[480px] border-2 shadow-2xl shadow-indigo-100 rounded-[40px] border-b-8 transition-colors duration-300 ${cardBg}`}>
            <CardContent className="p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
              <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                ✍️ Gõ từ tiếng Anh
              </Badge>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 break-words w-full px-2">{recallWord.translation}</h2>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {recallWord.pos && (
                  <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase tracking-widest px-3">{recallWord.pos}</Badge>
                )}
                <button onClick={() => speak(recallWord.word, 0.6)} title="Nghe gợi ý (chậm)"
                  className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center hover:scale-110 transition-transform border border-amber-200">
                  <Snail className="h-5 w-5 text-amber-600" />
                </button>
              </div>

              <div className="w-full mt-1">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={input}
                  disabled={verdict !== null}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Gõ từ vừa học..."
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  className={`w-full text-center text-2xl sm:text-3xl font-black p-4 rounded-2xl border-4 focus:outline-none transition-colors disabled:opacity-90 ${inputBorder}`}
                />
              </div>

              {verdict !== null && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {verdict === 'correct' && <p className="text-lg font-black text-emerald-600">✓ Chính xác! <span className="underline decoration-emerald-400">{recallWord.word}</span></p>}
                  {verdict === 'close' && <p className="text-lg font-black text-amber-600">Gần đúng! Đáp án: <span className="underline decoration-amber-400">{recallWord.word}</span></p>}
                  {verdict === 'wrong' && <p className="text-lg font-black text-rose-600">✗ Đáp án: <span className="underline decoration-rose-400">{recallWord.word}</span></p>}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="w-full max-w-[480px]">
            {verdict === null ? (
              <button onClick={submitRecall} disabled={!input.trim()}
                className="w-full h-16 rounded-[28px] bg-indigo-600 border-b-4 border-indigo-800 text-white font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-40">
                Kiểm tra
              </button>
            ) : (
              <button onClick={goNextRecall}
                className="w-full h-16 rounded-[28px] bg-white border-b-4 border-slate-200 text-slate-800 font-black text-lg shadow-sm hover:bg-slate-50 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2">
                {recallIndex + 1 >= batch.length ? 'Xem kết quả' : 'Tiếp theo'} <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── DONE ──
  const accuracy = batch.length > 0 ? Math.round((results.correct / batch.length) * 100) : 0;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans">
      <div className="text-center space-y-3">
        <div className="text-7xl mb-4 animate-bounce">🎓</div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Đã học {batch.length} từ!</h1>
        <p className="text-slate-500 text-lg font-medium">Độ chính xác khi nhớ lại: {accuracy}%. Các từ này sẽ quay lại ở phần Ôn tập.</p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Đúng', val: results.correct, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Gần đúng', val: results.close, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Sai', val: results.wrong, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((r) => (
              <div key={r.label} className={`${r.bg} rounded-2xl p-4`}>
                <div className={`text-2xl font-black ${r.color}`}>{r.val}</div>
                <div className={`text-[10px] uppercase font-black tracking-widest ${r.color} mt-1 opacity-70`}>{r.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2" onClick={() => router.push('/student')}>
          <ChevronLeft className="mr-2 h-5 w-5" /> Dashboard
        </Button>
        {remainingNew > 0 ? (
          <Button className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold border-b-4 border-indigo-800 active:translate-y-0.5 active:border-b-0" onClick={() => window.location.reload()}>
            <RotateCcw className="mr-2 h-5 w-5" /> Học tiếp ({remainingNew})
          </Button>
        ) : (
          <Button className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold border-b-4 border-primary/60 active:translate-y-0.5 active:border-b-0"
            onClick={() => router.push(classroomId ? `/flashcard?class=${classroomId}` : '/flashcard')}>
            <GraduationCap className="mr-2 h-5 w-5" /> Ôn tập
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components dùng lại trong các bước ──
function Header({ label, badge }: { label: string; badge: string }) {
  return (
    <header className="flex items-center justify-between p-4 sm:p-6 bg-white/50 backdrop-blur-md sticky top-0 z-10 gap-3">
      <Link href="/student">
        <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-primary font-bold rounded-xl">
          <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </Link>
      <div className="flex items-center gap-2 font-black text-slate-700">
        <BookOpen className="h-4 w-4 text-indigo-500" /> {label}
      </div>
      <div className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-black tracking-widest">{badge}</div>
    </header>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="px-6 mt-2">
      <div className="h-2.5 w-full bg-white rounded-full overflow-hidden shadow-sm border border-slate-100">
        <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
