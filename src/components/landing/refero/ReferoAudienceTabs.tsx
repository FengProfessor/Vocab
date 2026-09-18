'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import type { AudienceTrack, AudienceType } from './types';

const AUDIENCE_TRACKS: AudienceTrack[] = [
  {
    id: 'exam',
    label: 'Thí sinh Luyện thi (TOEIC / VSTEP / IELTS)',
    badge: 'Khảo thí định lượng',
    title: 'Học trúng 100% bẫy đề thi ETS 2024–2026 & VNU B1-C1',
    description:
      'Được tinh lọc từ 20 bộ đề thi thực tế (2.000 câu hỏi). Hệ thống không dạy lan man mà bẻ khóa trực tiếp 15 bẫy sát thủ phòng thi (bẫy being part 1, câu hỏi đùn đẩy part 2, đối thoại 3 người part 3 và paraphrase 3 tầng part 7).',
    stats: [
      { label: 'Tăng điểm trung bình', value: '+180 TOEIC' },
      { label: 'Bộ đề thi số hóa', value: '20+ Đề chuẩn' },
      { label: 'Từ vựng bẫy thi', value: '1.200 Collocation' },
    ],
    highlights: [
      'Giải mã 15 bẫy sát thủ có dẫn chứng số câu, số đề thực tế',
      'Đồng hồ đếm ngược áp lực phòng thi 45 phút listening & 75 phút reading',
      'Audio người bản xứ 4 chất giọng (Mỹ, Anh, Úc, Canada) chuẩn khảo thí',
    ],
  },
  {
    id: 'busy',
    label: 'Người bận rộn & Người mất gốc',
    badge: 'Phương pháp khoa học',
    title: 'Chỉ 8 phút mỗi ngày — Đánh bại đường quên Ebbinghaus',
    description:
      'Không cần ngồi bàn học 2 tiếng mệt mỏi. Thuật toán FSRS v5 tự động tính toán thời điểm sắp quên của từng từ riêng biệt để nhắc bạn mở điện thoại ôn tập trong chặng ngắn 5–8 phút.',
    stats: [
      { label: 'Thời gian học/ngày', value: '8 phút' },
      { label: 'Tỷ lệ ghi nhớ 30 ngày', value: '92.4%' },
      { label: 'Từ vựng tích lũy', value: '300 từ/tháng' },
    ],
    highlights: [
      'Không bao giờ bị dồn 100 thẻ bài một lúc gây nản chí',
      'Tra từ 1 chạm trên trình duyệt và tự động nhập ảnh, phiên âm, ví dụ',
      'Đồng bộ tức thì giữa Điện thoại (PWA/Capacitor) và Máy tính',
    ],
  },
  {
    id: 'teacher',
    label: 'Giáo viên, Gia sư & Trung tâm',
    badge: 'EdTech B2B Portal',
    title: 'Tự động hóa 80% thời gian soạn bài & kiểm tra từ vựng',
    description:
      'Tạo lớp học chỉ với 1 mã code. Giao bài tập từ vựng & ngữ pháp AI cho toàn bộ học sinh, theo dõi dashboard tiến độ từng em theo thời gian thực và xuất báo cáo PDF gửi phụ huynh chuyên nghiệp.',
    stats: [
      { label: 'Tiết kiệm thời gian/tuần', value: '3-5 Giờ' },
      { label: 'Tỷ lệ học sinh làm bài', value: '96%' },
      { label: 'Hỗ trợ lớp học', value: 'Không giới hạn' },
    ],
    highlights: [
      'Bảng điều khiển KPI sư phạm 4 chỉ số: Học thuộc, Tỷ lệ quên, Chuỗi Streak',
      'Gemini AI tự sinh bài tập trắc nghiệm và điền từ theo từ vựng giáo viên chọn',
      'Giao diện quản lý phân quyền giáo viên / trợ giảng trực quan',
    ],
  },
];

export function ReferoAudienceTabs() {
  const [activeTab, setActiveTab] = useState<AudienceType>('exam');

  const currentTrack = AUDIENCE_TRACKS.find((t) => t.id === activeTab) || AUDIENCE_TRACKS[0];

  return (
    <section id="audience" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Target className="w-3.5 h-3.5" />
          <span>Lộ Trình May Đo Riêng Biệt</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Bạn đang học tiếng Anh cho mục tiêu gì?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Chọn chân dung của bạn để khám phá cách LingoPro tối ưu hóa từng phút giây học tập.
        </p>
      </div>

      {/* Refero-style Segmented Pill Tabs (Bright Theme) */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-inner">
          {AUDIENCE_TRACKS.map((track) => {
            const isActive = track.id === activeTab;
            return (
              <button
                key={track.id}
                onClick={() => setActiveTab(track.id)}
                className={`relative px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{track.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Showcase Card (Bright Theme) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl sm:rounded-4xl p-6 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentTrack.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {currentTrack.title}
            </h3>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {currentTrack.description}
            </p>

            {/* Highlights bullet list */}
            <div className="space-y-3 pt-2">
              {currentTrack.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 p-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-700 font-semibold leading-normal">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA action for this track */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <span>Bắt đầu lộ trình này</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {activeTab === 'exam' && (
                <Link
                  href="/sat-thu-toeic-listening"
                  className="text-xs font-bold text-indigo-600 hover:underline underline-offset-4 transition"
                >
                  Xem bộ bẫy đề ETS 2026 &rarr;
                </Link>
              )}
              {activeTab === 'teacher' && (
                <Link
                  href="/for-teachers"
                  className="text-xs font-bold text-indigo-600 hover:underline underline-offset-4 transition"
                >
                  Đăng ký nhận tài khoản Giáo viên Pilot &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Right Metrics & Visual Card */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 pb-3">
              Chỉ số thực nghiệm học viên
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {currentTrack.stats.map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                >
                  <span className="text-xs text-slate-600 font-semibold">{stat.label}</span>
                  <span className="text-lg font-black font-mono text-emerald-700">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-indigo-900 block mb-1">Cam kết chất lượng:</strong>
              Dữ liệu học tập được đồng bộ đám mây và tối ưu theo thời gian thực. Đảm bảo tiến độ tăng điểm rõ rệt chỉ sau 14 ngày áp dụng đúng lộ trình.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
