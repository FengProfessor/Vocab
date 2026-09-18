'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { ReferoEcosystemMatrix } from './ReferoEcosystemMatrix';

export function ReferoHero() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="top" className="relative pt-6 pb-12 sm:pt-8 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#fbfcfd] border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10 space-y-8 sm:space-y-10">
        {/* ─── TOP ANNOUNCEMENT STRIP ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white font-extrabold text-[11px] tracking-wide rounded-sm uppercase shadow-xs">
              <Flame className="w-3.5 h-3.5 fill-white" />
              HỆ SINH THÁI TỪ VỰNG TOÀN DIỆN
            </span>
            <span className="font-semibold text-slate-800 hidden sm:inline">
              Nền tảng học tiếng Anh thông minh & ghi nhớ trọn đời
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              18.500+ Học viên tin dùng
            </span>
            <span className="text-slate-300">|</span>
            <span className="hidden md:inline text-slate-600">
              ĐH Ngoại Thương • Bách Khoa • ĐHQG • Kinh Tế Quốc Dân
            </span>
          </div>
        </div>

        {/* ─── EDITORIAL HEADLINE & VALUE COPY ─── */}
        <div className="text-center space-y-3.5 max-w-4xl mx-auto">
          <div className="inline-block border-b-2 border-blue-600 pb-0.5">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-700">
              Chấm Dứt Học Trước Quên Sau • Giải Pháp Học Tiếng Anh Thông Minh
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 leading-[1.2] tracking-tight">
            <span>Học Tiếng Anh Thông Minh. </span>
            <span className="text-blue-600">Lưu Trữ & Ghi Nhớ Từ Vựng Trọn Đời.</span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-700 leading-relaxed max-w-3xl mx-auto font-normal">
            LingoPro không chỉ là web giải đề thi đơn lẻ. Đây là <strong>Hệ Sinh Thái Học Tiếng Anh Toàn Diện</strong> kết nối trọn vẹn 4 phân khu: từ việc lướt web đọc báo, xem video YouTube, tra từ tức thì đến kho ứng dụng luyện nghe, nói, ngữ pháp chuyên sâu và module khảo thí chứng chỉ (TOEIC & VSTEP).
          </p>

          {/* Quick CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-md shadow-blue-600/25 transition-all group cursor-pointer"
            >
              <span>BẮT ĐẦU HỌC THỬ MIỄN PHÍ 0Đ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/sat-thu-toeic-listening"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>TẢI SÁCH SÁT THỦ 15 TRANG (0Đ)</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Không cần thẻ tín dụng
            </span>
            <span>•</span>
            <span>Kích hoạt trong 5 giây</span>
            <span>•</span>
            <span className="text-blue-700 font-semibold">Cam kết hoàn tiền 100% trong 14 ngày</span>
          </div>
        </div>

        {/* ─── 4-QUADRANT VISUAL ECOSYSTEM MATRIX (EXACT MATCH TO USER SKETCH) ─── */}
        <div className="pt-2">
          <ReferoEcosystemMatrix onSelectPillar={scrollToSection} />
        </div>

        {/* ─── SOCIAL PROOF TICKER BAR ─── */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
              FTU
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Trần Minh Hoàng • ĐH Ngoại Thương Hà Nội
              </span>
              <span className="text-[11px] text-slate-500">
                Tăng <strong className="text-emerald-700 font-bold">+130 điểm Listening</strong> (315 ➔ 445 LC) sau 3 tuần áp dụng mẹo né bẫy Being.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold font-mono border border-emerald-200 shrink-0">
              Xác thực điểm IIG
            </span>
            <button
              type="button"
              onClick={() => scrollToSection('proof-wall')}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Xem tất cả học viên &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
