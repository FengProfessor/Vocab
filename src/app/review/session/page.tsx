'use client';

/**
 * Unified review session: mixed | cloze | listen
 * Load due words → pick item mode → chấm → POST /api/words/srs
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight, ChevronLeft, Loader2, Snail, Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentShell } from '@/components/student/StudentShell';
import {
  speak, canAutoFocus, parseIpa, type Verdict,
} from '@/lib/study';
import { playWordWithBuffer } from '@/lib/audio-sync';
import { stopWordAudio } from '@/lib/audio';
import {
  type ItemMode,
  type ReviewSessionMode,
  type ReviewWordLike,
  buildWordChoices,
  extractVietnameseSentenceTranslation,
  itemModeLabel,
  makeCloze,
  pickItemMode,
  resultToQuality,
  shuffle,
  stripEmbeddedVietnamese,
  verdictAndQuality,
} from '@/lib/review-modes';
import { invalidateWordSummaryCache } from '@/lib/word-summary-cache';
import { saveSrsReview } from '@/lib/save-srs-review';

interface WordItem extends ReviewWordLike {
  ipa?: string;
  pos?: string;
  image_url?: string;
  srsLevel: number;
  reviewCount: number;
  isDue: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NEXT_OK_MS = 950;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NEXT_BAD_MS = 2500;
/** Chặn ghost-click / double-tap vào «Tiếp theo» ngay sau khi chạm đáp án (100ms mượt mà, tức thì nhưng chống nảy phím). */
const FEEDBACK_LOCK_MS = 100;
const SESSION_CAP = 25;

/** Lọc an toàn các từ có trạng thái dịch chưa hoàn tất, đang phân tích hoặc lỗi */
export function isCardReady(w: ReviewWordLike | WordItem | null | undefined): boolean {
  if (!w || !w.word || typeof w.word !== 'string' || !w.word.trim()) return false;
  if (!w.translation || typeof w.translation !== 'string' || !w.translation.trim()) return false;
  const t = w.translation.trim();
  const lower = t.toLowerCase();
  if (lower.includes('failed') || lower.includes('analyzing') || t.includes('⏳')) {
    return false;
  }
  return true;
}

/** Định dạng mốc thời gian từ kế tiếp sẽ đến hạn */
export function formatNextDue(isoString: string, now: Date = new Date()): string {
  try {
    if (!isoString || typeof isoString !== 'string') return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'sắp đến hạn ngay bây giờ';
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `lúc ${timeStr} hôm nay (sau khoảng ${diffMins} phút)`;
    }
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `lúc ${timeStr} hôm nay (sau khoảng ${diffHours} giờ)`;
    }
    return `lúc ${timeStr}, ngày ${dateStr}`;
  } catch {
    return '';
  }
}

