'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import { requestForToken } from '@/lib/firebase';
import { markPushDeviceRegistered } from '@/lib/push-device-state';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bell, ArrowRight, Share, PlusSquare, MoreVertical, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import './onboarding.css';

export function SetupModal() {
  const { isActive, currentStep, next, skip } = useOnboarding();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setNotificationSupported(false);
      return;
    }
    setPermission(Notification.permission);
  }, [isActive, currentStep.id]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const token = await requestForToken();
      if (!token) throw new Error('Không lấy được mã thiết bị. Thử lại sau.');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/push/fcm-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fcmToken: token }),
        });
        const result = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Không lưu được token thông báo lên server.');
        }
        markPushDeviceRegistered();
      }
      setPermission('granted');
      toast.success('Đã bật nhắc ôn tập thành công! 🔔');
    } catch (err) {
      console.error('[Onboarding Setup] Notification error:', err);
      const msg = err instanceof Error ? err.message : 'Không bật được thông báo.';
      toast.error(msg);
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isActive || currentStep.id !== 'setup') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4">
      <div
        className="relative my-auto w-full max-w-md max-h-[min(720px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-indigo-200 bg-white shadow-2xl onboarding-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={skip}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/20 p-1.5 text-white transition hover:bg-black/40 cursor-pointer"
          aria-label="Bỏ qua"
        >
          ✕
        </button>

        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-6 pb-10 text-center relative">
          <div className="absolute top-2 left-6 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="onboarding-mascot-bounce inline-block mb-2">
              <Mascot mood="thinking" size="lg" />
            </div>
            <h2 className="text-2xl font-black text-white">{currentStep.title}</h2>
            <p className="text-indigo-100 font-bold text-sm mt-1">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 pt-5 space-y-4">
          
          {/* Card 1: Notifications */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">🔔 Nhận nhắc nhở ôn tập (FSRS)</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Hệ thống FSRS sẽ gửi thông báo nhắc ôn đúng lúc bạn sắp quên từ vựng để tối ưu trí nhớ.
                </p>
              </div>
            </div>

            <div className="pt-1">
              {!notificationSupported ? (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 p-2.5 rounded-xl text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Trình duyệt không hỗ trợ thông báo đẩy.
                </div>
              ) : permission === 'granted' ? (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 p-2.5 rounded-xl text-xs font-black">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Đã bật thông báo thành công! 🎉
                </div>
              ) : permission === 'denied' ? (
                <div className="flex items-center gap-1.5 text-red-650 bg-red-50 p-2.5 rounded-xl text-xs font-semibold leading-relaxed text-left">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Thông báo bị chặn. Vui lòng vào <strong>Cài đặt trình duyệt</strong> &rarr; Cho phép thông báo của trang này để nhận nhắc học.
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Bật thông báo nhắc học 🔔'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: PWA Install */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">📱 Cài LingoPro lên màn hình chính điện thoại</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Mở LingoPro trên điện thoại và cài đặt ứng dụng (không cần App Store / Play Store):
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1.5">
                <div className="font-black text-slate-700 flex items-center gap-1.5">
                  🍏 Trên iPhone (Safari)
                </div>
                <ul className="space-y-1 text-slate-500 font-semibold list-decimal pl-4">
                  <li>Bấm biểu tượng <strong>Chia sẻ</strong> <Share className="inline h-3.5 w-3.5 text-indigo-500" /></li>
                  <li>Chọn <strong>Thêm vào MH chính</strong> <PlusSquare className="inline h-3.5 w-3.5 text-indigo-500" /></li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1.5">
                <div className="font-black text-slate-700 flex items-center gap-1.5">
                  🤖 Trên Android (Chrome)
                </div>
                <ul className="space-y-1 text-slate-500 font-semibold list-decimal pl-4">
                  <li>Bấm menu <strong>3 chấm</strong> <MoreVertical className="inline h-3.5 w-3.5 text-indigo-500" /></li>
                  <li>Chọn <strong>Thêm vào MH chính</strong> hoặc <strong>Cài đặt ứng dụng</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="pt-2 space-y-2">
            <button
              onClick={next}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Tiếp theo <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={skip}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 py-1 cursor-pointer"
            >
              Bỏ qua hướng dẫn
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body,
  );
}
