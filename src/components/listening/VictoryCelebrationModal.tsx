'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  Pencil,
  CheckSquare,
  ArrowRight,
  RotateCcw,
  Library,
  X,
  Zap,
} from 'lucide-react';
import { Celebration } from '@/components/gamification/Celebration';

export interface VictoryCelebrationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  clozeScore: number;
  clozeTotal: number;
  quizScore: number;
  quizTotal: number;
  nextVideoId?: string;
  onRetry?: () => void;
}

export function VictoryCelebrationModal({
  isOpen,
  onClose,
  clozeScore,
  clozeTotal,
  quizScore,
  quizTotal,
  nextVideoId,
  onRetry,
}: VictoryCelebrationModalProps) {
  // Listen for Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const combinedScore = clozeScore + quizScore;
  const combinedTotal = clozeTotal + quizTotal;
  const percentScore =
    combinedTotal > 0 ? Math.round((combinedScore / combinedTotal) * 100) : 0;

  const nextVideoHref = nextVideoId
    ? `/practice/listening/${nextVideoId}`
    : '/practice/listening';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Confetti blast fireworks */}
      <Celebration trigger={isOpen} intensity="epic" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 sm:p-7 text-center">
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Celebratory Mascot / Trophy Header with animated glow */}
        <div className="mx-auto mb-4 relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 opacity-30 blur-lg animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg ring-4 ring-amber-200/50 dark:ring-amber-900/40">
            <Trophy className="h-8 w-8 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Modal Title */}
        <h2
          id="victory-celebration-title"
          className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl"
        >
          Xuất sắc hoàn thành!
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          Bạn đã hoàn thành trọn vẹn cả bài tập điền từ và trắc nghiệm nghe hiểu!
        </p>

        {/* +50 XP Reward Card with Glowing Style */}
        <div className="my-5 relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 text-center shadow-md dark:border-amber-500/30 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-orange-950/30">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              +50 XP
            </span>
          </div>
          <p className="mt-1.5 text-xs font-semibold text-amber-900/90 dark:text-amber-200">
            Chúc mừng bạn đã hoàn thành bài luyện nghe! +50 XP đã được cộng vào tài khoản.
          </p>
        </div>

        {/* Combined Accuracy & Breakdown Stats Grid */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-800/40 text-left">
          {/* Combined Score & Percentage */}
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tổng điểm đạt được
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {clozeScore + quizScore} / {clozeTotal + quizTotal}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Độ chính xác
              </span>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {percentScore}%
              </div>
            </div>
          </div>

          {/* Distinct Cloze & Quiz Breakdown */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* Cloze Breakdown */}
            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-800">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <Pencil className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Điền từ (Cloze)
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {clozeScore}/{clozeTotal} từ đúng
                </div>
              </div>
            </div>

            {/* Quiz Breakdown */}
            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-800">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                <CheckSquare className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Trắc nghiệm (Quiz)
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {quizScore}/{quizTotal} câu đúng
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary Action: Tiếp tục video kế tiếp */}
          <Link
            href={nextVideoHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <span>Tiếp tục video kế tiếp</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Secondary Actions: Làm lại bài tập & Về thư viện */}
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Làm lại bài tập</span>
              </button>
            )}

            <Link
              href="/practice/listening"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Library className="h-3.5 w-3.5" />
              <span>Về thư viện</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
