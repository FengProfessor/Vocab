'use client';

/**
 * Authentic ETS/IIG Computer-Based TOEIC Exam & Practice Environment.
 * Zero-chrome immersive simulation supporting Full 200Q Real Exams (120:00)
 * and Part Practice (Part 1 to Part 7) with instant explanations.
 *
 * Features:
 * - Hybrid Access Model ("Try before login" / Freemium UX)
 * - In-progress session autosave in localStorage
 * - Anti-scraping sensitive data stripping on test load
 * - Secure server-side scoring & honeypot trap detection
 * - Guest score preservation with 3-second Google OAuth sign-in
 */

import React, { useMemo, useState, Suspense, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { StudentShell } from '@/components/student/StudentShell';
import { ToeicExamHeader } from '@/components/toeic/ToeicExamHeader';
import { ToeicSplitPane } from '@/components/toeic/ToeicSplitPane';
import { ToeicQuestionPalette } from '@/components/toeic/ToeicQuestionPalette';
import { ExamPauseModal } from '@/components/toeic/ExamPauseModal';
import { SubmitConfirmModal } from '@/components/toeic/SubmitConfirmModal';
import { ToeicScoreReportView } from '@/components/toeic/ToeicScoreReportView';
import { GuestSaveExamModal } from '@/components/toeic/GuestSaveExamModal';
import { useToeicExamSession } from '@/hooks/useToeicExamSession';

import {
  loadToeicPartPractice,
  loadAnyToeicTest,
  getToeicCatalogIndex,
  getAvailableToeicTests,
  stripSensitiveToeicData,
  convertLegacyMiniTest,
} from '@/lib/toeic-test-loader';
import { completeRoadmapStep, setRoadmapCelebrateFlag } from '@/lib/roadmap-client';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type {
  ToeicUnifiedQuestion,
  ToeicClientQuestion,
  ToeicPart,
  ToeicExamMode,
  ToeicOptionKey,
  ToeicScoreResult,
  ToeicTestApiResponse,
} from '@/types/toeic';

const PART_RECOMMENDED_MINUTES: Record<ToeicPart, number> = {
  1: 4,   // 6 photos
  2: 10,  // 25 Q&R
  3: 17,  // 39 dialogue questions
  4: 15,  // 30 talks questions
  5: 12,  // 30 incomplete sentences
  6: 10,  // 16 text completion
  7: 55,  // 54 reading comprehension
};

function ToeicExamRoomInner() {
  const { examId } = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const decodedExamId = decodeURIComponent(examId || 'estudyme-test-1');
  const modeParam = searchParams.get('mode');
  const partParam = searchParams.get('part');
  const testIdParam = searchParams.get('testId');
  const limitParam = searchParams.get('limit');
  const timeParam = searchParams.get('time');
  const roadmapStep = searchParams.get('roadmapStep') ?? '';

  const limitNum = limitParam ? parseInt(limitParam, 10) : undefined;

  // ── 1. Determine Target Part and Testing Mode ──
  const partNum = useMemo(() => {
    if (!partParam) return null;
    const p = parseInt(partParam, 10);
    return p >= 1 && p <= 7 ? (p as ToeicPart) : null;
  }, [partParam]);

  const isPartPractice = Boolean(partNum);
  const initialMode: ToeicExamMode =
    modeParam === 'practice' || isPartPractice ? 'practice' : 'real';
  const [currentMode, setCurrentMode] = useState<ToeicExamMode>(initialMode);

  const targetTestId = useMemo(() => {
    if (isPartPractice && testIdParam) return testIdParam;
    return decodedExamId;
  }, [isPartPractice, testIdParam, decodedExamId]);

  // ── 2. Local Fallback Dataset (Used offline or before API loads) ──
  const { fallbackQuestions, testTitle, durationSeconds } = useMemo(() => {
    // Check if it's a legacy mini-test ID first
    const legacyQuestions = convertLegacyMiniTest(decodedExamId);
    if (legacyQuestions.length > 0) {
      const minutes = timeParam ? parseInt(timeParam, 10) : 20;
      return {
        fallbackQuestions: stripSensitiveToeicData(legacyQuestions),
        testTitle: `TOEIC Mini Test (${decodedExamId})`,
        durationSeconds: minutes * 60,
      };
    }

    // Part practice mode
    if (isPartPractice && partNum) {
      const isBank =
        !targetTestId ||
        targetTestId === 'all' ||
        targetTestId === 'bank' ||
        targetTestId === 'practice' ||
        targetTestId === 'part-practice';
      const catalog = getToeicCatalogIndex();
      const foundItem = catalog.fullTests.find(
        (t) => t.id === targetTestId || t.displayId === targetTestId
      );
      const cleanLabel = targetTestId
        .replace(/^estudyme-test-(\d+)/i, 'Đề ETS Simulation $1')
        .replace(/^study4_test_(\d+)/i, 'Đề ETS $1');
      const sourceLabel = isBank ? 'Ngân hàng đề' : (foundItem?.title || cleanLabel);
      const pQuestions = loadToeicPartPractice(partNum, targetTestId, limitNum, true);
      const minutes = timeParam
        ? parseInt(timeParam, 10)
        : Math.max(5, Math.ceil(pQuestions.length * ((PART_RECOMMENDED_MINUTES[partNum] || 15) / 25)));
      return {
        fallbackQuestions: stripSensitiveToeicData(pQuestions),
        testTitle: `Luyện tập Part ${partNum} (${pQuestions.length} câu — ${sourceLabel})`,
        durationSeconds: minutes * 60,
      };
    }

    // Universal Dynamic Test Resolution (ETS Authentic Simulation)
    const catalog = getToeicCatalogIndex();
    const fullCatalogItem = catalog.fullTests.find(
      (t) => t.id === decodedExamId || t.displayId === decodedExamId
    );

    let practiceCatalogItem = undefined;
    for (const pKey of Object.keys(catalog.practiceParts)) {
      const found = catalog.practiceParts[pKey]?.find((item) => item.id === decodedExamId);
      if (found) {
        practiceCatalogItem = found;
        break;
      }
    }

    const fullQuestions = loadAnyToeicTest(decodedExamId);
    const availableTests = getAvailableToeicTests();
    const meta = availableTests.find((t) => t.testId === decodedExamId);

    const cleanFallback = decodedExamId
      .replace(/^estudyme-test-(\d+)/i, 'ETS Simulation $1')
      .replace(/^study4_test_(\d+)/i, 'ETS $1');

    const resolvedTitle =
      fullCatalogItem?.title ||
      practiceCatalogItem?.title ||
      meta?.title ||
      `Đề thi TOEIC LR (${cleanFallback})`;

    const defaultMinutes =
      fullCatalogItem?.durationMinutes ||
      practiceCatalogItem?.durationMinutes ||
      (fullQuestions.length <= 30 ? 20 : 120);

    const minutes = timeParam ? parseInt(timeParam, 10) : defaultMinutes;

    const isAuthenticHardcoded = availableTests.some((t) => t.testId === decodedExamId);
    const isBrowser = typeof window !== 'undefined';
    // For non-hardcoded dynamic tests in browser, avoid flashing duplicate 6852 questions
    const safeFallbackQuestions =
      isBrowser && !isAuthenticHardcoded && !isPartPractice
        ? []
        : stripSensitiveToeicData(fullQuestions);

    return {
      fallbackQuestions: safeFallbackQuestions,
      testTitle: resolvedTitle,
      durationSeconds: minutes * 60,
    };
  }, [targetTestId, decodedExamId, isPartPractice, partNum, timeParam, limitNum, currentMode]);

  // Questions state: initially loaded via sanitized endpoint or fallback
  const [questions, setQuestions] = useState<ToeicClientQuestion[]>(fallbackQuestions);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  // Honeypot anti-bot trap state
  const [honeypotValue, setHoneypotValue] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');

  // ── 2.1. On-Demand Single-Question Explanation Fetcher (Zero Bulk Leak) ──
  const fetchSingleExplanation = useCallback(
    async (qNum: number) => {
      const targetQ = questions.find((q) => q.questionNumber === qNum);
      if (targetQ?.correctAnswer && targetQ?.explanationVi) {
        return;
      }
      try {
        const res = await fetch('/api/toeic/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: targetTestId,
            questionNumber: qNum,
            sessionToken,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setQuestions((prev) =>
              prev.map((q) =>
                q.questionNumber === qNum
                  ? {
                      ...q,
                      correctAnswer: data.correctAnswer,
                      explanationVi: data.explanationVi,
                      transcript: data.transcript,
                    }
                  : q
              )
            );
          }
        }
      } catch (err) {
        console.warn('[ToeicExam] Failed to fetch on-demand explanation:', err);
      }
    },
    [questions, sessionToken, targetTestId]
  );

  // Guest freemium save modal & Google auth loading
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // ── 3. Public Test Loader API: Fetch sanitized questions from server ──
  useEffect(() => {
    let isCancelled = false;

    async function fetchSanitizedTest() {
      try {
        const query = new URLSearchParams({
          testId: targetTestId,
          ...(partNum ? { part: String(partNum) } : {}),
          ...(limitNum ? { limit: String(limitNum) } : {}),
          ...(timeParam ? { time: timeParam } : {}),
          mode: currentMode,
        });

        const res = await fetch(`/api/toeic/test?${query.toString()}`);
        if (res.ok) {
          const data: ToeicTestApiResponse = await res.json();
          if (data.success && data.questions && data.questions.length > 0 && !isCancelled) {
            setQuestions(data.questions);
            if (data.sessionToken) {
              setSessionToken(data.sessionToken);
            }
            setIsLoadingQuestions(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[ToeicExam] Failed to load sanitized questions via API, using fallback:', err);
      }

      if (!isCancelled) {
        setQuestions(fallbackQuestions);
        setIsLoadingQuestions(false);
      }
    }

    void fetchSanitizedTest();

    return () => {
      isCancelled = true;
    };
  }, [targetTestId, currentMode, fallbackQuestions, partNum, timeParam, limitNum]);

  // ── 4. Session State Hook & Submitted Exam Persistence ──
  const sessionKey = useMemo(() => {
    return `${targetTestId}${partNum ? '_part' + partNum : ''}${limitNum ? '_lim' + limitNum : ''}_${currentMode}`;
  }, [targetTestId, currentMode, partNum, limitNum]);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [showPracticeExplanation, setShowPracticeExplanation] = useState<boolean>(false);

  // Submitted score state (persists across reloads & post-auth redirects)
  const [submittedScoreResult, setSubmittedScoreResult] = useState<ToeicScoreResult | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, ToeicOptionKey>>({});
  const [isExamSubmittedState, setIsExamSubmittedState] = useState<boolean>(false);
  const [isSavedToHistoryState, setIsSavedToHistoryState] = useState<boolean>(false);
  const [isGuestState, setIsGuestState] = useState<boolean>(false);

  // Handle submit roadmap integration & score modal
  const handleSubmit = (
    result: ToeicScoreResult,
    answers: Record<number, ToeicOptionKey>,
    reviewQuestions?: (ToeicUnifiedQuestion | ToeicClientQuestion)[]
  ) => {
    // Enrich questions with master review questions (reveals explanations & transcripts)
    if (reviewQuestions && reviewQuestions.length > 0) {
      setQuestions(reviewQuestions);
    }
    setSubmittedScoreResult(result);
    setSubmittedAnswers(answers);
    setIsExamSubmittedState(true);
    setIsSavedToHistoryState(Boolean(session.savedToHistory));
    setIsGuestState(Boolean(session.isGuest));

    // If user is guest or exam not yet saved to DB, cache in localStorage immediately
    if (session.isGuest || !session.savedToHistory) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'lingo_pending_toeic_save',
            JSON.stringify({
              testId: targetTestId,
              examMode: currentMode,
              part: partNum || undefined,
              sessionKey,
              answers,
              timeSpentSeconds: durationSeconds - session.timeRemainingSeconds,
              scoreResult: result,
              savedAt: Date.now(),
            })
          );
        } catch (e) {
          console.warn('[ToeicExam] Failed to cache pending save:', e);
        }
      }
      setIsGuestModalOpen(true);
    } else {
      toast.success('Kết quả bài thi đã được lưu vào tài khoản của bạn!');
    }

    if (roadmapStep && questions.length > 0) {
      const percent = Math.round((result.rawTotal / questions.length) * 100);
      if (percent >= 80) {
        completeRoadmapStep(roadmapStep, percent)
          .then((res) => {
            if (res) {
              setRoadmapCelebrateFlag(res);
            }
          })
          .catch((err) => {
            console.warn('[ToeicExam] Roadmap complete failed:', err);
          });
      }
    }
  };

  const session = useToeicExamSession({
    testId: sessionKey,
    questions,
    initialTimeSeconds: durationSeconds,
    mode: currentMode,
    autoRestore: true,
    onSubmit: handleSubmit,
  });

  // In practice mode: auto-reveal explanation and fetch on-demand if question answered
  useEffect(() => {
    if (currentMode === 'practice') {
      const hasAnswer = Boolean(session.answers[session.currentQNum]);
      setShowPracticeExplanation(hasAnswer);
      if (hasAnswer) {
        void fetchSingleExplanation(session.currentQNum);
      }
    }
  }, [currentMode, session.currentQNum, session.answers, fetchSingleExplanation]);

  // Toggle instant explanation mode directly during the exam
  const toggleExamMode = useCallback(async () => {
    if (currentMode === 'practice') {
      setCurrentMode('real');
      setShowPracticeExplanation(false);
      toast('Đã chuyển sang chế độ Thi thử (ẩn đáp án và giải thích cho đến khi nộp bài)');
    } else {
      setCurrentMode('practice');
      setShowPracticeExplanation(true);
      if (session.answers[session.currentQNum]) {
        void fetchSingleExplanation(session.currentQNum);
      }
      toast.success('Đã BẬT giải thích chi tiết: Lời giải & transcript sẽ hiển thị ngay khi bạn chọn đáp án!');
    }
  }, [currentMode, fetchSingleExplanation, session.answers, session.currentQNum]);

  // ── 5. Auto-sync Pending Guest Exam Submission after Login or Page Reload ──
  useEffect(() => {
    const syncPendingGuestSubmission = async () => {
      if (typeof window === 'undefined') return;
      try {
        const pendingRaw = localStorage.getItem('lingo_pending_toeic_save');
        if (!pendingRaw) return;

        const pending = JSON.parse(pendingRaw);
        if (!pending || !pending.testId) return;

        // Strictly match this specific exam session (testId, part, limit, mode) before restoring
        const matchesSession = pending.sessionKey
          ? pending.sessionKey === sessionKey
          : pending.testId === targetTestId &&
            Number(pending.part || 0) === Number(partNum || 0) &&
            pending.examMode === currentMode;

        // Discard stale empty submissions (0 answers) so user can take a fresh exam unless returning from OAuth
        const hasAnswers = Object.keys(pending.answers || {}).length > 0;
        const isOAuthRedirect =
          typeof window !== 'undefined' &&
          Boolean(sessionStorage.getItem('lingopro_oauth_redirect_to'));

        if (!hasAnswers && !isOAuthRedirect) {
          localStorage.removeItem('lingo_pending_toeic_save');
          return;
        }

        if (matchesSession && pending.scoreResult) {
          setSubmittedScoreResult(pending.scoreResult);
          setSubmittedAnswers(pending.answers || {});
          setIsExamSubmittedState(true);
        }

        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession?.user) {
          // Still a guest
          setIsGuestState(true);
          setIsSavedToHistoryState(false);
          return;
        }

        // User is authenticated! Sync pending exam to database
        const res = await authFetch('/api/toeic/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: pending.testId,
            examMode: pending.examMode || 'real',
            part: pending.part,
            answers: pending.answers,
            timeSpentSeconds: pending.timeSpentSeconds || 0,
            honeypot: '',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.scoreResult) setSubmittedScoreResult(data.scoreResult);
            if (data.reviewQuestions && data.reviewQuestions.length > 0) {
              setQuestions(data.reviewQuestions);
            }
            setIsExamSubmittedState(true);
            setIsSavedToHistoryState(true);
            setIsGuestState(false);
            localStorage.removeItem('lingo_pending_toeic_save');
            toast.success('Đã lưu kết quả thi TOEIC vào tài khoản của bạn!');
          }
        }
      } catch (e) {
        console.warn('[SyncPendingExam] Failed to sync:', e);
      }
    };

    void syncPendingGuestSubmission();
  }, [sessionKey, targetTestId, currentMode, partNum]);

  // Retake exam handler (clears persisted submission and local draft)
  const handleRetakeExam = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('lingo_pending_toeic_save');
        localStorage.removeItem(sessionKey);
      } catch (e) {
        console.warn('[ToeicExam] Reset storage error:', e);
      }
    }
    setSubmittedScoreResult(null);
    setSubmittedAnswers({});
    setIsExamSubmittedState(false);
    setIsSavedToHistoryState(false);
    session.resetExam();
    setShowPracticeExplanation(false);
  }, [session, sessionKey]);

  // ── 6. Google Sign-In for Guests (Preserves in-progress/completed session) ──
  const handleGoogleSignInForGuest = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      const activeResult = submittedScoreResult || session.scoreResult;
      const activeAnswers =
        Object.keys(submittedAnswers).length > 0 ? submittedAnswers : session.answers;

      if (activeResult) {
        localStorage.setItem(
          'lingo_pending_toeic_save',
          JSON.stringify({
            testId: targetTestId,
            examMode: currentMode,
            part: partNum || undefined,
            answers: activeAnswers,
            timeSpentSeconds: durationSeconds - session.timeRemainingSeconds,
            scoreResult: activeResult,
            savedAt: Date.now(),
          })
        );
      }

      sessionStorage.setItem(
        'lingopro_oauth_redirect_to',
        window.location.pathname + window.location.search
      );

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google Sign In Error:', err);
      toast.error('Không thể kết nối với Google. Vui lòng thử lại.');
      setIsGoogleLoading(false);
    }
  }, [
    targetTestId,
    durationSeconds,
    currentMode,
    partNum,
    session.answers,
    session.scoreResult,
    session.timeRemainingSeconds,
    submittedAnswers,
    submittedScoreResult,
  ]);

  // ── 7. Exam Scope Memoization (Unconditional Hook) ──
  const isFullTestExam = useMemo(() => {
    if (isPartPractice) return false;
    if (questions.length < 100) return false;
    const hasListening = questions.some(
      (q) => q.section === 'listening' || (q.part && q.part <= 4)
    );
    const hasReading = questions.some(
      (q) => q.section === 'reading' || (q.part && q.part >= 5)
    );
    return hasListening && hasReading;
  }, [isPartPractice, questions]);

  // ── 8. Empty & Loading State Guards ──
  if (isLoadingQuestions && questions.length === 0) {
    return (
      <StudentShell title={testTitle} immersive={true} requireAuth={false}>
        <div className="flex h-[80vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Đang tải đề thi TOEIC...
            </span>
          </div>
        </div>
      </StudentShell>
    );
  }

  if (questions.length === 0) {
    return (
      <StudentShell title="Không tìm thấy đề thi" immersive={true} requireAuth={false}>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Không tìm thấy dữ liệu đề thi
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Mã đề &ldquo;{decodedExamId}&rdquo; không tồn tại hoặc chưa sẵn sàng. Vui lòng chọn một trong các bộ đề chính thức.
          </p>
          <Link href="/toeic">
            <Button variant="outline" className="gap-1.5 text-xs rounded-sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ TOEIC
            </Button>
          </Link>
        </div>
      </StudentShell>
    );
  }

  // ── 9. Post-Submission: Render Score Report & Review Mode ──
  const activeScoreResult = submittedScoreResult || session.scoreResult;
  const activeAnswers =
    Object.keys(submittedAnswers).length > 0 ? submittedAnswers : session.answers;
  const isCompleted = isExamSubmittedState || session.isSubmitted;
  const isHistorySaved = isSavedToHistoryState || session.savedToHistory;
  const isCurrentGuest = isGuestState || session.isGuest;

  if (isCompleted && activeScoreResult) {
    return (
      <StudentShell title={`${testTitle} — Báo cáo điểm số`} immersive={true} requireAuth={false}>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-16">
          <ToeicScoreReportView
            scoreResult={activeScoreResult}
            questions={questions}
            answers={activeAnswers}
            flagged={session.flagged}
            testTitle={testTitle}
            isGuest={isCurrentGuest && !isHistorySaved}
            savedToHistory={isHistorySaved}
            onOpenGuestSaveModal={() => setIsGuestModalOpen(true)}
            onRetake={handleRetakeExam}
            onBackToHub={() => router.push('/toeic')}
          />

          {/* Encouraging Guest Save Prompt Modal */}
          <GuestSaveExamModal
            isOpen={isGuestModalOpen}
            onClose={() => setIsGuestModalOpen(false)}
            scoreResult={activeScoreResult}
            testTitle={testTitle}
            onGoogleSignIn={handleGoogleSignInForGuest}
            isGoogleLoading={isGoogleLoading}
            isFullTest={isFullTestExam}
            totalQuestions={questions.length}
            partNum={partNum}
            onRetake={handleRetakeExam}
          />
        </div>
      </StudentShell>
    );
  }

  // ── 9. Active Test Room: Split-Pane & Question Palette ──
  const currentQ = session.currentQuestion;
  const currentPart = currentQ ? currentQ.part : partNum || 1;
  const currentSection = currentQ ? currentQ.section : 'listening';
  const currentIndex = questions.findIndex(
    (q) => q.questionNumber === session.currentQNum
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < questions.length - 1;

  return (
    <StudentShell title={testTitle} immersive={true} requireAuth={false}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
        {/* Anti-Scraping Honeypot Trap (Invisible to real users) */}
        <div
          style={{
            display: 'none',
            opacity: 0,
            position: 'absolute',
            top: 0,
            left: '-9999px',
            height: 0,
            width: 0,
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <label htmlFor="_hp_author_code">Anti-Scraping Verification Code</label>
          <input
            id="_hp_author_code"
            type="text"
            name="_hp_author_code"
            tabIndex={-1}
            autoComplete="off"
            value={honeypotValue}
            onChange={(e) => setHoneypotValue(e.target.value)}
          />
          {/* Dummy question trap for scrapers attempting to answer hidden questions */}
          <div className="toeic-dummy-question">
            <span>Question 999: What is the main purpose of this document?</span>
            <input
              type="radio"
              name="dummy_question_999"
              value="A"
              tabIndex={-1}
              autoComplete="off"
              onChange={() => setHoneypotValue('trap_dummy_q999')}
            />
          </div>
          {/* Honeypot canary link: Invisible to real users, crawled by HTML scraper bots */}
          <a
            href="/api/toeic/test?testId=ets-canary-honeypot"
            rel="nofollow"
            tabIndex={-1}
            aria-hidden="true"
          >
            Full TOEIC Exam Master Answers and Explanations Archive
          </a>
        </div>

        {/* Top Header */}
        <ToeicExamHeader
          title={testTitle}
          section={currentSection}
          currentPart={currentPart}
          formattedTime={session.formattedTime}
          isTimeWarning={session.isTimeWarning}
          timeRemainingSeconds={session.timeRemainingSeconds}
          answeredCount={session.answeredCount}
          totalQuestions={session.totalQuestions}
          flaggedCount={session.flaggedCount}
          mode={currentMode}
          onToggleMode={toggleExamMode}
          onPause={session.pauseExam}
          onSubmit={() => setIsSubmitModalOpen(true)}
          onOpenPalette={() => setIsPaletteOpen((prev) => !prev)}
          isPaused={session.isPaused}
          allowPause={true}
        />

        {/* Main Content Area */}
        <main className="relative flex-1 overflow-hidden">
          {isLoadingQuestions && questions.length === 0 ? (
            <div className="flex h-[calc(100vh-48px)] flex-col items-center justify-center gap-3 font-mono text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>Đang nạp dữ liệu bài thi {testTitle}...</span>
            </div>
          ) : currentQ ? (
            <ToeicSplitPane
              question={currentQ}
              mode={currentMode}
              selectedOption={session.answers[session.currentQNum]}
              isFlagged={session.flagged.has(session.currentQNum)}
              onSelectOption={(opt) => {
                session.selectAnswer(session.currentQNum, opt);
                if (currentMode === 'practice') {
                  setShowPracticeExplanation(true);
                  void fetchSingleExplanation(session.currentQNum);
                }
              }}
              onToggleFlag={() => session.toggleFlag(session.currentQNum)}
              onNext={session.nextQuestion}
              onPrev={session.prevQuestion}
              hasPrev={hasPrev}
              hasNext={hasNext}
              totalQuestions={session.totalQuestions}
              showExplanation={showPracticeExplanation}
              onToggleExplanation={() =>
                setShowPracticeExplanation((prev) => {
                  const next = !prev;
                  if (next) {
                    void fetchSingleExplanation(session.currentQNum);
                  }
                  return next;
                })
              }
              onEnablePracticeMode={toggleExamMode}
              onOpenPalette={() => setIsPaletteOpen((prev) => !prev)}
              paletteStats={{
                answered: session.answeredCount,
                total: session.totalQuestions,
              }}
              className="h-[calc(100vh-48px)]"
            />
          ) : null}

          {/* Question Palette Matrix */}
          <ToeicQuestionPalette
            questions={questions}
            answers={session.answers}
            flagged={session.flagged}
            currentQNum={session.currentQNum}
            onSelectQuestion={(qNum) => {
              session.goToQuestion(qNum);
              setIsPaletteOpen(false);
            }}
            isOpen={isPaletteOpen}
            onToggleOpen={() => setIsPaletteOpen((prev) => !prev)}
          />
        </main>

        {/* Pause Modal */}
        <ExamPauseModal
          isOpen={session.isPaused}
          formattedTime={session.formattedTime}
          onResume={session.resumeExam}
          onSaveAndExit={() => router.push('/toeic')}
        />

        {/* Submit Confirmation Dialog */}
        <SubmitConfirmModal
          isOpen={isSubmitModalOpen}
          totalQuestions={session.totalQuestions}
          answeredCount={session.answeredCount}
          unansweredCount={session.unansweredCount}
          flaggedCount={session.flaggedCount}
          onCancel={() => setIsSubmitModalOpen(false)}
          onConfirm={async () => {
            setIsSubmitModalOpen(false);
            const res = await session.submitExam({
              honeypot: honeypotValue,
              part: partNum || undefined,
              limit: limitNum || undefined,
            });
            if (res && !res.success && res.error) {
              toast.error(res.error);
            }
          }}
          isSubmitting={session.isSubmitting}
        />
      </div>
    </StudentShell>
  );
}

export default function ToeicExamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <span className="text-sm font-medium">Đang tải phòng thi TOEIC...</span>
          </div>
        </div>
      }
    >
      <ToeicExamRoomInner />
    </Suspense>
  );
}
