'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import { ONBOARDING_TOTAL_XP } from './onboarding-steps';
import { Crown, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import './onboarding.css';

const Celebration = dynamic(
  () => import('@/components/gamification/Celebration').then((m) => m.Celebration),
  { ssr: false },
);

/**
 * Step cuối: Modal phần thưởng + Mã Pro 2 tuần + Kích hoạt trực tiếp.
 */
export function RewardModal() {
  const { isActive, currentStep, complete } = useOnboarding();
  const [xpCount, setXpCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // XP counter animation
  useEffect(() => {
    if (!isActive || currentStep.id !== 'reward') return;

    // Trigger celebration sau 300ms
    const celebTimer = setTimeout(() => setShowCelebration(true), 300);

    // Count-up XP
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
      await navigator.clipboard.writeText('NEWBIE2W');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Đã copy mã NEWBIE2W vào bộ nhớ tạm!');
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleActivatePro = async () => {
    setActivationStatus('loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Bạn cần đăng nhập để kích hoạt');
      }

      const referralSource = localStorage.getItem('lingopro_referral_source') || 'not_specified';

      const res = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'pro',
          periodMonths: 1, // backend will override duration for NEWBIE2W
          paymentMethod: 'manual',
          couponCode: 'NEWBIE2W',
          note: `Referral source: ${referralSource}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi kích hoạt');
      }

      if (data.success && data.order?.status === 'paid') {
        setActivationStatus('success');
        // calculate 14 days later
        const d = new Date();
        d.setDate(d.getDate() + 14);
        const formatted = d.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        setExpiryDate(formatted);
        toast.success('Kích hoạt Pro 2 tuần thành công!');
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
    'Writing Practice (luyện viết)',
    'AI tạo Quiz tự động',
    'Ngữ pháp đầy đủ + bài tập',
    'AI Speaking Tutor (luyện nói)',
    'AI không giới hạn lượt/ngày',
    'Hỗ trợ ưu tiên',
  ];

  return createPortal(
    <>
      <Celebration
        trigger={showCelebration}
        triggerKey="onboarding-complete"
        intensity="epic"
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm onboarding-fade-in overflow-y-auto">
        <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border-b-8 border-amber-200 onboarding-zoom-in my-4">
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 p-6 pb-10 text-center rounded-t-[32px] relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-2 left-6 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10" />

            <div className="relative z-10">
              <div className="onboarding-mascot-bounce inline-block mb-2">
                <Mascot mood="cheer" size="lg" />
              </div>
              <h2 className="text-2xl font-black text-white">Tuyệt vời! 🎉</h2>
              <p className="text-white/90 font-bold text-sm mt-1">
                Bạn đã hoàn thành hướng dẫn
              </p>
            </div>
          </div>

          {/* XP Badge */}
          <div className="flex justify-center -mt-7 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-200 px-8 py-3 flex items-center gap-3">
              <span className="text-3xl">🏅</span>
              <div className="text-center">
                <div className="text-3xl font-black text-amber-500 onboarding-shimmer">
                  +{xpCount} XP
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Phần thưởng tân thủ</div>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="p-6 pt-5 space-y-4">
            {activationStatus === 'idle' && (
              <>
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quà Tặng Tân Thủ Pro 2 Tuần</p>
                  <p className="text-sm font-semibold text-slate-600 mb-2">Nhập mã ưu đãi hoặc kích hoạt trực tiếp bên dưới:</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="font-mono font-black text-xl text-indigo-700 bg-white border border-indigo-200 px-4 py-1.5 rounded-xl shadow-sm tracking-wider">
                      NEWBIE2W
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors flex items-center gap-1 px-3 py-1.5"
                      title="Sao chép mã"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="text-xs font-bold">Sao chép</span>}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Dùng mã này tại trang nâng cấp hoặc bấm nút kích hoạt nhanh bên dưới.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleActivatePro}
                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    🚀 Kích Hoạt 2 Tuần PRO Miễn Phí
                  </button>

                  <button
                    onClick={complete}
                    className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-200 cursor-pointer"
                  >
                    Bỏ qua & dùng bản Free ➔
                  </button>
                </div>
              </>
            )}

            {activationStatus === 'loading' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="font-bold text-indigo-700">Đang kích hoạt gói Pro 2 tuần của bạn...</p>
                <p className="text-xs text-slate-400">Vui lòng chờ trong giây lát</p>
              </div>
            )}

            {activationStatus === 'success' && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce">
                  ✨
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-emerald-800 text-xl">Kích hoạt Pro thành công! 🎉</h3>
                  <p className="text-sm font-semibold text-emerald-700">
                    Tài khoản của bạn đã được mở khóa đặc quyền Pro trong 2 tuần.
                  </p>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Hạn dùng đến ngày: <span className="text-indigo-700 text-sm font-black">{expiryDate}</span>
                  </p>
                </div>
                
                <button
                  onClick={complete}
                  className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg shadow-emerald-200 border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                    Bạn vẫn có thể nhận quà bằng cách sao chép mã <span className="font-mono font-bold text-red-650 bg-red-100/50 px-2 py-0.5 rounded">NEWBIE2W</span> và tự nhập tại trang nâng cấp.
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
                    onClick={complete}
                    className="flex-1 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors border border-slate-200"
                  >
                    Học bản Free trước
                  </button>
                </div>
              </div>
            )}

            {/* Pro features list */}
            {activationStatus !== 'success' && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-black text-slate-500 mb-2 flex items-center gap-1.5 justify-center">
                  <Crown className="h-3.5 w-3.5 text-indigo-600 animate-pulse" /> Đặc quyền gói Pro của bạn gồm:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-left">
                  {proFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
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
