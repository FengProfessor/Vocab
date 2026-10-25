'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

interface StickyCtaBarProps {
  onScrollToOptin: () => void;
  onReadOnline: () => void;
}

export default function StickyCtaBar({ onScrollToOptin, onReadOnline }: StickyCtaBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past 500px
      if (window.scrollY > 550) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Thumbnail & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-xs hidden sm:block relative">
            <Image
              src="/images/sat-thu-toeic-3d-book.jpg"
              alt="Ebook Thumbnail"
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] tracking-wide">
                MIỄN PHÍ 0Đ
              </span>
              <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                (Gói quà tặng 699,000đ)
              </span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024–2026
            </h4>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onReadOnline}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition hidden sm:inline-flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Đọc Online</span>
          </button>

          <button
            type="button"
            onClick={onScrollToOptin}
            className="px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tải Trọn Bộ Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
