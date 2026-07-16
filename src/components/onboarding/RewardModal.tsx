'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import {
  ONBOARDING_PRO_COUPON,
  ONBOARDING_PRO_DAYS,
  ONBOARDING_PRO_LABEL,
  ONBOARDING_TOTAL_XP,
} from './onboarding-steps';
import { Crown, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import './onboarding.css';

const Celebration = dynamic(
  () => import('@/components/gamification/Celebration').then((m) => m.Celebration),
  { ssr: false },
);

/**
 * Step cuối: Modal phần thưởng + mã Pro 1 tuần + kích hoạt trực tiếp.
 */
export function RewardModal() {
  const { isActive, currentStep, complete } = useOnboarding();
  const [xpCount, setXpCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (!isActive || currentStep.id !== 'reward') return;

    const celebTimer = setTimeout(() => setShowCelebration(true), 300);

    const target = ONBOARDING_TOTAL_XP;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setXpCount(target);
        clearInterval(interval);
      } else {
        setXpCount(Math.round(current));
      }
    }, duration / steps);

    return () => {
      clearTimeout(celebTimer);
      clearInterval(interval);
    };
  }, [isActive, currentStep.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ONBOARDING_PRO_COUPON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`Đã copy mã ${ONBOARDING_PRO_COUPON} vào bộ nhớ tạm!`);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleActivatePro = async () => {
    setActivationStatus('loading');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Bạn cần đăng nhập để kích hoạt');
      }

      const referralSource = localStorage.getItem('lingopro_referral_source') || 'not_specified';

      const res = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'pro',
          periodMonths: 1, // backend override → ONBOARDING_PRO_DAYS
          paymentMethod: 'manual',
          couponCode: ONBOARDING_PRO_COUPON,
          note: `Onboarding tour gift ${ONBOARDING_PRO_DAYS}d | referral: ${referralSource}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi kích hoạt');
      }

      if (data.success && data.order?.status === 'paid') {
        setActivationStatus('success');
        const d = new Date();
        d.setDate(d.getDate() + ONBOARDING_PRO_DAYS);
        const formatted = d.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        setExpiryDate(formatted);
        toast.success(`Kích hoạt Pro ${ONBOARDING_PRO_LABEL} thành công!`);
      } else {
        throw new Error(data.error || 'Trạng thái đơn hàng không hợp lệ');
      }
    } catch (err) {
      console.error('[Onboarding] Activate error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setActivationStatus('error');
    }
  };

  if (!isActive || currentStep.id !== 'reward') return null;

  const proFeatures = [
    'Lộ trình CEFR A2→B2 (Free: A0–A1)',
    'Ngữ pháp đầy đủ + bài tập',
    'Thư viện gói từ Pro',
    'Tra từ & lưu kho',
    'AI hỗ trợ học (quota cao hơn)',
    'Hỗ trợ ưu tiên',
  ];

  return createPortal(
    <>
      <Celebration
        trigger={showCelebration}
        triggerKey="onboarding-complete"
        intensity="epic"
      />
      <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4">
        <div className="relative my-auto w-full max-w-md max-h-[min(720px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-amber-200 bg-white shadow-2xl onboarding-zoom-in">
          <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 px-5 pb-9 pt-6 text-center">
            <div className="relative z-10">
              <div className="onboarding-mascot-bounce mb-1 inline-block">
                <Mascot mood="cheer" size="lg" />
              </div>
              <h2 className="text-2xl font-black text-white">Tuyệt vời! 🎉</h2>
              <p className="mt-1 text-sm font-bold text-white/90">Đã xong hướng dẫn</p>
            </div>
          </div>

          <div className="relative z-10 -mt-6 flex justify-center">
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-200 bg-white px-6 py-2.5 shadow-xl">
              <span className="text-2xl">🏅</span>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500 onboarding-shimmer">
                  +{xpCount} XP
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Thưởng tour</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 pt-4">
            {activationStatus === 'idle' && (
              <>
                <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4 text-center">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Quà tặng · Pro {ONBOARDING_PRO_LABEL}
                  </p>
                  <p className="mb-2 text-sm font-semibold text-slate-600">
                    Dùng free Pro đúng {ONBOARDING_PRO_DAYS} ngày (1 tuần) — mã:
                  </p>
                  <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 font-mono text-lg font-black tracking-wider text-indigo-700 shadow-sm">
                      {ONBOARDING_PRO_COUPON}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-xl bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-200"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : 'Sao chép'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Mở khóa lộ trình A2+, ngữ pháp Pro, thư viện Pro trong {ONBOARDING_PRO_LABEL}.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleActivatePro}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 text-base font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:translate-y-0.5 active:border-b-0 sm:h-14 sm:text-lg"
                  >
                    🚀 Kích hoạt Pro {ONBOARDING_PRO_LABEL} miễn phí
                  </button>

                  <button
                    type="button"
                    onClick={complete}
                    className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Bỏ qua & dùng Free ➔
                  </button>
                </div>
              </>
            )}

            {activationStatus === 'loading' && (
              <div className="space-y-3 py-8 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="font-bold text-indigo-700">
                  Đang kích hoạt Pro {ONBOARDING_PRO_LABEL}...
                </p>
              </div>
            )}

            {activationStatus === 'success' && (
              <div className="space-y-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  ✨
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-emerald-800">Pro {ONBOARDING_PRO_LABEL} đã bật! 🎉</h3>
                  <p className="text-sm font-semibold text-emerald-700">
                    Bạn có đặc quyền Pro trong đúng {ONBOARDING_PRO_LABEL} ({ONBOARDING_PRO_DAYS} ngày).
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Hết hạn:{' '}
                    <span className="text-sm font-black text-indigo-700">{expiryDate}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={complete}
                  className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border-b-4 border-emerald-800 bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:translate-y-0.5 active:border-b-0"
                >
                  Bắt đầu học ngay! 🎯
                </button>
              </div>
            )}

            {activationStatus === 'error' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto">
                  ⚠️
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-red-800 text-base">Không thể kích hoạt tự động</h3>
                  <p className="text-xs text-red-700 font-medium leading-relaxed">
                    Lỗi: {errorMessage}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Sao chép mã{' '}
                    <span className="font-mono font-bold bg-red-100/50 px-2 py-0.5 rounded">
                      {ONBOARDING_PRO_COUPON}
                    </span>{' '}
                    và nhập tại trang nâng cấp.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/upgrade"
                    onClick={complete}
                    className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Đi đến nâng cấp
                  </Link>
                  <button
                    type="button"
                    onClick={complete}
                    className="flex-1 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors border border-slate-200"
                  >
                    Học bản Free trước
                  </button>
                </div>
              </div>
            )}

            {activationStatus !== 'success' && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-black text-slate-500 mb-2 flex items-center gap-1.5 justify-center">
                  <Crown className="h-3.5 w-3.5 text-indigo-600 animate-pulse" /> Đặc quyền gói Pro:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-left">
                  {proFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <span className="text-indigo-500 text-[10px]">✦</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
