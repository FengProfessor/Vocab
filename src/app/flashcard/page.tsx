'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, type SRSProgress } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Volume2, RotateCcw, Loader2, RefreshCw, Snail, ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/useGamification';
import { XP_BY_QUALITY } from '@/lib/gamification';
import { Celebration } from '@/components/gamification/Celebration';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { DailyGoalRing } from '@/components/gamification/DailyGoalRing';
import { StudentShell } from '@/components/student/StudentShell';
import { LearnMode } from './LearnMode';
import { StudyGuideModal, STUDY_GUIDE_KEY } from '@/components/StudyGuideModal';
import { speak, parseIpa, canAutoFocus } from '@/lib/study';
import { stopWordAudio } from '@/lib/audio';
import { invalidateWordSummaryCache } from '@/lib/word-summary-cache';
import { ExampleWithSub } from '@/components/study/ExampleWithSub';
import { resolveImageSrc } from '@/lib/media-url';

interface WordItem {
  id: string;
  word: string;
  translation: string;
  ipa: string;
  pos: string;
  example: string;
  example_vi?: string | null;
  image_url?: string;
  synonyms?: string[];
  antonyms?: string[];
  isDue: boolean;
  reviewCount: number;
  srsLevel: number;
  mastery: number;
  srs: SRSProgress | null;
}

function FlashcardContent() {
  const searchParams = useSearchParams();
  // Chế độ học từ mới (Giới thiệu → Nhớ lại) tách khỏi luồng ôn tập
  if (searchParams.get('mode') === 'learn') {
    return <LearnMode classroomId={searchParams.get('class')} />;
  }
  return <ReviewSession initialClassroomId={searchParams.get('class')} />;
}

