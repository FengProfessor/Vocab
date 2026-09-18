'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

interface ExamExample {
  id: string;
  part: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  audioPrompt: string;
  expectedMindset: string;
  actualAnswer: string;
  trapAnalysis: string;
  takeaway: string;
}

const EXAMPLES: ExamExample[] = [
  {
    id: 'part1-produce',
    part: 'Part 1: Tranh Tả Cảnh',
    title: 'Bẫy Từ Nhóm Lớn (Hypernym)',
    subtitle: 'Nhìn thấy hoa quả quả táo, cam, dứa nhưng đề không đọc tên riêng',
    imageSrc: '/images/toeic-part1-produce.jpg',
    imageAlt: 'Quầy hoa quả rau củ siêu thị với táo, cam, chuối',
    audioPrompt: 'Look at the picture marked number 1 in your test book.',
    expectedMindset: 'apples, oranges, pineapples, bananas, fruits',
    actualAnswer: 'Some produce is displayed on shelves.',
    trapAnalysis: 'Băng KHÔNG hề nhắc đến quả táo (apple) hay chuối (banana). Người học thụ động chờ nghe tên quả sẽ bị lỡ nhịp và khoanh bừa.',
    takeaway: 'Mẹo: Nhìn thấy rau củ quả lập tức dịch nhẩm sang produce / groceries trong 2 giây đầu tiên!'
  },
  {
    id: 'part1-bending',
    part: 'Part 1: Tranh Người & Động Tác',
    title: 'Dáng Người Tĩnh vs Bẫy Being',
    subtitle: 'Nữ kỹ sư cúi người kiểm tra máy bơm trong xưởng',
    imageSrc: '/images/toeic-part1-bending.jpg',
    imageAlt: 'Nữ kỹ sư cúi người kiểm tra máy móc thiết bị công nghiệp',
    audioPrompt: 'Look at the picture marked number 2 in your test book.',
    expectedMindset: 'She is picking up tools / She is fixing the machine',
    actualAnswer: 'A woman is bending over the equipment.',
    trapAnalysis: 'Đề bẫy phương án: "The machine is being repaired" hoặc "She is carrying a toolbox". Thao tác dở dang hiếm khi đúng, ETS luôn ưu tiên tư thế duy trì (bending over).',
    takeaway: 'Mẹo: Tập trung vào tư thế cơ thể (bending, kneeling, reaching) thay vì suy diễn hành động sửa chữa.'
  },
  {
    id: 'part3-graphic',
    part: 'Part 3 & 4: Đọc Bảng Biểu',
    title: 'Quy Tắc Gióng Cột Đối Diện',
    subtitle: 'Bảng chương trình hội nghị 3 cột: Giờ - Phòng - Diễn giả',
    imageSrc: '/images/toeic-part3-graphic.jpg',
    imageAlt: 'Bảng lịch trình hội thảo Conference Schedule với các phòng Room 101, Room 204',
    audioPrompt: 'Look at the graphic. Which room will the speaker attend next?',
    expectedMindset: 'Room 101, Room 102, Room 204, Room 301',
    actualAnswer: 'Room 204 (Vì audio nói: "Let\'s attend Dr. Henderson\'s keynote")',
    trapAnalysis: 'Audio KHÔNG BAO GIỜ đọc thẳng số phòng Room 204. Nếu nghe thấy số phòng nào trong băng, 90% đó là phòng bẫy của người nói trước!',
    takeaway: 'Mẹo: Nhìn 4 đáp án (cột Phòng) -> Bịt tai chỉ bắt thông tin ở cột đối diện (Tên người hoặc Tên đề tài).'
  }
];

export default function VisualExamShowcase() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const current = EXAMPLES[activeTab];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Mục Sở Thị Đề Thi Thật ETS 2024 - 2026
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Hình Ảnh Minh Họa Bẫy Đề Thi Thực Tế
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Xem trực tiếp 3 tình huống &quot;kinh điển&quot; khiến thí sinh mất điểm oan uổng: Sự lệch pha giữa{' '}
            <strong className="text-rose-600 font-semibold">từ bạn trông đợi nghe</strong> và{' '}
            <strong className="text-emerald-700 font-semibold">từ ngữ thực tế ETS phát âm</strong>.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                activeTab === idx
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === idx ? 'bg-amber-300' : 'bg-slate-400'}`} />
              {ex.part}
            </button>
          ))}
        </div>

        {/* Card Content Showcase */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: Real Exam Picture Simulation */}
          <div className="lg:col-span-6 bg-slate-950 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-2 mb-4 z-10">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                  {current.part}
                </span>
                <span>ETS Real Exam Format</span>
              </div>
              <p className="text-xs text-slate-300 italic font-mono">
                🔊 &quot;{current.audioPrompt}&quot;
              </p>
            </div>

            {/* Simulated Photo Frame */}
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-2xl bg-slate-900">
              <Image
                src={current.imageSrc}
                alt={current.imageAlt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 text-xs text-slate-300">
                <p className="font-semibold text-white">{current.title}</p>
                <p className="text-[11px] text-slate-300 line-clamp-1">{current.subtitle}</p>
              </div>
            </div>

            <div className="mt-4 text-center text-slate-400 text-[11px] font-mono">
              Ảnh mô phỏng trực quan trích từ ngân hàng đề thi chuẩn hóa ETS
            </div>
          </div>

          {/* Right: Breakdown Table & Takeaways */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">
                  Bóc Tách Phản Xạ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {current.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {current.subtitle}
                </p>
              </div>

              {/* Comparison Box */}
              <div className="space-y-3 pt-2">
                {/* Expected */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Bạn trông đợi nghe trong đầu (Từ tiếng Anh quen thuộc):</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-slate-900 pl-6">
                    {current.expectedMindset}
                  </p>
                </div>

                {/* Actual ETS Answer */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thực tế đề thi phát âm (Đáp án ĐÚNG):</span>
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-950 font-mono pl-6">
                    &quot;{current.actualAnswer}&quot;
                  </p>
                </div>
              </div>

              {/* Deep Analysis */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  Tại sao lại như vậy? (Phân tích bẫy ETS)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {current.trapAnalysis}
                </p>
              </div>
            </div>

            {/* Bottom Takeaway */}
            <div className="pt-4 border-t border-slate-200/80 flex items-center gap-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                💡
              </div>
              <p className="text-xs font-semibold text-amber-950 leading-snug">
                {current.takeaway}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
