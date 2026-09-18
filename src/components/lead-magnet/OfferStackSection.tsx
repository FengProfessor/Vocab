'use client';

import React from 'react';
import { Gift, BookOpen, Headphones, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface OfferStackSectionProps {
  onScrollToOptin: () => void;
  onReadOnline: () => void;
}

export default function OfferStackSection({ onScrollToOptin, onReadOnline }: OfferStackSectionProps) {
  const stackItems = [
    {
      id: 1,
      badge: 'ẤN PHẨM CỐT LÕI',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Ebook Sát Thủ Bài Nghe TOEIC (10 Trang Tinh Gọn)',
      originalValue: '250,000đ',
      desc: 'Thiết kế chuẩn A4, mỗi trang 1 chuyên đề độc lập giải mã 15 bẫy sát thủ phòng thi, bẫy Being 100% sai, câu hỏi đuôi (+200%), đối thoại 3 người (+150%).',
      features: [
        'Dẫn chứng thực tế từ 20 đề ETS 2024 & ETS 2026',
        'Công thức phản xạ 3 giây bẻ gãy bẫy ETS',
        'Có sẵn bản PDF để in ấn và đọc trực tuyến',
      ],
      icon: BookOpen,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 2,
      badge: 'BẢO BỐI TỪ VỰNG',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      title: 'Kho 150 Cụm Từ & Collocation Tần Suất Cao Nhất ETS 2026',
      originalValue: '150,000đ',
      desc: 'Trích xuất trực tiếp từ 2,000 câu hỏi nghe thực tế. Loại bỏ từ vựng thừa, chỉ tập trung vào các từ thượng danh (hypernyms) và cụm bẫy mồi nhử.',
      features: [
        'Đầy đủ phiên âm IPA & giải nghĩa tiếng Việt xúc tích',
        'Cảnh báo bẫy thi độc quyền kèm vị trí câu hỏi trong đề thật',
        'Có thanh tra cứu và nghe phát âm chuẩn bản xứ',
      ],
      icon: Gift,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 3,
      badge: 'HUẤN LUYỆN TAI NGHE',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      title: 'File Audio MP3 "Phản Xạ 3 Giây" Tốc Độ 1.1x',
      originalValue: '100,000đ',
      desc: 'Tuyển tập các đoạn audio bẫy kinh điển được tăng tốc độ 1.1x để kích thích thích ứng thính giác, giúp bạn khi vào phòng thi cảm thấy băng đọc chậm và rõ mồn một.',
      features: [
        'Tải về máy nghe mọi lúc mọi nơi',
        'Bao gồm 4 giọng đọc chuẩn quốc tế: Mỹ, Anh, Úc, Canada',
        'Kèm transcript phụ đề song ngữ đối chiếu',
      ],
      icon: Headphones,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 4,
      badge: 'ĐẶC QUYỀN CÔNG NGHỆ',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      title: 'Voucher 7 Ngày VIP Pro Trải Nghiệm Luyện Nghe FSRS',
      originalValue: '199,000đ',
      desc: 'Mở khóa toàn bộ tính năng luyện nghe ngắt quãng FSRS, chế độ Shadowing Focus Player đồng bộ từng mili-giây trên nền tảng LingoPro.',
      features: [
        'Luyện nghe 20 đề chuẩn ETS 2024 & 2026 trên web',
        'Báo cáo tự động phân tích điểm yếu thính giác',
        'Kích hoạt tức thì không cần thẻ tín dụng',
      ],
      icon: Sparkles,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/80 border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Gift className="w-3.5 h-3.5" />
            Bóc Tách Trọn Gói Quà Tặng Độc Quyền
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bên Trong Gói Quà Tặng <span className="text-rose-600 line-through">699,000đ</span> Có Gì?
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Chúng tôi không chỉ gửi một file PDF đơn thuần. Đây là <strong className="text-slate-900 font-semibold">Hệ Thống Huấn Luyện Thính Giác Hoàn Chỉnh</strong> bao gồm đầy đủ tài liệu, công cụ và đặc quyền công nghệ giúp bạn bứt phá 450+ điểm.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stackItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                        {item.originalValue}
                      </span>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        0đ (Miễn Phí)
                      </span>
                    </div>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${item.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-indigo-600 transition">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Value Summary Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50 border border-indigo-200/90 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              Tổng Giá Trị Thực Tế: 699,000đ
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Hôm Nay: Miễn Phí 100% Cho 500 Lượt Đăng Ký Sớm Nhất
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              Chỉ mất 5 giây nhập email. Hệ thống máy chủ tự động gửi link tải Google Drive tốc độ cao ngay lập tức.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={onReadOnline}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 shadow-sm transition cursor-pointer"
            >
              Đọc Thử Online
            </button>
            <button
              type="button"
              onClick={onScrollToOptin}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Nhận Ngay Trọn Bộ 0đ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
