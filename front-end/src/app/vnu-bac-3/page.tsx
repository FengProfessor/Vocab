'use client';
import { ExamApi } from '@/features/exam/api';

/**
 * VNU Test Bậc 3 (ULIS ĐHQGHN) Landing Page & Catalog — Client-side API version
 * File: src/app/vnu-bac-3/page.tsx
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ShieldCheck,
  GraduationCap,
  ChevronLeft,
  Layers,
  Compass,
  Library,
  Award,
} from 'lucide-react';
import { getVnuBac3Catalog } from '@/lib/vnu-bac-3/loader';
import { VnuCatalogGrid } from '@/components/vnu-bac-3/VnuCatalogGrid';
import type { VnuBac3CatalogItem } from '@/types/vnu-bac-3';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function VnuBac3CatalogPage() {
  const [catalog, setCatalog] = useState<VnuBac3CatalogItem[]>(() => getVnuBac3Catalog());

  useEffect(() => {
    let cancelled = false;
    ExamApi.getVnuCatalog()
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.catalog) && data.catalog.length > 0) {
          setCatalog(data.catalog as VnuBac3CatalogItem[]);
        }
      })
      .catch(() => {
        // Keep hydrated catalog fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Trung tâm luyện tập
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-4 w-4" /> ULIS ĐHQGHN · CEFR B1
            </span>
          </div>
          <ThemeToggle variant="compact" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/70 rounded-full text-xs font-extrabold text-blue-700 dark:text-blue-300 tracking-wide">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Khảo thí chuẩn đầu ra · ULIS ĐHQGHN</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 font-sans">
              VNU Test Tiếng Anh Bậc 3 (B1)
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Hệ thống khảo thí số hóa chuẩn đầu ra Bậc 3 (CEFR B1) — ULIS ĐHQGHN. Gồm 13 đề phân tầng 4 chặng, cẩm nang chiến thuật 4 kỹ năng và 240 từ vựng cốt lõi.
            </p>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
            <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Lộ trình
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  13 đề · 4 chặng
                </span>
              </div>
            </div>

            <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Cẩm nang
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Chiến lược 4 kỹ năng
                </span>
              </div>
            </div>

            <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                <Library className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Từ vựng
                </span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                  240 từ · 8 chủ đề
                </span>
              </div>
            </div>

            <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Chuẩn đạt B1
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                  ĐTB ≥ 6.0 · Liệt &lt; 2.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Catalog List, Study Guide & Vocabulary */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Danh mục đề thi &amp; học liệu Bậc 3</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            13 bộ đề phân tầng 4 chặng, tích hợp cẩm nang chiến thuật và từ vựng cốt lõi.
          </p>
        </div>

        {/* Interactive Exam Cards Grid with History & Draft Status */}
        <VnuCatalogGrid catalog={catalog} />

        {/* Information Callout: Barem & Quy chế */}
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3 text-xs sm:text-sm shadow-2xs">
          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Quy chế khảo thí VNU Test Bậc 3 (ULIS ĐHQGHN)</span>
          </h4>
          <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>
              <strong>Đọc hiểu (40 phút):</strong> 25 câu trắc nghiệm (Part 1: 7 biển báo; Part 2: 8 điền từ; Part 3: 5 Đúng/Sai; Part 4: 5 đọc hiểu). Điểm = <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs">(Số câu đúng / 25) × 10.0</code> (làm tròn 0.5).
            </li>
            <li>
              <strong>Nghe hiểu (~25 phút):</strong> 20 câu trắc nghiệm (Part 1: 7 độc thoại; Part 2: 7 đối thoại; Part 3: 6 Đúng/Sai). Phát đúng 2 lần. Điểm = <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs">Số câu đúng × 0.5</code>.
            </li>
            <li>
              <strong>Viết (45 phút) &amp; Nói (10–12 phút):</strong> Viết Task 1 (≥80 từ), Task 2 (≥100 từ). Nói Part 1 (phỏng vấn), Part 2 (thẻ đề 2 phút).
            </li>
            <li>
              <strong>Điều kiện ĐẠT:</strong> Điểm trung bình cộng (ĐTB) đạt từ <strong>6.0 / 10.0 trở lên</strong> VÀ <strong>không có kỹ năng nào dưới 2.0 / 10.0</strong> (Điểm liệt).
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
