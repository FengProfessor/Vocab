'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export function ReferoPricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2.5 mb-8 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Bảng Giá Trong Suốt</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          Chọn Gói Học Phù Hợp Với Bạn
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Đầu tư một lần, tự do hủy bất kỳ lúc nào. Cam kết hoàn tiền 100% trong 14 ngày nếu bạn không thấy hiệu quả.
        </p>
      </div>

      {/* Monthly / Annual Toggle (Bright Theme, Sharp Corners) */}
      <div className="flex justify-center mb-12 sm:mb-16">
        <div className="inline-flex items-center p-1 rounded-md bg-slate-100 border border-slate-200">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 sm:px-5 py-2 rounded text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              !isAnnual ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thanh toán theo tháng
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 sm:px-5 py-2 rounded text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isAnnual ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Thanh toán 1 năm</span>
            <span className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase ${
              isAnnual ? 'bg-emerald-300 text-slate-950' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Tiết kiệm 33%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid (Bright Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Plan 1: Free */}
        <div className="rounded-lg bg-white border border-slate-300 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Starter Free</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dành cho người mới làm quen với phương pháp FSRS
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2">
              <span className="text-4xl font-black text-slate-900">0₫</span>
              <span className="text-xs text-slate-500">/ mãi mãi</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>200 từ vựng cá nhân</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thuật toán FSRS v5 cơ bản</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tra từ điển AI (5 lượt/ngày)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Flashcard & Trắc nghiệm phản xạ</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Link
              href="/auth"
              className="block w-full text-center py-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition border border-slate-200"
            >
              Đăng Ký Miễn Phí
            </Link>
          </div>
        </div>

        {/* Plan 2: Pro (Highlighted with Sharp Border & Clear Anchor) */}
        <div className="rounded-lg bg-gradient-to-b from-blue-50/50 via-white to-white border-2 border-blue-600 p-6 sm:p-8 flex flex-col justify-between shadow-lg relative lg:-translate-y-2">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-sm bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
            Khuyên dùng nhiều nhất
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                VIP Pro Membership
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              </h3>
              <p className="text-xs text-blue-700 font-medium mt-1">
                Đột phá điểm số TOEIC 800+ hoặc VSTEP B2-C1
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">
                {isAnnual ? '69.000₫' : '99.000₫'}
              </span>
              <span className="text-xs text-slate-500">/ tháng</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Không giới hạn từ vựng lưu trữ</span>
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Toàn bộ 20 bộ đề khảo thí ETS 2026 & VSTEP</span>
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Gemini AI phân tích câu không giới hạn</span>
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Luyện nghe 4K + Chép chính tả Dictation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đồng bộ tức thì Máy tính + App Điện thoại</span>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-2">
            <Link
              href="/upgrade"
              className="block w-full text-center py-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-sm hover:scale-[1.01] transition-all"
            >
              Nâng Cấp VIP Pro Ngay
            </Link>
            <span className="text-[11px] text-center text-slate-500 block font-medium">
              Quét mã VietQR nhận gói tự động trong 30 giây
            </span>
          </div>
        </div>

        {/* Plan 3: Group & Classroom */}
        <div className="rounded-lg bg-white border border-slate-300 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Học Nhóm & Lớp Học</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dành cho nhóm bạn cùng thi hoặc Gia sư & Trung tâm
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2">
              <span className="text-4xl font-black text-slate-900">49.000₫</span>
              <span className="text-xs text-slate-500">/ bạn / tháng</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mọi quyền lợi của gói VIP Pro</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Học nhóm từ 2 đến 20 thành viên</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quản trị viên quản lý ghế linh hoạt</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hỗ trợ xuất hóa đơn VAT & Support 1-1</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Link
              href="/upgrade?target=group"
              className="block w-full text-center py-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition border border-slate-200"
            >
              Đăng Ký Gói Nhóm
            </Link>
          </div>
        </div>
      </div>

      {/* 14-day Guarantee Seal embedded cleanly in Pricing */}
      <div className="mt-10 max-w-2xl mx-auto p-4 sm:p-5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-4 text-left">
        <div className="size-11 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-amber-600" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            Cam Kết Hoàn Tiền 100% Trong 14 Ngày
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            Nếu bạn cảm thấy phương pháp không giúp bạn ghi nhớ từ vựng tốt hơn, chỉ cần nhắn tin — LingoPro hoàn tiền 100% không phiền hà.
          </p>
        </div>
      </div>
    </section>
  );
}
