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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <BarChart3 className="w-3.5 h-3.5" />
          Báo Cáo Dữ Liệu Khảo Thí Độc Quyền
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Đối Chiếu Định Lượng: 10 Đề ETS 2024 vs 10 Đề ETS 2026
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Giải mã 2,000 câu hỏi nghe thực tế để chứng minh sự sụp đổ của các mẹo vặt cơ học và sự thay đổi triệt để trong cấu trúc ra đề của Viện Khảo Thí ETS.
        </p>
      </div>

      {/* 4 Key Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Part 1 Being Trap</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold font-mono text-xs">
              0% Đúng
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
            100% BẪY
          </div>
          <p className="text-xs text-slate-300">
            Trong ETS 2026, 11/11 phương án chứa <code className="text-rose-300">being</code> đều là ĐÁP ÁN SAI hoàn toàn!
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Part 2 Tag Questions</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-xs">
              Gấp 3 Lần
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            +200.0%
          </div>
          <p className="text-xs text-slate-300">
            Câu hỏi đuôi tăng vọt từ 6 lên 18 câu, đánh sập thói quen dịch nhị phân &quot;Ừ/Không&quot; của người Việt.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Part 3 3-Speakers</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono text-xs">
              2 đoạn / đề
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
            +150.0%
          </div>
          <p className="text-xs text-slate-300">
            Bùng nổ đối thoại 3 người (từ 8 lên 20 đoạn thoại), bẫy gán nhầm vai nhân vật (M1 vs M2).
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Part 3 &amp; 4 Verbatim</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-xs">
              Nguy Hiểm
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            79% BẪY
          </div>
          <p className="text-xs text-slate-300">
            Gần 8/10 đáp án chứa từ khóa phát âm giống hệt audio là phương án mồi nhử của ETS.
          </p>
        </div>
      </div>

      {/* Full Technical Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            Bảng Số Liệu Đối Chiếu Chi Tiết 2,000 Câu Hỏi
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Audited &amp; Verified by LingoPro Lab
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
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
                <th className="py-3 px-4 font-semibold">Ý nghĩa Chiến thuật Khảo thí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {KEY_STATS_2026.map((item: KeyStat, idx: number) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition ${
                    item.isHighlight ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-white">
                    {item.label}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-slate-400 whitespace-nowrap">
                    {item.ets2024}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-white font-semibold whitespace-nowrap">
                    {item.ets2026}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center font-black text-emerald-400 whitespace-nowrap">
                    {item.change}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
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
