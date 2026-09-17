'use client';

import React from 'react';
import Link from 'next/link';
import { Play, ArrowRight, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';
import type { BridgeToPractice } from '@/data/toeic/theory/types';

export interface ToeicPracticeBridgeProps {
  bridge: BridgeToPractice;
  className?: string;
}

export function ToeicPracticeBridge({ bridge, className = '' }: ToeicPracticeBridgeProps) {
  const {
    targetPart,
    partName,
    recommendedQuestionCount,
    practiceUrl,
    ctaText,
  } = bridge;

  // Fallback safe URL matching requirement
  const targetUrl =
    practiceUrl ||
    `/toeic/exam/bank?part=${targetPart}&limit=${recommendedQuestionCount}&mode=practice&filterMode=unseen`;

  return (
    <section
      aria-label="Cầu nối thực hành thực chiến"
      className={`rounded-sm border border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-900 text-white p-5 sm:p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left column: Context & Motivation */}
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-emerald-500 text-slate-950">
              Thực Hành Thực Chiến
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              Part {targetPart} · {partName}
            </span>
          </div>

          <h3 className="font-mono text-base sm:text-lg font-bold tracking-tight text-white">
            Áp dụng lý thuyết vào kho đề thi thật ETS
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Chuyển hóa quy tắc vừa học thành phản xạ tự nhiên. Hệ thống tự động lọc các câu hỏi mới toanh (chống trùng lặp 100%) kèm bộ bấm giờ thi thật.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Chống trùng lặp (Unseen)
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {recommendedQuestionCount} câu đề xuất
            </span>
          </div>
        </div>

        {/* Right column: Action CTAs */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0">
          <Link
            href={targetUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xs bg-white text-slate-900 px-5 py-2.5 font-mono text-xs sm:text-sm font-bold hover:bg-slate-100 transition-colors shadow-xs cursor-pointer select-none"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{ctaText || `Luyện ngay ${recommendedQuestionCount} câu Part ${targetPart}`}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href={`/toeic?tab=practice_parts&part=${targetPart}`}
            className="inline-flex items-center justify-center gap-1.5 font-mono text-xs text-slate-300 hover:text-white transition-colors underline-offset-4 hover:underline py-1"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Tùy chỉnh số lượng & cấu hình Part {targetPart}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
