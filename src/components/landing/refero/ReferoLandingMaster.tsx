'use client';

import React from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import { ReferoNavbar } from './ReferoNavbar';
import { ReferoHero } from './ReferoHero';
import { ReferoCaptureSection } from './ReferoCaptureSection';
import { ReferoBentoGrid } from './ReferoBentoGrid';
import { ReferoExamModuleSection } from './ReferoExamModuleSection';
import { ReferoProofWall } from './ReferoProofWall';
import { ReferoPricingSection } from './ReferoPricingSection';
import { ReferoFaqSection } from './ReferoFaqSection';
import { ReferoStickyCta } from './ReferoStickyCta';
import { ReferoFloatingSocialProof } from './ReferoCroModules';

export function ReferoLandingMaster() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Clean Sticky Navbar */}
      <ReferoNavbar />

      <main>
        {/* 2. Trụ Cột 01: Giới Thiệu Tổng Quan & Bản Đồ Hệ Sinh Thái */}
        <ReferoHero />

        {/* 3. Trụ Cột 02: Tra Từ & Lưu Từ 1-Chạm (Báo chí, YouTube, Desktop) */}
        <ReferoCaptureSection />

        {/* 4. Trụ Cột 03: Kho Ứng Dụng Thực Chiến (Nghe Song Ngữ, Ngữ Pháp AI, Nói Shadowing, FSRS) */}
        <ReferoBentoGrid />

        {/* 5. Trụ Cột 04: Module Khảo Thí Chứng Chỉ (20 Đề ETS 2026, VSTEP 6 Bậc, 15 Bẫy Sát Thủ) */}
        <ReferoExamModuleSection />

        {/* 6. Dẫn Chứng Thực Tế & Điểm Số Thí Sinh (FTU, HUST, VNU) */}
        <ReferoProofWall />

        {/* 7. Bảng Giá Minh Bạch & Cam Kết Hoàn Tiền 14 Ngày */}
        <ReferoPricingSection />

        {/* 8. Giải Đáp Thắc Mắc (FAQ) */}
        <ReferoFaqSection />
      </main>

      {/* 7. Clean Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">LingoPro</span>
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Nền tảng học từ vựng và luyện thi thông minh. Kết hợp phương pháp ôn tập ngắt quãng khoa học với kho 20 bộ đề khảo thí chuẩn ETS 2026 và VSTEP B1–C1.
            </p>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} LingoPro EdTech Platform. Bảo lưu mọi quyền.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase font-mono text-[11px]">
              Tài Liệu & Đề Thi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/sat-thu-toeic-listening" className="hover:text-blue-600 transition">
                  Sát Thủ Bài Nghe TOEIC (Ebook 0đ)
                </Link>
              </li>
              <li>
                <Link href="/vstep" className="hover:text-blue-600 transition">
                  Kho Đề Thi Thử VSTEP B1–C1
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-blue-600 transition">
                  Đăng Ký Học Thử Miễn Phí
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase font-mono text-[11px]">
              Cam Kết Chất Lượng
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mọi tài liệu khảo thí được định lượng từ 20 bộ đề thi thực tế chuẩn ETS và khung tham chiếu 6 bậc châu Âu. Hoàn tiền 100% trong 14 ngày nếu không tiến bộ.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating social proof notification & mobile sticky CTA */}
      <ReferoFloatingSocialProof />
      <ReferoStickyCta />
    </div>
  );
}
