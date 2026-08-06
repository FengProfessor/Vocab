'use client';

import { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'lingopro_upgrade_gift_confirmed_20260806_v4';

export function UpgradeGiftModal() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(LOCAL_STORAGE_KEY) === 'true') {
        setIsOpen(false);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!mounted || !isOpen) return null;

  const handleClose = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/40 p-6 md:p-8 shadow-2xl shadow-amber-500/20 text-slate-100">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            🎁 QUÀ TRI ÂN NÂNG CẤP MÁY CHỦ
          </div>
        </div>

        <div className="text-center text-4xl mb-4">🥳</div>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
            Tặng Bạn 7 Ngày Pro Miễn Phí! 🎉
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed px-2">
            LingoPro vừa nâng cấp thành công hệ thống máy chủ **Self-Hosted 100%** siêu tốc.
            Cảm ơn bạn đã luôn đồng hành cùng hệ thống!
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-slate-800/90 border border-amber-500/30 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
              +7D
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm">
                Cộng dồn +7 Ngày Pro ✨
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động kích hoạt & cộng nối tiếp 7 ngày Pro trải nghiệm toàn bộ tính năng cao cấp!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-base shadow-lg shadow-amber-500/25 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <span>🚀 Bắt Đầu Học Ngay</span>
        </button>
      </div>
    </div>
  );
}
