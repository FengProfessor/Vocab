'use client';

import React from 'react';
import {
  KEY_STATS_2026,
  type KeyStat,
} from '@/data/sat-thu-toeic-listening-data';
import {
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

export default function StatsComparisonTable() {
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider shadow-xs">
          <BarChart3 className="w-3.5 h-3.5" />
          Báo Cáo Dữ Liệu Khảo Thí Độc Quyền
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Đối Chiếu Định Lượng: 10 Đề ETS 2024 vs 10 Đề ETS 2026
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Giải mã 2,000 câu hỏi nghe thực tế để chứng minh sự sụp đổ của các mẹo vặt cơ học và sự thay đổi triệt để trong cấu trúc ra đề của Viện Khảo Thí ETS.
        </p>
      </div>

      {/* 4 Key Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-white to-white border border-rose-200 shadow-md shadow-rose-100/60 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Part 1: Bẫy &quot;Being&quot;</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold font-mono text-xs border border-rose-200">
              0% Đúng
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
            100% BẪY
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Trong ETS 2026, 11/11 phương án chứa <code className="text-rose-700 font-bold bg-rose-100/70 px-1 py-0.5 rounded">being</code> đều là ĐÁP ÁN SAI hoàn toàn!
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-white border border-amber-200 shadow-md shadow-amber-100/60 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Part 2: Câu hỏi đuôi</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold font-mono text-xs border border-amber-200">
              Gấp 3 Lần
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            +200.0%
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Câu hỏi đuôi tăng vọt từ 6 lên 18 câu, gài bẫy thói quen dịch &quot;Ừ/Không&quot; của người Việt.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-white border border-purple-200 shadow-md shadow-purple-100/60 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Part 3: Thoại 3 người</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold font-mono text-xs border border-purple-200">
              2 đoạn / đề
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600">
            +150.0%
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bùng nổ đối thoại 3 người (từ 8 lên 20 đoạn thoại), bẫy gán nhầm vai nhân vật (M1 vs M2).
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-white border border-emerald-200 shadow-md shadow-emerald-100/60 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Part 3 &amp; 4: Bẫy trùng từ</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold font-mono text-xs border border-emerald-200">
              Nguy Hiểm
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">
            79% BẪY
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gần 8/10 đáp án chứa từ khóa phát âm giống hệt audio là phương án mồi nhử của ETS.
          </p>
        </div>
      </div>

      {/* Full Technical Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-100">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            Bảng Số Liệu Đối Chiếu Chi Tiết 2,000 Câu Hỏi
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Audited &amp; Verified by LingoPro Lab
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Chỉ số Khảo thí Thực nghiệm</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                  ETS 2024 (10 Đề)
                </th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                  ETS 2026 (10 Đề)
                </th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                  Tỷ lệ Biến thiên
                </th>
                <th className="py-3 px-4 font-semibold">Ý nghĩa Thực chiến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {KEY_STATS_2026.map((item: KeyStat, idx: number) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/80 transition ${
                    item.isHighlight ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {item.label}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-slate-500 whitespace-nowrap">
                    {item.ets2024}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-slate-900 font-semibold whitespace-nowrap">
                    {item.ets2026}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center font-black text-emerald-700 whitespace-nowrap">
                    {item.change}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {item.impact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