function parseSessionMode(raw: string | null): ReviewSessionMode {
  if (raw === 'cloze' || raw === 'listen' || raw === 'mixed') return raw;
  return 'mixed';
}

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionMode = parseSessionMode(searchParams.get('mode'));
  const classParam = searchParams.get('class');

  const [userId, setUserId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(classParam);
  const [isFreeReview, setIsFreeReview] = useState(searchParams.get('free') === '1');
  const [nextDueTime, setNextDueTime] = useState<string | null>(null);
  const [isLoadingFree, setIsLoadingFree] = useState(false);
  const [pool, setPool] = useState<WordItem[]>([]);
  const queueRef = useRef<WordItem[]>([]);
  const [current, setCurrent] = useState<WordItem | null>(null);
  const [itemMode, setItemMode] = useState<ItemMode>('type_vi_en');
  const [choices, setChoices] = useState<string[]>([]);
  const [clozeStem, setClozeStem] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ correct: 0, close: 0, wrong: 0 });
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);
  /** Sau chấm: true khi đã hết lock — cho bấm Next / Enter skip. */
  const [canSkip, setCanSkip] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const startedAt = useRef<number>(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceFn = useRef<(() => void) | null>(null);
  /** Timeout auto-play listen — phải clear khi sang thẻ mới, không để speak từ cũ trễ. */
  const listenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guard cứng (tránh stale verdict / double-tap) — không phụ thuộc render. */
  const answeredRef = useRef(false);
  /** Buffer phím Enter/Space bấm trong lúc feedback lock (180ms) để không bị trôi/bỏ qua */
  const pendingSkipRef = useRef(false);

  const modeMeta = useMemo(() => itemModeLabel(itemMode), [itemMode]);

  const setupCard = useCallback((word: WordItem, all: WordItem[], mode: ReviewSessionMode) => {
    // Hủy auto-play + audio từ thẻ trước (lookup freeDict có thể còn treo)
    if (listenTimer.current) {
      clearTimeout(listenTimer.current);
      listenTimer.current = null;
    }
    if (feedbackLockTimer.current) {
      clearTimeout(feedbackLockTimer.current);
      feedbackLockTimer.current = null;
    }
    stopWordAudio();

    const hasEx = all.some((w) => {
      const c = makeCloze(w.example, w.word);
      return Boolean(c && c.stem.includes('___') && c.stem !== '___' && c.full !== c.answer);
    });
    const im = pickItemMode(word, mode, hasEx);
    setItemMode(im);
    setInput('');
    setSelected(null);
    setVerdict(null);
    setCanSkip(false);
    pendingSkipRef.current = false;
    setShakingIdx(null);
    answeredRef.current = false;
    startedAt.current = Date.now();

    if (im === 'cloze_mcq' || im === 'cloze_type') {
      const cloze = makeCloze(word.example, word.word);
      setClozeStem(cloze?.stem ?? '___');
      setAnswer(cloze?.answer ?? word.word);
      if (im === 'cloze_mcq') {
        setChoices(buildWordChoices(word, all, 'word'));
      } else {
        setChoices([]);
      }
    } else if (im === 'mcq_vi_en') {
      setClozeStem('');
      setAnswer(word.word);
      setChoices(buildWordChoices(word, all, 'word'));
    } else if (im === 'mcq_en_vi') {
      setClozeStem('');
      setAnswer(word.translation);
      setChoices(buildWordChoices(word, all, 'translation'));
    } else if (im === 'listen_mcq') {
      setClozeStem('');
      setAnswer(word.word);
      setChoices(buildWordChoices(word, all, 'word'));
      listenTimer.current = setTimeout(() => speak(word.word, 1.0), 200);
    } else if (im === 'listen_type') {
      setClozeStem('');
      setAnswer(word.word);
      setChoices([]);
      listenTimer.current = setTimeout(() => speak(word.word, 1.0), 200);
    } else {
      // type_vi_en
      setClozeStem('');
      setAnswer(word.word);
      setChoices([]);
    }

    setTimeout(() => {
      if (im.includes('type') || im === 'type_vi_en') {
        inputRef.current?.focus();
      }
    }, 80);
  }, []);

  const startFreeReview = useCallback(async () => {
    setIsLoadingFree(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      const user = session.user;


      setUserId(user.id);

      let freeWords: WordItem[] = [];
      const base = classroomId
        ? `/api/words?classroomId=${encodeURIComponent(classroomId)}`
        : `/api/words`;

      try {
        const res = await authFetch(`${base}${base.includes('?') ? '&' : '?'}limit=40&noCount=1`, {});
        const json = await res.json().catch(() => ({ success: false }));
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          freeWords = (json.data as WordItem[]).filter(isCardReady);
        }
      } catch {
        // fallback bên dưới
      }

      // Fallback cross-classroom nếu API trả về rỗng (ví dụ: personal class rỗng nhưng có từ ở các lớp đã tham gia)
      if (freeWords.length === 0) {
        try {
          const { data: srsRows } = await supabase
            .from('srs_progress')
            .select('word_id, words(id, word, translation, ipa, pos, example, example_vi, image_url, classroom_id)')
            .eq('user_id', user.id)
            .gt('review_count', 0)
            .limit(40);
          if (srsRows && srsRows.length > 0) {
            const mapped: WordItem[] = [];
            for (const row of srsRows) {
              const w = row.words as unknown as (WordItem & { id: string }) | null;
              if (w && isCardReady(w)) {
                mapped.push({
                  ...w,
                  srsLevel: 1,
                  reviewCount: 1,
                  isDue: false,
                });
              }
            }
            freeWords = mapped;
          }
        } catch {
          // ignore
        }
      }

      if (freeWords.length === 0) {
        toast.info('Chưa có từ nào trong kho từ để ôn tập tự do.');
        setIsLoadingFree(false);
        return;
      }

      const shuffled = shuffle(freeWords).slice(0, SESSION_CAP);
      setIsFreeReview(true);
      setPool(shuffled);
      queueRef.current = [...shuffled];
      setTotal(shuffled.length);
      setProgress(0);
      setStats({ correct: 0, close: 0, wrong: 0 });
      setDone(false);
      setCurrent(shuffled[0]);
      setupCard(shuffled[0], shuffled, sessionMode);
      toast.success(`Đã nạp ${shuffled.length} từ đã học để ôn tập tự do!`);
    } catch (err: unknown) {
      console.error('[ReviewSession] free review error:', err);
      toast.error('Không tải được danh sách từ tự do.');
    } finally {
      setIsLoadingFree(false);
    }
  }, [classroomId, router, sessionMode, setupCard]);

  useEffect(() => {
    const init = async () => {
      try {
        // getSession() trả cả user + token → tránh gọi getUser() riêng + 2× getSession() trong authFetch
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        const user = session.user;


        setUserId(user.id);

        if (searchParams.get('free') === '1') {
          await startFreeReview();
          return;
        }

        const base = classroomId
          ? `/api/words?classroomId=${encodeURIComponent(classroomId)}`
          : `/api/words`;
        // Ưu tiên nạp danh sách đến hạn ôn (RPC get_due_words_list, siêu nhẹ ~120ms)
        const dueRes = await authFetch(`${base}${base.includes('?') ? '&' : '?'}filter=review&limit=${SESSION_CAP}`, {});
        const dueJson = await dueRes.json().catch(() => ({ success: false }));

        if (!dueJson.success) {
          toast.error('Không tải được từ vựng.');
          setIsLoading(false);
          return;
        }
        const classroomIdFromRes = dueJson.classroomId;
        if (classParam && !classroomId && classroomIdFromRes) setClassroomId(classroomIdFromRes);

        const dueWords = (dueJson.success && Array.isArray(dueJson.data)) ? (dueJson.data as WordItem[]) : [];

        // Nếu queue ôn ít hơn 4 từ (không đủ 4 đáp án MCQ), nạp thêm pool distractor phụ (30 từ)
        let allWords: WordItem[] = [];
        if (dueWords.length > 0 && dueWords.length < 4) {
          try {
            const allRes = await authFetch(`${base}${base.includes('?') ? '&' : '?'}limit=30&noCount=1`, {});
            const allJson = await allRes.json().catch(() => ({ success: false }));
            if (allJson.success && Array.isArray(allJson.data)) {
              allWords = allJson.data as WordItem[];
            }
          } catch {
            // Không chặn phiên ôn nếu distractor phụ lỗi
          }
        }

        // Pool cho distractor MCQ: kết hợp allWords + dueWords để không bị thiếu phương án
        const combinedPool = [...dueWords];
        for (const aw of allWords) {
          if (!combinedPool.some((w) => w.id === aw.id)) {
            combinedPool.push(aw);
          }
        }

        // Lọc sạch các từ có trạng thái dịch lỗi / đang phân tích / rỗng
        const ready = combinedPool.filter(isCardReady);
        setPool(ready);

        let due = dueWords.filter(isCardReady);
        if (due.length === 0) {
          due = ready.filter((w) => w.isDue);
        }

        // Cloze session: ưu tiên từ có example chứa target word
        if (sessionMode === 'cloze') {
          const withEx = due.filter((w) => {
            const c = makeCloze(w.example, w.word);
            return Boolean(w.example?.trim() && c && c.stem.includes('___') && c.stem !== '___');
          });
          if (withEx.length >= 2) due = withEx;
        }

        // Không fallback random — ôn khi chưa due sẽ phá lịch FSRS

        due = due.slice(0, SESSION_CAP);
        if (due.length === 0) {
          // Khi không có từ đến hạn, tìm mốc thời gian từ kế tiếp sẽ đến hạn
          try {
            const { data: nextDueData } = await supabase
              .from('srs_progress')
              .select('next_review_date')
              .eq('user_id', user.id)
              .gt('review_count', 0)
              .gt('next_review_date', new Date().toISOString())
              .order('next_review_date', { ascending: true })
              .limit(1)
              .maybeSingle();
            if (nextDueData?.next_review_date) {
              setNextDueTime(nextDueData.next_review_date);
            }
          } catch {
            // silent
          }
          setIsLoading(false);
          return;
        }

        queueRef.current = [...due];
        setTotal(due.length);
        setCurrent(due[0]);
        setupCard(due[0], ready.length >= 2 ? ready : due, sessionMode);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        console.error('[ReviewSession] load:', msg);
        toast.error('Lỗi tải phiên ôn.');
      } finally {
        setIsLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classParam, sessionMode, startFreeReview]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (listenTimer.current) clearTimeout(listenTimer.current);
    if (feedbackLockTimer.current) clearTimeout(feedbackLockTimer.current);
    stopWordAudio();
  }, []);

  const goNext = useCallback((wasWrong: boolean) => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    advanceFn.current = null;
    // Chặn tiếng từ cũ lướt theo sau khi UI đã sang từ mới
    if (listenTimer.current) {
      clearTimeout(listenTimer.current);
      listenTimer.current = null;
    }
    if (feedbackLockTimer.current) {
      clearTimeout(feedbackLockTimer.current);
      feedbackLockTimer.current = null;
    }
    pendingSkipRef.current = false;
    stopWordAudio();

    const head = queueRef.current[0];
    const rest = queueRef.current.slice(1);
    if (wasWrong && head) rest.push(head);
    queueRef.current = rest;

    if (!wasWrong) setProgress((p) => Math.min(p + 1, total));

    if (rest.length === 0) {
      setDone(true);
      setCurrent(null);
      if (!isFreeReview) {
        invalidateWordSummaryCache();
      }
      return;
    }

    const next = rest[0];
    setCurrent(next);
    setupCard(next, pool.length >= 2 ? pool : rest, sessionMode);
  }, [isFreeReview, pool, sessionMode, setupCard, total]);

  const finalize = useCallback(
    (isCorrect: boolean, isClose: boolean, quality: 0 | 3 | 4 | 5) => {
      // Guard ref — không dùng verdict state (stale closure / double-tap)
      if (!current || !userId || answeredRef.current) return;
      answeredRef.current = true;

      // Phản hồi đúng/sai phải hiện ngay; lưu SRS chạy nền để độ trễ mạng
      // không làm chậm nhịp học hoặc giữ giao diện ở trạng thái chưa chấm.
      // Chỉ lưu FSRS khi KHÔNG ở chế độ Ôn tập tự do (Free Review) để bảo toàn thuật toán FSRS.
      if (!isFreeReview) {
        void saveSrsReview(current.id, quality).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Không lưu được lịch ôn';
          toast.error(message);
        });
      }

      const v: Verdict = isCorrect ? 'correct' : isClose ? 'close' : 'wrong';
      setVerdict(v);
      setCanSkip(false);
      setStats((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        close: s.close + (isClose && !isCorrect ? 1 : 0),
        wrong: s.wrong + (!isCorrect && !isClose ? 1 : 0),
      }));

      const advance = () => {
        if (advanceFn.current !== advance) return;
        goNext(!isCorrect && !isClose);
      };
      advanceFn.current = advance;

      // Mở skip sau lock — nếu user đã bấm Enter/Space trước đó thì advance ngay
      if (feedbackLockTimer.current) clearTimeout(feedbackLockTimer.current);
      feedbackLockTimer.current = setTimeout(() => {
        setCanSkip(true);
        feedbackLockTimer.current = null;
        if (pendingSkipRef.current) {
          pendingSkipRef.current = false;
          advanceFn.current?.();
        }
      }, FEEDBACK_LOCK_MS);

      if (isCorrect) {
        if (advanceTimer.current) {
          clearTimeout(advanceTimer.current);
          advanceTimer.current = null;
        }
        // CORRECT: Await pronunciation completion + 400ms buffer before advancing
        void playWordWithBuffer(current.word, 400).then(() => {
          if (advanceFn.current === advance) {
            advance();
          }
        });
      } else {
        // INCORRECT / ALMOST CORRECT:
        // Play pronunciation for reinforcement, but DO NOT set auto-advance timer.
        // Card pauses indefinitely until manual action (Enter, Space, or "Tiếp theo").
        speak(current.word, 1.0);
        if (advanceTimer.current) {
          clearTimeout(advanceTimer.current);
          advanceTimer.current = null;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, userId, goNext],
  );

  const handleMcq = (choice: string, idx: number) => {
    if (answeredRef.current || !current) return;
    setSelected(choice);
    const ok = choice.trim().toLowerCase() === answer.trim().toLowerCase();
    if (!ok) {
      setShakingIdx(idx);
      setTimeout(() => setShakingIdx(null), 500);
    }
    const quality = resultToQuality({
      correct: ok,
      itemMode,
      elapsedMs: Date.now() - startedAt.current,
    });
    finalize(ok, false, quality);
  };

  const handleTypeSubmit = () => {
    if (answeredRef.current || !current) return;
    const guess = input.trim();
    if (!guess) return;
    const { verdict: v, quality } = verdictAndQuality(
      guess,
      answer,
      itemMode,
      Date.now() - startedAt.current,
    );
    finalize(v === 'correct', v === 'close', quality);
  };

  const skipWait = () => {
    if (!answeredRef.current) return;
    if (!canSkip) {
      pendingSkipRef.current = true;
      return;
    }
    advanceFn.current?.();
  };

  const replayAudio = (rate = 1.0) => {
    if (current) speak(current.word, rate);
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || isLoading || !current) return;
      if (answeredRef.current && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        skipWait();
        return;
      }
      if (answeredRef.current) return;

      if (['1', '2', '3', '4'].includes(e.key) && choices.length > 0) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < choices.length) handleMcq(choices[idx], idx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, isLoading, current, choices, verdict, selected, canSkip]);

  const hubHref = classroomId ? `/review?class=${encodeURIComponent(classroomId)}` : '/review';
  const sessionTitle =
    sessionMode === 'cloze' ? 'Cloze' : sessionMode === 'listen' ? 'Nghe' : 'Ôn hỗn hợp';

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="font-bold text-indigo-400">Đang chuẩn bị phiên {sessionTitle}…</p>
      </div>
    );
  }

  if (!current && !done) {
    return (
      <StudentShell title={sessionTitle} hideMobileNav contentClassName="max-w-md mx-auto">
        <div className="flex flex-col items-center gap-6 px-4 py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-4xl shadow-sm border border-emerald-100">
            🎯
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Tất cả từ đã ôn tập đúng hạn!</h1>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Hiện tại bạn chưa có từ nào đến hạn cần ôn. Thuật toán FSRS tối ưu khoảng cách ghi nhớ bằng cách giãn thời gian — ôn tập trước hạn không bắt buộc theo FSRS và bạn đã hoàn thành tốt lịch trình hôm nay.
            </p>
          </div>

          {nextDueTime && formatNextDue(nextDueTime) ? (
            <div className="w-full rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs font-semibold text-indigo-900 flex items-center justify-center gap-2">
              <span>⏳</span>
              <span>Từ tiếp theo đến hạn: <strong>{formatNextDue(nextDueTime)}</strong></span>
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-2.5 pt-2">
            <Button
              onClick={startFreeReview}
              disabled={isLoadingFree}
              className="h-12 w-full rounded-2xl bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              {isLoadingFree ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang nạp từ ôn tự do…</span>
                </>
              ) : (
                <>
                  <span>🔄 Ôn tập tự do (tất cả từ đã học)</span>
                </>
              )}
            </Button>
            <p className="text-[11px] font-medium text-slate-400">
              Ôn tự do giúp củng cố trí nhớ ngay mà không làm thay đổi lịch trình FSRS.
            </p>

            <div className="pt-2 flex flex-col gap-2 w-full">
              <Link href="/student" className="w-full">
                <Button variant="outline" className="h-11 w-full rounded-2xl font-bold border-slate-200 hover:bg-slate-50">
                  🏠 Về trang chủ
                </Button>
              </Link>
              <Link href={hubHref} className="w-full">
                <Button variant="ghost" className="h-10 w-full rounded-2xl font-semibold text-slate-500 hover:text-slate-800">
                  ← Về Hub ôn tập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  if (done) {
    const answered = stats.correct + stats.close + stats.wrong;
    const acc = answered > 0 ? Math.round((stats.correct / answered) * 100) : 0;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 font-sans">
        <div className="text-7xl">{acc >= 80 ? '🦁' : acc >= 60 ? '🦊' : '🐼'}</div>
        <h1 className="text-3xl font-black text-slate-900">
          {isFreeReview ? 'Xong lượt ôn tự do!' : `Xong phiên ${sessionTitle}!`}
        </h1>
        <Card className="w-full max-w-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
          <div className="mb-4 flex justify-between">
            <div>
              <div className="text-3xl font-black text-indigo-600">{acc}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</div>
            </div>
            <div className="text-right text-sm font-bold text-slate-600">
              <div className="text-emerald-600">✓ {stats.correct}</div>
              <div className="text-amber-600">≈ {stats.close}</div>
              <div className="text-rose-500">✗ {stats.wrong}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="h-12 rounded-2xl bg-indigo-600 font-bold"
              onClick={() => {
                if (isFreeReview) {
                  void startFreeReview();
                } else {
                  window.location.reload();
                }
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" /> {isFreeReview ? 'Ôn tiếp lượt khác' : 'Ôn tiếp'}
            </Button>
            <Link href={hubHref}>
              <Button variant="outline" className="h-12 w-full rounded-2xl font-bold">
                <ChevronLeft className="mr-2 h-4 w-4" /> Hub ôn tập
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isListen = itemMode === 'listen_mcq' || itemMode === 'listen_type';
  const isType =
    itemMode === 'cloze_type' || itemMode === 'listen_type' || itemMode === 'type_vi_en';
  const isMcq = !isType;
  const showWordFront = itemMode === 'mcq_en_vi';
  const showTranslationFront = itemMode === 'mcq_vi_en' || itemMode === 'type_vi_en';

  return (
    <div className="flex h-[calc(100dvh-var(--safe-top,0px))] flex-col bg-gradient-to-br from-indigo-50 via-white to-violet-50 font-sans">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href={hubHref}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="rounded-full border-none bg-indigo-100 px-2 py-0 text-[10px] font-black text-indigo-700">
              {modeMeta.emoji} {modeMeta.vi}
            </Badge>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {sessionTitle}
            </span>
            {isFreeReview && (
              <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-2 py-0 text-[10px] font-black text-amber-700">
                🔄 Ôn tự do
              </Badge>
            )}
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs font-black text-slate-500">
          {progress}/{total}
        </span>
      </div>

      {/* Card */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-2">
        <Card className="flex w-full max-w-md min-h-0 max-h-full flex-col overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
            {/* Prompt area */}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              {isListen && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-500">
                    Nghe và {itemMode === 'listen_type' ? 'gõ' : 'chọn'} từ
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => replayAudio(1.0)}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition active:scale-95"
                      aria-label="Phát lại"
                    >
                      <Volume2 className="h-8 w-8" />
                    </button>
                    <button
                      type="button"
                      onClick={() => replayAudio(0.6)}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-200 bg-amber-50 text-amber-700 transition active:scale-95"
                      aria-label="Chậm"
                    >
                      <Snail className="h-7 w-7" />
                    </button>
                  </div>
                  {verdict !== null && current && (
                    <div className="mt-1 w-full max-w-xs space-y-2 text-center">
                      {/* Sau chọn đáp án: nghĩa EN + VI — không lộ trước khi trả lời */}
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                          EN
                        </p>
                        <p className="text-2xl font-black text-slate-900">{current.word}</p>
                        {current.ipa && (
                          <p className="font-mono text-sm text-slate-400">{parseIpa(current.ipa)}</p>
                        )}
                      </div>
                      <div className="space-y-0.5 border-t border-slate-100 pt-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                          VI
                        </p>
                        <p className="text-base font-bold leading-snug text-slate-700">
                          {current.translation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(itemMode === 'cloze_mcq' || itemMode === 'cloze_type') && (
                <div className="w-full space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-violet-500">
                    Điền vào chỗ trống
                  </p>
                  <p className="text-lg font-bold leading-relaxed text-slate-800 sm:text-xl">
                    {clozeStem.split('___').map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span
                            className={`mx-0.5 inline-block min-w-[3rem] rounded-lg border-b-2 px-1 text-center ${
                              verdict === 'correct'
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                : verdict === 'close'
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : verdict === 'wrong'
                                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                                    : 'border-indigo-300 bg-indigo-50 text-indigo-400'
                            }`}
                          >
                            {verdict !== null ? answer : '___'}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                  {/* Cloze: không hiện gợi ý/VI — lộ đáp án */}
                </div>
              )}

              {showTranslationFront && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Nghĩa → {isType ? 'gõ' : 'chọn'} từ tiếng Anh
                  </p>
                  <p className="text-2xl font-black text-slate-900 sm:text-3xl">
                    {current?.translation}
                  </p>
                  {current?.pos && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {current.pos}
                    </Badge>
                  )}
                </div>
              )}

              {showWordFront && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Từ → chọn nghĩa
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-black text-slate-900">{current?.word}</p>
                    <button
                      type="button"
                      onClick={() => current && speak(current.word, 1.0)}
                      className="rounded-lg bg-indigo-100 p-2 text-indigo-600"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  {current?.ipa && (
                    <p className="font-mono text-sm text-slate-400">{parseIpa(current.ipa)}</p>
                  )}
                </div>
              )}
            </div>

            {/* Feedback banner */}
            {verdict !== null && (
              <div
                className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 text-center text-sm font-bold border transition-all ${
                  verdict === 'correct'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : verdict === 'close'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base font-black">
                    {verdict === 'correct' && '✓ Chính xác!'}
                    {verdict === 'close' && `≈ Gần đúng — đáp án: ${answer}`}
                    {verdict === 'wrong' && `✗ Sai — đáp án: ${answer}`}
                  </span>
                  {current && (
                    <button
                      type="button"
                      onClick={() => speak(current.word, 1.0)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-current shadow-xs transition hover:scale-105 active:scale-95"
                      title="Phát âm từ đúng"
                    >
                      <Volume2 className="h-4 w-4 text-emerald-600" />
                    </button>
                  )}
                </div>

                {/* Từ vựng + IPA + Nghĩa Tiếng Việt của từ */}
                {current && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm">
                    <span className="font-black text-slate-900">{current.word}</span>
                    {current.pos && (
                      <span className="rounded bg-slate-200/60 px-1 py-0.2 text-[10px] font-bold text-slate-600">
                        {current.pos}
                      </span>
                    )}
                    {current.ipa && (
                      <span className="font-mono text-xs text-slate-500">{parseIpa(current.ipa)}</span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-indigo-700">{current.translation}</span>
                  </div>
                )}

                {/* Dịch câu Tiếng Việt cho dạng Cloze (Điền chỗ trống) */}
                {(itemMode === 'cloze_mcq' || itemMode === 'cloze_type') && current?.example && (
                  <div className="mt-1 w-full border-t border-slate-200/60 pt-1.5 text-xs font-medium text-slate-700">
                    {extractVietnameseSentenceTranslation(current.example) ? (
                      <p className="italic text-emerald-900/90 font-semibold">
                        &ldquo;{extractVietnameseSentenceTranslation(current.example)}&rdquo;
                      </p>
                    ) : (
                      <p className="italic text-slate-600 opacity-90">
                        &ldquo;{stripEmbeddedVietnamese(current.example)}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MCQ choices */}
            {isMcq && choices.length > 0 && (
              <div className="grid shrink-0 gap-2">
                {choices.map((c, idx) => {
                  const isSel = selected === c;
                  const isAns = c.trim().toLowerCase() === answer.trim().toLowerCase();
                  let cls =
                    'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-slate-800';
                  if (verdict !== null) {
                    if (isAns) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                    else if (isSel) cls = 'border-rose-300 bg-rose-50 text-rose-700';
                    else cls = 'border-slate-100 bg-slate-50 text-slate-400';
                  } else if (isSel) {
                    cls = 'border-indigo-400 bg-indigo-50 text-indigo-800';
                  }
                  return (
                    <button
                      key={`${c}-${idx}`}
                      type="button"
                      disabled={verdict !== null}
                      onClick={() => handleMcq(c, idx)}
                      className={`flex h-12 items-center gap-2 rounded-xl border-2 px-3 text-left text-sm font-bold transition active:scale-[0.99] sm:h-14 sm:text-base ${cls} ${
                        shakingIdx === idx ? 'animate-shake' : ''
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-500">
                        {idx + 1}
                      </span>
                      <span className="line-clamp-2">{c}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Type input */}
            {isType && (
              <div className="shrink-0 space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus={canAutoFocus()}
                  value={input}
                  readOnly={verdict !== null}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (answeredRef.current) {
                        skipWait();
                      } else {
                        handleTypeSubmit();
                      }
                    }
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  placeholder={isListen ? 'Gõ từ bạn nghe…' : 'Gõ từ tiếng Anh…'}
                  className={`h-12 w-full rounded-xl border-2 px-3 text-center text-lg font-bold focus:outline-none sm:h-14 ${
                    verdict === 'correct'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : verdict === 'close'
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : verdict === 'wrong'
                          ? 'border-rose-400 bg-rose-50 text-rose-600'
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-500'
                  }`}
                />
                {verdict === null ? (
                  <Button
                    onClick={handleTypeSubmit}
                    className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold hover:bg-indigo-700"
                  >
                    Kiểm tra
                  </Button>
                ) : (
                  <Button
                    onClick={skipWait}
                    variant="outline"
                    className="h-11 w-full rounded-xl text-sm font-bold"
                  >
                    Tiếp theo →
                  </Button>
                )}
              </div>
            )}

            {isMcq && verdict !== null && (
              <Button
                onClick={skipWait}
                variant="outline"
                className="h-11 w-full shrink-0 rounded-xl text-sm font-bold"
              >
                Tiếp theo →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReviewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
