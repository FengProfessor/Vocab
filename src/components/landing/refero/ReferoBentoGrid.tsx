'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Repeat2,
  Bot,
  Headphones,
  Mic,
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export function ReferoBentoGrid() {
  return (
    <section id="apps" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          <span>Trụ Cột 03: Kho Ứng Dụng Thực Chiến</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Hàng Chục Ứng Dụng Thay Thế 5–6 Phần Mềm Rời Rạc
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Không cần mua riêng app luyện nghe, app học ngữ pháp, app chép chính tả hay flashcard. LingoPro tích hợp toàn diện mọi công cụ chuyên sâu trong một cỗ máy học tập thống nhất.
        </p>
      </div>

      {/* Structured Clean Bento Grid (Sharp Geometry, Authentic Product Visuals) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* CARD 1: Luyện Nghe Phụ Đề Song Ngữ & Chép Chính Tả (8 cols) */}
        <article className="md:col-span-12 lg:col-span-8 rounded-lg bg-white border border-slate-300 overflow-hidden shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
          <div className="p-6 sm:p-7 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
              <Headphones className="w-3.5 h-3.5 text-sky-600" />
              <span>Luyện Nghe Phụ Đề Song Ngữ & Chép Chính Tả</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nghe Thấu Mọi Ngữ Cảnh: Tua Chậm, Lặp Câu & 4 Giọng Đọc Bản Ngữ
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Học qua video đời sống thực tế với phụ đề đồng bộ chính xác từng mili-giây. Bạn có thể bật chế độ song ngữ, ẩn phụ đề để thử thách tai nghe, lặp đoạn A-B khó nghe hoặc điều chỉnh tốc độ từ 0.75x đến 1.25x.
            </p>
          </div>

          {/* Real Screenshot Preview of the Video Player */}
          <div className="px-6 pb-6 space-y-3">
            <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border border-slate-300 bg-slate-900 shadow-inner">
              <Image
                src="/test-artifacts/listening/05-player-bilingual-sync.png"
                alt="Giao diện luyện nghe video phụ đề song ngữ LingoPro"
                fill
                sizes="(max-width: 1024px) 100vw, 65vw"
                className="object-cover object-top"
              />
              <div className="absolute top-2 left-2 bg-black/80 text-white font-mono text-[10px] px-2 py-1 rounded border border-slate-700">
                Giao Diện Luyện Nghe Trực Tiếp
              </div>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Chất giọng</span>
                <strong className="text-slate-900">Mỹ • Anh • Úc • Can</strong>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Tốc độ tuỳ chỉnh</span>
                <strong className="text-blue-700 font-mono">0.75x – 1.25x</strong>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Chế độ luyện</span>
                <strong className="text-emerald-700 font-mono">Chép chính tả A-B</strong>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Tra từ tức thì</span>
                <strong className="text-slate-900 font-mono">1-Click Tra Từ</strong>
              </div>
            </div>
          </div>
        </article>

        {/* CARD 2: Cỗ Máy Ghi Nhớ Ngắt Quãng FSRS v5 (4 cols) */}
        <article className="md:col-span-12 lg:col-span-4 rounded-lg bg-white border border-slate-300 p-6 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              <Repeat2 className="w-3.5 h-3.5" />
              <span>Thuật Toán Trí Nhớ Khoa Học</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Nhắc Ôn Tập Đúng Tích Tắc Trước Khi Quên
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dựa trên đường cong lãng quên Ebbinghaus. Hệ thống tự động đo lường độ khó của từng từ và lên lịch nhắc ôn trong 5 giây mà không cần chép phạt.
            </p>
          </div>

          {/* Retention Comparison Bar */}
          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">Tỷ lệ duy trì sau 30 ngày:</span>
              <span className="text-emerald-700 font-bold font-mono">Gấp 4.4 lần</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-900 font-bold">Phương pháp LingoPro</span>
                  <span className="text-emerald-700 font-bold font-mono">92.4%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-xs overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[92.4%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Cách học chép phạt cũ</span>
                  <span className="text-rose-600 font-bold font-mono">21.0%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-xs overflow-hidden">
                  <div className="bg-rose-400 h-full w-[21%]" />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-1">
              ✓ Ôn 8–10 phút mỗi ngày ➔ Tích lũy 600 từ mới / tháng.
            </div>
          </div>

          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tự động đồng bộ giữa điện thoại, máy tính & Chrome.</span>
          </div>
        </article>

        {/* CARD 3: Bác Sĩ Ngữ Pháp AI (4 cols) */}
        <article className="md:col-span-12 lg:col-span-4 rounded-lg bg-white border border-slate-300 p-6 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
              <Bot className="w-3.5 h-3.5 text-purple-600" />
              <span>Bác Sĩ Ngữ Pháp AI (Grammar Doctor)</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Mổ Xẻ Cặn Kẽ: Tại Sao Sai & Cách Sửa Chuẩn
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Không đưa đáp án suông. Giải thích bản chất cấu trúc ngữ pháp, chỉ ra bẫy mồi nhử thường gặp trong đề thi và ngữ cảnh giao tiếp.
            </p>
          </div>

          {/* Grammar Explainer Snippet */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="p-2.5 rounded bg-slate-900 text-white font-mono text-[11px] space-y-1">
              <span className="text-slate-400 block text-[10px]">CÂU HỎI NGỮ PHÁP PART 5:</span>
              <p>&ldquo;The committee insisted that the audit report _____ completed immediately.&rdquo;</p>
              <div className="text-slate-300 grid grid-cols-2 gap-1 text-[10px] pt-1">
                <span className="text-rose-400 line-through">❌ (A) was / (B) is</span>
                <span className="text-emerald-400 font-bold">✅ (C) be completed</span>
              </div>
            </div>
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
              👉 <strong>Bẫy Thể Giả Định (Subjunctive):</strong> Sau động từ <em>insist that + S + (should) + V-bare</em>. 80% thí sinh bị lừa chọn thì quá khứ.
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            ✓ Kèm theo 120 bài giảng ngữ pháp cốt lõi chuẩn GFM sinh động.
          </div>
        </article>

        {/* CARD 4: Luyện Nói Phản Xạ Shadowing (4 cols) */}
        <article className="md:col-span-12 lg:col-span-4 rounded-lg bg-white border border-slate-300 p-6 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
              <Mic className="w-3.5 h-3.5 text-rose-600" />
              <span>Luyện Nói & Phản Xạ Shadowing</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Nhại Giọng Bản Ngữ: Sửa Phát Âm Chuẩn IPA
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nghe câu thoại mẫu từ người bản ngữ, lặp lại và nhận phản hồi chấm điểm ngữ điệu, nối âm (linking sounds) và trọng âm câu.
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-bold">Độ chuẩn xác phát âm IPA:</span>
              <span className="text-emerald-700 font-mono font-bold">96/100 Điểm</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
              &ldquo;First of all, every morning my alarm goes off...&rdquo;
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Nối âm mượt mà: <em>First of all</em> [ˈfɜːst əv ɔːl]</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            ✓ Tự tin mở miệng giao tiếp và trả lời Speaking trôi chảy.
          </div>
        </article>

        {/* CARD 5: Thư Viện 200+ Video Đời Sống Thực Tế (4 cols) */}
        <article className="md:col-span-12 lg:col-span-4 rounded-lg bg-white border border-slate-300 p-6 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thư Viện 200+ Video & Chủ Đề</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Học Tiếng Anh Thật Từ Cuộc Sống Thật
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Từ giao tiếp công sở, phỏng vấn, đàm phán đến ẩm thực, du lịch và tin tức công nghệ từ TED, BBC, CNN.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 text-lg block font-mono">200+</strong>
              <span className="text-slate-500 text-[11px]">Video tuyển chọn</span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <strong className="text-emerald-700 text-lg block font-mono">7 Chủ đề</strong>
              <span className="text-slate-500 text-[11px]">Từ A2 đến C1</span>
            </div>
          </div>

          <div className="pt-1">
            <Link
              href="/auth"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200"
            >
              <span>Khám phá toàn bộ kho ứng dụng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
