'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { TheoryCheckpoint } from '@/data/toeic/theory/types';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';

export interface ToeicQuickQuizProps {
  checkpoints: TheoryCheckpoint[];
  lessonId: string;
  onCheckpointAnswer?: (checkpointId: string, isCorrect: boolean) => void;
  onAllCompleted?: (score: number, total: number) => void;
  className?: string;
}

interface UserAnswerState {
  selected: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  answeredAt: string;
}

export function ToeicQuickQuiz({
  checkpoints,
  lessonId,
  onCheckpointAnswer,
  onAllCompleted,
  className = '',
}: ToeicQuickQuizProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerState>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  const storageKey = `lingo_toeic_theory_quiz_${lessonId}`;

  // Hydrate quiz state safely on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setUserAnswers(parsed);
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, [storageKey]);

  // Check if all are completed
  const totalQuestions = checkpoints.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleSelectOption = useCallback(
    (checkpoint: TheoryCheckpoint, optionKey: 'A' | 'B' | 'C' | 'D') => {
      // Prevent re-answering once answered
      if (userAnswers[checkpoint.id]) return;

      const isCorrect = optionKey === checkpoint.correctAnswer;
      const newAnswer: UserAnswerState = {
        selected: optionKey,
        isCorrect,
        answeredAt: new Date().toISOString(),
      };

      const updated = {
        ...userAnswers,
        [checkpoint.id]: newAnswer,
      };

      setUserAnswers(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Ignore localStorage write errors
      }

      onCheckpointAnswer?.(checkpoint.id, isCorrect);

      if (Object.keys(updated).length === totalQuestions) {
        const totalCorrect = Object.values(updated).filter(a => a.isCorrect).length;
        onAllCompleted?.(totalCorrect, totalQuestions);
      }
    },
    [userAnswers, storageKey, totalQuestions, onCheckpointAnswer, onAllCompleted]
  );

  const toggleExplanation = (checkpointId: string) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [checkpointId]: !prev[checkpointId],
    }));
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setExpandedExplanations({});
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  };

  if (!checkpoints || checkpoints.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Khối câu hỏi kiểm tra nhanh lý thuyết"
      className={`rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-6 space-y-6 ${className}`}
    >
      {/* Quiz Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xs bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Checkpoint Thực Hành Ngay
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm tra mức độ thấu hiểu quy tắc và kỹ năng giải đề tức thì
            </p>
          </div>
        </div>

        {/* Progress Badge & Reset */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {mounted && (
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
              Đã làm: {answeredCount}/{totalQuestions} câu
            </span>
          )}
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleResetQuiz}
              className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Làm lại các câu hỏi của bài này"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Checkpoints List */}
      <div className="space-y-6">
        {checkpoints.map((checkpoint, qIndex) => {
          const answer = mounted ? userAnswers[checkpoint.id] : undefined;
          const isAnswered = !!answer;
          const hasSelectedCorrect = isAnswered && answer.isCorrect;

          return (
            <div
              key={checkpoint.id}
              className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-colors space-y-4"
            >
              {/* Question Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    Câu {checkpoint.order || qIndex + 1}
                  </span>
                  {checkpoint.timeTargetSeconds && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <Clock className="h-3 w-3" />
                      Mục tiêu: {checkpoint.timeTargetSeconds}s
                    </span>
                  )}
                </div>

                {isAnswered && (
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 ${
                      hasSelectedCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                    }`}
                  >
                    {hasSelectedCorrect ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đúng (+10đ)
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        Chưa chính xác
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Optional Passage */}
              {checkpoint.passage && (
                <div className="rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-3 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  <ExamInteractiveText text={checkpoint.passage} enabled={true} />
                </div>
              )}

              {/* Optional Audio Stimulus */}
              {checkpoint.audioUrl && (
                <div className="flex items-center gap-2 p-2 rounded-xs bg-slate-100 dark:bg-slate-800 text-xs">
                  <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <audio controls src={checkpoint.audioUrl} className="w-full h-8" />
                </div>
              )}

              {/* Optional Image */}
              {checkpoint.imageUrl && (
                <div className="overflow-hidden rounded-xs border border-slate-200 dark:border-slate-800 max-w-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={checkpoint.imageUrl}
                    alt={`Stimulus for question ${checkpoint.order}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Question Prompt */}
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                <ExamInteractiveText text={checkpoint.prompt} enabled={true} />
              </div>

              {/* Options Grid */}
              <div
                role="radiogroup"
                aria-label={`Các phương án cho câu ${checkpoint.order || qIndex + 1}`}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
              >
                {checkpoint.options.map(option => {
                  const isSelected = answer?.selected === option.key;
                  const isOptionCorrect = option.key === checkpoint.correctAnswer;

                  let buttonStyles =
                    'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60';

                  if (isAnswered) {
                    if (isOptionCorrect) {
                      buttonStyles =
                        'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/50';
                    } else if (isSelected && !isOptionCorrect) {
                      buttonStyles =
                        'border-rose-400 bg-rose-50/90 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 line-through ring-1 ring-rose-400/50';
                    } else {
                      buttonStyles =
                        'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75';
                    }
                  }

                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(checkpoint, option.key)}
                      className={`flex items-start gap-2.5 p-3 rounded-xs border text-left text-xs sm:text-sm transition-all select-none ${
                        !isAnswered ? 'cursor-pointer' : ''
                      } ${buttonStyles}`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-xs font-mono text-xs font-bold border ${
                          isAnswered && isOptionCorrect
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isAnswered && isSelected && !isOptionCorrect
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {option.key}
                      </span>
                      <div className="flex-1 leading-normal">
                        <ExamInteractiveText text={option.text} enabled={true} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Post-Answer Feedback & Detailed Explanation */}
              {isAnswered && (
                <div className="mt-3 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {/* Instant Feedback Banner */}
                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-xs border text-xs font-mono font-bold ${
                      hasSelectedCorrect
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {hasSelectedCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Chính xác! Đáp án đúng là {checkpoint.correctAnswer}.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Chưa chính xác. Đáp án đúng là {checkpoint.correctAnswer}.</span>
                      </>
                    )}
                  </div>

                  {/* Trap Signal Warning if incorrect option was selected */}
                  {!hasSelectedCorrect && checkpoint.trapSignal && (
                    <div className="flex items-start gap-2 rounded-xs border border-rose-200 bg-rose-50/80 dark:border-rose-900/70 dark:bg-rose-950/30 p-2.5 text-xs text-rose-900 dark:text-rose-200">
                      <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono font-bold uppercase tracking-wide mr-1">
                          Cảnh báo bẫy ETS:
                        </span>
                        {checkpoint.trapSignal}
                      </div>
                    </div>
                  )}

                  {/* Toggle Explanation Button */}
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleExplanation(checkpoint.id)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>
                        {expandedExplanations[checkpoint.id] ? 'Ẩn giải thích' : 'Xem giải thích chi tiết'}
                      </span>
                    </button>
                  </div>

                  {/* Vietnamese Explanation (Never wrapped in ExamInteractiveText per IT-7.5) */}
                  {expandedExplanations[checkpoint.id] && (
                    <div className="rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 text-xs sm:text-sm space-y-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Giải thích chi tiết:</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                        {checkpoint.explanationVi}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {isAllAnswered && (
        <div className="rounded-sm border border-emerald-300/80 bg-emerald-50/80 dark:border-emerald-800/80 dark:bg-emerald-950/40 p-4 text-center space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300">
            ★ Kết quả kiểm tra Checkpoint ★
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-200 tabular-nums">
            {correctCount} / {totalQuestions} câu đúng ({Math.round((correctCount / totalQuestions) * 100)}%)
          </div>
          <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 max-w-md mx-auto">
            {correctCount === totalQuestions
              ? 'Xuất sắc! Bạn đã nắm vững 100% kiến thức và chiến thuật của bài học này.'
              : 'Hãy xem lại các câu làm sai và bẫy đề thi trước khi chuyển sang luyện tập thực chiến.'}
          </p>
        </div>
      )}
    </section>
  );
}
