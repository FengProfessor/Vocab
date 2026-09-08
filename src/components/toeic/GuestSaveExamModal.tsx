'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Smartphone,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import type { ToeicScoreResult } from '@/types/toeic';
import { getCefrDescriptor } from '@/lib/toeic-scoring';

export interface GuestSaveExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreResult: ToeicScoreResult;
  testTitle?: string;
  onGoogleSignIn: () => void;
  isGoogleLoading?: boolean;
}

export function GuestSaveExamModal({
  isOpen,
  onClose,
  scoreResult,
  testTitle,
  onGoogleSignIn,
  isGoogleLoading = false,
}: GuestSaveExamModalProps) {
  if (!isOpen) return null;

  const cefrInfo = getCefrDescriptor(scoreResult.cefrLevel);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-md border border-slate-200 bg-white p-6 sm:p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
        {/* Top close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon + Celebration */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Trophy className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <Sparkles className="h-3 w-3 text-slate-500" />
              <span>Hoàn thành bài thi</span>
            </div>
            <h2 id="guest-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
              Điểm số dự kiến của bạn
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {testTitle || 'Bài thi thử TOEIC'}
            </p>
          </div>
        </div>

        {/* Preliminary Score Highlight Box */}
        <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 text-center space-y-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {scoreResult.scaledTotal}
            </span>
            <span className="font-mono text-base font-bold text-slate-400">/ 990</span>
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 text-xs">
            <div className="rounded-sm border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-medium text-slate-500 text-[11px]">Listening</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {scoreResult.scaledListening}
              </p>
            </div>
            <div className="rounded-sm border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-medium text-slate-500 text-[11px]">Reading</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {scoreResult.scaledReading}
              </p>
            </div>
            <div className="rounded-sm border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-medium text-slate-500 text-[11px]">CEFR</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {scoreResult.cefrLevel}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            &ldquo;{cefrInfo.title}&rdquo; — {scoreResult.rawTotal} câu đúng
          </p>
        </div>

        {/* Benefits list */}
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lợi ích khi đăng nhập lưu bài:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Lưu vĩnh viễn lịch sử thi & theo dõi tiến độ nâng band</span>
            </li>
            <li className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Mở khóa báo cáo phân tích chi tiết từng Part 1 đến Part 7</span>
            </li>
            <li className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Đồng bộ tức thì trên điện thoại và máy tính</span>
            </li>
          </ul>
        </div>

        {/* Actions Buttons */}
        <div className="mt-5 flex flex-col gap-2">
          {/* Primary Action: Google 1-Click */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-sm border border-slate-900 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Đăng nhập Google để lưu kết quả</span>
          </button>

          {/* Secondary Action: Email auth link */}
          <Link
            href={`/auth?redirectTo=${encodeURIComponent(
              typeof window !== 'undefined'
                ? window.location.pathname + window.location.search
                : '/toeic'
            )}`}
            className="w-full"
          >
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-slate-200 bg-white py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <span>Đăng nhập hoặc đăng ký bằng Email</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>

          {/* Dismiss / Browse as guest */}
          <button
            type="button"
            onClick={onClose}
            className="text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition cursor-pointer"
          >
            Xem kết quả tạm thời mà không lưu
          </button>
        </div>
      </div>
    </div>
  );
}
