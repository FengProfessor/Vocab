'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  ToeicOptionKey,
  ToeicUnifiedQuestion,
  ToeicScoreResult,
  ToeicExamMode,
  ToeicSubmitApiResponse,
  ToeicClientQuestion,
} from '@/types/toeic';
import { calculateToeicScore } from '@/lib/toeic-scoring';
import { authFetch } from '@/lib/auth-fetch';

export interface UseToeicExamSessionOptions {
  testId: string;
  questions: ToeicClientQuestion[];
  initialTimeSeconds?: number; // Default 120 * 60 = 7200s
  mode?: ToeicExamMode; // Default 'real'
  autoRestore?: boolean; // Default true
  onTimeExpired?: () => void;
  onSubmit?: (
    result: ToeicScoreResult,
    answers: Record<number, ToeicOptionKey>,
    reviewQuestions?: (ToeicUnifiedQuestion | ToeicClientQuestion)[]
  ) => void;
}

interface SavedSessionDraft {
  testId: string;
  answers: Record<number, ToeicOptionKey>;
  flagged: number[];
  currentQNum: number;
  timeRemainingSeconds: number;
  mode: ToeicExamMode;
  updatedAt: number;
}

export function useToeicExamSession({
  testId,
  questions,
  initialTimeSeconds = 120 * 60,
  mode = 'real',
  autoRestore = true,
  onTimeExpired,
  onSubmit,
}: UseToeicExamSessionOptions) {
  const storageKey = useMemo(() => `lingo_toeic_session_${testId}`, [testId]);

  // Determine first question number
  const minQNum = questions.length > 0 ? questions[0].questionNumber : 1;

  // Initialize states
  const [answers, setAnswers] = useState<Record<number, ToeicOptionKey>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentQNum, setCurrentQNum] = useState<number>(minQNum);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(initialTimeSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<ToeicScoreResult | undefined>(undefined);
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedToHistory, setSavedToHistory] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Keep references for timer & auto-submit
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittedRef = useRef<boolean>(isSubmitted);
  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  // ── 1. Restore draft from localStorage on mount ──
  useEffect(() => {
    if (!autoRestore || typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const draft: SavedSessionDraft = JSON.parse(raw);
        if (draft && draft.testId === testId && draft.timeRemainingSeconds > 0) {
          setAnswers(draft.answers || {});
          setFlagged(new Set(draft.flagged || []));
          if (draft.currentQNum) {
            setCurrentQNum(draft.currentQNum);
          }
          if (typeof draft.timeRemainingSeconds === 'number') {
            setTimeRemainingSeconds(draft.timeRemainingSeconds);
          }
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn('[useToeicExamSession] Failed to restore draft:', e);
    }
  }, [autoRestore, storageKey, testId]);

  // Update currentQNum when questions first load if default minQNum changed
  useEffect(() => {
    if (questions.length > 0 && !hasRestoredDraft) {
      setCurrentQNum((prev) => {
        const exists = questions.some((q) => q.questionNumber === prev);
        return exists ? prev : questions[0].questionNumber;
      });
    }
  }, [questions, hasRestoredDraft]);

  // ── 2. Throttled Autosave (every 2s max) ──
  const scheduleAutosave = useCallback(
    (
      currentAnswers: Record<number, ToeicOptionKey>,
      currentFlagged: Set<number>,
      qNum: number,
      timeRemaining: number
    ) => {
      if (typeof window === 'undefined' || isSubmittedRef.current) return;

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTimeRef.current;

      const performSave = () => {
        try {
          const draft: SavedSessionDraft = {
            testId,
            answers: currentAnswers,
            flagged: Array.from(currentFlagged),
            currentQNum: qNum,
            timeRemainingSeconds: timeRemaining,
            mode,
            updatedAt: Date.now(),
          };
          localStorage.setItem(storageKey, JSON.stringify(draft));
          lastSaveTimeRef.current = Date.now();
        } catch (e) {
          console.warn('[useToeicExamSession] Autosave error:', e);
        }
      };

      if (timeSinceLastSave >= 2000) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        performSave();
      } else {
        if (!saveTimeoutRef.current) {
          saveTimeoutRef.current = setTimeout(() => {
            performSave();
            saveTimeoutRef.current = null;
          }, 2000 - timeSinceLastSave);
        }
      }
    },
    [mode, storageKey, testId]
  );

  // ── 3. Submit Exam Method (Server-Side Scoring with Local Fallback) ──
  const submitExam = useCallback(
    async (options?: { honeypot?: string; part?: number; limit?: number }) => {
      if (isSubmittedRef.current || isSubmitting) return;
      setIsSubmitting(true);

      const elapsed = initialTimeSeconds - timeRemainingSeconds;

      // Extract clean testId without mode suffixes (e.g. '6852_real' -> '6852')
      const cleanTestId = testId
        .replace(/_(real|practice|full_simulation|practice_part)$/, '')
        .replace(/_part[1-7]/, '')
        .replace(/_lim\d+/, '');

      try {
        // Attempt secure server-side scoring & submission
        const res = await authFetch('/api/toeic/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: cleanTestId,
            examMode: mode,
            part: options?.part,
            limit: options?.limit,
            answers,
            timeSpentSeconds: Math.max(0, elapsed),
            honeypot: options?.honeypot || '',
          }),
        });

        if (res.ok) {
          const data: ToeicSubmitApiResponse = await res.json();
          if (data.success && data.scoreResult) {
            // ONLY remove draft after submission successfully finishes
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem(storageKey);
              } catch (e) {
                console.warn('[useToeicExamSession] Failed to remove draft on submit:', e);
              }
            }

            setIsSubmitted(true);
            isSubmittedRef.current = true;
            setScoreResult(data.scoreResult);
            setSavedToHistory(Boolean(data.savedToHistory));
            setIsGuest(Boolean(data.isGuest));
            setIsSubmitting(false);

            if (onSubmit) {
              onSubmit(data.scoreResult, answers, data.reviewQuestions);
            }
            return {
              success: true,
              scoreResult: data.scoreResult,
              reviewQuestions: data.reviewQuestions,
              savedToHistory: Boolean(data.savedToHistory),
              isGuest: Boolean(data.isGuest),
            };
          } else {
            console.warn('[useToeicExamSession] Submit error payload:', data.error);
          }
        } else {
          console.warn('[useToeicExamSession] Submit HTTP status error:', res.status);
        }
      } catch (e) {
        console.warn('[useToeicExamSession] Server submit exception:', e);
      }

      // Check if questions have master keys (unit test mocks / local dev without backend)
      const hasLocalMasterKeys =
        questions.length > 0 && questions.some((q) => Boolean(q.correctAnswer));

      if (hasLocalMasterKeys) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(storageKey);
          } catch (e) {
            console.warn('[useToeicExamSession] Failed to remove draft:', e);
          }
        }

        const computedResult = calculateToeicScore(answers, questions, Math.max(0, elapsed));
        setIsSubmitted(true);
        isSubmittedRef.current = true;
        setScoreResult(computedResult);
        setIsSubmitting(false);

        if (onSubmit) {
          onSubmit(computedResult, answers, questions);
        }
        return {
          success: true,
          scoreResult: computedResult,
          reviewQuestions: questions,
          savedToHistory: false,
          isGuest: true,
        };
      }

      // Client questions are sanitized and server submission failed:
      // DO NOT mark exam as submitted with a false 0 score. Preserve draft!
      setIsSubmitting(false);
      return {
        success: false,
        error:
          'Không thể nộp bài do sự cố kết nối máy chủ. Câu trả lời của bạn đã được bảo lưu an toàn. Vui lòng thử nộp lại!',
      };
    },
    [
      answers,
      initialTimeSeconds,
      isSubmitting,
      mode,
      onSubmit,
      questions,
      storageKey,
      testId,
      timeRemainingSeconds,
    ]
  );

  // ── 4. Countdown Timer Engine ──
  useEffect(() => {
    if (isSubmitted || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Timer reached 00:00 -> auto submit
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTimeout(() => {
            if (onTimeExpired) onTimeExpired();
            submitExam();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, isSubmitted, onTimeExpired, submitExam]);

  // Save on time changes periodically (every 5 seconds)
  useEffect(() => {
    if (!isSubmitted && !isPaused && timeRemainingSeconds % 5 === 0) {
      scheduleAutosave(answers, flagged, currentQNum, timeRemainingSeconds);
    }
  }, [answers, currentQNum, flagged, isPaused, isSubmitted, scheduleAutosave, timeRemainingSeconds]);

  // ── 5. User Interaction Actions ──

  const selectAnswer = useCallback(
    (qNum: number, option: ToeicOptionKey) => {
      if (isSubmitted) return;
      setAnswers((prev) => {
        const next = { ...prev, [qNum]: option };
        scheduleAutosave(next, flagged, currentQNum, timeRemainingSeconds);
        return next;
      });
    },
    [currentQNum, flagged, isSubmitted, scheduleAutosave, timeRemainingSeconds]
  );

  const toggleFlag = useCallback(
    (qNum: number) => {
      if (isSubmitted) return;
      setFlagged((prev) => {
        const next = new Set(prev);
        if (next.has(qNum)) {
          next.delete(qNum);
        } else {
          next.add(qNum);
        }
        scheduleAutosave(answers, next, currentQNum, timeRemainingSeconds);
        return next;
      });
    },
    [answers, currentQNum, isSubmitted, scheduleAutosave, timeRemainingSeconds]
  );

  const goToQuestion = useCallback(
    (qNum: number) => {
      setCurrentQNum(qNum);
      scheduleAutosave(answers, flagged, qNum, timeRemainingSeconds);
    },
    [answers, flagged, scheduleAutosave, timeRemainingSeconds]
  );

  const nextQuestion = useCallback(() => {
    const currentIndex = questions.findIndex((q) => q.questionNumber === currentQNum);
    if (currentIndex >= 0 && currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1].questionNumber;
      goToQuestion(nextQ);
    }
  }, [currentQNum, goToQuestion, questions]);

  const prevQuestion = useCallback(() => {
    const currentIndex = questions.findIndex((q) => q.questionNumber === currentQNum);
    if (currentIndex > 0) {
      const prevQ = questions[currentIndex - 1].questionNumber;
      goToQuestion(prevQ);
    }
  }, [currentQNum, goToQuestion, questions]);

  const pauseExam = useCallback(() => {
    if (isSubmitted) return;
    setIsPaused(true);
    // Persist immediately on pause
    scheduleAutosave(answers, flagged, currentQNum, timeRemainingSeconds);
  }, [answers, currentQNum, flagged, isSubmitted, scheduleAutosave, timeRemainingSeconds]);

  const resumeExam = useCallback(() => {
    setIsPaused(false);
  }, []);

  const resetExam = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('[useToeicExamSession] Reset failed to remove key:', e);
      }
    }
    setAnswers({});
    setFlagged(new Set());
    setCurrentQNum(minQNum);
    setTimeRemainingSeconds(initialTimeSeconds);
    setIsPaused(false);
    setIsSubmitted(false);
    isSubmittedRef.current = false;
    setScoreResult(undefined);
  }, [initialTimeSeconds, minQNum, storageKey]);

  // ── 6. Computed Metrics ──

  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of questions) {
      if (answers[q.questionNumber]) count++;
    }
    return count;
  }, [answers, questions]);

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = useMemo(() => {
    let count = 0;
    for (const q of questions) {
      if (flagged.has(q.questionNumber)) count++;
    }
    return count;
  }, [flagged, questions]);

  // Warning when less than 5 minutes (300 seconds)
  const isTimeWarning = timeRemainingSeconds <= 300 && timeRemainingSeconds > 0;

  // Active question object
  const currentQuestion = useMemo(() => {
    return questions.find((q) => q.questionNumber === currentQNum) || questions[0];
  }, [currentQNum, questions]);

  // Formatted countdown time mm:ss or hh:mm:ss
  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeRemainingSeconds / 3600);
    const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
    const seconds = timeRemainingSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [timeRemainingSeconds]);

  return {
    // States
    answers,
    flagged,
    currentQNum,
    currentQuestion,
    timeRemainingSeconds,
    formattedTime,
    isPaused,
    isSubmitted,
    isSubmitting,
    savedToHistory,
    isGuest,
    scoreResult,
    hasRestoredDraft,
    isTimeWarning,

    // Counts
    totalQuestions,
    answeredCount,
    unansweredCount,
    flaggedCount,

    // Actions
    selectAnswer,
    toggleFlag,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    pauseExam,
    resumeExam,
    submitExam,
    resetExam,
  };
}
