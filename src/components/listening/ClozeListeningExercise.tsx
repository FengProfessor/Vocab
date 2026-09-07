'use client';

import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  Keyboard,
  ListFilter,
} from 'lucide-react';
import { validateClozeAnswer, saveListeningAttempt, getListeningAttempt } from '@/lib/listening';
import type { ClozeItem } from '@/types/listening';

export interface ClozeListeningExerciseProps {
  videoId?: string;
  items: ClozeItem[];
  onSeekToTimestamp: (timestamp: number) => void;
  onComplete?: (score: number, total: number) => void;
  className?: string;
}

export const ClozeListeningExercise: React.FC<ClozeListeningExerciseProps> = ({
  videoId,
  items,
  onSeekToTimestamp,
  onComplete,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedInput, setTypedInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'type' | 'select'>('type');
  const [showHint, setShowHint] = useState(false);
  const [checkedState, setCheckedState] = useState<Record<number, { isCorrect: boolean; userAnswer: string }>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  if (!currentItem) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500">Video này chưa có bài tập điền từ.</p>
      </div>
    );
  }

  const currentStatus = checkedState[currentIndex];
  const isAnswered = !!currentStatus;

  // Helper to persist cloze attempt to localStorage and notify parent
  const saveAttemptIfComplete = (finalChecked: Record<number, { isCorrect: boolean; userAnswer: string }>) => {
    let correctCount = 0;
    for (const val of Object.values(finalChecked)) {
      if (val.isCorrect) correctCount++;
    }
    if (videoId) {
      const existing = getListeningAttempt(videoId);
      const quizScore = existing?.quizScore || 0;
      const quizTotal = existing?.quizTotal || 0;
      const totalItemsCombined = totalItems + quizTotal;
      const totalCorrect = correctCount + quizScore;
      const percentScore = totalItemsCombined > 0
        ? Math.round((totalCorrect / totalItemsCombined) * 100)
        : Math.round((correctCount / totalItems) * 100);

      saveListeningAttempt({
        videoId,
        completedAt: new Date().toISOString(),
        clozeScore: correctCount,
        clozeTotal: totalItems,
        quizScore,
        quizTotal,
        percentScore,
      });
    }
    onComplete?.(correctCount, totalItems);
  };

  // Handle checking answer
  const handleCheckAnswer = () => {
    if (isAnswered) return;

    const answerToValidate = inputMode === 'type' ? typedInput : selectedOption || '';
    if (!answerToValidate.trim()) return;

    const isCorrect = validateClozeAnswer(answerToValidate, currentItem.blankWord);

    const nextChecked = {
      ...checkedState,
      [currentIndex]: {
        isCorrect,
        userAnswer: answerToValidate.trim(),
      },
    };
    setCheckedState(nextChecked);

    // If this was the last question, calculate results
    if (Object.keys(nextChecked).length === totalItems) {
      setIsFinished(true);
      saveAttemptIfComplete(nextChecked);
    }
  };

  // Next question
  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setTypedInput(checkedState[nextIdx]?.userAnswer || '');
      setSelectedOption(checkedState[nextIdx]?.userAnswer || null);
      setShowHint(false);
    } else {
      setIsFinished(true);
      if (Object.keys(checkedState).length === totalItems) {
        saveAttemptIfComplete(checkedState);
      }
    }
  };

  // Previous question
  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setTypedInput(checkedState[prevIdx]?.userAnswer || '');
      setSelectedOption(checkedState[prevIdx]?.userAnswer || null);
      setShowHint(false);
    }
  };

  // Reset exercise
  const handleRetry = () => {
    setCheckedState({});
    setCurrentIndex(0);
    setTypedInput('');
    setSelectedOption(null);
    setShowHint(false);
    setIsFinished(false);
  };

  // Render masked sentence with highlighted blank
  const renderSentenceWithBlank = () => {
    const parts = currentItem.sentence.split('{{blank}}');
    return (
      <p className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100 sm:text-lg">
        {parts[0]}
        <span
          className={`inline-block mx-1.5 min-w-[90px] border-b-2 px-2.5 py-0.5 text-center font-bold transition-all ${
            isAnswered
              ? currentStatus.isCorrect
                ? 'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'border-rose-500 bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200'
              : 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200'
          }`}
        >
          {isAnswered ? (
            currentStatus.isCorrect ? (
              currentItem.blankWord
            ) : (
              <span className="line-through">{currentStatus.userAnswer || '...'}</span>
            )
          ) : inputMode === 'type' ? (
            typedInput || '____'
          ) : (
            selectedOption || '____'
          )}
        </span>
        {parts[1] || ''}
      </p>
    );
  };

  // If finished, show scorecard
  if (isFinished) {
    let score = 0;
    for (const item of Object.values(checkedState)) {
      if (item.isCorrect) score++;
    }
    const percent = Math.round((score / totalItems) * 100);

    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 ${className}`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <Trophy className="h-9 w-9" />
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          Hoàn thành bài tập điền từ!
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kết quả rèn luyện khả năng bắt âm và chính tả từ vựng
        </p>

        <div className="my-6 flex items-center justify-center gap-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-xs font-semibold text-slate-400">Điểm số</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {score} / {totalItems}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-xs font-semibold text-slate-400">Tỷ lệ đúng</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {percent}%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Luyện lại lần nữa</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}>
      {/* Exercise Progress Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            {currentIndex + 1}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Câu {currentIndex + 1} / {totalItems}
          </p>
        </div>

        {/* Input Mode Switcher (Typing vs Multiple Choice) */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            disabled={isAnswered}
            onClick={() => setInputMode('type')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              inputMode === 'type'
                ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Gõ từ</span>
          </button>
          {currentItem.options && currentItem.options.length > 0 && (
            <button
              type="button"
              disabled={isAnswered}
              onClick={() => setInputMode('select')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                inputMode === 'select'
                  ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Trắc nghiệm</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio Replay Button */}
      <div className="my-4">
        <button
          type="button"
          onClick={() => onSeekToTimestamp(currentItem.timestamp)}
          className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-95 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
        >
          <Volume2 className="h-4 w-4" />
          <span>🔊 Nghe câu này trong video</span>
        </button>
      </div>

      {/* Sentence with Cloze Blank */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
        {renderSentenceWithBlank()}
      </div>

      {/* Input / Selection Area */}
      <div className="my-5">
        {inputMode === 'type' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Nhập từ còn thiếu:
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                disabled={isAnswered}
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckAnswer();
                }}
                placeholder="Gõ từ nghe được..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {!isAnswered && (
                <button
                  type="button"
                  disabled={!typedInput.trim()}
                  onClick={handleCheckAnswer}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
                >
                  Kiểm tra
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Chọn từ đúng:
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {currentItem.options?.map((opt) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => {
                      setSelectedOption(opt);
                    }}
                    className={`rounded-xl border p-2.5 text-center text-sm font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {!isAnswered && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleCheckAnswer}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
                >
                  Kiểm tra
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint & Feedback Banner */}
      <div className="space-y-3">
        {/* Hint toggle */}
        {!isAnswered && currentItem.hintVi && (
          <div>
            {showHint ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Gợi ý: {currentItem.hintVi}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Xem gợi ý nghĩa tiếng Việt</span>
              </button>
            )}
          </div>
        )}

        {/* Immediate Feedback Card */}
        {isAnswered && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
              currentStatus.isCorrect
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
            }`}
          >
            {currentStatus.isCorrect ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold">
                {currentStatus.isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
              </p>
              {!currentStatus.isCorrect && (
                <p className="mt-0.5">
                  Đáp án đúng là: <strong className="underline">{currentItem.blankWord}</strong>
                </p>
              )}
              {currentItem.hintVi && (
                <p className="mt-1 text-[11px] opacity-85">
                  Giải nghĩa: {currentItem.hintVi}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>{currentIndex < totalItems - 1 ? 'Tiếp' : 'Tổng kết'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
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
          {items.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-4 bg-indigo-600'
                  : checkedState[idx]
                  ? checkedState[idx].isCorrect
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={currentIndex === totalItems - 1 && !isAnswered}
          onClick={handleNext}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 dark:hover:text-slate-200"
        >
          {currentIndex === totalItems - 1 ? 'Xem kết quả' : 'Câu tiếp →'}
        </button>
      </div>
    </div>
  );
};
