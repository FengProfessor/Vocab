/**
 * VNU Test Bậc 3 Exam Room Component (4-Skill Interactive Support)
 * File: src/components/vnu-bac-3/VnuExamRoom.tsx
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Clock,
  ArrowLeft,
  Send,
  Award,
  AlertTriangle,
  XCircle,
  BookOpen,
  Headphones,
  Edit3,
  Mic,
} from 'lucide-react';
import {
  VnuBac3Exam,
  VnuBac3ExamMode,
  VnuBac3ScoreResult,
  VnuBac3SkillType,
} from '@/types/vnu-bac-3';
import { recordVnuB3Attempt } from '@/lib/vnu-bac-3/history';
import type { WritingEvalResult } from '@/app/api/vstep/writing-eval/route';
import { VnuSplitPane } from './VnuSplitPane';
import { VnuQuestionPalette } from './VnuQuestionPalette';

interface VnuExamRoomProps {
  examId: string;
  initialMode: VnuBac3ExamMode;
}

export function VnuExamRoom({ examId, initialMode }: VnuExamRoomProps) {
  const [exam, setExam] = useState<VnuBac3Exam | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái làm bài
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [activeSkillFilter, setActiveSkillFilter] = useState<VnuBac3SkillType | 'all'>('all');

  // Trạng thái bài viết & bài nói & kết quả chấm Writing
  const [writingDrafts, setWritingDrafts] = useState<Record<string, string>>({});
  const [speakingNotes, setSpeakingNotes] = useState<Record<string, string>>({});
  const [writingEvals, setWritingEvals] = useState<Record<string, WritingEvalResult>>({});
  const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);

  // Đồng hồ đếm ngược (giây)
  const [timeLeft, setTimeLeft] = useState<number>(65 * 60);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Popup & Kết quả
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<VnuBac3ScoreResult | null>(null);
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  const isExamMode = initialMode === 'full_simulation';
  const draftKey = `vnu_b3_draft_${examId}_${initialMode}`;
  const writingEvalsKey = `vnu_b3_writing_evals_${examId}`;
  const hasAutoSubmittedRef = useRef<boolean>(false);

  // 1. Nạp đề thi an toàn từ API /api/vnu-bac-3/test
  useEffect(() => {
    let isMounted = true;
    hasAutoSubmittedRef.current = false;
    setLoading(true);
    setError(null);

    fetch(`/api/vnu-bac-3/test?id=${examId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi tải đề thi (HTTP ${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (!data.success || !data.exam) {
          throw new Error(data.error || 'Dữ liệu đề thi không hợp lệ.');
        }

        const loadedExam: VnuBac3Exam = data.exam;
        setExam(loadedExam);
        setSessionToken(data.sessionToken || '');

        // Tìm mục đầu tiên trong đề thi (Reading Q1)
        const firstQId = loadedExam.sections?.[0]?.tasks?.[0]?.questions?.[0]?.id || '';
        setCurrentQuestionId(firstQId);

        // Khôi phục nháp writing & speaking từ localStorage
        const loadedWriting: Record<string, string> = {};
        const loadedSpeaking: Record<string, string> = {};
        if (loadedExam.sections) {
          for (const s of loadedExam.sections) {
            if (s.type === 'writing') {
              for (const t of s.tasks) {
                try {
                  const val = localStorage.getItem(`vnu_b3_writing_${loadedExam.id}_${t.id}`);
                  if (val) loadedWriting[t.id] = val;
                } catch {
                  // ignore
                }
              }
            }
            if (s.type === 'speaking') {
              for (const t of s.tasks) {
                try {
                  const val = localStorage.getItem(`vnu_b3_speaking_${loadedExam.id}_${t.id}`);
                  if (val) loadedSpeaking[t.id] = val;
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        // Khôi phục kết quả chấm bài Writing đã lưu riêng
        let loadedEvals: Record<string, WritingEvalResult> = {};
        try {
          const savedEvals = localStorage.getItem(writingEvalsKey);
          if (savedEvals) {
            const parsedEvals = JSON.parse(savedEvals);
            if (parsedEvals && typeof parsedEvals === 'object') {
              loadedEvals = parsedEvals;
            }
          }
        } catch {
          // ignore
        }

        // Khôi phục nháp tổng thể từ localStorage nếu có
        try {
          const saved = localStorage.getItem(draftKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.answers) setUserAnswers(parsed.answers);
            if (parsed.flags) setFlaggedQuestions(parsed.flags);
            if (parsed.currentQuestionId) setCurrentQuestionId(parsed.currentQuestionId);
            if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) {
              setTimeLeft(parsed.timeLeft);
            }
            if (typeof parsed.timeSpent === 'number' && parsed.timeSpent >= 0) {
              setTimeSpent(parsed.timeSpent);
            }
            if (parsed.writingDrafts && typeof parsed.writingDrafts === 'object') {
              Object.assign(loadedWriting, parsed.writingDrafts);
            }
            if (parsed.speakingNotes && typeof parsed.speakingNotes === 'object') {
              Object.assign(loadedSpeaking, parsed.speakingNotes);
            }
            if (parsed.writingEvals && typeof parsed.writingEvals === 'object') {
              loadedEvals = { ...loadedEvals, ...parsed.writingEvals };
            }
          }
        } catch {
          // ignore
        }

        setWritingDrafts(loadedWriting);
        setSpeakingNotes(loadedSpeaking);
        setWritingEvals(loadedEvals);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Không thể kết nối đến máy chủ.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [examId, draftKey, writingEvalsKey]);

  // 2. Tự động lưu tiến trình trắc nghiệm + tự luận + chấm bài vào localStorage
  useEffect(() => {
    if (!exam || result) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers: userAnswers,
          flags: flaggedQuestions,
          writingDrafts,
          speakingNotes,
          writingEvals,
          currentQuestionId,
          timeLeft,
          timeSpent,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  }, [userAnswers, flaggedQuestions, writingDrafts, speakingNotes, writingEvals, currentQuestionId, timeLeft, timeSpent, exam, result, draftKey]);

  // Thực thi nộp bài lên Server (Decoupled Scoring: chỉ chấm Reading và Listening)
  const performSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/vnu-bac-3/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          mode: initialMode,
          answers: userAnswers,
          timeSpentSeconds: timeSpent,
          sessionToken,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
        setShowSubmitModal(false);
        setShowResultModal(true);
        setReviewMode(true);
        try {
          recordVnuB3Attempt({
            examId,
            examTitle: exam?.title || examId,
            mode: initialMode,
            durationSeconds: timeSpent,
            result: data.result,
            writingDrafts,
          });
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
      } else {
        toast.error(data.error || 'Lỗi khi gửi kết quả nộp bài.');
      }
    } catch {
      toast.error('Không thể nộp bài do mất kết nối mạng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }, [examId, exam, initialMode, userAnswers, writingDrafts, timeSpent, sessionToken, draftKey]);

  // Xử lý nộp bài tự động khi hết giờ (luôn giữ tham chiếu mới nhất tránh stale closure)
  const handleAutoSubmit = useCallback(() => {
    if (result || submitting) return;
    performSubmit();
  }, [result, submitting, performSubmit]);

  const autoSubmitRef = useRef(handleAutoSubmit);
  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmit;
  }, [handleAutoSubmit]);

  // 3. Đồng hồ đếm ngược
  useEffect(() => {
    if (loading || result) return;

    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);

      if (isExamMode) {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, result, isExamMode]);

  // Tự động nộp bài ngay khi đồng hồ về 0 trong chế độ thi thử
  useEffect(() => {
    if (!isExamMode || loading || result || submitting || hasAutoSubmittedRef.current) return;
    if (timeLeft === 0) {
      hasAutoSubmittedRef.current = true;
      autoSubmitRef.current();
    }
  }, [isExamMode, loading, result, submitting, timeLeft]);

  // Xử lý chọn đáp án
  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (result && !reviewMode) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Gắn cờ câu hỏi hoặc bài thi
  const handleToggleFlag = (itemId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Thay đổi bài nháp Writing
  const handleWritingDraftChange = (taskId: string, draft: string) => {
    setWritingDrafts((prev) => ({
      ...prev,
      [taskId]: draft,
    }));
  };

  // Thay đổi ghi chú dàn ý Speaking
  const handleSpeakingNotesChange = (taskId: string, notes: string) => {
    setSpeakingNotes((prev) => ({
      ...prev,
      [taskId]: notes,
    }));
  };

  // Chấm điểm bài viết Writing theo Rubric B1
  const handleEvaluateWriting = useCallback(
    async (taskId: string, prompt: string, minWords: number, text: string) => {
      if (!text || text.trim().split(/\s+/).length < 5) {
        toast.error('Bài viết cần tối thiểu 5 từ để chấm điểm nhận xét.');
        return;
      }
      setEvaluatingTaskId(taskId);
      try {
        const res = await fetch('/api/vstep/writing-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examType: 'vnu-bac-3',
            taskId,
            prompt,
            minWords,
            text,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.evaluation) {
          throw new Error(data.error || 'Không thể chấm bài viết lúc này.');
        }
        setWritingEvals((prev) => {
          const next = { ...prev, [taskId]: data.evaluation as WritingEvalResult };
          try {
            localStorage.setItem(writingEvalsKey, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        toast.success('Đã hoàn tất chấm điểm & nhận xét bài viết!');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi chấm bài viết.';
        toast.error(msg);
      } finally {
        setEvaluatingTaskId(null);
      }
    },
    [writingEvalsKey]
  );

  // Chuyển câu hỏi / mục thi
  const handleSelectQuestion = (qId: string) => {
    setCurrentQuestionId(qId);
  };

  // Chuyển tab lọc kỹ năng
  const handleFilterSkillChange = (skill: VnuBac3SkillType | 'all') => {
    setActiveSkillFilter(skill);
    if (!exam || skill === 'all') return;

    // Tự động chuyển tới mục đầu tiên của kỹ năng đó
    const section = exam.sections.find((s) => s.type === skill);
    if (section && section.tasks.length > 0) {
      const firstTask = section.tasks[0];
      if (firstTask.questions && firstTask.questions.length > 0) {
        setCurrentQuestionId(firstTask.questions[0].id);
      } else {
        setCurrentQuestionId(firstTask.id);
      }
    }
  };

  // Xác định kỹ năng hiện tại đang xem
  const currentSkillType = useMemo((): VnuBac3SkillType => {
    if (!exam) return 'reading';
    for (const s of exam.sections) {
      for (const t of s.tasks) {
        if (
          t.id === currentQuestionId ||
          t.questions.some((q) => q.id === currentQuestionId) ||
          t.writingPrompts?.some((wp) => wp.id === currentQuestionId) ||
          t.speakingPrompts?.some((sp) => sp.id === currentQuestionId)
        ) {
          return s.type;
        }
      }
    }
    return 'reading';
  }, [exam, currentQuestionId]);

  // Xin giải thích từng câu (On-Demand Explain)
  const handleRequestExplain = async (questionId: string) => {
    try {
      const res = await fetch('/api/vnu-bac-3/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          questionId,
          sessionToken,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        return {
          questionId: data.questionId,
          correctAnswer: data.correctAnswer,
          explanationVi: data.explanationVi,
          transcript: data.transcript,
          vocabularyNotes: data.vocabularyNotes,
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Thống kê số lượng câu hỏi trắc nghiệm (Reading 25 + Listening 20 = 45 câu)
  const objectiveQuestionIds = useMemo(() => {
    if (!exam) return [];
    const ids: string[] = [];
    for (const s of exam.sections) {
      if (s.type === 'reading' || s.type === 'listening') {
        for (const t of s.tasks) {
          for (const q of t.questions) {
            ids.push(q.id);
          }
        }
      }
    }
    return ids;
  }, [exam]);

  const objectiveTotal = objectiveQuestionIds.length;
  const objectiveAnswered = objectiveQuestionIds.filter((id) => Boolean(userAnswers[id])).length;
  const objectiveUnanswered = objectiveTotal - objectiveAnswered;

  const writingCompletedCount = Object.values(writingDrafts).filter(
    (d) => d && d.trim().length > 0
  ).length;
  const speakingCompletedCount = Object.values(speakingNotes).filter(
    (n) => n && n.trim().length > 0
  ).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  // Định dạng thời gian MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent animate-spin rounded-none" />
        <p className="font-mono text-xs text-slate-500">Đang chuẩn bị phòng thi VNU Bậc 3...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-sm max-w-md w-full space-y-3 text-center shadow-xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
            Không thể mở phòng thi
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">{error}</p>
          <Link
            href="/vnu-bac-3"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-mono rounded-sm hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh mục đề thi</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* ================= ULTRA-COMPACT STICKY HEADER ================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 shadow-2xs h-10 sm:h-11">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 h-full flex items-center justify-between gap-2 min-w-0">
          {/* Trái: Nút quay lại + Quick Skill Chips */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <Link
              href="/vnu-bac-3"
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0"
              title="Quay lại danh mục đề thi"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Quick Skill Tabs trực tiếp trong header */}
            <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
              <button
                type="button"
                onClick={() => handleFilterSkillChange('reading')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-sm border transition-all cursor-pointer shrink-0 ${
                  currentSkillType === 'reading'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
                title="Kỹ năng Đọc hiểu (25 câu)"
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">1. Đọc (25c)</span>
                <span className="sm:hidden">1. Đọc</span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterSkillChange('listening')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-sm border transition-all cursor-pointer shrink-0 ${
                  currentSkillType === 'listening'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
                title="Kỹ năng Nghe hiểu (20 câu)"
              >
                <Headphones className="w-3 h-3" />
                <span className="hidden sm:inline">2. Nghe (20c)</span>
                <span className="sm:hidden">2. Nghe</span>
                <span className="sr-only">Listening</span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterSkillChange('writing')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-sm border transition-all cursor-pointer shrink-0 ${
                  currentSkillType === 'writing'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
                title="Kỹ năng Viết (2 tasks)"
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden sm:inline">3. Viết</span>
                <span className="sm:hidden">3. Viết</span>
                {writingCompletedCount > 0 && <span className="text-[10px] opacity-80">({writingCompletedCount}/2)</span>}
              </button>

              <button
                type="button"
                onClick={() => handleFilterSkillChange('speaking')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-sm border transition-all cursor-pointer shrink-0 ${
                  currentSkillType === 'speaking'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
                title="Kỹ năng Nói (2 parts)"
              >
                <Mic className="w-3 h-3" />
                <span className="hidden sm:inline">4. Nói</span>
                <span className="sm:hidden">4. Nói</span>
                {speakingCompletedCount > 0 && <span className="text-[10px] opacity-80">({speakingCompletedCount}/2)</span>}
              </button>
            </div>

            {/* Tên đề thi thu gọn trên màn hình lớn */}
            <span className="hidden xl:inline text-xs font-semibold text-slate-500 truncate min-w-0 ml-1.5">
              {exam.title}
            </span>
          </div>

          {/* Phải: Đồng hồ & Nộp bài */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Đồng hồ đếm ngược */}
            <div
              className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-sm border shrink-0 ${
                isExamMode && timeLeft < 300
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse font-bold'
                  : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 font-semibold'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isExamMode ? formatTimer(timeLeft) : formatTimer(timeSpent)}</span>
            </div>

            {/* Nút nộp bài */}
            {!result ? (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-mono text-xs font-bold rounded-sm shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>Nộp bài</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResultModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-sm shadow-xs cursor-pointer shrink-0"
                >
                  <Award className="w-3 h-3" />
                  <span>Điểm</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN EXAM LAYOUT ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-1.5 sm:p-3 grid grid-cols-1 xl:grid-cols-12 gap-2 sm:gap-3">
        {/* Cột chính: Split-Pane (Stimulus + Question / Writing / Speaking Editor) */}
        <div className="xl:col-span-9">
          <VnuSplitPane
            exam={exam}
            currentQuestionId={currentQuestionId}
            userAnswers={userAnswers}
            flaggedQuestions={flaggedQuestions}
            mode={initialMode}
            sessionToken={sessionToken}
            onAnswerSelect={handleAnswerSelect}
            onToggleFlag={handleToggleFlag}
            onNavigateQuestion={handleSelectQuestion}
            onRequestExplain={handleRequestExplain}
            isReviewMode={Boolean(result)}
            reviewQuestions={result?.reviewQuestions}
            writingDrafts={writingDrafts}
            speakingNotes={speakingNotes}
            writingEvals={writingEvals}
            evaluatingTaskId={evaluatingTaskId}
            onWritingDraftChange={handleWritingDraftChange}
            onSpeakingNotesChange={handleSpeakingNotesChange}
            onEvaluateWriting={handleEvaluateWriting}
            onOpenPalette={() => setShowMobilePalette(true)}
          />
        </div>

        {/* Cột phụ: Question Palette Matrix 4 Kỹ Năng (Hiển thị sidebar trên desktop) */}
        <div className="hidden xl:block xl:col-span-3">
          <VnuQuestionPalette
            exam={exam}
            userAnswers={userAnswers}
            flaggedQuestions={flaggedQuestions}
            currentQuestionId={currentQuestionId}
            onSelectQuestion={handleSelectQuestion}
            activeSkillFilter={activeSkillFilter}
            onFilterSkillChange={handleFilterSkillChange}
            writingDrafts={writingDrafts}
            speakingNotes={speakingNotes}
          />
        </div>
      </main>

      {/* Mobile Floating Button: Open Palette */}
      <div className="xl:hidden fixed bottom-16 right-3.5 z-30">
        <button
          type="button"
          onClick={() => setShowMobilePalette(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 dark:bg-blue-600/90 text-white font-mono text-xs font-bold rounded-full shadow-lg border border-slate-700/50 backdrop-blur-xs active:scale-95 cursor-pointer hover:bg-slate-800 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mục lục ({objectiveAnswered}/45)</span>
        </button>
      </div>

      {/* ================= MOBILE QUESTION PALETTE DRAWER ================= */}
      {showMobilePalette && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  Danh mục 45 câu &amp; tự luận
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-none font-bold">
                  {objectiveAnswered}/45 TN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-sm cursor-pointer"
                aria-label="Đóng danh mục câu hỏi"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Content */}
            <div className="p-3 overflow-y-auto flex-1">
              <VnuQuestionPalette
                exam={exam}
                userAnswers={userAnswers}
                flaggedQuestions={flaggedQuestions}
                currentQuestionId={currentQuestionId}
                onSelectQuestion={(qId) => {
                  handleSelectQuestion(qId);
                  setShowMobilePalette(false);
                }}
                activeSkillFilter={activeSkillFilter}
                onFilterSkillChange={handleFilterSkillChange}
                writingDrafts={writingDrafts}
                speakingNotes={speakingNotes}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN NỘP BÀI ================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Xác nhận nộp bài</span>
            </h3>

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <div className="text-[11px] text-slate-500">Trắc nghiệm</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {objectiveAnswered}/{objectiveTotal}
                </div>
                <div className="text-[10px] text-slate-400">R: 25, L: 20</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <div className="text-[11px] text-slate-500">Writing</div>
                <div className="text-base font-bold text-blue-600">
                  {writingCompletedCount}/2
                </div>
                <div className="text-[10px] text-slate-400">Đã soạn</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <div className="text-[11px] text-slate-500">Speaking</div>
                <div className="text-base font-bold text-indigo-600">
                  {speakingCompletedCount}/2
                </div>
                <div className="text-[10px] text-slate-400">Dàn ý</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <div className="text-[11px] text-slate-500">Gắn cờ</div>
                <div className="text-base font-bold text-amber-600">{flaggedCount}</div>
                <div className="text-[10px] text-slate-400">Xem lại</div>
              </div>
            </div>

            {objectiveUnanswered > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/40 p-2.5 border border-amber-200 dark:border-amber-800">
                Còn {objectiveUnanswered} câu trắc nghiệm chưa làm. Thang điểm 10.0 tính trên 45 câu Đọc &amp; Nghe.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={performSubmit}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-sm shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL HIỂN THỊ KẾT QUẢ BAREM (DECOUPLED SCORING) ================= */}
      {result && showResultModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header kết quả */}
            <div className="relative text-center space-y-1.5">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="absolute top-0 right-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Đóng bảng điểm"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold rounded-none uppercase ${
                  result.isPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>{result.statusLabel}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Kết quả thi VNU Test Bậc 3
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Thang điểm 10.0 (làm tròn 0.5) — ULIS ĐHQGHN
              </p>
            </div>

            {/* Thẻ Điểm Chi Tiết 3 Khối */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              {/* Reading */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <div className="text-xs text-slate-500">Reading (/10)</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.readingScore.toFixed(1)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {result.readingCorrect} / {result.readingTotal} câu
                </div>
              </div>

              {/* Listening */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <div className="text-xs text-slate-500">Listening (/10)</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.listeningScore.toFixed(1)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {result.listeningCorrect} / {result.listeningTotal} câu
                </div>
              </div>

              {/* Overall */}
              <div
                className={`p-3 border rounded-sm ${
                  result.isPassed
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                }`}
              >
                <div className="text-xs font-semibold">Điểm TB (/10)</div>
                <div className="text-2xl font-bold">
                  {result.overallScore.toFixed(1)}
                </div>
                <div className="text-[11px] font-bold mt-0.5">
                  {result.isPassed ? 'ĐẠT B1' : 'CHƯA ĐẠT'}
                </div>
              </div>
            </div>

            {/* Thông báo Writing & Speaking */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-sm text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold text-blue-800 dark:text-blue-300">
                Writing &amp; Speaking:
              </div>
              <p>
                Đã lưu {writingCompletedCount}/2 bài viết và {speakingCompletedCount}/2 dàn ý nói. Bạn có thể xem bài mẫu tham khảo để tự đối chiếu.
              </p>
            </div>

            {/* Chi tiết điều kiện đạt / lý do chưa đạt */}
            {result.failureReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-sm text-xs font-mono text-rose-800 dark:text-rose-300">
                <strong>Lý do chưa đạt:</strong> {result.failureReason}
              </div>
            )}

            {/* Phân rã độ chính xác từng Part */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                Chi tiết trắc nghiệm từng phần:
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {Object.entries(result.partBreakdown).map(([k, p]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[280px]">
                      {p.label}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {p.correct}/{p.total} ({p.accuracy}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer hành động */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/vnu-bac-3"
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 rounded-sm hover:bg-slate-100"
              >
                Danh mục đề
              </Link>
              <button
                type="button"
                onClick={() => {
                  setReviewMode(true);
                  setShowResultModal(false);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-sm cursor-pointer shadow-xs"
              >
                Xem lại bài làm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
