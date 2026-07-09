'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, type SRSProgress } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Volume2, Snail, ArrowRight, RotateCcw, BookOpen, GraduationCap, Sparkles, HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { StudyGuideModal, STUDY_GUIDE_KEY } from '@/components/StudyGuideModal';
import { speak, judgeAnswer, verdictToQuality, parseIpa, canAutoFocus, type Verdict } from '@/lib/study';
import { completeRoadmapStep } from '@/lib/roadmap-client';

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
const NEXT_DELAY_MS = 1400;  // delay tự chuyển khi đúng
const WRONG_DELAY_MS = 2400; // sai → đợi lâu hơn để kịp nhìn đáp án

type Phase = 'loading' | 'empty' | 'ready' | 'introduce' | 'recall' | 'done';

export function LearnMode({ classroomId: initialClassroomId }: { classroomId: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');
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

  // Hướng dẫn cơ chế — tự hiện lần đầu (dùng chung key với /flashcard ôn), mở lại qua nút "?"
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(STUDY_GUIDE_KEY) !== '1') setShowGuide(true);
  }, []);
  const closeGuide = () => {
    localStorage.setItem(STUDY_GUIDE_KEY, '1');
    setShowGuide(false);
  };

  // ── Load từ mới (chưa học) đã enrich ──
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { router.push('/auth'); return; }

        // filter=new: server lọc từ CHƯA học trên toàn bộ words (không kẹt 300 từ mới nhất)
        const query = new URLSearchParams({
          filter: 'new',
          limit: idsParam === null ? '100' : '20',
        });
        if (initialClassroomId) query.set('classroomId', initialClassroomId);
        if (idsParam !== null) query.set('ids', idsParam);

        const res = await authFetch(`/api/words?${query.toString()}`);
        const data = await res.json();

        if (data.success && data.data) {
          if (!initialClassroomId && data.classroomId) setClassroomId(data.classroomId);
          const fresh: WordItem[] = data.data;
          if (fresh.length === 0) { setPhase('empty'); return; }
          const batchLimit = idsParam === null ? NEW_BATCH : 20;
          setBatch(fresh.slice(0, batchLimit));
          setRemainingNew(Math.max(0, fresh.length - batchLimit));
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
  }, [initialClassroomId, idsParam, router]);

  // Tự phát âm khi đổi thẻ ở bước Giới thiệu
  useEffect(() => {
    if (phase === 'introduce' && batch[introIndex]) {
      speak(batch[introIndex].word, 1.0);
    }
  }, [phase, introIndex, batch]);

  // Cleanup timer
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  // Preload toàn bộ ảnh trong batch (≤20 từ) — ảnh sẵn trong cache khi lật tới
  useEffect(() => {
    batch.forEach((w) => {
      if (w.image_url) {
        const img = new window.Image();
        img.src = `/api/image-proxy?url=${encodeURIComponent(w.image_url)}`;
      }
    });
  }, [batch]);

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

  // Chốt kết quả 1 từ: ghi điểm + phát âm + sync SRS + hẹn auto-next.
  // Sai → đợi lâu hơn để user kịp nhìn đáp án.
  const finalizeRecall = useCallback((v: Verdict) => {
    if (!recallWord) return;
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

    advanceTimer.current = setTimeout(goNextRecall, v === 'correct' ? NEXT_DELAY_MS : WRONG_DELAY_MS);
  }, [recallWord, goNextRecall]);

  const submitRecall = useCallback(() => {
    if (!recallWord || verdict !== null) return;
    const guess = input.trim();
    if (!guess) return;
    finalizeRecall(judgeAnswer(guess, recallWord.word));
  }, [recallWord, verdict, input, finalizeRecall]);

  // "Không nhớ" — không bắt user gõ bừa; tính là sai (Again) và hiện đáp án
  const giveUpRecall = useCallback(() => {
    if (!recallWord || verdict !== null) return;
    finalizeRecall('wrong');
  }, [recallWord, verdict, finalizeRecall]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (verdict === null) submitRecall(); else goNextRecall();
    } else if (e.key === ' ' && verdict !== null) {
      e.preventDefault();
      goNextRecall();
    } else if (e.key === 'Escape' && verdict === null) {
      e.preventDefault();
      giveUpRecall();
    }
  };

  // Lưu accuracy phiên khi xong + báo hoàn thành step lộ trình (nếu mở từ /journey)
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

    const roadmapStep = searchParams.get('roadmapStep');
    if (roadmapStep) {
      void completeRoadmapStep(roadmapStep).then((result) => {
        if (result) toast.success(`+${result.xpAwarded} XP lộ trình — bạn đã đi hết bước này, đều đặn thế là quý lắm!`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ═══════════ RENDER ═══════════

  if (phase === 'loading') {
    return (
      <div className="flex h-[calc(100dvh-62px)] items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-5">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="font-bold animate-pulse text-indigo-600">Đang chuẩn bị bài học...</p>
        </div>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="flex h-[calc(100dvh-62px)] flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 font-sans">
        <div className="space-y-3 text-center">
          <div className="mb-2 text-6xl">🎉</div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Hết từ mới rồi!</h1>
          <p className="text-base font-medium text-slate-500 sm:text-lg">Bạn đã học hết các từ chưa thuộc. Giờ chuyển sang ôn tập nhé.</p>
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
      <div className="flex h-[calc(100dvh-62px)] flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 text-center font-sans">
        <StudyGuideModal open={showGuide} onClose={closeGuide} />
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-black text-indigo-600">
          <Sparkles className="h-4 w-4" /> Phiên học mới
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Học {batch.length} từ mới</h1>
          <p className="max-w-sm font-medium text-slate-500">
            Xem từ, nghĩa và nghe phát âm trước. Sau đó điền lại để kiểm tra trí nhớ ngay.
          </p>
        </div>
        <Button
          onClick={startSession}
          className="h-14 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-8 text-base font-black text-white shadow-xl shadow-indigo-200 active:translate-y-0.5 active:border-b-0 sm:h-16 sm:px-10 sm:text-lg"
        >
          <BookOpen className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Bắt đầu học
        </Button>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowGuide(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-700">
            <HelpCircle className="h-4 w-4" /> Cách học hiệu quả
          </button>
          <Link href="/student" className="text-sm font-bold text-slate-400 hover:text-slate-600">← Về Dashboard</Link>
        </div>
      </div>
    );
  }

  // ── Bước GIỚI THIỆU — fit 1 viewport (trừ shell header 62px) ──
  if (phase === 'introduce') {
    const w = batch[introIndex];
    return (
      <div className="flex h-[calc(100dvh-62px)] max-h-[calc(100dvh-62px)] flex-col overflow-hidden bg-slate-50 font-sans">
        <StudyGuideModal open={showGuide} onClose={closeGuide} />
        <Header label="Học từ mới" badge={`${introIndex + 1} / ${batch.length}`} onHelp={() => setShowGuide(true)} />
        <ProgressBar value={(introIndex / batch.length) * 100} />

        <div className="flex min-h-0 flex-1 flex-col items-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
          <Card className="flex min-h-0 w-full max-w-[400px] flex-1 flex-col overflow-hidden rounded-[28px] border-none border-b-[6px] border-slate-200 bg-white shadow-xl shadow-indigo-100 sm:rounded-[32px]">
            <CardContent className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overscroll-contain p-3 text-center sm:gap-2.5 sm:p-4">
              <Badge className="shrink-0 rounded-full border-none bg-amber-50 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
                📖 Làm quen
              </Badge>

              {w.image_url && (
                <div className="relative h-[clamp(72px,16dvh,128px)] w-full shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(w.image_url)}`}
                    alt={w.word}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = 'none';
                      img.parentElement?.querySelector('[data-img-fallback]')?.classList.replace('hidden', 'flex');
                    }}
                  />
                  <div
                    data-img-fallback
                    className="absolute inset-0 hidden flex-col items-center justify-center bg-slate-50 text-slate-300"
                  >
                    <span className="text-2xl">🖼️</span>
                  </div>
                </div>
              )}

              <h2 className="line-clamp-2 w-full break-words text-[clamp(1.5rem,6.5vw,2.75rem)] font-black leading-tight tracking-tight text-slate-900">
                {w.word}
              </h2>
              {w.ipa && <p className="shrink-0 font-mono text-sm text-slate-400 sm:text-base">{parseIpa(w.ipa)}</p>}

              <div className="flex shrink-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => speak(w.word, 1.0)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 transition-transform hover:scale-105 active:scale-95 sm:h-12 sm:w-12"
                >
                  <Volume2 className="h-5 w-5 text-indigo-600 sm:h-6 sm:w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => speak(w.word, 0.6)}
                  title="Phát âm chậm"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 transition-transform hover:scale-105 active:scale-95 sm:h-12 sm:w-12"
                >
                  <Snail className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="w-full shrink space-y-1.5 border-t border-slate-100 pt-2">
                <p className="line-clamp-3 text-[clamp(1.05rem,4vw,1.5rem)] font-black leading-snug text-indigo-600">
                  {w.translation}
                </p>
                {w.pos && (
                  <Badge className="border-none bg-slate-100 px-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {w.pos}
                  </Badge>
                )}
                {w.example && (
                  <p className="line-clamp-3 border-l-4 border-slate-200 pl-2.5 text-left text-xs font-medium italic leading-snug text-slate-500 sm:text-sm">
                    &quot;{w.example}&quot;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-2 w-full max-w-[400px] shrink-0">
            <button
              type="button"
              onClick={nextIntro}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-b-[3px] border-indigo-800 bg-indigo-600 text-base font-black text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-700 active:translate-y-0.5 active:border-b-0 sm:h-16 sm:rounded-[22px] sm:text-lg"
            >
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
      <div className="flex h-[calc(100dvh-62px)] max-h-[calc(100dvh-62px)] flex-col overflow-hidden bg-slate-50 font-sans">
        <StudyGuideModal open={showGuide} onClose={closeGuide} />
        <Header label="Nhớ lại" badge={`${recallIndex + 1} / ${batch.length}`} onHelp={() => setShowGuide(true)} />
        <ProgressBar value={(recallIndex / batch.length) * 100} />

        <div className="flex min-h-0 flex-1 flex-col items-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
          <Card
            className={`flex min-h-0 w-full max-w-[400px] flex-1 flex-col overflow-hidden rounded-[28px] border-2 border-b-[6px] shadow-xl shadow-indigo-100 transition-colors duration-300 sm:rounded-[32px] ${cardBg}`}
          >
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-3 text-center sm:p-4">
              <Badge className="mx-auto shrink-0 rounded-full border-none bg-indigo-50 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-600">
                ✍️ Gõ từ tiếng Anh
              </Badge>

              {/* Nghĩa chiếm phần giữa — không bị input/nút đè */}
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 py-2">
                <h2 className="line-clamp-5 w-full break-words px-1 text-[clamp(1.35rem,5.5vw,2.1rem)] font-black leading-tight tracking-tight text-slate-900">
                  {recallWord.translation}
                </h2>
                <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5">
                  {recallWord.pos && (
                    <Badge className="border-none bg-slate-100 px-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {recallWord.pos}
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => speak(recallWord.word, 0.6)}
                    title="Nghe gợi ý (chậm)"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 transition-transform hover:scale-105"
                  >
                    <Snail className="h-3.5 w-3.5 text-amber-600" />
                  </button>
                </div>
              </div>

              <div className="mt-auto w-full shrink-0 space-y-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus={canAutoFocus()}
                  value={input}
                  readOnly={verdict !== null}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Gõ từ..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={`h-10 w-full rounded-xl border-2 px-2 text-center text-base font-bold transition-colors focus:outline-none read-only:opacity-90 sm:h-11 sm:text-lg ${inputBorder}`}
                />

                {verdict !== null && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {verdict === 'correct' && (
                      <p className="text-sm font-black text-emerald-600">
                        ✓ Chính xác!{' '}
                        <span className="underline decoration-emerald-400">{recallWord.word}</span>
                      </p>
                    )}
                    {verdict === 'close' && (
                      <p className="text-sm font-black text-amber-600">
                        Gần đúng! Đáp án:{' '}
                        <span className="underline decoration-amber-400">{recallWord.word}</span>
                      </p>
                    )}
                    {verdict === 'wrong' && (
                      <p className="text-sm font-black text-rose-600">
                        ✗ Đáp án: <span className="underline decoration-rose-400">{recallWord.word}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-1.5 w-full max-w-[400px] shrink-0">
            {verdict === null ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={submitRecall}
                  disabled={!input.trim()}
                  className="h-10 flex-[2] rounded-xl border-b-[3px] border-indigo-800 bg-indigo-600 text-sm font-black text-white shadow-sm transition-all hover:bg-indigo-700 active:translate-y-0.5 active:border-b-0 disabled:opacity-40 sm:h-11"
                >
                  Kiểm tra
                </button>
                <button
                  type="button"
                  onClick={giveUpRecall}
                  className="h-10 flex-1 rounded-xl border border-b-[3px] border-slate-200 bg-white text-[11px] font-bold text-slate-500 transition-all hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 sm:h-11 sm:text-xs"
                >
                  Không nhớ
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={goNextRecall}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-b-[3px] border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:translate-y-0.5 active:border-b-0 sm:h-11"
              >
                {recallIndex + 1 >= batch.length ? 'Xem kết quả' : 'Tiếp theo'}{' '}
                <ArrowRight className="h-4 w-4" />
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
    <div className="flex h-[calc(100dvh-62px)] flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 font-sans">
      <div className="space-y-3 text-center">
        <div className="mb-2 animate-bounce text-6xl">🎓</div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Đã học {batch.length} từ!</h1>
        <p className="text-base font-medium text-slate-500 sm:text-lg">
          Độ chính xác khi nhớ lại: {accuracy}%. Các từ này sẽ quay lại ở phần Ôn tập.
        </p>
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
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2"
          onClick={() => router.push(searchParams.get('roadmapStep') ? '/journey' : '/student')}>
          <ChevronLeft className="mr-2 h-5 w-5" /> {searchParams.get('roadmapStep') ? 'Về lộ trình' : 'Dashboard'}
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

// ── Sub-components gọn cho viewport-fit ──
function Header({ label, badge, onHelp }: { label: string; badge: string; onHelp?: () => void }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100/80 bg-white/70 px-3 py-1.5 backdrop-blur-md sm:px-4">
      <Link href="/student">
        <Button variant="ghost" size="sm" className="h-9 gap-1 rounded-xl px-2 font-bold text-slate-500 hover:text-primary">
          <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </Link>
      <div className="flex items-center gap-1.5 text-sm font-black text-slate-700">
        <BookOpen className="h-4 w-4 text-indigo-500" /> {label}
      </div>
      <div className="flex items-center gap-1.5">
        {onHelp && (
          <button
            type="button"
            onClick={onHelp}
            aria-label="Hướng dẫn cách học"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        )}
        <div className="rounded-full bg-primary px-3 py-1 text-[11px] font-black tracking-widest text-white">
          {badge}
        </div>
      </div>
    </header>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="shrink-0 px-3 pt-1.5 sm:px-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
