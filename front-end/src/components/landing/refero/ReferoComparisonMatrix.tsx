'use client';

import React from 'react';
import { Check, X, Scale } from 'lucide-react';
import type { ComparisonRow } from './types';

const ROWS: ComparisonRow[] = [
  {
    feature: 'Thuật toán lặp lại ngắt quãng',
    lingopro: 'FSRS v5 (Hiện đại nhất 2026)',
    anki: 'SM-2 (Thuật toán từ 1987)',
    traditional: 'Học dồn cuối tuần / Quên sạch sau 3 ngày',
    highlight: true,
  },
  {
    feature: 'Cách thêm từ mới vào bộ nhớ',
    lingopro: 'Tra 1 chạm trên web + AI tự điền',
    anki: 'Phải tự gõ tay hoặc tìm deck rời',
    traditional: 'Chép sổ tay thủ công',
    highlight: true,
  },
  {
    feature: 'Phân tích ngữ cảnh & sắc thái',
    lingopro: 'Gemini AI phân tích chuyên sâu',
    anki: 'Không có AI hỗ trợ',
    traditional: 'Tra từ điển giấy thô',
    highlight: false,
  },
  {
    feature: 'Bộ đề thi & Khảo thí ETS 2026',
    lingopro: '20+ Bộ đề định lượng 15 bẫy',
    anki: 'Deck cộng đồng cũ, sai lệch',
    traditional: 'Sách photo in giấy',
    highlight: true,
  },
  {
    feature: 'Giao bài tập & Quản lý lớp học',
    lingopro: 'Portal Giáo viên + Báo cáo KPI',
    anki: 'Không hỗ trợ trường lớp',
    traditional: 'Chấm vở bằng bút đỏ',
    highlight: false,
  },
  {
    feature: 'Độ mượt & Đồng bộ đa thiết bị',
    lingopro: 'Web, iOS, Android, Chrome PWA',
    anki: 'Giao diện thô, iOS thu phí 25$',
    traditional: 'Mang theo sổ tay',
    highlight: false,
  },
];

export function ReferoComparisonMatrix() {
  return (
    <section id="compare" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center space-y-3 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Scale className="w-3.5 h-3.5" />
          <span>Đối Chiếu Thực Tế</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Tại sao học viên chuyển từ Anki sang LingoPro?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          So sánh chi tiết giữa công nghệ FSRS thế hệ mới và các phương thức ghi nhớ trước đây.
        </p>
      </div>

      {/* Comparison Table Container (Bright Theme) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 text-xs sm:text-sm bg-slate-50/70">
              <th className="p-4 sm:p-6 text-slate-700 font-bold w-2/5">
                Tiêu chí so sánh
              </th>
              <th className="p-4 sm:p-6 bg-indigo-50/80 text-indigo-900 font-black w-1/3 border-x border-indigo-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg text-slate-900">LingoPro</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-mono font-bold text-white">
                    FSRS v5
                  </span>
                </div>
              </th>
              <th className="p-4 sm:p-6 text-slate-600 font-bold w-1/4">
                Anki / Quizlet
              </th>
              <th className="p-4 sm:p-6 text-slate-600 font-bold w-1/4">
                Học chép phạt
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {ROWS.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-slate-50/80 transition-colors ${
                  row.highlight ? 'bg-indigo-50/30' : ''
                }`}
              >
                <td className="p-4 sm:p-6 text-slate-800 font-semibold">
                  {row.feature}
                </td>
                <td className="p-4 sm:p-6 bg-indigo-50/40 border-x border-indigo-200/60 text-slate-900 font-bold">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{row.lingopro}</span>
                  </div>
                </td>
                <td className="p-4 sm:p-6 text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-slate-100 text-slate-500 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span>{row.anki}</span>
                  </div>
                </td>
                <td className="p-4 sm:p-6 text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-rose-100 text-rose-600 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span>{row.traditional}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
