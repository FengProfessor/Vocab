'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // first item open by default

  const faqs = [
    {
      q: 'Bách khoa Sát Thủ Bài Nghe TOEIC ETS 2024 & 2026 có gì khác biệt so với các tài liệu mẹo vặt thông thường?',
      a: 'Khác với các tài liệu mẹo vặt máy móc thời kỳ cũ (ETS 2019-2022) vốn đã bị Viện Khảo Thí ETS vô hiệu hóa, tài liệu này được đúc kết từ dữ liệu khảo thí định lượng của 20 bộ đề chuẩn ETS 2024 và 2026 (2,000 câu hỏi). Toàn bộ 15 bẫy sát thủ, bẫy being (100% sai), bẫy câu hỏi đuôi (+200%), đối thoại 3 người (+150%) và quy luật đổi chữ paraphrase 3 tầng đều có dẫn chứng số câu, số đề thực tế và công thức phản xạ 3 giây chuẩn xác.',
    },
    {
      q: 'Tại sao trong đề thi ETS 2026, các phương án chứa từ "being" ở Part 1 lại có tỷ lệ sai 100%?',
      a: 'Theo thống kê thực nghiệm trên 10 đề ETS 2026, 11/11 phương án xuất hiện cấu trúc is/are being + V-ed trong tranh tĩnh không có người thao tác đều là bẫy mồi nhử. ETS cố tình gài để loại các thí sinh học vẹt công thức mà không quan sát hành động thực tế của con người trong tranh.',
    },
    {
      q: 'Part 2 đề thi mới 2024–2026 có xu hướng ra đề như thế nào?',
      a: 'Part 2 hiện nay đã cắt giảm triệt để các câu trả lời trực tiếp (Yes/No, thời gian cụ thể). Thay vào đó, hơn 40% câu hỏi sử dụng phản xạ trả lời vòng vo, thoái thác hoặc bẻ lái câu hỏi (như đùn đẩy trách nhiệm: "Clara is already organizing one"). Ngoài ra, số lượng câu hỏi đuôi tăng vọt từ 6 lên 18 câu (+200%) nhằm gài bẫy thói quen dịch nghĩa của người Việt.',
    },
    {
      q: 'Làm thế nào để nhận trọn bộ Ebook, File Audio và Mã VIP Pro 7 ngày?',
      a: 'Bạn chỉ cần nhập địa chỉ Email vào biểu mẫu trên trang web. Hệ thống máy chủ tự động của LingoPro sẽ gửi ngay link tải trọn gói gồm: Ebook chuẩn PDF 10 trang, File tài liệu Markdown, bộ từ điển 150 cụm từ và mã kích hoạt 7 ngày trải nghiệm luyện nghe FSRS trên nền tảng.',
    },
    {
      q: 'Lộ trình 30 ngày trong Ebook có phù hợp với người mất gốc tiếng Anh không?',
      a: 'Hoàn toàn phù hợp. Lộ trình được thiết kế theo 4 chặng từ cơ bản đến nâng cao: Tuần 1 giải mã Part 1 & Part 2, Tuần 2 bẻ khóa bẫy vòng vo, Tuần 3 làm chủ Paraphrase 3 tầng và Tuần 4 thi thử áp lực 45 phút. Kèm theo đó là công nghệ FSRS của LingoPro giúp tự động ngắt quãng ôn tập thính giác phù hợp với từng bạn.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/80 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            Giải Đáp Thắc Mắc &amp; Khảo Thí
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Những thắc mắc phổ biến nhất của thí sinh trước kỳ thi TOEIC 2026 và cách tận dụng tối đa tài liệu độc quyền từ LingoPro.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:border-indigo-300 transition duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      Q{idx + 1}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {faq.q}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in-50 duration-200">
                    <p className="pl-9">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
