'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  GraduationCap,
  Headphones,
  BookOpen,
  Volume2,
  Play,
  AlertTriangle,
  CheckCircle2,
  Download,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

type ExamSubTab = 'toeic' | 'vstep' | 'traps';

export function ReferoExamModuleSection() {
  const [activeSubTab, setActiveSubTab] = useState<ExamSubTab>('toeic');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const playWordAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSampleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      playWordAudio('Fresh produce is displayed on shelves.');
      setTimeout(() => setIsPlayingAudio(false), 3500);
    }
  };

  return (
    <section
      id="exam-module"
      className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#f8fafc] border-b border-slate-200 overflow-hidden"
    >
      {/* Background Subtle Watermark / Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Trụ Cột 04: Module Khảo Thí Chứng Chỉ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Khảo Thí Chuẩn Hóa: Sẵn Sàng Thi TOEIC & VSTEP
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Khi đã tích lũy vốn từ và phản xạ từ LingoPro, module khảo thí cung cấp ngân hàng 20 bộ đề số hóa
            chuẩn ETS 2026 và VSTEP 6 bậc. Phân tích bẫy thi cặn kẽ giúp bạn né đòn mồi nhử và đạt mục tiêu ngay lần thi đầu.
          </p>
        </div>

        {/* ─── TAB CONTROLS (Sharp Editorial Segmented Buttons) ─── */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-md bg-slate-200/80 border border-slate-300 text-xs font-bold text-slate-700 gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('toeic')}
              className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'toeic'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Luyện Đề TOEIC ETS 2026</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('vstep')}
              className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'vstep'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Phòng Thi VSTEP 6 Bậc</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('traps')}
              className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'traps'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>3. Bách Khoa Sát Thủ (Sách 3D 0đ)</span>
            </button>
          </div>
        </div>

        {/* ─── TAB CONTENT PANELS ─── */}
        {/* SUBTAB 1: TOEIC EXAM REAL QUESTION WITH BEING TRAP */}
        {activeSubTab === 'toeic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-150">
            {/* Left: Authentic Exam Photo & Trap Analysis */}
            <div className="lg:col-span-7 rounded-lg border-2 border-slate-300 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-[11px] rounded uppercase">
                    ETS 2026 TEST 01
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Part 1: Photographs (Tranh Tả Vật & Kệ Hàng)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Phòng thi thực tế
                </span>
              </div>

              {/* Realistic Photo with Trap Overlays */}
              <div className="relative w-full aspect-[16/10] rounded overflow-hidden border border-slate-300 bg-slate-900 shadow-inner">
                <Image
                  src="/images/toeic-part1-produce.jpg"
                  alt="Đề thi thật TOEIC Part 1 - Kệ hàng rau quả nông sản"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute top-2 left-2 bg-slate-900/90 text-white font-mono text-[10px] font-extrabold px-2 py-1 rounded shadow border border-slate-700 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>TRANH TĨNH: 0 NGƯỜI THAO TÁC</span>
                </div>

                <div className="absolute bottom-2 inset-x-2 bg-rose-950/95 text-rose-100 text-[11px] p-2 rounded border border-rose-600 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>BẪY SÁT THỦ ETS: 100% CẤM CHỌN CÂU CÓ &quot;BEING&quot;</span>
                  </div>
                  <span className="font-mono text-[10px] bg-rose-600 px-2 py-0.5 rounded text-white font-black shrink-0">
                    NÉ BẪY 1 GIÂY
                  </span>
                </div>
              </div>

              {/* Audio controller */}
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={toggleSampleAudio}
                    className="size-8 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition"
                    title="Bấm nghe phát âm mẫu"
                  >
                    {isPlayingAudio ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Audio 4 chất giọng bản ngữ: Mỹ • Anh • Úc • Canada
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ETS Full Bandwidth Audio Master
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  00:04 / 00:15
                </span>
              </div>

              {/* Options */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                  <span>(A) Customers are waiting in line at the register.</span>
                  <span className="text-[10px] text-slate-400 font-mono">❌ Sai (Không có người)</span>
                </div>

                <div className="p-2 rounded bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between font-medium">
                  <span>(B) Some vegetables are <u className="decoration-rose-600 font-bold">being packed</u> into boxes.</span>
                  <span className="text-[10px] font-mono text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                    ⚠️ BẪY BEING: 100% SAI!
                  </span>
                </div>

                <div className="p-2.5 rounded bg-emerald-50 border-2 border-emerald-500 text-emerald-950 flex items-center justify-between font-bold shadow-xs">
                  <div>
                    <span>(C) Fresh <mark className="bg-emerald-200 text-emerald-950 px-1 rounded">produce</mark> is displayed on shelves.</span>
                    <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                      👉 <strong>Từ vựng bẫy:</strong> &quot;Produce&quot; là Danh từ (n) = Rau củ tươi (không phải động từ sản xuất).
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-white bg-emerald-600 px-2 py-1 rounded font-black shrink-0 ml-2">
                    ✓ ĐÁP ÁN ĐÚNG
                  </span>
                </div>

                <div className="p-2 rounded bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between font-medium">
                  <span>(D) The grocery floor is <u className="decoration-rose-600 font-bold">being cleaned</u> with a mop.</span>
                  <span className="text-[10px] font-mono text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                    ⚠️ BẪY BEING: 100% SAI!
                  </span>
                </div>
              </div>
            </div>

            {/* Right: TOEIC Specs & Practice CTA */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-xs space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-blue-700 uppercase">
                    Ngân hàng khảo thí 20 bộ đề
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bộ Đề ETS 2024–2026 Số Hóa Toàn Diện
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mỗi đề thi bao gồm 200 câu hỏi đầy đủ Listening (Part 1-4) & Reading (Part 5-7). Hệ thống tự động chấm điểm thang 990, phân tích điểm yếu theo từng Part và đề xuất bài tập khắc phục.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xl font-mono block">2.000+</strong>
                    <span className="text-slate-500 text-[11px]">Câu hỏi có audio chuẩn</span>
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <strong className="text-emerald-700 text-xl font-mono block">+135đ</strong>
                    <span className="text-slate-500 text-[11px]">Tăng điểm trung bình</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Chế độ luyện thi thông minh:
                  </span>
                  <ul className="space-y-1 text-[11px] text-blue-800 list-disc list-inside">
                    <li>Luyện full test 120 phút hoặc luyện riêng từng Part 10 phút.</li>
                    <li>Hiển thị transcripts và giải thích chi tiết từng câu.</li>
                    <li>1-click lưu từ vựng mới trong bài đọc vào kho cá nhân.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href="/auth"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>LÀM THỬ ĐỀ ETS 2026 MIỄN PHÍ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: VSTEP SIMULATOR */}
        {activeSubTab === 'vstep' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-150">
            {/* Left: VSTEP Mock Test Interface */}
            <div className="lg:col-span-7 rounded-lg border-2 border-slate-300 bg-white overflow-hidden shadow-sm space-y-0">
              <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-mono flex items-center justify-between">
                <span>VSTEP COMPUTER-BASED • READING PASSAGE 3</span>
                <span className="text-emerald-400 font-bold">CÂU HỎI 21 / 40 • 58:24</span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Passage */}
                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    ĐOẠN VĂN HỌC THUẬT (BẬC B2-C1):
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    &ldquo;Rapid urban expansion has led to <span className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold underline decoration-amber-500 cursor-help" title="unprecedented (C1): chưa từng có">unprecedented</span> heat retention in metropolitan regions. To <span className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-semibold underline decoration-blue-500 cursor-help" title="mitigate (B2): giảm nhẹ, làm dịu">mitigate</span> severe microclimate fluctuations, municipal planners are implementing rooftop vegetation...&rdquo;
                  </p>
                  <div className="p-2 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                    <span className="font-bold">Tra từ 1-chạm:</span>
                    <span>Hover từ vựng để xem nghĩa C1 và collocations ngay trong bài đọc.</span>
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    CÂU HỎI BẬC 4 (B2):
                  </span>
                  <p className="font-bold text-slate-900 text-xs">
                    What is the primary objective of rooftop vegetation mentioned in the text?
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-600">
                      (A) To expand residential capacity
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-bold">
                      (B) To mitigate severe microclimate temperature rises (✓ Đáp án đúng)
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-600">
                      (C) To increase vehicular transportation
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-600">
                      (D) To replace agricultural supply
                    </div>
                  </div>
                </div>
              </div>

              {/* CEFR Scale Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Bậc 3 (B1)</span>
                  <strong className="text-slate-800">4.0 – 5.5</strong>
                </div>
                <div className="p-2 rounded bg-emerald-50 border border-emerald-300">
                  <span className="text-[10px] text-emerald-700 block font-bold">Bậc 4 (B2)</span>
                  <strong className="text-emerald-800">6.0 – 8.0</strong>
                </div>
                <div className="p-2 rounded bg-blue-50 border border-blue-300">
                  <span className="text-[10px] text-blue-700 block font-bold">Bậc 5 (C1)</span>
                  <strong className="text-blue-800">8.5 – 10.0</strong>
                </div>
              </div>
            </div>

            {/* Right: VSTEP Specs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-xs space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-700 uppercase">
                    Khung năng lực 6 bậc Việt Nam
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Luyện Thi VSTEP Chuẩn ĐHQG & Bộ GD&ĐT
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dành cho sinh viên cần chuẩn đầu ra tốt nghiệp B1, học viên thạc sĩ cần B2 hoặc giáo viên tiếng Anh cần C1. Giao diện thi trắc nghiệm trên máy tính giống 100% phần mềm thi chính thức tại các trường ĐH.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Luyện 35 câu Listening 3 phần (Thông báo, Hội thoại, Bài giảng).</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4 Bài đọc học thuật 40 câu hỏi với độ khó tăng dần từ B1 đến C1.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/vstep"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>VÀO THI THỬ VSTEP B1–C1</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SÁCH 3D & EBOOK BÁCH KHOA 15 TRANG */}
        {activeSubTab === 'traps' && (
          <div className="rounded-lg border-2 border-slate-300 bg-white p-6 sm:p-8 shadow-sm animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* 3D Book Cover Image */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm aspect-[16/10] rounded-md overflow-hidden border-2 border-slate-300 shadow-md">
                  <Image
                    src="/images/sat-thu-toeic-3d-book.jpg"
                    alt="Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Book Content & Direct Download */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-1 rounded-sm bg-amber-100 text-amber-900 font-mono font-bold text-xs inline-block">
                    ẤN PHẨM KHẢO THÍ ĐỘC QUYỀN • MIỄN PHÍ 0Đ
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Bách Khoa Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Ấn phẩm 15 trang cô đọng, định lượng từ 2.000 câu hỏi thi thật. Giúp bạn nhận diện 15 bẫy sát thủ phòng thi chỉ trong 3 giây và tăng ngay 100+ điểm Listening mà không cần học vẹt.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>15 Bẫy sát thủ có thống kê số câu, số đề</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>150 Collocation bẫy thi đi kèm audio</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Barem điểm chuẩn ETS & IIG Việt Nam</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tải về đọc ngay dạng PDF điện tử</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/sat-thu-toeic-listening"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>TẢI NGAY BẢN PDF 15 TRANG (0Đ)</span>
                  </Link>
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition"
                  >
                    <span>Làm thử đề thi trực tuyến</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
