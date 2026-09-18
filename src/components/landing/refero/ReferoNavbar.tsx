'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, ArrowRight, Menu, X, Gift } from 'lucide-react';

export function ReferoNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs'
          : 'bg-white border-b border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                LingoPro
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-blue-700 uppercase -mt-1">
                Hệ Sinh Thái Học Tiếng Anh
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links (4 Pillars Ecosystem Navigation) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-3 py-1.5 rounded hover:text-slate-900 hover:bg-white transition cursor-pointer"
          >
            Tổng quan
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('capture')}
            className="px-3 py-1.5 rounded hover:text-blue-700 hover:bg-white transition cursor-pointer text-blue-700 font-bold"
          >
            Tra & Lưu từ
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('apps')}
            className="px-3 py-1.5 rounded hover:text-slate-900 hover:bg-white transition cursor-pointer"
          >
            Kho ứng dụng
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('exam-module')}
            className="px-3 py-1.5 rounded hover:text-slate-900 hover:bg-white transition cursor-pointer"
          >
            Thi TOEIC & VSTEP
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('proof-wall')}
            className="px-3 py-1.5 rounded hover:text-slate-900 hover:bg-white transition cursor-pointer"
          >
            Dẫn chứng
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pricing')}
            className="px-3 py-1.5 rounded hover:text-slate-900 hover:bg-white transition cursor-pointer"
          >
            Bảng giá
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/sat-thu-toeic-listening"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-md transition"
          >
            <Gift className="w-3.5 h-3.5 text-amber-700" />
            <span>Tải Sách 15 Trang (0đ)</span>
          </Link>

          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
          >
            <span>Bắt Đầu Miễn Phí</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white p-4 space-y-3 text-xs animate-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-100 font-semibold text-slate-800"
          >
            Tổng quan hệ sinh thái
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('capture')}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-100 font-bold text-blue-700"
          >
            Tra & Lưu từ tức thì (Extension/Youtube)
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('apps')}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-100 font-semibold text-slate-800"
          >
            Kho ứng dụng thực chiến (Nghe/Nói/Ngữ pháp/SRS)
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('exam-module')}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-100 font-semibold text-slate-800"
          >
            Module Luyện thi TOEIC & VSTEP
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('proof-wall')}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-100 font-semibold text-slate-800"
          >
            Dẫn chứng học viên (+135đ)
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pricing')}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-100 font-semibold text-slate-800"
          >
            Bảng giá & Gói học
          </button>
        </div>
      )}
    </header>
  );
}
