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
  stripEmbeddedVietnamese,
  verdictAndQuality,
} from '@/lib/review-modes';
import { invalidateWordSummaryCache } from '@/lib/word-summary-cache';

interface WordItem extends ReviewWordLike {
  ipa?: string;
  pos?: string;
  image_url?: string;
  srsLevel: number;
  reviewCount: number;
  isDue: boolean;
}

const NEXT_OK_MS = 4000;
const NEXT_BAD_MS = 10000;
/** Chặn ghost-click / double-tap vào «Tiếp theo» ngay sau khi chạm đáp án. */
const FEEDBACK_LOCK_MS = 700;
const SESSION_CAP = 25;

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
        const token = session.access_token;
        setUserId(user.id);

        const base = classroomId
          ? `/api/words?classroomId=${classroomId}`
          : `/api/words`;
        // Pool nhẹ (80 từ) cho distractor MCQ; queue due cap SESSION_CAP
        // Truyền token sẵn → authFetch không gọi getSession() lại (tiết kiệm ~400ms)
        const [allRes, dueRes] = await Promise.all([
          authFetch(`${base}${base.includes('?') ? '&' : '?'}limit=80`, {}, token),
          authFetch(`${base}${base.includes('?') ? '&' : '?'}filter=review&limit=${SESSION_CAP}`, {}, token),
        ]);
        const allJson = await allRes.json();
        const dueJson = await dueRes.json();

        if (!allJson.success) {
          toast.error('Không tải được từ vựng.');
          setIsLoading(false);
          return;
        }
        if (!classroomId && allJson.classroomId) setClassroomId(allJson.classroomId);

        const ready = (allJson.data as WordItem[]).filter(
          (w) =>
            w.word &&
            w.translation &&
            !w.translation.includes('failed') &&
            !w.translation.includes('Analyzing'),
        );
        setPool(ready);

        let due = ((dueJson.success && dueJson.data) ? dueJson.data : ready.filter((w) => w.isDue)) as WordItem[];
        due = due.filter(
          (w) =>
            w.word &&
            w.translation &&
            !w.translation.includes('failed') &&
            !w.translation.includes('Analyzing'),
        );

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
  }, [classParam, sessionMode]);

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
    stopWordAudio();

    const head = queueRef.current[0];
    const rest = queueRef.current.slice(1);
    if (wasWrong && head) rest.push(head);
    queueRef.current = rest;

    if (!wasWrong) setProgress((p) => Math.min(p + 1, total));

    if (rest.length === 0) {
      setDone(true);
      setCurrent(null);
      invalidateWordSummaryCache();
      return;
    }

    const next = rest[0];
    setCurrent(next);
    setupCard(next, pool.length >= 2 ? pool : rest, sessionMode);
  }, [pool, sessionMode, setupCard, total]);

  const finalize = useCallback(
    (isCorrect: boolean, isClose: boolean, quality: 0 | 3 | 4 | 5) => {
      // Guard ref — không dùng verdict state (stale closure / double-tap)
      if (!current || !userId || answeredRef.current) return;
      answeredRef.current = true;

      const v: Verdict = isCorrect ? 'correct' : isClose ? 'close' : 'wrong';
      setVerdict(v);
      setCanSkip(false);
      setStats((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        close: s.close + (isClose && !isCorrect ? 1 : 0),
        wrong: s.wrong + (!isCorrect && !isClose ? 1 : 0),
      }));

      // Phát âm củng cố
      speak(current.word, 1.0);

      authFetch('/api/words/srs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: current.id, quality }),
      }).catch((err) => console.error('[ReviewSession] SRS:', err));

      // Mở skip sau lock — tránh ghost-click từ chạm đáp án
      if (feedbackLockTimer.current) clearTimeout(feedbackLockTimer.current);
      feedbackLockTimer.current = setTimeout(() => {
        setCanSkip(true);
        feedbackLockTimer.current = null;
      }, FEEDBACK_LOCK_MS);

      const delay = isCorrect ? NEXT_OK_MS : NEXT_BAD_MS;
      const advance = () => {
        if (advanceFn.current !== advance) return;
        goNext(!isCorrect && !isClose);
      };
      advanceFn.current = advance;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(advance, delay);
    },
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
    if (!answeredRef.current || !canSkip) return;
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
        // Chỉ skip khi hết feedback lock (tránh Enter double-fire sau gõ)
        if (canSkip) skipWait();
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

  const hubHref = classroomId ? `/review?class=${classroomId}` : '/review';
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
        <div className="flex flex-col items-center gap-6 px-4 py-16 text-center">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-black text-slate-900">Không có từ nào đến hạn ôn</h1>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            Hiện tại chưa có từ nào cần ôn tập. Ôn trước hạn sẽ ảnh hưởng đến thuật toán ghi nhớ.
          </p>
          <p className="text-sm font-medium text-indigo-600">
            Muốn luyện thêm? Vào <strong>Sử dụng từ</strong> để làm quiz mà không ảnh hưởng FSRS.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link href={classroomId ? `/practice?class=${classroomId}` : '/practice'}>
              <Button className="h-12 w-full rounded-2xl bg-indigo-600 font-bold">🧠 Sử dụng từ — Quiz luyện tập</Button>
            </Link>
            <Link href={hubHref}>
              <Button variant="outline" className="h-12 w-full rounded-2xl font-bold">← Hub ôn tập</Button>
            </Link>
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
        <h1 className="text-3xl font-black text-slate-900">Xong phiên {sessionTitle}!</h1>
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
              onClick={() => window.location.reload()}
            >
              <ArrowRight className="mr-2 h-4 w-4" /> Ôn tiếp
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
          <div className="flex items-center gap-1.5">
            <Badge className="rounded-full border-none bg-indigo-100 px-2 py-0 text-[10px] font-black text-indigo-700">
              {modeMeta.emoji} {modeMeta.vi}
            </Badge>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {sessionTitle}
            </span>
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
                      <span className="font-mono text-xs text-slate-500">/{parseIpa(current.ipa)}/</span>
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
                        if (canSkip) skipWait();
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
                    disabled={!canSkip}
                    variant="outline"
                    className="h-11 w-full rounded-xl text-sm font-bold disabled:opacity-40"
                  >
                    Tiếp theo →
                  </Button>
                )}
              </div>
            )}

            {isMcq && verdict !== null && (
              <Button
                onClick={skipWait}
                disabled={!canSkip}
                variant="outline"
                className="h-11 w-full shrink-0 rounded-xl text-sm font-bold disabled:opacity-40"
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
