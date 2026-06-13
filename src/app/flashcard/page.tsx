'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, type SRSProgress } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Volume2, RotateCcw, Loader2, RefreshCw, Snail, ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/useGamification';
import { XP_BY_QUALITY } from '@/lib/gamification';
import { Celebration } from '@/components/gamification/Celebration';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { DailyGoalRing } from '@/components/gamification/DailyGoalRing';
import { LearnMode } from './LearnMode';
import { StudyGuideModal, STUDY_GUIDE_KEY } from '@/components/StudyGuideModal';
import { speak, parseIpa, canAutoFocus } from '@/lib/study';

interface WordItem {
  id: string;
  word: string;
  translation: string;
  ipa: string;
  pos: string;
  example: string;
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
  const [isRetryingAI, setIsRetryingAI] = useState(false);
  
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

        // Lấy ĐÚNG từ đã học & đến hạn (server lọc toàn bộ srs_progress, không kẹt 100 từ mới nhất)
        const url = classroomId
          ? `/api/words?classroomId=${classroomId}&filter=review`
          : `/api/words?filter=review`;

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
    toast.success('Chính xác! Đang tự động chuyển...', { position: 'top-center' });
    setTimeout(() => setFlipped(true), 600);

    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setAutoAdvanceTime(1200);
    autoAdvanceRef.current = setTimeout(() => {
      handleRate(4);
      setAutoAdvanceTime(null);
    }, 1800);
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

