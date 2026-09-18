'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star,
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

interface StudentCase {
  id: string;
  name: string;
  school: string;
  avatarText: string;
  avatarBg: string;
  scoreBefore: string;
  scoreAfter: string;
  gain: string;
  exam: string;
  date: string;
  highlight: string;
  quote: string;
  proofBadge: string;
}

const STUDENT_CASES: StudentCase[] = [
  {
    id: 'case-1',
    name: 'Trần Minh Hoàng',
    school: 'ĐH Ngoại Thương Hà Nội (FTU)',
    avatarText: 'MH',
    avatarBg: 'bg-blue-600',
    scoreBefore: '315 LC',
    scoreAfter: '445 LC',
    gain: '+130 điểm',
    exam: 'TOEIC Listening',
    date: 'Thi đợt 12/08/2026',
    highlight: 'Né sạch bẫy "Being" Part 1',
    quote:
      'Trước đây mình rất hay bị lừa ở Part 1 với mấy câu có being, cứ nghe thấy máy đọc là mừng rỡ khoanh luôn. Xem phân tích 20 bộ đề ETS 2026 mới vỡ lẽ 11/11 câu being ở tranh tĩnh đều là mồi nhử. Vào phòng thi thật mình né sạch bẫy, Part 1 đúng trọn vẹn 6/6 câu.',
    proofBadge: 'Xác thực bảng điểm IIG',
  },
  {
    id: 'case-2',
    name: 'Phạm Đức Dũng',
    school: 'Kỹ sư Vi Mạch (Khu Công Nghệ Cao Q9)',
    avatarText: 'ĐD',
    avatarBg: 'bg-emerald-600',
    scoreBefore: '280 LC',
    scoreAfter: '425 LC',
    gain: '+145 điểm',
    exam: 'TOEIC Listening',
    date: 'Thi đợt 04/09/2026',
    highlight: 'Mẹo gióng cột biểu đồ Part 3-4',
    quote:
      'Đi làm bận tối mắt, mỗi tối chỉ dành được 15 phút. Nhờ hệ thống nhắc đúng từ sắp quên và mẹo gióng cột đối diện ở biểu đồ Part 3-4, mắt vừa liếc biểu đồ là tai bắt trúng từ đồng nghĩa phát ra. Tăng 145 điểm sau đúng 1 tháng.',
    proofBadge: 'Xác thực bảng điểm IIG',
  },
  {
    id: 'case-3',
    name: 'Nguyễn Lê Quỳnh Anh',
    school: 'Chuyên viên Nhân sự tại FPT Software',
    avatarText: 'QA',
    avatarBg: 'bg-indigo-600',
    scoreBefore: '360 LC',
    scoreAfter: '470 LC',
    gain: '+110 điểm',
    exam: 'TOEIC Listening',
    date: 'Thi đợt 25/07/2026',
    highlight: 'Bắt trọn câu thoái thác Part 2',
    quote:
      'Part 2 đề mới không còn Yes/No đơn giản nữa mà hơn 40% là câu trả lời vòng vo đùn việc. Nhờ cẩm nang 15 câu cửa miệng ngầm ý và quy tắc phản xạ 3 giây, mình nghe hiểu ngay ý người nói mà không phải cố dịch nhẩm từng từ.',
    proofBadge: 'Xác thực bảng điểm IIG',
  },
  {
    id: 'case-4',
    name: 'Lê Thanh Hằng',
    school: 'ĐHQG Hà Nội (Trường ĐH Ngoại Ngữ)',
    avatarText: 'TH',
    avatarBg: 'bg-purple-600',
    scoreBefore: 'Chưa đạt B1',
    scoreAfter: 'Đạt B2 (7.0đ)',
    gain: 'Vượt chuẩn B2',
    exam: 'VSTEP B1–B2–C1',
    date: 'Thi đợt 18/08/2026',
    highlight: 'Ăn trọn điểm Reading 4 bài',
    quote:
      'Cần bằng B2 nộp chuẩn đầu ra thạc sĩ gấp trong 1 tháng. Mình cày nát 4 bài đọc học thuật và bộ từ vựng phân tầng C1 trên LingoPro. Phòng thi máy tính y hệt giao diện luyện tập nên tâm lý cực kỳ vững vàng.',
    proofBadge: 'Chứng chỉ VSTEP B2',
  },
];

export function ReferoProofWall() {
  return (
    <section id="proof-wall" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
      {/* Concrete Stats Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 mb-16 shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="space-y-1 pt-3 md:pt-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-mono block">
              18.500+
            </span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">Học viên đang ôn luyện</span>
          </div>

          <div className="space-y-1 pt-3 md:pt-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono block">
              +135 đ
            </span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">Điểm tăng trung bình sau 30 ngày</span>
          </div>

          <div className="space-y-1 pt-3 md:pt-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono block">
              94.2%
            </span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">Học viên đạt chuẩn cam kết</span>
          </div>

          <div className="space-y-1 pt-3 md:pt-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono block">
              20 Bộ Đề
            </span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">ETS 2026 & VSTEP có lời giải</span>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="text-center space-y-2.5 mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5 text-blue-600" />
          <span>Dẫn Chứng & Kết Quả Phòng Thi Thật</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          Học Thật, Thi Thật: Điểm Số Của Học Viên
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Thí sinh trực tiếp áp dụng phương pháp của LingoPro để bứt phá điểm số trong các kỳ thi gần nhất.
        </p>
      </div>

      {/* Grid: 4 Real Student Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {STUDENT_CASES.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              {/* Header card: Name, School, Gain */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-md ${c.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-xs`}>
                    {c.avatarText}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {c.school}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <TrendingUp className="w-3 h-3" />
                    {c.gain}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{c.date}</span>
                </div>
              </div>

              {/* Score Transition Badge */}
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Trước học:</span>
                  <span className="font-mono font-bold text-slate-700">{c.scoreBefore}</span>
                </div>
                <span className="text-slate-400 font-bold">&rarr;</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Sau ôn luyện:</span>
                  <span className="font-mono font-black text-blue-700 text-sm">{c.scoreAfter}</span>
                </div>
              </div>

              {/* Strategy Highlight */}
              <div className="text-xs">
                <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                  {c.highlight}
                </span>
              </div>

              {/* Quote */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                &ldquo;{c.quote}&rdquo;
              </p>
            </div>

            {/* Verification Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {c.proofBadge}
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Proof Showcase Banner */}
      <div className="rounded-lg border border-slate-200 bg-slate-900 text-white p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="space-y-4 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Video Phản Hồi Trực Tiếp Từ Học Viên</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Xem Trực Tiếp Trải Nghiệm & Cách Thí Sinh Bứt Phá Điểm
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Xem trích đoạn video học viên chia sẻ về việc làm quen với 4 chất giọng đọc chuẩn ETS, cách luyện chép chính tả 3 bước và giải đề VSTEP trực tuyến.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-sm"
            >
              <span>Trải nghiệm học thử 0đ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sat-thu-toeic-listening"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition"
            >
              <span>Xem tài liệu bẫy thi</span>
            </Link>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="w-full lg:w-[440px] aspect-video rounded-md overflow-hidden border border-slate-700 bg-black relative shadow-lg">
          <video
            src="/student-cases.mp4"
            poster="/lingopro-demo-5min-poster.jpg"
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
