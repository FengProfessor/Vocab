'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Brain,
  ArrowUpRight,
  Sparkles,
  BookmarkPlus,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface ReferoEcosystemMatrixProps {
  onSelectPillar?: (pillarId: string) => void;
}

export function ReferoEcosystemMatrix({ onSelectPillar }: ReferoEcosystemMatrixProps) {
  const [hoveredPillar, setHoveredPillar] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);

  const scrollTo = (id: string) => {
    if (onSelectPillar) {
      onSelectPillar(id);
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full relative select-none">
      {/* ─── DESKTOP & TABLET MATRIX: EXACT 4-QUADRANT X-PARTITION FROM USER SKETCH ─── */}
      <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] lg:aspect-[16/9.5] min-h-[520px] max-h-[720px] rounded-xl border-2 border-slate-300 shadow-xl overflow-hidden bg-slate-950">
        {/* ════ 1. TOP QUADRANT: GIỚI THIỆU TỔNG QUAN ════ */}
        <div
          onClick={() => scrollTo('top')}
          onMouseEnter={() => setHoveredPillar('top')}
          onMouseLeave={() => setHoveredPillar(null)}
          className="absolute inset-0 cursor-pointer transition-all duration-300 group z-10"
          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)' }}
        >
          {/* Background Illustration */}
          <div className="absolute inset-0">
            <Image
              src="/test-artifacts/listening/01-library-200-overview.png"
              alt="Giới thiệu tổng quan hệ sinh thái LingoPro"
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className={`object-cover object-top transition-transform duration-500 ${
                hoveredPillar === 'top' ? 'scale-105 brightness-95' : 'scale-100 brightness-75'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-900/60 transition-opacity" />
          </div>

          {/* Quadrant Text Content */}
          <div className="absolute top-0 inset-x-0 pt-4 sm:pt-6 lg:pt-8 px-6 sm:px-14 lg:px-24 text-center text-white flex flex-col items-center justify-start space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-blue-600/90 text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>1. Giới thiệu tổng quan</span>
            </div>
            <h3 className="text-sm sm:text-lg lg:text-xl font-black tracking-tight text-white drop-shadow-sm">
              Hệ Sinh Thái Học Tiếng Anh Thông Minh
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-200 leading-snug max-w-lg hidden sm:block">
              Chấm dứt học trước quên sau. Kết nối từ việc lướt web, xem video hàng ngày đến luyện nghe, nói, ngữ pháp và khảo thí chứng chỉ. Thuật toán FSRS nhắc ôn đúng thời điểm.
            </p>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 group-hover:text-white transition">
                <span>Khám phá triết lý học thông minh</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ════ 2. RIGHT QUADRANT: TÍNH NĂNG LƯU TỪ KHI ĐANG HỌC / TRA TỪ ĐIỂN VÀ LƯU ════ */}
        <div
          onClick={() => scrollTo('capture')}
          onMouseEnter={() => setHoveredPillar('right')}
          onMouseLeave={() => setHoveredPillar(null)}
          className="absolute inset-0 cursor-pointer transition-all duration-300 group z-10"
          style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)' }}
        >
          {/* Background Illustration */}
          <div className="absolute inset-0">
            <Image
              src="/test-artifacts/listening/06-player-word-lookup-popover.png"
              alt="Tính năng lưu từ khi đang học - tra từ điển và lưu 1 chạm"
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className={`object-cover object-left-top transition-transform duration-500 ${
                hoveredPillar === 'right' ? 'scale-105 brightness-95' : 'scale-100 brightness-75'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-slate-950/95 via-slate-900/85 to-slate-900/60" />
          </div>

          {/* Quadrant Text Content */}
          <div className="absolute right-0 top-0 bottom-0 w-[48%] sm:w-[44%] lg:w-[40%] py-4 pr-4 sm:pr-8 lg:pr-10 pl-2 text-right flex flex-col justify-center items-end space-y-1.5 text-white">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-emerald-600/90 text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
              <BookmarkPlus className="w-3 h-3 text-emerald-200" />
              <span>2. Tra từ & Lưu tức thì</span>
            </div>
            <h3 className="text-xs sm:text-base lg:text-lg font-black tracking-tight text-white leading-tight">
              Lưu Từ Khi Đang Học / Tra Từ Điển & Lưu
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-200 leading-snug hidden sm:block">
              Click trực tiếp phụ đề video YouTube • Bôi đen đọc báo Chrome Extension • Phím tắt tra nhanh Desktop (<kbd className="font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">Ctrl+Shift+L</kbd>).
            </p>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-300 group-hover:text-white transition">
                <span>Xem demo bắt từ 1-chạm</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* ════ 3. BOTTOM QUADRANT: HÀNG CHỤC ỨNG DỤNG KHÁC (NGỮ PHÁP, LUYỆN TẬP, NGHE, NÓI...) ════ */}
        <div
          onClick={() => scrollTo('apps')}
          onMouseEnter={() => setHoveredPillar('bottom')}
          onMouseLeave={() => setHoveredPillar(null)}
          className="absolute inset-0 cursor-pointer transition-all duration-300 group z-10"
          style={{ clipPath: 'polygon(100% 100%, 0% 100%, 50% 50%)' }}
        >
          {/* Background Illustration */}
          <div className="absolute inset-0">
            <Image
              src="/test-artifacts/listening/05-player-bilingual-sync.png"
              alt="Hàng chục ứng dụng khác: ngữ pháp, luyện tập, luyện nghe, nói"
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className={`object-cover object-bottom transition-transform duration-500 ${
                hoveredPillar === 'bottom' ? 'scale-105 brightness-95' : 'scale-100 brightness-75'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/85 to-slate-900/60" />
          </div>

          {/* Quadrant Text Content */}
          <div className="absolute bottom-0 inset-x-0 pb-4 sm:pb-6 lg:pb-8 px-6 sm:px-14 lg:px-24 text-center text-white flex flex-col items-center justify-end space-y-1 sm:space-y-1.5">
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 group-hover:text-white transition">
                <span>Khám phá toàn bộ kho ứng dụng thực chiến</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-200 leading-snug max-w-lg hidden sm:block">
              Luyện nghe song ngữ 4 giọng đọc (Mỹ, Anh, Úc, Can) • Bác sĩ ngữ pháp AI mổ xẻ lỗi sai • Luyện nói Shadowing chuẩn IPA • Ôn ngắt quãng FSRS nhớ 92.4% sau 30 ngày.
            </p>
            <h3 className="text-sm sm:text-lg lg:text-xl font-black tracking-tight text-white drop-shadow-sm">
              Hàng Chục Ứng Dụng: Ngữ Pháp, Luyện Tập, Luyện Nghe, Nói...
            </h3>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-purple-600/90 text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
              <Layers className="w-3 h-3 text-purple-200" />
              <span>3. Kho ứng dụng thực chiến</span>
            </div>
          </div>
        </div>

        {/* ════ 4. LEFT QUADRANT: LUYỆN THI TOEIC + VSTEP ════ */}
        <div
          onClick={() => scrollTo('exam-module')}
          onMouseEnter={() => setHoveredPillar('left')}
          onMouseLeave={() => setHoveredPillar(null)}
          className="absolute inset-0 cursor-pointer transition-all duration-300 group z-10"
          style={{ clipPath: 'polygon(0% 100%, 0% 0%, 50% 50%)' }}
        >
          {/* Background Illustration */}
          <div className="absolute inset-0">
            <Image
              src="/images/toeic-part1-produce.jpg"
              alt="Luyện thi Toeic + Vstep chuẩn ETS 2026 và 6 bậc Bộ GD&ĐT"
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className={`object-cover object-left transition-transform duration-500 ${
                hoveredPillar === 'left' ? 'scale-105 brightness-95' : 'scale-100 brightness-75'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-900/60" />
          </div>

          {/* Quadrant Text Content */}
          <div className="absolute left-0 top-0 bottom-0 w-[48%] sm:w-[44%] lg:w-[40%] py-4 pl-4 sm:pl-8 lg:pl-10 pr-2 text-left flex flex-col justify-center items-start space-y-1.5 text-white">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-amber-600/90 text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
              <GraduationCap className="w-3 h-3 text-amber-200" />
              <span>4. Khảo thí chứng chỉ</span>
            </div>
            <h3 className="text-xs sm:text-base lg:text-lg font-black tracking-tight text-white leading-tight">
              Luyện Thi TOEIC + VSTEP
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-200 leading-snug hidden sm:block">
              20 Bộ đề số hóa ETS 2026 & VSTEP 6 bậc • Giải mã 15 bẫy sát thủ phòng thi • Tặng Ebook 3D Sát Thủ Bài Nghe 15 trang (0đ).
            </p>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-300 group-hover:text-white transition">
                <span>Vào phòng thi thử ngay</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* ════ 5. CRISP WHITE/SILVER DIAGONAL DIVIDER LINES (MATCHING USER SKETCH X) ════ */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <line
            x1="0"
            y1="0"
            x2="50%"
            y2="50%"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <line
            x1="100%"
            y1="0"
            x2="50%"
            y2="50%"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <line
            x1="0"
            y1="100%"
            x2="50%"
            y2="50%"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <line
            x1="100%"
            y1="100%"
            x2="50%"
            y2="50%"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>

        {/* ════ 6. CENTER CIRCLE (LINGOPRO CORE FSRS HUB) ════ */}
        <div
          onClick={() => scrollTo('capture')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 size-20 sm:size-24 lg:size-32 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-4 border-white shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 group"
        >
          {/* Subtle Outer Glowing Pulse Ring */}
          <span className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-ping opacity-30 pointer-events-none" />

          <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow group-hover:rotate-12 transition-transform" />
          <span className="text-xs sm:text-base font-black tracking-tight mt-0.5">LingoPro</span>
          <span className="text-[8px] sm:text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
            CORE FSRS
          </span>
        </div>
      </div>

      {/* ─── BOTTOM QUICK GUIDE STRIP ─── */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 text-slate-700 font-bold">
          <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Sơ đồ 4 trụ cột tương tác: Bấm vào từng góc để di chuyển nhanh đến tính năng chi tiết.</span>
        </span>
        <span className="font-mono text-blue-700 font-semibold hidden sm:inline">
          100% Ảnh chụp ứng dụng thực tế
        </span>
      </div>
    </div>
  );
}
