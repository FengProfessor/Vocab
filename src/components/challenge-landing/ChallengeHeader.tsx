'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Flame, Gift, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';

interface ChallengeHeaderProps {
  onOpenLeadModal: () => void;
}

export function ChallengeHeader({ onOpenLeadModal }: ChallengeHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-950/40 group-hover:scale-105 transition-transform">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-white tracking-tight leading-none group-hover:text-amber-400 transition-colors">
              LingoPro
            </span>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest leading-tight flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 fill-amber-400" /> Challenge 180D
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-semibold text-slate-300">
          <button
            onClick={() => scrollTo('roadmap')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Lộ trình 3000 từ
          </button>
          <button
            onClick={() => scrollTo('before-after')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Trước & Sau
          </button>
          <button
            onClick={() => scrollTo('mechanism')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Quyền hồi phục
          </button>
          <button
            onClick={() => scrollTo('lead-magnet')}
            className="hover:text-amber-400 text-amber-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" /> Quà 0đ
          </button>
          <button
            onClick={() => scrollTo('guarantee')}
            className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Cam kết hoàn tiền
          </button>
          <button
            onClick={() => scrollTo('pricing')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Học phí
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            onClick={onOpenLeadModal}
            variant="outline"
            size="sm"
            className="border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 hover:text-white rounded-full font-bold text-xs"
          >
            <Gift className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Nhận Sổ Tay 0đ
          </Button>

          <Button
            onClick={() => scrollTo('pricing')}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-black rounded-full text-xs shadow-md shadow-orange-950/50 uppercase tracking-wide"
          >
            Tham gia ngay <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <Button
            onClick={onOpenLeadModal}
            size="sm"
            variant="ghost"
            className="text-amber-300 hover:text-white p-1 text-xs font-bold"
          >
            <Gift className="w-4 h-4 text-amber-400" />
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <button
            onClick={() => scrollTo('roadmap')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Lộ trình 3000 từ vựng
          </button>
          <button
            onClick={() => scrollTo('before-after')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            So sánh Trước & Sau
          </button>
          <button
            onClick={() => scrollTo('mechanism')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Cơ chế bảo vệ chuỗi học
          </button>
          <button
            onClick={() => scrollTo('lead-magnet')}
            className="block w-full text-left py-2 text-sm font-bold text-amber-400"
          >
            🎁 Nhận Sổ tay 3000 từ 0đ
          </button>
          <button
            onClick={() => scrollTo('guarantee')}
            className="block w-full text-left py-2 text-sm font-medium text-emerald-400"
          >
            🛡️ Cam kết hoàn tiền 100%
          </button>
          <button
            onClick={() => scrollTo('pricing')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Bảng giá & Đăng ký
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Câu hỏi thường gặp (FAQ)
          </button>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLeadModal();
              }}
              variant="outline"
              className="w-full border-amber-500/50 text-amber-300 bg-amber-500/10 font-bold text-sm rounded-xl"
            >
              <Gift className="w-4 h-4 mr-2 text-amber-400" />
              Nhận Sổ Tay 3000 Từ 0đ
            </Button>
            <Button
              onClick={() => scrollTo('pricing')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-black text-white text-sm rounded-xl uppercase tracking-wide"
            >
              Đăng ký Thử Thách Ngay
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
