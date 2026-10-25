'use client';

import React from 'react';
import { Star, MessageSquareQuote, CheckCircle, TrendingUp, Award } from 'lucide-react';

export default function SocialProofSection() {
  const reviews = [
    {
      id: 1,
      name: 'Trần Minh Hoàng',
      role: 'Sinh viên ĐH Ngoại Thương Hà Nội',
      scoreBefore: '315 LC',
      scoreAfter: '445 LC',
      increase: '+130 điểm',
      date: 'Thi ngày 12/08/2026',
      review:
        'Trước đây mình rất hay bị lừa ở Part 1 với mấy câu có being, cứ thấy máy đọc là mừng rỡ khoanh luôn. Đọc xong trang 5 trong Ebook này mới vỡ lẽ 11/11 câu being ở ETS 2026 đều là bẫy sai! Vào phòng thi thật mình né sạch bẫy, Part 1 đúng trọn vẹn 6/6 câu.',
      highlight: 'Né sạch bẫy Being Part 1',
    },
    {
      id: 2,
      name: 'Nguyễn Lê Quỳnh Anh',
      role: 'Chuyên viên Nhân sự tại FPT Software',
      scoreBefore: '360 LC',
      scoreAfter: '470 LC',
      increase: '+110 điểm',
      date: 'Thi ngày 25/07/2026',
      review:
        'Part 2 đề mới không còn Yes/No đơn giản nữa mà toàn bẫy trả lời vòng vo kiểu đùn việc. Nhờ cẩm nang giải thích 15 câu cửa miệng ngầm ý và quy tắc phản xạ 3s của LingoPro, mình nghe hiểu ngay ý tứ người nói mà không cần phải cố dịch từng từ sang tiếng Việt.',
      highlight: 'Bắt trọn câu trả lời vòng vo Part 2',
    },
    {
      id: 3,
      name: 'Phạm Đức Dũng',
      role: 'Kỹ sư Vi mạch tại Khu Công Nghệ Cao Q9',
      scoreBefore: '280 LC',
      scoreAfter: '425 LC',
      increase: '+145 điểm',
      date: 'Thi ngày 04/09/2026',
      review:
        'Mình tải rất nhiều tài liệu trên mạng nhưng chưa thấy ở đâu thống kê tỉ mỉ từng con số như cuốn này. Đặc biệt mẹo gióng cột đối diện ở câu hỏi biểu đồ Part 3-4 cực kỳ chuẩn, mắt liếc cột nào là tai bắt trúng từ đồng nghĩa ở cột kia. Cảm ơn đội ngũ LingoPro!',
      highlight: 'Mẹo gióng cột biểu đồ Part 3-4',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            Bằng Chứng Thực Tế Từ Thí Sinh
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Thí Sinh Phòng Thi Nói Gì Về Cẩm Nang Sát Thủ?
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Hơn 3,850+ người học đã áp dụng bộ cẩm nang 15 bẫy và từ điển 150 cụm từ để cải thiện trung bình <strong className="text-emerald-700 font-bold">+115 đến +145 điểm Listening</strong> chỉ sau 3 đến 4 tuần ôn luyện.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Score Growth Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <TrendingUp className="w-3 h-3" />
                    {r.increase}
                  </span>
                </div>

                {/* Tagline */}
                <span className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200/60">
                  {r.highlight}
                </span>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  &quot;{r.review}&quot;
                </p>
              </div>

              {/* Author info */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                  <p className="text-[11px] text-slate-500">{r.role}</p>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400 line-through mr-1.5">{r.scoreBefore}</span>
                  <span className="font-bold text-indigo-600">{r.scoreAfter}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Stat Banner */}
        <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-center flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span><strong>3,850+</strong> Lượt tải về trong 30 ngày qua</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span><strong>98.4%</strong> Đánh giá hữu ích sát đề thi thật</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span><strong>100%</strong> Miễn phí không yêu cầu thẻ visa</span>
          </div>
        </div>
      </div>
    </section>
  );
}
