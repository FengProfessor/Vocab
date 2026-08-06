'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Celebration } from '@/components/gamification/Celebration';
import { Mascot } from '@/components/gamification/Mascot';
import { Sparkles, Gift, CheckCircle2, X } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'lingopro_upgrade_gift_confirmed_20260806_v2';

interface ClaimResult {
  success: boolean;
  alreadyClaimed?: boolean;
  isExtended?: boolean;
  daysAdded?: number;
  planExpiresAt?: string;
  message?: string;
}

export function UpgradeGiftModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [claimData, setClaimData] = useState<ClaimResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    // 1. Nếu đã nhận trên trình duyệt này -> bỏ qua
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(LOCAL_STORAGE_KEY) === 'true') return;

    async function checkAndClaimGift(activeSession?: any) {
      try {
        let session = activeSession;
        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }
        if (!session?.access_token) {
          try {
            const rawToken = localStorage.getItem('sb-jyhdxhqkftirncbstfpe-auth-token');
            if (rawToken) {
              const parsed = JSON.parse(rawToken);
              if (parsed.access_token && parsed.user) {
                session = parsed;
              }
            }
          } catch {
            // ignore
          }
        }
        if (!session?.access_token || !session.user) return;


        let data: ClaimResult | null = null;

        try {
          let res = await fetch('/api/billing/claim-upgrade-gift', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (!res.ok) {
            res = await fetch('/api/campaign/claim-upgrade-gift', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
            });
          }
          if (res.ok) {
            data = await res.json();
          }
        } catch {
          data = null;
        }

        // Fallback trực tiếp qua Supabase nếu API bị vướng
        if (!data || !data.success) {
          const userId = session.user.id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan, plan_expires_at')
            .eq('id', userId)
            .maybeSingle();

          const { data: history } = await supabase
            .from('subscription_history')
            .select('id')
            .eq('user_id', userId)
            .eq('reason', 'campaign_upgrade_gift_20260806')
            .limit(1);

          const alreadyClaimed = (history && history.length > 0);
          const now = new Date();
          let newExpiresAt: Date;
          let isExtended = false;

          if (profile?.plan === 'pro' && profile.plan_expires_at) {
            const currentExpiry = new Date(profile.plan_expires_at);
            if (currentExpiry > now) {
              newExpiresAt = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
              isExtended = true;
            } else {
              newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
          } else {
            newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          if (!alreadyClaimed) {
            await supabase
              .from('profiles')
              .update({
                plan: 'pro',
                plan_expires_at: newExpiresAt.toISOString(),
              })
              .eq('id', userId);

            await supabase.from('subscription_history').insert({
              user_id: userId,
              old_plan: profile?.plan || 'free',
              new_plan: 'pro',
              reason: 'campaign_upgrade_gift_20260806',
            });
          }


          data = {
            success: true,
            alreadyClaimed: !!alreadyClaimed,
            isExtended,
            daysAdded: 7,
            planExpiresAt: alreadyClaimed && profile?.plan_expires_at ? profile.plan_expires_at : newExpiresAt.toISOString(),
            message: '7 ngày Pro tri ân nâng cấp máy chủ.',
          };
        }

        if (data && data.success) {
          (window as any).__upgrade_gift_debug = { data, isOpen: true };
          setClaimData(data);
          setIsOpen(true);
          setCelebrate(true);
        } else {
          (window as any).__upgrade_gift_debug = { data, isOpen: false, reason: 'data_not_success' };
        }
      } catch (err: any) {
        (window as any).__upgrade_gift_debug = { error: err?.message || String(err), isOpen: false };
        console.error('[UpgradeGiftModal] Error checking gift:', err);
      }

    }


    // Delay nhẹ 800ms để dashboard tải xong trước khi bật quà
    const timer = setTimeout(() => {
      void checkAndClaimGift();
    }, 800);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void checkAndClaimGift(session);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);


  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };


  if (!isOpen || !claimData) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <Celebration trigger={celebrate} intensity="epic" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/30 p-6 md:p-8 shadow-2xl shadow-amber-500/10 text-slate-100 animate-in zoom-in-95 duration-300">
        {/* Nút đóng góc phải */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
            <Gift className="h-4 w-4 animate-bounce text-amber-400" />
            <span>Quà Tri Ân Nâng Cấp Máy Chủ</span>
          </div>
        </div>

        {/* Linh vật Mascot chúc mừng */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
            <Mascot mood="happy" className="h-24 w-24 relative drop-shadow-xl" />
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
            Tặng Bạn 7 Ngày Pro Miễn Phí! 🎉
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed px-2">
            LingoPro vừa nâng cấp thành công hệ thống máy chủ **Self-Hosted 100%** siêu tốc.
            Cảm ơn bạn đã luôn đồng hành cùng hệ thống!
          </p>
        </div>

        {/* Thẻ quyền lợi nhận được */}
        <div className="mb-6 rounded-2xl bg-slate-800/80 border border-amber-500/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              +7D
            </div>
            <div>
              <div className="font-bold text-slate-100 text-base flex items-center gap-1.5">
                {claimData.isExtended ? 'Cộng dồn +7 Ngày Pro' : 'Kích hoạt 7 Ngày Pro Đếm Ngược'}
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {claimData.isExtended
                  ? 'Gói Pro hiện tại của bạn đã được cộng nối tiếp thêm 7 ngày trải nghiệm.'
                  : 'Trải nghiệm full tính năng Pro: Luyện nói AI, Tra cụm từ Pro, Ngữ pháp nâng cao...'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-amber-200/90 font-medium px-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Đã áp dụng tự động
            </span>
            {claimData.planExpiresAt && (
              <span>Hạn dùng: {new Date(claimData.planExpiresAt).toLocaleDateString('vi-VN')}</span>
            )}
          </div>
        </div>

        {/* Lời chúc */}
        <p className="text-center text-xs font-medium text-amber-300/90 mb-6 italic">
          &quot;Chúc các bạn học tập thật tốt và bứt phá mục tiêu điểm số! 🚀&quot;
        </p>

        {/* Nút Chunky 3D */}
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
