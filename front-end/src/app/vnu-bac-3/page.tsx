'use client';

/**
 * VNU Test Bậc 3 (ULIS ĐHQGHN) Landing Page & Catalog — Client-side API version
 * File: src/app/vnu-bac-3/page.tsx
 */

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { getVnuBac3Catalog } from '@/lib/vnu-bac-3/loader';
import { VnuCatalogGrid } from '@/components/vnu-bac-3/VnuCatalogGrid';
import type { VnuBac3CatalogItem } from '@/types/vnu-bac-3';

export default function VnuBac3CatalogPage() {
  const [catalog, setCatalog] = useState<VnuBac3CatalogItem[]>(() => getVnuBac3Catalog());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vnu-bac-3?action=catalog')
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
      {/* Top Banner / Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-none text-xs font-mono font-bold text-blue-700 dark:text-blue-300 tracking-wide">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Khảo thí chuẩn đầu ra · ULIS ĐHQGHN</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
              VNU Test Tiếng Anh Bậc 3 (B1)
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Hệ thống khảo thí số hóa chuẩn đầu ra Bậc 3 (CEFR B1) — ULIS ĐHQGHN. Gồm 13 đề phân tầng 4 chặng, cẩm nang 4 kỹ năng và 240 từ vựng cốt lõi.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 font-mono text-xs">
              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[10px] sm:text-[11px]">LỘ TRÌNH</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">13 đề · 4 chặng</span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[10px] sm:text-[11px]">CẨM NANG</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">Chiến lược 4 kỹ năng</span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[10px] sm:text-[11px]">TỪ VỰNG</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">240 từ · 8 chủ đề</span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[10px] sm:text-[11px]">CHUẨN ĐẠT B1</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">ĐTB ≥ 6.0 · Liệt &lt; 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Catalog List, Study Guide & Vocabulary */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-slate-100 flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <span>Danh mục đề thi &amp; học liệu Bậc 3</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            13 bộ đề phân tầng 4 chặng, tích hợp cẩm nang chiến thuật và từ vựng cốt lõi.
          </p>
        </div>

        {/* Interactive Exam Cards Grid with History & Draft Status */}
        <VnuCatalogGrid catalog={catalog} />

        {/* Information Callout: Barem & Quy chế */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm space-y-3 font-mono text-xs">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Quy chế khảo thí VNU Test Bậc 3 (ULIS ĐHQGHN)</span>
          </h4>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
            <li>
              <strong>Đọc hiểu (40 phút):</strong> 25 câu trắc nghiệm (Part 1: 7 biển báo; Part 2: 8 điền từ; Part 3: 5 Đúng/Sai; Part 4: 5 đọc hiểu). Điểm = <code>(Số câu đúng / 25) × 10.0</code> (làm tròn 0.5).
            </li>
            <li>
              <strong>Nghe hiểu (~25 phút):</strong> 20 câu trắc nghiệm (Part 1: 7 độc thoại; Part 2: 7 đối thoại; Part 3: 6 Đúng/Sai). Phát đúng 2 lần. Điểm = <code>Số câu đúng × 0.5</code>.
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
