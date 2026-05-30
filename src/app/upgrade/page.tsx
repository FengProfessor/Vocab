'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, ChevronLeft, CheckCircle2, Crown, Sparkles,
  Zap, Shield, BookOpen, Star, Loader2, ArrowRight,
  Copy, Clock, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_PRICES, PLAN_LABELS, PERIOD_OPTIONS, computeBasePrice, listPrice, formatVND, getRemainingDays, formatExpiry, applyDiscount, type Coupon } from '@/lib/billing';
import type { Plan } from '@/lib/supabase';

// ─── Constants ───
const BANK_INFO = {
  bank: 'MB Bank',
  accountNumber: '0369 xxx xxx',
  accountName: 'NGUYEN VAN A',
  // Thay thế bằng thông tin thật
};

interface PlanOption {
  plan: Exclude<Plan, 'free'>;
  name: string;
  price: number;
  icon: typeof Crown;
  color: string;
  gradient: string;
  features: string[];
  popular?: boolean;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    plan: 'pro',
    name: 'Pro',
    price: PLAN_PRICES.pro,
    icon: Zap,
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    popular: true,
    features: [
      'Unlimited classrooms & students',
      'Unlimited vocabulary',
      'AI Grammar Module',
      'Writing Practice',
      'PDF Reports',
      'Priority support',
    ],
  },
  {
    plan: 'premium',
    name: 'Premium',
    price: PLAN_PRICES.premium,
    icon: Crown,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    features: [
      'Everything in Pro',
      'AI Grammar: advanced analysis',
      'Custom quizzes with AI',
      'Advanced analytics',
      'API access',
      'Dedicated support',
    ],
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Exclude<Plan, 'free'>>('pro');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState<{
    orderId: string;
    amount: number;
    plan: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .single();
      setCurrentPlan((data?.plan as Plan) ?? 'free');
      setExpiresAt(data?.plan_expires_at ?? null);
      setIsLoading(false);
    })();
  }, [router]);

  // Calculate price — dùng chung computeBasePrice/listPrice với server (billing.ts) để luôn khớp
  const selectedOption = PLAN_OPTIONS.find(p => p.plan === selectedPlan)!;
  const basePrice = listPrice(selectedPlan, periodMonths);            // giá niêm yết (chưa giảm)
  const afterPeriodDiscount = computeBasePrice(selectedPlan, periodMonths); // sau giảm kỳ hạn
  const afterCoupon = couponValid
    ? applyDiscount(afterPeriodDiscount, couponValid)
    : afterPeriodDiscount;
  const totalSaved = basePrice - afterCoupon;

  // Submit order
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          periodMonths,
          paymentMethod: 'bank_transfer',
          couponCode: couponValid?.code ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrderCreated({
        orderId: data.order.id,
        amount: data.order.amount,
        plan: data.order.plan,
      });
      toast.success('Đơn hàng đã được tạo thành công!');
    } catch (err) {
      toast.error(`Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = getRemainingDays(expiresAt);
  const copyBankInfo = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070711]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070711] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b border-white/5 bg-[#070711]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2 font-bold">
          <Brain className="h-5 w-5 text-primary" />
          LingoPro
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Current plan status */}
        {currentPlan !== 'free' && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-xl">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                Gói hiện tại: <span className="text-primary">{PLAN_LABELS[currentPlan]}</span>
              </p>
              {remaining !== null && (
                <p className="text-xs text-slate-400">
                  {remaining > 0
                    ? `Còn ${remaining} ngày — Hết hạn ${formatExpiry(expiresAt)}`
                    : 'Đã hết hạn — Vui lòng gia hạn'
                  }
                </p>
              )}
            </div>
            {remaining !== null && remaining <= 7 && remaining > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                Sắp hết hạn
              </span>
            )}
          </div>
        )}

        {/* If order created — show payment instructions */}
        {orderCreated ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-extrabold mb-2">Đơn hàng đã tạo!</h1>
              <p className="text-slate-400">Vui lòng chuyển khoản theo thông tin bên dưới</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Thông tin chuyển khoản
              </h3>

              <div className="grid gap-3">
                {[
                  { label: 'Ngân hàng', value: BANK_INFO.bank },
                  { label: 'Số tài khoản', value: BANK_INFO.accountNumber },
                  { label: 'Chủ tài khoản', value: BANK_INFO.accountName },
                  { label: 'Số tiền', value: formatVND(orderCreated.amount) },
                  { label: 'Nội dung CK', value: `LINGOPRO ${orderCreated.orderId.slice(0, 8).toUpperCase()}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{item.value}</span>
                      <button
                        onClick={() => copyBankInfo(item.value)}
                        className="text-slate-500 hover:text-primary transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Chờ xác nhận</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Sau khi chuyển khoản, gói sẽ được kích hoạt trong vòng 2-24 giờ.
                      Admin sẽ kiểm tra và xác nhận thanh toán.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Quay về trang chính
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Upgrade your learning
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                Chọn gói phù hợp
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Mở khóa toàn bộ tính năng AI, grammar, và analytics nâng cao
              </p>
            </div>

            {/* Plan cards */}
            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              {PLAN_OPTIONS.map(opt => {
                const isSelected = selectedPlan === opt.plan;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.plan}
                    onClick={() => setSelectedPlan(opt.plan)}
                    className={`relative text-left border rounded-2xl p-6 transition-all ${
                      isSelected
                        ? `bg-gradient-to-br ${opt.gradient} shadow-lg shadow-primary/10 ring-2 ring-primary/50`
                        : 'bg-white/3 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {opt.popular && (
                      <div className="absolute -top-3 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full">
                        Popular
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/10' : 'bg-white/5'}`}>
                        <Icon className={`h-5 w-5 ${opt.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{opt.name}</h3>
                        <p className="text-sm text-slate-400">
                          {formatVND(opt.price)}<span className="text-xs">/tháng</span>
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </div>
                    <ul className="space-y-2">
                      {opt.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Period selector */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Thời hạn
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.months}
                    onClick={() => setPeriodMonths(opt.months)}
                    className={`relative p-3 rounded-xl border text-center transition-all ${
                      periodMonths === opt.months
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <p className="font-bold text-sm">{opt.label}</p>
                    {opt.discountPct === null ? (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Rẻ nhất
                      </span>
                    ) : opt.discountPct > 0 ? (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                        -{opt.discountPct}%
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" /> Mã giảm giá
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã coupon…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => {
                    // Simplified: just accept the code, actual validation happens server-side
                    if (couponCode.trim()) {
                      setCouponValid({
                        id: '', code: couponCode.trim(), discount_pct: null, discount_amount: null,
                        max_uses: null, used_count: 0, valid_from: '', valid_until: null,
                        applicable_plans: null, is_active: true,
                      });
                      toast.success('Mã sẽ được xác nhận khi đặt hàng');
                    }
                  }}
                  className="bg-primary/10 text-primary font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/20 transition-colors text-sm"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6 mb-8">
              <h3 className="font-bold mb-4">Tổng thanh toán</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    {selectedOption.name} × {periodMonths} tháng
                  </span>
                  <span>{formatVND(basePrice)}</span>
                </div>
                {basePrice > afterPeriodDiscount && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Ưu đãi kỳ hạn</span>
                    <span>-{formatVND(basePrice - afterPeriodDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="font-bold text-lg">Tổng cộng</span>
                  <div className="text-right">
                    <span className="font-extrabold text-2xl text-primary">{formatVND(afterCoupon)}</span>
                    {totalSaved > 0 && (
                      <p className="text-xs text-emerald-400 mt-0.5">Tiết kiệm {formatVND(totalSaved)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Nâng cấp ngay
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              Thanh toán an toàn · Hỗ trợ 24/7
            </p>
          </>
        )}
      </main>
    </div>
  );
}
