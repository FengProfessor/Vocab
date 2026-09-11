'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Flag,
  Send,
  Loader2,
  X,
} from 'lucide-react';

export interface SubmitConfirmModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function SubmitConfirmModal({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: SubmitConfirmModalProps) {
  if (!isOpen) return null;

  const percentComplete =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in-0 duration-150"
    >
      <div className="w-full max-w-lg rounded-sm border border-slate-200 bg-white p-5 sm:p-6 shadow-none dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xs border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="submit-modal-title"
                className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white"
              >
                Xác nhận nộp bài thi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kiểm tra lại số lượng câu hỏi trước khi chính thức chấm điểm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xs p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between font-mono tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Tiến độ làm bài</span>
            <span>{percentComplete}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-slate-900 transition-all duration-200 dark:bg-slate-100"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Statistics Grid (3 Columns Monospace) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Answered */}
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-xs font-semibold">Đã làm</span>
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {answeredCount}
            </p>
            <span className="font-mono text-[10px] text-slate-500">
              /{totalQuestions} câu
            </span>
          </div>

          {/* Unanswered */}
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 mb-1">
              <HelpCircle className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              <span className="font-mono text-xs font-semibold">Chưa làm</span>
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {unansweredCount}
            </p>
            <span className="font-mono text-[10px] text-slate-500">câu trống</span>
          </div>

          {/* Flagged */}
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 mb-1">
              <Flag className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
              <span className="font-mono text-xs font-semibold">Gắn cờ</span>
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {flaggedCount}
            </p>
            <span className="font-mono text-[10px] text-slate-500">câu xem lại</span>
          </div>
        </div>

        {/* Warning if there are unanswered questions */}
        {answeredCount === 0 ? (
          <div className="flex items-start gap-2.5 rounded-sm border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Bạn chưa chọn đáp án cho câu nào (0/{totalQuestions}):</p>
              <p className="leading-relaxed">
                Nếu nộp bài lúc này, bài thi sẽ được tính 0 câu đúng và nhận điểm sàn tối thiểu <strong>10/990</strong> theo chuẩn thang điểm ETS (5 Listening + 5 Reading).
              </p>
            </div>
          </div>
        ) : unansweredCount > 0 ? (
          <div className="flex items-start gap-2.5 rounded-sm border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Lưu ý câu chưa trả lời:</p>
              <p className="leading-relaxed">
                Bạn vẫn còn <strong>{unansweredCount}</strong> câu chưa chọn đáp án. Bài thi TOEIC
                không trừ điểm câu sai, bạn nên chọn phương án cho tất cả câu hỏi trước khi nộp.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Bạn đã hoàn thành đầy đủ tất cả câu hỏi.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-sm border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
          >
            Tiếp tục làm bài
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-slate-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-none hover:bg-slate-800 transition dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang chấm điểm...</span>
              </>
            ) : answeredCount === 0 ? (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Nộp bài trống (0 câu)</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Nộp bài ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
