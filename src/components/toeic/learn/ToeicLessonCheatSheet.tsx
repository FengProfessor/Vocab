'use client';

import React from 'react';
import {
  Printer,
  Zap,
  CheckSquare,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import type { TheoryLesson } from '@/data/toeic/theory/types';
import { getCheatSheetByLessonId } from '@/data/toeic/theory/cheatsheets';

export interface ToeicLessonCheatSheetProps {
  lesson: TheoryLesson;
  className?: string;
}

export function ToeicLessonCheatSheet({ lesson, className = '' }: ToeicLessonCheatSheetProps) {
  const cheatSheet = getCheatSheetByLessonId(lesson.id);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!cheatSheet) {
    return (
      <div className="p-8 text-center font-mono text-xs text-slate-500">
        Đang cập nhật bản tóm tắt cấp tốc cho bài học này.
      </div>
    );
  }

  return (
    <div
      className={`rounded-sm border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0 ${className}`}
    >
      {/* Header with Print CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              Cheat Sheet 60 Giây
            </span>
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
              Mục Tiêu: {cheatSheet.targetScore}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase mt-1">
            {lesson.id} · {cheatSheet.title}
          </h2>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-xs font-semibold transition cursor-pointer print:hidden shadow-2xs"
          title="In hoặc lưu dạng PDF để ôn trước giờ thi"
        >
          <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span>In / Lưu PDF</span>
        </button>
      </div>

      {/* 1. Core Formula Banner */}
      <div className="rounded-xs border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 sm:p-4 space-y-1">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-amber-900 dark:text-amber-300">
          <Zap className="h-4 w-4 text-amber-600" />
          <span>Công Thức Cốt Lõi (Core Syntax Pattern)</span>
        </div>
        <div className="font-mono text-sm sm:text-base font-black text-slate-950 dark:text-amber-100 bg-white dark:bg-slate-900 p-2.5 rounded-xs border border-amber-200 dark:border-amber-900/60 overflow-x-auto">
          {cheatSheet.formulaSummary}
        </div>
      </div>

      {/* 2-Column Grid: Core Rules & Speed Tricks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Rules */}
        <div className="rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            <span>3 Quy Tắc Bất Di Bất Dịch</span>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {cheatSheet.coreRules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-mono font-bold text-emerald-600 shrink-0">#{idx + 1}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Speed Tricks (Mẹo 5 Giây) */}
        <div className="rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Mẹo Bấm Giờ 5 Giây (Speed Tricks)</span>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {cheatSheet.speedTricks.map((trick, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-mono font-bold text-amber-500 shrink-0">⚡</span>
                <span>{trick}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. Top ETS Traps & Antidotes */}
      <div className="rounded-xs border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-4 space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-rose-900 dark:text-rose-300 border-b border-rose-200 dark:border-rose-900/60 pb-2">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>Top Bẫy Đề Thi ETS Thường Gặp & Cách Giải Độc</span>
        </div>

        <ul className="space-y-2 text-xs sm:text-sm text-rose-950 dark:text-rose-200 leading-relaxed">
          {cheatSheet.commonTraps.map((trap, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-mono font-bold text-rose-600 shrink-0">✕</span>
              <span>{trap}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. In-Exam Checklist */}
      <div className="rounded-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
          <FileCheck className="h-4 w-4 text-blue-600" />
          <span>Quy Trình 3 Bước Xử Lý Nhanh Trong Phòng Thi</span>
        </div>

        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
          {cheatSheet.examChecklist.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
