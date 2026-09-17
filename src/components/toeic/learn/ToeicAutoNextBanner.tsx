'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, Pause, Play, Sparkles, X } from 'lucide-react';
import type { TheoryLesson } from '@/data/toeic/theory/types';

export interface ToeicAutoNextBannerProps {
  currentLesson: TheoryLesson;
  nextLesson?: TheoryLesson;
  onAdvanceNext: () => void;
  onDismiss: () => void;
  countdownSeconds?: number;
}

export function ToeicAutoNextBanner({
  currentLesson,
  nextLesson,
  onAdvanceNext,
  onDismiss,
  countdownSeconds = 6,
}: ToeicAutoNextBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(countdownSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused || !nextLesson) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onAdvanceNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextLesson, onAdvanceNext]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const progressPercent = Math.max(0, (timeLeft / countdownSeconds) * 100);

  return (
    <div className="rounded-sm border-2 border-emerald-500 bg-white dark:bg-slate-900 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Progress countdown bar */}
      {nextLesson && !isPaused && (
        <div className="h-1 bg-emerald-100 dark:bg-emerald-950 w-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Achievement Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-emerald-500 text-slate-950">
                Mục Tiêu Đạt Được
              </span>
              <span className="font-mono text-xs text-slate-500">
                {currentLesson.id} Hoàn Thành
              </span>
            </div>

            <h4 className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Xuất sắc! Bạn đã vượt qua toàn bộ Checkpoints của bài học này.
            </h4>

            {nextLesson && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {!isPaused ? (
                  <>
                    Tự động chuyển sang bài tiếp theo:{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {nextLesson.id} · {nextLesson.title}
                    </strong>{' '}
                    trong <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{timeLeft}s</span>...
                  </>
                ) : (
                  <>
                    Đã tạm dừng tự động chuyển. Bạn có thể xem lại bài học hoặc nhấn tiếp tục bất cứ lúc nào.
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {nextLesson && (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="px-2.5 py-1.5 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                title={isPaused ? 'Tiếp tục đếm ngược' : 'Tạm dừng đếm ngược'}
              >
                {isPaused ? 'Tiếp tục' : 'Dừng lại'}
              </button>

              <button
                type="button"
                onClick={onAdvanceNext}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Sang bài tiếp theo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
