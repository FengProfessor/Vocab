'use client';

import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Trophy,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { formatTime, saveListeningAttempt, getListeningAttempt } from '@/lib/listening';
import type { ComprehensionQuestion } from '@/types/listening';

export interface ComprehensionQuizProps {
  videoId: string;
  questions: ComprehensionQuestion[];
  onSeekToTimestamp: (timestamp: number) => void;
  onComplete?: (score: number, total: number) => void;
  className?: string;
}

export const ComprehensionQuiz: React.FC<ComprehensionQuizProps> = ({
  videoId,
  questions,
  onSeekToTimestamp,
  onComplete,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const hasSavedAttempt = useRef(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500">Video này chưa có câu hỏi trắc nghiệm nghe hiểu.</p>
      </div>
    );
  }

  const isSubmitted = !!submittedAnswers[currentIndex];
  const userSelected = selectedAnswers[currentIndex];

  // Helper to persist attempt if not already saved
  const persistAttempt = (answers: Record<number, number>) => {
    if (hasSavedAttempt.current) return;
    hasSavedAttempt.current = true;

    let score = 0;
    for (let i = 0; i < totalQuestions; i++) {
      if (answers[i] === questions[i].correctIndex) {
        score++;
      }
    }

    const existing = getListeningAttempt(videoId);
    const clozeScore = existing?.clozeScore || 0;
    const clozeTotal = existing?.clozeTotal || 0;
    const totalItemsCombined = totalQuestions + clozeTotal;
    const totalCorrect = score + clozeScore;
    const percentScore = totalItemsCombined > 0
      ? Math.round((totalCorrect / totalItemsCombined) * 100)
      : Math.round((score / totalQuestions) * 100);

    saveListeningAttempt({
      videoId,
      completedAt: new Date().toISOString(),
      clozeScore,
      clozeTotal,
      quizScore: score,
      quizTotal: totalQuestions,
      percentScore,
    });

    onComplete?.(score, totalQuestions);
  };

  // Handle selecting an option
  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: index }));
  };

  // Submit answer for current question
  const handleSubmitCurrent = () => {
    if (userSelected === undefined || isSubmitted) return;

    const nextSubmitted = { ...submittedAnswers, [currentIndex]: true };
    setSubmittedAnswers(nextSubmitted);

    // If all questions are now submitted
    if (Object.keys(nextSubmitted).length === totalQuestions) {
      setIsFinished(true);
      persistAttempt(selectedAnswers);
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      if (Object.keys(submittedAnswers).length === totalQuestions) {
        persistAttempt(selectedAnswers);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Retry quiz
  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    hasSavedAttempt.current = false;
  };

  // Summary scorecard when finished
  if (isFinished) {
    let score = 0;
    for (let i = 0; i < totalQuestions; i++) {
      if (selectedAnswers[i] === questions[i].correctIndex) {
        score++;
      }
    }
    const percent = Math.round((score / totalQuestions) * 100);

    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 ${className}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <Trophy className="h-9 w-9" />
        </div>

        <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          Kết quả Trắc nghiệm nghe hiểu
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Đánh giá mức độ tiếp thu và hiểu nội dung hội thoại
        </p>

        <div className="my-6 flex items-center justify-center gap-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-xs font-semibold text-slate-400">Câu đúng</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {score} / {totalQuestions}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-xs font-semibold text-slate-400">Tỷ lệ chính xác</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {percent}%
            </p>
          </div>
        </div>

        {/* Detailed review items */}
        <div className="w-full text-left space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Xem lại chi tiết từng câu:
          </h4>
          {questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correctIndex;
            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Câu {idx + 1}: {q.question}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSeekToTimestamp(q.timestampSeek)}
                    className="flex items-center gap-1 font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>⏱ {formatTime(q.timestampSeek)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Làm lại bài trắc nghiệm</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}
    >
      {/* Quiz Progress Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            {currentIndex + 1}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Câu hỏi {currentIndex + 1} / {totalQuestions}
          </p>
        </div>

        {/* Clue Seek Link in Video */}
        <button
          type="button"
          onClick={() => onSeekToTimestamp(currentQuestion.timestampSeek)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900"
          title="Tua video tới đoạn chứa câu trả lời"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>⏱ Xem lại đoạn này ({formatTime(currentQuestion.timestampSeek)})</span>
        </button>
      </div>

      {/* Question Title */}
      <div className="my-4">
        <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-white sm:text-lg">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Options List */}
      <div className="space-y-2.5">
        {currentQuestion.options.map((option, optIdx) => {
          const isSelected = userSelected === optIdx;
          const isCorrectOption = optIdx === currentQuestion.correctIndex;

          let optionStyle =
            'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200';

          if (isSubmitted) {
            if (isCorrectOption) {
              optionStyle =
                'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-200';
            } else if (isSelected && !isCorrectOption) {
              optionStyle =
                'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 dark:bg-rose-950/50 dark:text-rose-200';
            } else {
              optionStyle = 'opacity-50 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800';
            }
          } else if (isSelected) {
            optionStyle =
              'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-white';
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleSelectOption(optIdx)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${optionStyle}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {String.fromCharCode(65 + optIdx)}
              </span>
              <span className="flex-1 leading-relaxed">{option}</span>
              {isSubmitted && isCorrectOption && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              {isSubmitted && isSelected && !isCorrectOption && (
                <XCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Check button (before submit) */}
      {!isSubmitted && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={userSelected === undefined}
            onClick={handleSubmitCurrent}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
          >
            Kiểm tra đáp án
          </button>
        </div>
      )}

      {/* Explanation Banner (after submit) */}
      {isSubmitted && (
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                <HelpCircle className="h-4 w-4" />
                <span>Giải thích chi tiết:</span>
              </div>
              <p className="leading-relaxed text-indigo-950/90 dark:text-indigo-200">
                {currentQuestion.explanation}
              </p>
              <button
                type="button"
                onClick={() => onSeekToTimestamp(currentQuestion.timestampSeek)}
                className="mt-2 inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>⏱ Nghe lại đoạn chứng cứ ({formatTime(currentQuestion.timestampSeek)})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>{currentIndex < totalQuestions - 1 ? 'Câu tiếp' : 'Tổng kết'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer step indicators */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={handlePrev}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 dark:hover:text-slate-200"
        >
          ← Câu trước
        </button>

        <div className="flex items-center gap-1">
          {questions.map((q, idx) => {
            const isDone = submittedAnswers[idx];
            const isCorrect = selectedAnswers[idx] === q.correctIndex;
            return (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-4 bg-indigo-600'
                    : isDone
                    ? isCorrect
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentIndex === totalQuestions - 1 && !isSubmitted}
          onClick={handleNext}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 dark:hover:text-slate-200"
        >
          {currentIndex === totalQuestions - 1 ? 'Xem kết quả' : 'Câu tiếp →'}
        </button>
      </div>
    </div>
  );
};
