'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Clock, Sparkles } from 'lucide-react';

interface UrgencyCountdownProps {
  onOpenLeadModal?: () => void;
}

export function UrgencyCountdown({ onOpenLeadModal }: UrgencyCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 32,
    seconds: 45,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Target midnight tonight or 24 hours rolling
    const now = new Date();
    const target = new Date();
    target.setHours(23, 59, 59, 999);

    const updateTimer = () => {
      const current = new Date();
      const diff = Math.max(0, target.getTime() - current.getTime());
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg relative z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left message */}
        <div className="flex items-center gap-2 font-bold tracking-wide">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-200"></span>
          </span>
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
            <span className="hidden sm:inline">ĐỢT THỬ THÁCH MỚI:</span> Khởi động lúc 00:00 ngày mai • Luyện tập kỷ luật mỗi ngày
          </span>
        </div>

        {/* Center/Right Timer & Action */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 font-mono font-bold text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 text-yellow-300" />
            <span>Còn:</span>
            {mounted ? (
              <span className="text-yellow-200 tracking-wider">
                {formatNum(timeLeft.hours)}:{formatNum(timeLeft.minutes)}:{formatNum(timeLeft.seconds)}
              </span>
            ) : (
              <span className="text-yellow-200 tracking-wider">14:32:45</span>
            )}
          </div>

          {onOpenLeadModal && (
            <button
              onClick={onOpenLeadModal}
              className="hidden lg:inline-flex items-center gap-1 bg-white text-orange-700 hover:bg-yellow-100 font-extrabold px-3 py-1 rounded-full text-xs shadow-sm transition-transform active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Nhận Sổ Tay 0đ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
