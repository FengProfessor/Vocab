'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Flame,
  Bookmark,
  ArrowRight,
  X,
  MapPin,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PROVINCES, isKnownProvince } from '@/lib/provinces';

export const KHAIGIANG_MODAL_SEEN_KEY = 'lingo_khaigiang_modal_seen';

export interface WelcomeKhaiGiangModalProps {
  open?: boolean;
  onClose?: () => void;
  defaultProvince?: string;
  initialCode?: string;
}

export function WelcomeKhaiGiangModal({
  open: controlledOpen,
  onClose,
  defaultProvince = '',
  initialCode = 'KHAIGIANG3M',
}: WelcomeKhaiGiangModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(defaultProvince);
  const [streakCommitted, setStreakCommitted] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const isQueryTriggered =
    searchParams.get('welcome') === '1' || searchParams.get('khaigiang') === '1';
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClose = useCallback(() => {
    try {
      localStorage.setItem(KHAIGIANG_MODAL_SEEN_KEY, 'true');
    } catch {}
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }, [onClose]);

  useEffect(() => {
    if (controlledOpen === undefined && isQueryTriggered) {
      const timer = window.setTimeout(() => {
        try {
          if (localStorage.getItem(KHAIGIANG_MODAL_SEEN_KEY) !== 'true') {
            setInternalOpen(true);
          }
        } catch {
          setInternalOpen(true);
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [controlledOpen, isQueryTriggered]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      localStorage.setItem(KHAIGIANG_MODAL_SEEN_KEY, 'true');
    } catch {}

    import('canvas-confetti')
      .then((confetti) => {
        confetti.default({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
        });
      })
      .catch(() => undefined);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    closeBtnRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleClose]);

  const handleSaveAndNavigate = async (destination: string = '/journey') => {
    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        const payload: Record<string, unknown> = {};
        if (selectedProvince && (isKnownProvince(selectedProvince) || selectedProvince.trim().length > 0)) {
          payload.province = selectedProvince.trim();
        }
        if (streakCommitted) {
          payload.daily_goal = 15;
          payload.notification_hour = 20;
        }

        if (Object.keys(payload).length > 0) {
          await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(payload),
          }).catch(() => null);
        }
      }
    } catch {
      // Non-blocking catch
    } finally {
      setIsSaving(false);
      handleClose();
      router.push(destination);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="khaigiang-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative my-auto w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-slate-950 text-slate-100 shadow-2xl p-5 sm:p-7 animate-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          ref={closeBtnRef}
          onClick={handleClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative space-y-5">
          {/* Header Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>CHÀO MỪNG KHAI GIẢNG 05/09 · MÃ: {initialCode}</span>
            </div>
            <h2
              id="khaigiang-modal-title"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300"
            >
              Kích Hoạt Thành Công 3 Tháng VIP Pro! 🎉
            </h2>
          </div>

          {/* Personal message from Thầy Phong */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 p-4 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-sm">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1.5">
              <GraduationCap className="h-4 w-4 text-amber-400" />
              <span>Thầy Phong gửi tặng em:</span>
            </div>
            <p>
              &ldquo;Chào mừng em đến với LingoPro! Thầy rất vui vì em đã sẵn sàng bắt đầu lại từ đầu để xóa bỏ hoàn toàn nỗi sợ tiếng Anh. Dưới đây là phương pháp lấy gốc vững chắc mà Thầy đã chuẩn bị cho em trong 90 ngày tới.&rdquo;
            </p>
          </div>

          {/* 2 Core Pillars: Foundation Methodology */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>Lộ trình xóa mất gốc toàn diện:</span>
            </p>

            {/* Pillar 1 */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Trụ cột 1: Lấy gốc Ngữ pháp Chặng A0 (Thì & chia động từ)</span>
              </div>
              <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                Nắm chắc đại từ nhân xưng, các thì cơ bản và quy tắc chia động từ sinh tồn. Xóa sạch cảm giác mơ hồ, tự tin ghép câu chuẩn ngay từ ngày đầu.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Trụ cột 2: Nạp 2.000–3.000 từ vựng sống còn với thuật toán Spaced Repetition (FSRS)</span>
              </div>
              <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                Thuật toán lặp lại ngắt quãng hiện đại tự động tính toán &amp; nhắc em ôn tập đúng &ldquo;thời điểm vàng&rdquo;, giúp từ vựng ngấm sâu vào trí nhớ dài hạn.
              </p>
            </div>
          </div>

          {/* Hook: Lưu từ vựng cá nhân */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-indigo-300 mb-1">
              <Bookmark className="h-4 w-4 text-indigo-400" />
              <span>Mẹo học độc quyền: Lưu từ vựng cá nhân</span>
            </div>
            <p>
              Khi làm bài đọc hoặc tra từ trong app, chỉ cần <strong>chạm 2 lần (double-tap)</strong> hoặc bấm nút <strong>&ldquo;+&rdquo;</strong> để lưu ngay từ mới vào sổ từ. Hệ thống FSRS sẽ tự lên lịch ôn tập cho em mỗi ngày!
            </p>
          </div>

          {/* Cam kết Chiến binh 7 ngày (7-Day Streak Challenge) */}
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-3.5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={streakCommitted}
                onChange={(e) => setStreakCommitted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400/50 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs sm:text-sm">
                  <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />
                  <span>Kích hoạt: Cam kết Chiến binh 7 ngày</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Em cam kết học tối thiểu 15 phút mỗi ngày trong 7 ngày liên tiếp để xây dựng thói quen bứt phá (App sẽ gửi thông báo nhắc lúc 20:00).
                </p>
              </div>
            </label>
          </div>

          {/* Province Dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="welcome-province-select"
              className="text-xs font-bold text-slate-300 flex items-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>Em đang học tập tại Tỉnh / Thành phố nào?</span>
            </label>
            <select
              id="welcome-province-select"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs sm:text-sm font-semibold text-slate-100 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            >
              <option value="">-- Chọn Tỉnh / Thành phố của em --</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSaveAndNavigate('/journey')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-5 py-3.5 text-sm sm:text-base font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang thiết lập lộ trình...</span>
                </>
              ) : (
                <>
                  <span>Bắt đầu bài học đầu tiên ngay (Chặng A0)</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between px-1 text-xs">
              <button
                type="button"
                onClick={() => void handleSaveAndNavigate('/grammar/learn')}
                className="text-slate-400 hover:text-emerald-300 transition underline underline-offset-4 cursor-pointer"
              >
                Học Ngữ pháp Chặng 1
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                Để sau, vào trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