function ReviewSession({ initialClassroomId }: { initialClassroomId: string | null }) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(initialClassroomId);
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [current, setCurrent] = useState<WordItem | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [sessionResults, setSessionResults] = useState({ easy: 0, hard: 0, forgot: 0 });

  const [spellingInput, setSpellingInput] = useState('');
  const [spellingError, setSpellingError] = useState(false);
  const [hasSpelledCorrectly, setHasSpelledCorrectly] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [goodStreak, setGoodStreak] = useState(0);
  const [xpPopup, setXpPopup] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [showFlipHint, setShowFlipHint] = useState(false);
  // Chế độ gõ từ (Active Recall). Tắt → lật thẻ truyền thống, đỡ mỏi tay trên mobile.
  // Đọc localStorage sau mount để tránh hydration mismatch.
  const [typingMode, setTypingMode] = useState(true);
  const [autoAdvanceTime, setAutoAdvanceTime] = useState<number | null>(null);
  // Hướng dẫn bấm nút — tự hiện lần đầu (localStorage), mở lại qua nút "?"
  const [showGuide, setShowGuide] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: gamification, refresh: refreshGamification } = useGamification(userId);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user || !session) { router.push('/auth'); return; }
        setUserId(user.id);

        // Due cap 40 thẻ / session — đủ 1 phiên, payload nhẹ
        const url = classroomId
          ? `/api/words?classroomId=${classroomId}&filter=review&limit=40`
          : `/api/words?filter=review&limit=40`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        if (data.success && data.data) {
          if (!classroomId && data.classroomId) setClassroomId(data.classroomId);

          // Server đã trả đúng từ đã học & đến hạn (filter=review)
          const studyQueue: WordItem[] = data.data;

          if (studyQueue.length === 0) {
            setIsLoading(false);
            return;
          }

          setQueue([...studyQueue]);
          setCurrent(studyQueue[0] || null);
          setTotal(studyQueue.length);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Flashcard] Load failed:', msg);
        toast.error('Failed to load flashcards.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [initialClassroomId]);

  // Clean up auto advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // Preload ảnh 3 thẻ kế tiếp — ảnh sẵn trong cache trình duyệt khi chuyển thẻ
  useEffect(() => {
    queue.slice(1, 4).forEach((w) => {
      if (w.image_url) {
        const img = new window.Image();
        img.src = resolveImageSrc(w.image_url);
      }
    });
  }, [queue]);

  // Khôi phục lựa chọn chế độ gõ
  useEffect(() => {
    setTypingMode(localStorage.getItem('lingopro_typing_mode') !== 'off');
  }, []);

  // Hiện hướng dẫn lần đầu vào ôn tập
  useEffect(() => {
    if (localStorage.getItem(STUDY_GUIDE_KEY) !== '1') setShowGuide(true);
  }, []);

  const closeGuide = () => {
    localStorage.setItem(STUDY_GUIDE_KEY, '1');
    setShowGuide(false);
  };

  const toggleTypingMode = () => {
    setTypingMode((prev) => {
      localStorage.setItem('lingopro_typing_mode', prev ? 'off' : 'on');
      return !prev;
    });
  };

  // Task 1: Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Allow Escape key to skip spelling card even when input is focused
      if (e.key === 'Escape') {
        if (current && typingMode && current.srsLevel >= 2 && !hasSpelledCorrectly && !flipped) {
          e.preventDefault();
          handleSpellingSkip();
          return;
        }
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      if (flipped) {
        if (e.key === '1') handleRate(0);
        if (e.key === '2') handleRate(3);
        if (e.key === '3') handleRate(4);
        if (e.key === '4') handleRate(5);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, current, hasSpelledCorrectly, typingMode]);

  // Task 3: Flip hint sau 5 giây
  useEffect(() => {
    if (flipped) { setShowFlipHint(false); return; }
    const t = setTimeout(() => setShowFlipHint(true), 5000);
    return () => clearTimeout(t);
  }, [flipped, current?.id]);

  const handleSpellingCorrect = () => {
    if (!current) return;
    setHasSpelledCorrectly(true);
    speak(current.word, 1.0);
    // Không auto-rate: gõ đúng chỉ chứng minh recall; Hard/Good/Easy do user chọn
    // (trước đây auto Good sau 1.8s → flip quá nhanh, không kịp bấm)
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setAutoAdvanceTime(null);
    toast.success('Chính xác! Chọn mức độ nhớ (Hard / Good / Easy)', { position: 'top-center' });
    setTimeout(() => setFlipped(true), 600);
  };

  const handleSpellingSkip = () => {
    if (!current) return;
    setFlipped(true);
    setSpellingInput('');
    setSpellingError(false);
    setHasSpelledCorrectly(false);
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setAutoAdvanceTime(null);
    toast.info('Hãy xem kỹ từ này và tự đánh giá nhé!', { position: 'top-center' });
  };

  const handleRate = async (quality: 0 | 3 | 4 | 5) => {
    if (!current || !userId) return;

    // Hủy bộ hẹn giờ tự động chuyển thẻ nếu người dùng tự ấn rating
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setAutoAdvanceTime(null);
    // Chặn tiếng từ cũ phát trễ khi đã sang thẻ mới
    stopWordAudio();

    // 1. Snapshot for the background sync
    const currentWordId = current.id;
    const currentWord = current;

    setIsSwapping(true);
    setSessionResults(prev => ({
      easy: (quality === 5 || quality === 4) ? prev.easy + 1 : prev.easy,
      hard: quality === 3 ? prev.hard + 1 : prev.hard,
      forgot: quality === 0 ? prev.forgot + 1 : prev.forgot,
    }));

    // Cập nhật good streak
    if (quality === 4 || quality === 5) {
      setGoodStreak(prev => prev + 1);
    } else {
      setGoodStreak(0);
    }

    // XP feedback
    const xp = XP_BY_QUALITY[quality] ?? 5;
    setSessionXp(prev => prev + xp);
    setXpPopup({ show: true, amount: xp });
    setTimeout(() => setXpPopup({ show: false, amount: 0 }), 900);
 
    const newQueue = queue.slice(1);
    if (quality === 0) newQueue.push(currentWord); 
 
    setQueue(newQueue);
    setCurrent(newQueue[0] || null);
    setFlipped(false);
    // Chỉ tăng tiến độ khi thẻ THỰC SỰ xong (không Quên). Quên → thẻ quay lại cuối hàng, chưa tính.
    if (quality !== 0) setProgress(prev => Math.min(prev + 1, total));
    setSpellingInput('');
    setSpellingError(false);
    setHasSpelledCorrectly(false);
    
    // Briefly disable transition to "warp" to front of next card
    setTimeout(() => setIsSwapping(false), 50);

    if (newQueue.length === 0) {
      setDone(true);
      // Refresh gamification sau khi session xong
      setTimeout(() => refreshGamification(), 1500);
    }

    // 3. BACKGROUND SYNC (No 'await' to keep UI fast)
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };

      fetch('/api/words/srs', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ wordId: currentWordId, quality: quality as 0|3|4|5 }),
      }).then(() => {
        invalidateWordSummaryCache(session.user.id);
      }).catch(err => {
        console.error('Failed to save SRS result:', err);
        // We don't rollback to avoid UI flickering, just log it.
      });

      if (newQueue.length === 0) {
        try {
          // "Nhớ được" = Good(4) hoặc Easy(5) — khớp cách đếm sessionResults.easy ở trên.
          // sessionResults là snapshot TRƯỚC thẻ này nên cộng thêm thẻ hiện tại; clamp ≤ total.
          const remembered = (quality === 4 || quality === 5) ? sessionResults.easy + 1 : sessionResults.easy;
          const finalScore = Math.min(remembered, total);
          await fetch('/api/quiz/save', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              classroomId,
              score: finalScore,
              totalQuestions: total,
              quizType: 'vocabulary',
            }),
          });
        } catch (err) {
          console.error('Failed to save session accuracy', err);
        }
      }
    })();

  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-var(--header-h)-var(--safe-top))] items-center justify-center bg-muted/40 font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-lg font-bold animate-pulse text-indigo-600">Preparing your session...</p>
        </div>
      </div>
    );
  }

  if (done || !current) {
    const goalReached = gamification.today_xp >= gamification.daily_goal;
    return (
      <div className="flex h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 font-sans">
        <Celebration trigger={true} intensity={goalReached ? 'strong' : 'light'} />

        <div className="text-center space-y-3">
          <div className="text-7xl mb-4 animate-bounce">🥳</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Xong rồi!</h1>
          <p className="text-slate-500 text-lg font-medium">Tiến độ đã được lưu.</p>
        </div>

        {/* XP + streak row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-2">
            <span className="text-xl">⭐</span>
            <span className="font-black text-yellow-700">+{sessionXp} XP</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2">
            <span className="text-xl">🔥</span>
            <span className="font-black text-orange-600">{gamification.current_streak} ngày</span>
          </div>
          {goalReached && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2">
              <span className="text-xl">🎯</span>
              <span className="font-black text-emerald-600">Mục tiêu đạt!</span>
            </div>
          )}
        </div>

        <Card className="w-full max-w-sm border-none shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                 { label: 'Dễ', val: sessionResults.easy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { label: 'Khó', val: sessionResults.hard, color: 'text-amber-600', bg: 'bg-amber-50' },
                 { label: 'Quên', val: sessionResults.forgot, color: 'text-rose-600', bg: 'bg-rose-50' }
              ].map(r => (
                <div key={r.label} className={`${r.bg} rounded-2xl p-4`}>
                  <div className={`text-2xl font-black ${r.color}`}>{r.val}</div>
                  <div className={`text-[10px] uppercase font-black tracking-widest ${r.color} mt-1 opacity-70`}>{r.label}</div>
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-2xl font-bold border-2 hover:bg-slate-50 transition-all"
            onClick={() => { window.location.href = '/student'; }}
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Dashboard
          </Button>
          <Button className="flex-1 h-14 rounded-2xl bg-primary hover:brightness-110 text-white font-bold shadow-lg border-b-4 border-primary/60 active:translate-y-0.5 active:border-b-0 transition-all" onClick={() => window.location.reload()}>
            <RotateCcw className="mr-2 h-5 w-5" /> Ôn lại
          </Button>
        </div>
      </div>
    );
  }

  // Layout fit 1 viewport: shell header 62px — mọi phần (ảnh, chữ, input, flip/rating) trong khung còn lại
  const isTypingFront =
    typingMode &&
    current.srsLevel >= 2 &&
    !hasSpelledCorrectly &&
    !!current.translation &&
    !current.translation.includes('failed') &&
    !current.translation.includes('Analyzing');

  return (
    <div className="flex h-[calc(100dvh-var(--header-h)-var(--safe-top))] max-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex-col overflow-hidden bg-slate-50 font-sans">
      <StudyGuideModal open={showGuide} onClose={closeGuide} />

      {/* Session chrome — gọn, không sticky chồng shell */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100/80 bg-white/70 px-3 py-1.5 backdrop-blur-md sm:px-4">
        <Link href="/student">
          <Button variant="ghost" size="sm" className="h-9 gap-1 rounded-xl px-2 font-bold text-slate-500 hover:text-primary">
            <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(true)}
            aria-label="Hướng dẫn cách học"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <StreakCounter streak={gamification.current_streak} />
          <DailyGoalRing todayXp={gamification.today_xp} dailyGoal={gamification.daily_goal} size={30} />
        </div>
        <div className="rounded-full bg-primary px-3 py-1 text-[11px] font-black tracking-widest text-white">
          {Math.min(progress + 1, total)} / {total}
        </div>
      </header>

      <div className="shrink-0 px-3 pt-1.5 sm:px-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Body: card flex-1 + actions cố định đáy */}
      <div className="flex min-h-0 flex-1 flex-col items-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div
          className={`relative min-h-0 w-full max-w-[400px] flex-1 ${isTypingFront ? '' : 'cursor-pointer'}`}
          style={{ perspective: '1200px' }}
          onClick={() => {
            if (!isTypingFront) setFlipped(!flipped);
          }}
        >
          {goodStreak >= 2 && (
            <div className="absolute -top-2 right-1 z-20 animate-in zoom-in duration-300">
              <div className="flex items-center gap-1 rounded-full border border-orange-400 bg-orange-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md shadow-orange-200">
                🔥 {goodStreak}
              </div>
            </div>
          )}

          <div
            className={`relative h-full w-full ${isSwapping ? '' : 'transition-transform duration-[200ms] ease-out'}`}
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              WebkitTransform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <Card
              className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border-none border-b-[6px] border-slate-200 bg-white text-center shadow-xl shadow-indigo-100 sm:rounded-[32px]"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <CardContent className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto overscroll-contain p-3 sm:gap-2.5 sm:p-4">
                <Badge className="shrink-0 rounded-full border-none bg-amber-50 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
                  {current.isDue ? '⚡ ÔN TẬP' : '📖 TỪ MỚI'}
                </Badge>

                {current.image_url && (
                  /* Khung ngang 16:10 — cao vừa để thấy đủ trên/dưới, không dải mỏng */
                  <div
                    className={`group/img relative w-full shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-inner ${
                      isTypingFront
                        ? 'aspect-[16/10] max-h-[min(20dvh,128px)]'
                        : 'aspect-[16/10] max-h-[min(26dvh,168px)]'
                    }`}
                  >
                    <img
                      src={resolveImageSrc(current.image_url)}
                      alt={current.word}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-all duration-500 group-hover/img:scale-105"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = 'none';
                        img.parentElement?.querySelector('[data-img-fallback]')?.classList.replace('hidden', 'flex');
                      }}
                    />
                    <div
                      data-img-fallback
                      className="absolute inset-0 hidden flex-col items-center justify-center gap-0.5 bg-slate-50 text-slate-300"
                    >
                      <span className="text-2xl">🖼️</span>
                      <span className="text-[9px] font-bold">Ảnh lỗi — bấm 🔄</span>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        toast.info('Finding a better image...', { icon: '🔍' });
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch('/api/words/refresh-image', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${session?.access_token ?? ''}`,
                            },
                            body: JSON.stringify({ wordId: current.id }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setCurrent((prev) => (prev ? { ...prev, image_url: data.imageUrl } : null));
                            toast.success('Updated image!');
                          }
                        } catch {
                          toast.error('Could not update image.');
                        }
                      }}
                      className="absolute right-2 top-2 z-20 rounded-full border border-white/20 bg-black/40 p-1.5 text-white opacity-50 shadow-lg backdrop-blur-md transition-all hover:bg-black/70 group-hover/img:opacity-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {isTypingFront ? (
                  /* Ưu tiên nghĩa: input/nút gọn, không che translation */
                  <div className="flex w-full min-h-0 flex-1 flex-col animate-in fade-in zoom-in duration-300">
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5">
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-100 transition-transform hover:scale-105 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(current.word, 1.0);
                          }}
                        >
                          <Volume2 className="h-4 w-4 text-indigo-600" />
                        </button>
                        <button
                          type="button"
                          title="Slow pronunciation"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 transition-transform hover:scale-105 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(current.word, 0.6);
                          }}
                        >
                          <Snail className="h-4 w-4 text-amber-600" />
                        </button>
                      </div>

                      {/* Ẩn IPA khi gõ — lộ gợi ý đánh vần; hiện sau flip (mặt sau) */}
                      <p className="line-clamp-4 w-full max-w-full break-words px-1 text-center text-[clamp(1.2rem,4.8vw,1.75rem)] font-black leading-snug text-slate-900">
                        {current.translation}
                      </p>
                    </div>

                    <div className="mt-auto w-full shrink-0 space-y-1.5 pt-1">
                      <input
                        type="text"
                        autoFocus={canAutoFocus()}
                        value={spellingInput}
                        onChange={(e) => {
                          setSpellingInput(e.target.value);
                          setSpellingError(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (spellingInput.trim().toLowerCase() === current.word.toLowerCase()) {
                              handleSpellingCorrect();
                            } else {
                              setSpellingError(true);
                              toast.error('Incorrect, try again!', { position: 'top-center' });
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleSpellingSkip();
                          }
                        }}
                        placeholder="Gõ từ..."
                        className={`h-10 w-full rounded-xl border-2 px-2 text-center text-base font-bold transition-colors focus:outline-none sm:h-11 sm:text-lg ${
                          spellingError
                            ? 'animate-shake border-rose-400 bg-rose-50 text-rose-600'
                            : 'border-slate-200 bg-slate-50 focus:border-indigo-500'
                        }`}
                      />
                      <div className="flex w-full gap-1.5">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spellingInput.trim().toLowerCase() === current.word.toLowerCase()) {
                              handleSpellingCorrect();
                            } else {
                              setSpellingError(true);
                              toast.error('Incorrect, try again!', { position: 'top-center' });
                            }
                          }}
                          className="h-9 flex-[2] rounded-xl bg-indigo-600 text-xs font-bold shadow-sm hover:bg-indigo-700 sm:h-10 sm:text-sm"
                        >
                          Kiểm tra
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpellingSkip();
                          }}
                          className="h-9 flex-1 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 sm:h-10 sm:text-xs"
                        >
                          Không nhớ
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
                    <h2 className="line-clamp-4 w-full break-words px-1 text-center text-[clamp(1.35rem,5.5vw,2.25rem)] font-black leading-tight tracking-tight text-slate-900">
                      {current.translation}
                    </h2>
                    <div className="flex flex-col items-center opacity-40">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 animate-bounce">
                        <div className="h-2.5 w-1 rounded-full bg-slate-300" />
                      </div>
                      <p className="mt-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                        Lật thẻ xem từ
                      </p>
                    </div>
                    {showFlipHint && (
                      <ChevronDown className="h-5 w-5 animate-bounce text-slate-500 animate-in fade-in duration-500" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Back */}
            <Card
              className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border-none border-b-[6px] border-indigo-800 bg-indigo-600 text-center shadow-xl shadow-indigo-100 sm:rounded-[32px]"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                WebkitTransform: 'rotateY(180deg)',
              }}
            >
              <CardContent className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 overflow-y-auto overscroll-contain p-3 text-white sm:gap-2.5 sm:p-4">
                <div className="flex w-full shrink-0 flex-col items-center gap-1">
                  <h3 className="line-clamp-2 w-full break-words px-1 text-[clamp(1.5rem,6.5vw,2.75rem)] font-black leading-tight tracking-tight">
                    {current.word}
                  </h3>
                  {current.ipa && (
                    <p className="font-mono text-sm tracking-wide text-indigo-200 sm:text-base">
                      {parseIpa(current.ipa)}
                    </p>
                  )}
                  <p className="line-clamp-2 text-sm text-indigo-100 sm:text-base">{current.translation}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {current.pos && (
                    <Badge className="border-none bg-white/20 px-2.5 text-[9px] font-black uppercase tracking-widest text-white">
                      {current.pos}
                    </Badge>
                  )}
                  <button
                    type="button"
                    title="Nghe phát âm Anh - Anh (UK)"
                    className="flex h-10 items-center gap-1 px-2.5 rounded-xl border border-white/25 bg-white/20 hover:bg-white/30 transition-transform hover:scale-105 active:scale-95 text-xs font-bold text-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(current.word, 1.0, 'en-GB');
                    }}
                  >
                    <Volume2 className="h-4 w-4 text-white" />
                    <span>🇬🇧 UK</span>
                  </button>
                  <button
                    type="button"
                    title="Nghe phát âm Anh - Mỹ (US)"
                    className="flex h-10 items-center gap-1 px-2.5 rounded-xl border border-white/25 bg-white/20 hover:bg-white/30 transition-transform hover:scale-105 active:scale-95 text-xs font-bold text-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(current.word, 1.0, 'en-US');
                    }}
                  >
                    <Volume2 className="h-4 w-4 text-white" />
                    <span>🇺🇸 US</span>
                  </button>
                  <button
                    type="button"
                    title="Đọc chậm"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-transform hover:scale-105 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(current.word, 0.6);
                    }}
                  >
                    <Snail className="h-4 w-4 text-white/90" />
                  </button>
                </div>

                {current.example && (
                  <div className="w-full max-w-sm shrink rounded-2xl border border-white/10 bg-white/10 p-2.5 text-left backdrop-blur-sm sm:p-3">
                    <ExampleWithSub
                      example={current.example}
                      exampleVi={current.example_vi}
                      defaultShowVi={false}
                      className="border-l-4 border-white/30 pl-3"
                      enClassName="line-clamp-3 text-xs font-medium italic leading-snug sm:text-sm"
                      viClassName="mt-1 text-[11px] font-medium leading-snug text-white/70 sm:text-xs not-italic"
                    />
                  </div>
                )}

                {autoAdvanceTime !== null && (
                  <p className="shrink-0 animate-pulse text-[10px] font-black tracking-wide text-indigo-200">
                    ⚡ Đang chuyển thẻ...
                  </p>
                )}

                {((current.synonyms && current.synonyms.length > 0) ||
                  (current.antonyms && current.antonyms.length > 0)) && (
                  <div className="flex w-full max-w-sm shrink-0 flex-col gap-0.5 text-[10px] sm:text-xs">
                    {current.synonyms && current.synonyms.length > 0 && (
                      <p className="line-clamp-1 text-emerald-300">
                        <span className="font-black">Đồng nghĩa:</span> {current.synonyms.join(', ')}
                      </p>
                    )}
                    {current.antonyms && current.antonyms.length > 0 && (
                      <p className="line-clamp-1 text-red-300">
                        <span className="font-black">Trái nghĩa:</span> {current.antonyms.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {xpPopup.show && (
          <div className="pointer-events-none fixed left-1/2 top-[76px] z-50 -translate-x-1/2 animate-in fade-in zoom-in duration-200">
            <div className="rounded-2xl border border-yellow-300 bg-yellow-400 px-4 py-1.5 text-base font-black text-yellow-900 shadow-xl">
              +{xpPopup.amount} XP ⭐
            </div>
          </div>
        )}

        {/* Actions — gõ: không lặp Lật thẻ (đã có Kiểm tra/Không nhớ trong card) */}
        <div className="mt-1.5 w-full max-w-[400px] shrink-0">
          {flipped ? (
            <div className="flex gap-1.5 animate-in fade-in slide-in-from-bottom-4 duration-300 sm:gap-2">
              {(
                [
                  {
                    q: 0 as const,
                    emoji: '😵',
                    en: 'Again',
                    vi: 'Quên',
                    cls: 'bg-red-50 border-red-200 border-b-red-300 text-red-700 hover:bg-red-100',
                    sub: 'text-red-400',
                  },
                  {
                    q: 3 as const,
                    emoji: '😅',
                    en: 'Hard',
                    vi: 'Khó',
                    cls: 'bg-orange-50 border-orange-200 border-b-orange-300 text-orange-700 hover:bg-orange-100',
                    sub: 'text-orange-400',
                  },
                  {
                    q: 4 as const,
                    emoji: '😊',
                    en: 'Good',
                    vi: 'Nhớ',
                    cls: 'bg-green-50 border-green-200 border-b-green-300 text-green-700 hover:bg-green-100',
                    sub: 'text-green-500',
                  },
                  {
                    q: 5 as const,
                    emoji: '🚀',
                    en: 'Easy',
                    vi: 'Dễ',
                    cls: 'bg-purple-600 border-purple-800 text-white hover:bg-purple-700 shadow-md shadow-purple-200',
                    sub: 'text-purple-200',
                  },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.en}
                  type="button"
                  className={`flex h-12 flex-1 flex-col items-center justify-center gap-0 rounded-xl border border-b-[3px] text-[10px] font-black uppercase tracking-tight transition-all active:translate-y-0.5 active:border-b-0 sm:h-14 sm:rounded-2xl sm:text-[11px] ${btn.cls}`}
                  onClick={() => handleRate(btn.q)}
                >
                  <span className="text-sm">{btn.emoji}</span>
                  <span>{btn.en}</span>
                  <span className={`text-[8px] font-bold normal-case tracking-normal ${btn.sub}`}>
                    {btn.vi}
                  </span>
                </button>
              ))}
            </div>
          ) : isTypingFront ? null : (
            <button
              type="button"
              className="h-12 w-full rounded-2xl border-b-[3px] border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:translate-y-0.5 active:border-b-0 sm:h-14 sm:text-base"
              onClick={() => setFlipped(true)}
            >
              Lật thẻ
            </button>
          )}
          <div className="mt-1 flex items-center justify-center gap-2">
            <p className="hidden text-[10px] text-slate-500 sm:block">
              {isTypingFront ? 'Enter: kiểm tra · Esc: bỏ qua' : 'Space: lật · 1–4: đánh giá'}
            </p>
            <button
              type="button"
              onClick={toggleTypingMode}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors ${
                typingMode
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              ✍️ Gõ: {typingMode ? 'Bật' : 'Tắt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <StudentShell title="Flashcards" contentClassName="p-0" hideMobileNav>
      <Suspense fallback={
        <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      }>
        <FlashcardContent />
      </Suspense>
    </StudentShell>
  );
}
