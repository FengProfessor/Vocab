'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Sparkles,
  Gift,
  Award,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';

/* ─── 1. URGENCY COUNTDOWN BAR (Bright & Warm) ─── */
export function ReferoUrgencyCountdownBar() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 11,
    minutes: 42,
    seconds: 19,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const target = new Date();
    target.setHours(23, 59, 59, 999);

    const update = () => {
      const now = new Date();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
      setMounted(true);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
        {/* Left flame & slot info */}
        <div className="flex items-center gap-2 font-bold tracking-wide">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-200" />
          </span>
          <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
          <span>
            <strong className="text-yellow-200">ĐỢT ƯU ĐÃI THÁNG NÀY:</strong> Đã có{' '}
            <u className="decoration-yellow-300 font-black">43/50 bạn</u> giữ chỗ VIP 0đ
          </span>
          <span className="hidden md:inline-flex items-center gap-1 ml-2 bg-black/20 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-white/20">
            <span>86% slot</span>
            <span className="w-12 h-1.5 bg-white/30 rounded-full inline-block overflow-hidden">
              <span className="block h-full bg-yellow-300 w-[86%]" />
            </span>
          </span>
        </div>

        {/* Right timer & CTA */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-full border border-white/20 font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5 text-yellow-300" />
            <span>Còn:</span>
            <span className="text-yellow-200 tracking-wider font-mono">
              {mounted
                ? `${format(timeLeft.hours)}:${format(timeLeft.minutes)}:${format(timeLeft.seconds)}`
                : '11:42:19'}
            </span>
          </div>

          <Link
            href="/sat-thu-toeic-listening"
            className="hidden sm:inline-flex items-center gap-1 bg-white text-orange-700 hover:bg-yellow-50 font-extrabold px-3 py-1 rounded-full text-xs shadow-xs transition-transform active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Nhận Gói 0đ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── 2. FLOATING SOCIAL PROOF POPUP (FOMO - Bright Theme) ─── */
interface SocialProofItem {
  id: number;
  name: string;
  school: string;
  action: string;
  timeAgo: string;
  type: 'gift' | 'streak' | 'upgrade';
}

const NOTIFICATIONS: SocialProofItem[] = [
  {
    id: 1,
    name: 'Nguyễn Tuấn A.',
    school: 'ĐH Bách Khoa Hà Nội',
    action: 'vừa tải trọn bộ Ebook 15 Bẫy Sát Thủ TOEIC',
    timeAgo: '2 phút trước',
    type: 'gift',
  },
  {
    id: 2,
    name: 'Trần Thị Mai',
    school: 'ĐH Kinh Tế Quốc Dân (NEU)',
    action: 'đã đạt chuỗi 30 ngày học FSRS liên tục',
    timeAgo: '5 phút trước',
    type: 'streak',
  },
  {
    id: 3,
    name: 'Hoàng Minh V.',
    school: 'ĐH Ngoại Thương (FTU)',
    action: 'vừa kích hoạt tài khoản VIP Pro 3 tháng',
    timeAgo: '8 phút trước',
    type: 'upgrade',
  },
  {
    id: 4,
    name: 'Lê Quỳnh Nga',
    school: 'ĐH Sư Phạm TP.HCM',
    action: 'vừa hoàn thành bài test chẩn đoán phản xạ (28/30đ)',
    timeAgo: '11 phút trước',
    type: 'gift',
  },
  {
    id: 5,
    name: 'Phạm Đăng Khoa',
    school: 'Học Viện Tài Chính',
    action: 'đạt mốc 90 ngày & nhận lại 100% tiền cọc',
    timeAgo: '14 phút trước',
    type: 'streak',
  },
];

export function ReferoFloatingSocialProof() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const initial = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 3000);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        if (!dismissed) {
          setIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
          setVisible(true);
        }
      }, 800);
    }, 10000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed) return null;

  const item = NOTIFICATIONS[index];

  return (
    <aside
      aria-label="Thông báo học viên"
      className={`hidden sm:block fixed bottom-20 left-4 sm:left-6 z-40 max-w-xs sm:max-w-sm transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative rounded-md bg-white border border-slate-300 p-3.5 shadow-xl flex items-start gap-3 text-left">
        <div className="size-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
          {item.type === 'gift' && <Gift className="w-4 h-4 text-blue-600" />}
          {item.type === 'streak' && <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />}
          {item.type === 'upgrade' && <Award className="w-4 h-4 text-emerald-600" />}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-900 truncate">{item.name}</span>
            <span className="text-[10px] text-slate-500 truncate">({item.school})</span>
          </div>
          <p className="text-xs text-slate-700 leading-snug mt-0.5 font-medium">{item.action}</p>
          <span className="text-[10px] font-mono text-indigo-600 font-bold mt-1 block">{item.timeAgo}</span>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

/* ─── 3. VALUE STACK SECTION (Bright Theme) ─── */
export function ReferoValueStack() {
  const items = [
    {
      title: 'Ấn phẩm Ebook "Sát Thủ Bài Nghe TOEIC ETS 2024 & 2026"',
      value: '500.000₫',
      desc: '10 trang định lượng giải mã 20 bộ đề thi mới nhất + công thức phản xạ 3 giây.',
    },
    {
      title: 'Kho từ điển 150 Cụm từ Collocation bẫy thi tần suất cao',
      value: '300.000₫',
      desc: 'Đi kèm file Markdown, Audio bản xứ 4 chất giọng và ví dụ phân tầng.',
    },
    {
      title: '7 Ngày trải nghiệm gói VIP Pro FSRS v5 không giới hạn',
      value: '150.000₫',
      desc: 'Tự động lên lịch ôn ngắt quãng cho toàn bộ từ vựng cá nhân trên web và app.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>GÓI QUÀ KHỞI ĐỘNG 0Đ</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Toàn Bộ Học Liệu & Quà Tặng Bạn Nhận Được Hôm Nay
            </h3>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{it.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{it.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400 line-through shrink-0 sm:text-right">
                  Trị giá: {it.value}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Tổng giá trị thực tế: 950.000₫</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                Ưu đãi hôm nay: 0₫
              </span>
            </div>

            <Link
              href="/sat-thu-toeic-listening"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <span>Nhận Ngay Trọn Bộ 0đ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 4. GUARANTEE SEAL (Bright Theme) ─── */
export function ReferoGuaranteeSeal() {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-xs">
        <div className="size-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-7 h-7 text-amber-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Cam Kết Vàng: Hoàn Tiền 100% Trong 14 Ngày Nếu Không Hài Lòng
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Nếu bạn cảm thấy phương pháp không giúp bạn nhớ từ vựng lâu hơn hoặc không phù hợp với thói quen học tập của bạn, chỉ cần gửi 1 tin nhắn hỗ trợ — LingoPro sẽ hoàn lại 100% chi phí mà không hỏi thêm bất kỳ điều kiện phức tạp nào.
          </p>
        </div>
      </div>
    </section>
  );
}
