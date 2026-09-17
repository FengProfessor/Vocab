'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Gift, Award, X, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: number;
  type: 'challenge' | 'lead' | 'refund';
  name: string;
  location: string;
  action: string;
  timeAgo: string;
}

const proofNotifications: NotificationItem[] = [
  {
    id: 1,
    type: 'challenge',
    name: 'Nguyễn Tuấn A.',
    location: 'ĐH Bách Khoa Hà Nội',
    action: 'vừa đăng ký Thử Thách 6 Tháng',
    timeAgo: '2 phút trước',
  },
  {
    id: 2,
    type: 'lead',
    name: 'Trần Thị Mai',
    location: 'ĐH Kinh Tế Quốc Dân (NEU)',
    action: 'vừa nhận Sổ Tay 3000 Từ Vựng 0đ',
    timeAgo: '4 phút trước',
  },
  {
    id: 3,
    type: 'refund',
    name: 'Hoàng Minh V.',
    location: 'ĐH Ngoại Thương (FTU)',
    action: 'đạt mốc 90 ngày & nhận lại 300.000đ cọc',
    timeAgo: '7 phút trước',
  },
  {
    id: 4,
    type: 'challenge',
    name: 'Lê Quỳnh Nga',
    location: 'ĐH Sư Phạm TP.HCM',
    action: 'vừa đăng ký Thử Thách 3 Tháng',
    timeAgo: '9 phút trước',
  },
  {
    id: 5,
    type: 'lead',
    name: 'Phạm Đăng Khoa',
    location: 'Học Viện Tài Chính',
    action: 'vừa tải Ebook 3000 Từ & Đề Test 5 Phút',
    timeAgo: '12 phút trước',
  },
];

export function FloatingSocialProof() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let subTimer: ReturnType<typeof setTimeout> | null = null;

    // Initial delay before first popup
    const initialTimer = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 3500);

    // Rotation interval
    const interval = setInterval(() => {
      setVisible(false);
      subTimer = setTimeout(() => {
        if (!dismissed) {
          setCurrentIndex((prev) => (prev + 1) % proofNotifications.length);
          setVisible(true);
        }
      }, 1000);
    }, 9000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (subTimer) clearTimeout(subTimer);
    };
  }, [dismissed]);

  if (dismissed) return null;

  const item = proofNotifications[currentIndex];

  const getIcon = () => {
    switch (item.type) {
      case 'challenge':
        return <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'lead':
        return <Gift className="w-4 h-4 text-indigo-500" />;
      case 'refund':
        return <Award className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getBadgeColor = () => {
    switch (item.type) {
      case 'challenge':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'lead':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'refund':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-3.5 pr-4 rounded-2xl shadow-xl border border-slate-200/80 max-w-sm transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 shadow-inner">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <strong className="text-xs font-bold text-slate-900 truncate">{item.name}</strong>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${getBadgeColor()}`}>
            {item.timeAgo}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 truncate mt-0.5">
          <span className="text-slate-800 font-semibold">{item.action}</span>
        </p>
        <div className="text-[10px] text-slate-400 truncate">{item.location}</div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
