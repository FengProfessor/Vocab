'use client';

import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { TrapAlert } from '@/data/toeic/theory/types';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';

export interface ToeicTrapAlertProps {
  trap: TrapAlert;
  className?: string;
}

export function ToeicTrapAlert({ trap, className = '' }: ToeicTrapAlertProps) {
  const { trapName, trapLevel, trapDescription, distractorExample, antidote } = trap;

  const levelBadge = {
    high_distractor: {
      text: 'Bẫy Hiểm / Tần Suất Cao',
      className: 'bg-rose-600 text-white dark:bg-rose-700 dark:text-white',
    },
    subtle: {
      text: 'Bẫy Tinh Vi / Dễ Nhầm',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800',
    },
    common: {
      text: 'Bẫy Phổ Biến ETS',
      className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
    },
  }[trapLevel] || {
    text: 'Cảnh Báo Bẫy ETS',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
  };

  return (
    <section
      aria-label={`Bẫy đề thi: ${trapName}`}
      className={`rounded-sm border border-rose-200/90 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20 p-4 transition-colors space-y-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs ${levelBadge.className}`}
            >
              {levelBadge.text}
            </span>
            <h4 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wide text-rose-950 dark:text-rose-200">
              {trapName}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {trapDescription}
          </p>
        </div>
      </div>

      {/* Distractor Dissection Card */}
      {distractorExample && (
        <div className="rounded-xs border border-rose-200 dark:border-rose-900/80 bg-white dark:bg-slate-900/90 p-3 text-xs sm:text-sm space-y-2.5">
          {/* Question Prompt */}
          <div className="font-medium text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Ví dụ bẫy thực tế:
            </span>
            <div className="font-sans leading-relaxed">
              <ExamInteractiveText text={distractorExample.prompt} enabled={true} />
            </div>
          </div>

          {/* Side by side comparison: Incorrect vs Correct */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Incorrect distractor */}
            <div className="rounded-xs border border-rose-300/70 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/30 p-2.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Phương án bẫy (Sai)</span>
              </div>
              <div className="line-through font-mono text-xs font-semibold text-rose-800 dark:text-rose-300 mb-1">
                <ExamInteractiveText text={distractorExample.incorrectChoice} enabled={true} />
              </div>
              <div className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-400 leading-normal">
                {distractorExample.whyDistractorFails}
              </div>
            </div>

            {/* Correct choice */}
            <div className="rounded-xs border border-emerald-300/70 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-2.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Phương án chính xác (Đúng)</span>
              </div>
              <div className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                <ExamInteractiveText text={distractorExample.correctChoice} enabled={true} />
              </div>
              <div className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 leading-normal">
                Khớp đúng cấu trúc ngữ pháp và ngữ cảnh ETS yêu cầu.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Antidote (Phương pháp hóa giải bẫy) */}
      {antidote && (
        <div className="flex items-start gap-2.5 rounded-xs border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 text-xs sm:text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mr-1.5">
              Chiến thuật hóa giải:
            </span>
            {antidote}
          </div>
        </div>
      )}
    </section>
  );
}
