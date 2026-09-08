'use client';

import React from 'react';
import { Pause, Play, LogOut, Clock, ShieldCheck } from 'lucide-react';

export interface ExamPauseModalProps {
  isOpen: boolean;
  formattedTime: string;
  onResume: () => void;
  onSaveAndExit: () => void;
}

export function ExamPauseModal({
  isOpen,
  formattedTime,
  onResume,
  onSaveAndExit,
}: ExamPauseModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in-0 duration-150"
    >
      <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-6 shadow-none dark:border-slate-800 dark:bg-slate-900 text-center space-y-5">
        {/* Top Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xs border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
          <Pause className="h-6 w-6" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h2
            id="pause-modal-title"
            className="font-mono text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white"
          >
            Bài thi đang tạm dừng
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Đồng hồ đã ngưng đếm. Toàn bộ nội dung câu hỏi phía sau đã được ẩn để bảo đảm tính khách quan.
          </p>
        </div>

        {/* Time remaining card */}
        <div className="flex items-center justify-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-3 font-mono dark:border-slate-700 dark:bg-slate-800/50">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">Thời gian còn lại:</span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
            {formattedTime}
          </span>
        </div>

        {/* Info notice */}
        <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-2.5 text-left text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
          <span>Bài làm của bạn đã được tự động lưu an toàn vào bộ nhớ máy.</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onSaveAndExit}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Lưu & Thoát</span>
          </button>

          <button
            type="button"
            onClick={onResume}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-none hover:bg-slate-800 transition dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Tiếp tục làm bài</span>
          </button>
        </div>
      </div>
    </div>
  );
}
