'use client';

import { useEffect, useRef } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';

interface WluWelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WluWelcomeModal({ open, onClose }: WluWelcomeModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    closeBtnRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wlu-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber-400/40 bg-slate-900 text-slate-100 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect background */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />

        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative space-y-5 text-center">
          {/* Header Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
            <Sparkles className="h-7 w-7" />
          </div>

          <h2 id="wlu-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-amber-300">
            Kích hoạt thành công mã WLU 🎉
          </h2>

          <div className="space-y-4 text-left text-sm sm:text-[15px] leading-relaxed text-slate-200">
            <p>
              Xin chào ace, xin cảm ơn ace đã dành thêm thời gian để luyện tập ngoại ngữ, mong rằng thông qua app nhỏ bé này giúp cho ace trên con đường học tập thật tốt và bày tỏ tốt.
            </p>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5 text-amber-200 font-medium text-center">
              Lưu ý: mình dùng nội bộ cho ace thôi nhé ạ &lt;3
            </div>

            <p className="text-center font-medium text-emerald-300">
              Và nếu thật tuyệt vời nếu ace cho e xin 1 lượt PR ha &lt;3
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.99]"
          >
            <Heart className="h-5 w-5 fill-slate-950" />
            Đã hiểu &amp; Cảm ơn!
          </button>
        </div>
      </div>
    </div>
  );
}