  const handleRetryAI = async () => {
    if (!classroomId || isRetryingAI) return;
    setIsRetryingAI(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in again.'); return; }
      const res = await fetch('/api/words/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ classroomId }),
      });
      const data = await res.json();
      toast.success(`✅ AI refreshed ${data.refreshed} word(s)! Reloading...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('Retry failed. Please try again.');
    } finally {
      setIsRetryingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/40 font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-600 font-bold animate-pulse text-lg">Preparing your session...</p>
        </div>
      </div>
    );
  }

  if (done || !current) {
    const goalReached = gamification.today_xp >= gamification.daily_goal;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans">
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

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 font-sans">
      <StudyGuideModal open={showGuide} onClose={closeGuide} />
      <header className="flex items-center justify-between p-4 sm:p-6 bg-white/50 backdrop-blur-md sticky top-0 z-10 gap-3">
        <Link href="/student">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-primary font-bold rounded-xl transition-colors">
            <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(true)}
            aria-label="Hướng dẫn cách học"
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <StreakCounter streak={gamification.current_streak} />
          <DailyGoalRing todayXp={gamification.today_xp} dailyGoal={gamification.daily_goal} size={36} />
        </div>
        <div className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-black tracking-widest">
          {Math.min(progress + 1, total)} / {total}
        </div>
      </header>

      <div className="px-6 mt-2">
        <div className="h-2.5 w-full bg-white rounded-full overflow-hidden shadow-sm border border-slate-100">
           <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${(progress / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div
          className={`relative w-full max-w-[420px] ${typingMode && current.srsLevel >= 2 && !hasSpelledCorrectly ? '' : 'cursor-pointer'}`}
          style={{ perspective: '1200px' }}
          onClick={() => {
            if (!typingMode || current.srsLevel < 2 || hasSpelledCorrectly) {
              setFlipped(!flipped);
            }
          }}
        >
          {/* Streak badge — hiện phía trên góc phải card */}
          {goodStreak >= 2 && (
            <div className="absolute -top-4 right-0 z-20 animate-in zoom-in duration-300">
              <div className="flex items-center gap-1 bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-orange-200 border border-orange-400">
                🔥 {goodStreak} streak
              </div>
            </div>
          )}

          <div
            className={`relative w-full ${isSwapping ? '' : 'transition-transform duration-[200ms] ease-out'}`}
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              WebkitTransform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: 'clamp(380px, 58vh, 480px)', // co lại trên màn nhỏ, tránh tràn
            }}
          >
            {/* Front */}
            <Card className="absolute inset-0 border-none shadow-2xl shadow-indigo-100 flex flex-col items-center justify-center p-10 text-center rounded-[40px] bg-white border-b-8 border-slate-200"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <CardContent className="p-0 w-full flex flex-col items-center gap-6">
                <Badge className="bg-amber-50 text-amber-600 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-2">
                  {current.isDue ? '⚡ REVIEW TIME' : '📖 NEW WORD'}
                </Badge>

                {/* Vocabulary Image */}
                {current.image_url && (
                  <div className="w-full h-40 rounded-3xl overflow-hidden border border-slate-100 shadow-inner relative group/img">
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(current.image_url)}`}
                      alt={current.word}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-all duration-700 opacity-0 group-hover/img:scale-110"
                      onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = 'none';
                        img.parentElement?.querySelector('[data-img-fallback]')?.classList.replace('hidden', 'flex');
                      }}
                    />
                    {/* Placeholder khi ảnh lỗi — giữ nguyên kích thước card, nút refresh vẫn dùng được */}
                    <div data-img-fallback className="hidden absolute inset-0 flex-col items-center justify-center gap-1 bg-slate-50 text-slate-300">
                      <span className="text-3xl">🖼️</span>
                      <span className="text-[10px] font-bold">Ảnh lỗi — bấm 🔄 để tìm ảnh khác</span>
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        toast.info('Finding a better image...', { icon: '🔍' });
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch('/api/words/refresh-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
                            body: JSON.stringify({ wordId: current.id })
                          });
                          const data = await res.json();
                          if (data.success) {
                             setCurrent(prev => prev ? { ...prev, image_url: data.imageUrl } : null);
                             toast.success('Updated image!');
                          }
                        } catch {
                           toast.error('Could not update image.');
                        }
                      }}
                      className="absolute top-3 right-3 p-2.5 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-40 group-hover/img:opacity-100 transition-all border border-white/20 shadow-xl z-20"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Only use typing mode if word is fully analyzed */}
                {typingMode && current.srsLevel >= 2 && !hasSpelledCorrectly &&
                  current.translation && !current.translation.includes('failed') && !current.translation.includes('Analyzing') ? (
                  // Active Recall Typing Mode (MochiVocab Style)
                  <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-sm border border-indigo-200 group"
                           onClick={(e) => { e.stopPropagation(); speak(current.word, 1.0); }}>
                        <Volume2 className="h-8 w-8 text-indigo-600 group-hover:animate-pulse" />
                      </div>
                      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-sm border border-amber-200 group"
                           title="Slow pronunciation"
                           onClick={(e) => { e.stopPropagation(); speak(current.word, 0.6); }}>
                        <Snail className="h-8 w-8 text-amber-600 font-black group-hover:animate-bounce" />
                      </div>
                    </div>
                    
                     <p className="text-xl font-bold text-slate-800 break-words">{current.translation}</p>
                     {current.ipa && <p className="text-sm font-mono text-slate-400">{parseIpa(current.ipa)}</p>}

                    <div className="w-full relative mt-4">
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
                        placeholder="Nghe và gõ lại (Esc để bỏ qua)..."
                        className={`w-full text-center text-3xl font-black p-4 rounded-2xl border-4 focus:outline-none transition-colors
                          ${spellingError ? 'border-rose-400 bg-rose-50 text-rose-600 animate-shake' : 'border-slate-200 bg-slate-50 focus:border-indigo-500'}`}
                      />
                    </div>
                    <div className="flex gap-3 w-full mt-4">
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
                         className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg shadow-xl shadow-indigo-100"
                       >
                         Kiểm Tra
                       </Button>
                       <Button
                         variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleSpellingSkip();
                         }}
                         className="flex-1 h-14 rounded-2xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm shadow-sm"
                       >
                         Không nhớ
                       </Button>
                     </div>
                  </div>
                ) : (
                  // Passive Recognition Mode (Level 1) or After Spelled Correctly
                  <>
                    <h2 className="text-5xl font-black tracking-tight text-slate-900 break-words w-full px-2">
                      {current.translation}
                    </h2>
                    
                    <div className="mt-8 flex flex-col items-center opacity-40">
                       <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center animate-bounce">
                          <div className="w-1 h-3 bg-slate-300 rounded-full" />
                       </div>
                       <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-tighter">Lật thẻ xem từ tiếng Anh</p>
                    </div>
                    {showFlipHint && (
                      <div className="flex flex-col items-center mt-2 animate-in fade-in duration-500">
                        <ChevronDown className="animate-bounce text-slate-500 h-5 w-5" />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Back */}
            <Card className="absolute inset-0 border-none shadow-2xl shadow-indigo-100 flex flex-col items-center justify-center p-10 text-center rounded-[40px] bg-indigo-600 border-b-8 border-indigo-800"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', WebkitTransform: 'rotateY(180deg)' }}>
              <CardContent className="p-0 w-full flex flex-col items-center gap-4 text-white">
                <div className="flex flex-col items-center gap-2">
                   <h3 className="text-7xl font-black tracking-tight leading-tight mb-2">
                     {current.word}
                   </h3>
                   {current.ipa && <p className="text-2xl text-indigo-200 font-mono tracking-widest">{parseIpa(current.ipa)}</p>}
                   <p className="text-lg text-indigo-200 mt-2">{current.translation}</p>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  {current.pos && <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase tracking-widest px-3">{current.pos}</Badge>}
                  
                  {/* Normal Speed */}
                  <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer group border border-white/20"
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         speak(current.word, 1.0); 
                       }}>
                    <Volume2 className="h-8 w-8 text-white" />
                  </div>

                  {/* Slow Speed */}
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer group border border-white/20"
                       title="Slow pronunciation"
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         speak(current.word, 0.6); 
                       }}>
                    <Snail className="h-8 w-8 text-white/80" />
                  </div>
                </div>

                {current.example && (
                  <div className="bg-white/10 rounded-3xl p-6 text-left border border-white/10 max-w-sm backdrop-blur-sm">
                    <p className="text-base font-medium leading-relaxed italic border-l-4 border-white/30 pl-4">
                      &quot;{current.example}&quot;
                    </p>
                  </div>
                )}

                {/* Auto-advance notification */}
                {autoAdvanceTime !== null && (
                  <p className="text-xs font-black text-indigo-200 tracking-wide mt-2 animate-pulse">
                     ⚡ Đang chuyển thẻ tiếp theo...
                  </p>
                )}

                {/* Task 2: Synonyms & Antonyms */}
                {((current.synonyms && current.synonyms.length > 0) || (current.antonyms && current.antonyms.length > 0)) && (
                  <div className="flex flex-col gap-1 text-xs w-full max-w-sm">
                    {current.synonyms && current.synonyms.length > 0 && (
                      <p className="text-emerald-400">
                        <span className="font-black">Đồng nghĩa:</span>{' '}
                        {current.synonyms.join(', ')}
                      </p>
                    )}
                    {current.antonyms && current.antonyms.length > 0 && (
                      <p className="text-red-400">
                        <span className="font-black">Trái nghĩa:</span>{' '}
                        {current.antonyms.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* XP popup */}
        {xpPopup.show && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in duration-200 pointer-events-none">
            <div className="bg-yellow-400 text-yellow-900 font-black text-lg rounded-2xl px-5 py-2 shadow-xl border border-yellow-300">
              +{xpPopup.amount} XP ⭐
            </div>
          </div>
        )}

        {/* Rating buttons */}
        <div className="w-full max-w-[420px] min-h-[80px]">
          {flipped ? (
            <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <button
                className="flex-1 h-20 rounded-[28px] bg-red-50 border border-red-200 border-b-4 border-b-red-300 text-red-700 font-black text-[11px] uppercase tracking-tight hover:bg-red-100 transition-all active:translate-y-1 active:border-b-0 shadow-sm flex flex-col items-center justify-center gap-0.5"
                onClick={() => handleRate(0)}
              >
                <span className="text-base">😵</span>
                <span>Again</span>
                <span className="text-[9px] font-bold text-red-400 normal-case tracking-normal">Quên</span>
              </button>
              <button
                className="flex-1 h-20 rounded-[28px] bg-orange-50 border border-orange-200 border-b-4 border-b-orange-300 text-orange-700 font-black text-[11px] uppercase tracking-tight hover:bg-orange-100 transition-all active:translate-y-1 active:border-b-0 shadow-sm flex flex-col items-center justify-center gap-0.5"
                onClick={() => handleRate(3)}
              >
                <span className="text-base">😅</span>
                <span>Hard</span>
                <span className="text-[9px] font-bold text-orange-400 normal-case tracking-normal">Khó</span>
              </button>
              <button
                className="flex-1 h-20 rounded-[28px] bg-green-50 border border-green-200 border-b-4 border-b-green-300 text-green-700 font-black text-[11px] uppercase tracking-tight hover:bg-green-100 transition-all active:translate-y-1 active:border-b-0 shadow-sm flex flex-col items-center justify-center gap-0.5"
                onClick={() => handleRate(4)}
              >
                <span className="text-base">😊</span>
                <span>Good</span>
                <span className="text-[9px] font-bold text-green-500 normal-case tracking-normal">Nhớ được</span>
              </button>
              <button
                className="flex-1 h-20 rounded-[28px] bg-purple-600 border-b-4 border-purple-800 text-white font-black text-[11px] uppercase tracking-tight shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center gap-0.5"
                onClick={() => handleRate(5)}
              >
                <span className="text-base">🚀</span>
                <span>Easy</span>
                <span className="text-[9px] font-bold text-purple-200 normal-case tracking-normal">Dễ</span>
              </button>
            </div>
          ) : (
            <button
              className="w-full h-20 rounded-[28px] bg-white border-b-4 border-slate-200 text-slate-800 font-black text-lg shadow-sm hover:bg-slate-50 transition-all active:translate-y-1 active:border-b-0"
              onClick={() => setFlipped(true)}
            >
              Flip Card
            </button>
          )}
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-[10px] text-slate-600">Space: lật • 1-4: đánh giá</p>
            <button
              onClick={toggleTypingMode}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                typingMode
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
              ✍️ Chế độ gõ: {typingMode ? 'Bật' : 'Tắt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
      </div>
    }>
      <FlashcardContent />
    </Suspense>
  );
}
