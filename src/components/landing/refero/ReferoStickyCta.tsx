'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain } from 'lucide-react';

export function ReferoStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA when scrolled past hero (~500px)
      setVisible(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Thanh kêu gọi hành động cố định"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3 sm:hidden shadow-2xl transition-all animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">LingoPro ETS & VSTEP</span>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="size-1.5 rounded-xs bg-emerald-500 animate-pulse" />
              Tặng Gói Quà 0đ Hôm Nay
            </span>
          </div>
        </div>

        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-95"
        >
          <span>Học Thử 0đ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
