'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, FileText, CheckCircle2, Star, ShieldCheck, Eye } from 'lucide-react';

interface BookCover3DProps {
  onReadOnline: () => void;
  onScrollToOptin: () => void;
}

export default function BookCover3D({ onReadOnline, onScrollToOptin }: BookCover3DProps) {
  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Glow Ambient behind Book */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-teal-400/20 rounded-3xl blur-2xl -z-10" />

      {/* Main 3D Book Container */}
      <div className="relative group cursor-pointer w-full transition-transform duration-500 hover:scale-[1.02]">
        {/* Book Image with Shadow & Realistic Borders */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/20 border border-slate-200/90 bg-white">
          <Image
            src="/images/sat-thu-toeic-3d-book.jpg"
            alt="Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026 - 3D Mockup"
            width={1200}
            height={675}
            priority
            className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
          />

          {/* Glossy Overlay Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />

          {/* Quick Read Button overlay on hover */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-xs">
            <button
              type="button"
              onClick={onReadOnline}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lg hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Đọc Thử Online</span>
            </button>
            <button
              type="button"
              onClick={onScrollToOptin}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg hover:bg-emerald-500 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Nhận Sách 0đ</span>
            </button>
          </div>
        </div>

        {/* Floating Badge 1: Top Right - 15 Trang Tinh Gọn */}
        <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white border border-emerald-200 text-slate-900 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce [animation-duration:3s]">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
            15
          </div>
          <div className="text-left">
            <span className="block text-[11px] font-extrabold text-slate-900 leading-none">Trang Tinh Gọn</span>
            <span className="text-[9px] text-emerald-600 font-semibold">Chuẩn Khổ A4</span>
          </div>
        </div>

        {/* Floating Badge 2: Bottom Left - Dữ liệu Khảo Thí */}
        <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white border border-indigo-200 text-slate-900 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="block text-[11px] font-extrabold text-slate-900 leading-none">20 Đề ETS</span>
            <span className="text-[9px] text-indigo-600 font-semibold">2024 &amp; 2026 Mới Nhất</span>
          </div>
        </div>
      </div>

      {/* Social Proof Counter Bar below mockup */}
      <div className="mt-5 w-full bg-white/90 border border-slate-200/90 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
              H
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
              M
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
              T
            </div>
          </div>
          <div>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1 font-bold text-slate-800 text-[11px]">4.9/5</span>
            </div>
            <span className="text-[10px] text-slate-500">3,850+ thí sinh đã tải về</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Bản Quyền Độc Quyền</span>
        </div>
      </div>
    </div>
  );
}
