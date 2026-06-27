'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, ChevronLeft, CheckCircle2, Crown, Sparkles,
  Zap, Shield, Star, Loader2, ArrowRight,
  Copy, Clock, CreditCard, Users, Minus, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PLAN_PRICES, PLAN_LABELS, PERIOD_OPTIONS, computeBasePrice, listPrice,
  formatVND, getRemainingDays, formatExpiry, applyDiscount, type Coupon,
  computeGroupPrice, listGroupPrice, GROUP_SEAT_PRICE, getGroupSeatPrice,
  GROUP_SEATS_MIN, GROUP_SEATS_MAX, GROUP_SEATS_DEFAULT,
} from '@/lib/billing';
import type { Plan } from '@/lib/supabase';

// ─── Constants ───
const BANK_INFO = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank',
  bankId: process.env.NEXT_PUBLIC_BANK_ID || 'MB',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0369 xxx xxx',
  accountName: process.env.NEXT_PUBLIC_BANK_OWNER || 'NGUYEN VAN A',
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

// Tính năng gói Free hiện tại — để người dùng SO SÁNH với Pro.
const FREE_FEATURES: string[] = [
  'Học từ vựng + flashcard ôn tập thông minh (SRS)',
  'Tra từ bằng AI — 5 lượt/ngày',
  'Quiz từ vựng cơ bản',
  'Tham gia lớp học bằng mã mời',
];

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
      'Tất cả tính năng Free — KHÔNG giới hạn',
      'Tra từ AI không giới hạn (Free: 5 lượt/ngày)',
      'AI tạo quiz từ vựng riêng cho bạn',
      'Luyện viết + AI chấm & sửa lỗi',
      'Học ngữ pháp + AI phân tích câu, ôn câu sai',
      'Giáo viên: lớp học & học sinh không giới hạn',
      'Báo cáo tiến độ PDF · Hỗ trợ ưu tiên',
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
  const [billingMode, setBillingMode] = useState<'individual' | 'group'>('individual');
  const [seats, setSeats] = useState(GROUP_SEATS_DEFAULT);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState<{
    orderId: string;
    amount: number;
    plan: string;
    status?: string;
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

  // Real-time polling for order status
  useEffect(() => {
    if (!orderCreated || orderCreated.status === 'paid' || orderCreated.amount === 0) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status, plan, expires_at')
          .eq('id', orderCreated.orderId)
          .single();

        if (error) throw error;

        if (data?.status === 'paid') {
          // Play celebration confetti
          import('canvas-confetti').then((confetti) => {
            confetti.default({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
          }).catch(err => console.error(err));

          setOrderCreated(prev => prev ? { ...prev, status: 'paid' } : null);
          setCurrentPlan((data.plan as Plan) ?? 'free');
          setExpiresAt(data.expires_at ?? null);
          toast.success('Kích hoạt gói thành công!');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('[Billing Polling] Error checking order status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderCreated]);

  // Calculate price — dùng chung computeBasePrice/listPrice với server (billing.ts) để luôn khớp
  const isGroupMode = billingMode === 'group';
  const selectedOption = PLAN_OPTIONS.find(p => p.plan === selectedPlan)!;
  const basePrice = isGroupMode                                        // giá niêm yết (chưa giảm)
    ? listGroupPrice(seats, periodMonths)
    : listPrice(selectedPlan, periodMonths);
  const afterPeriodDiscount = isGroupMode                             // sau giảm kỳ hạn
    ? computeGroupPrice(seats, periodMonths)
    : computeBasePrice(selectedPlan, periodMonths);
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
        body: JSON.stringify(isGroupMode ? {
          orderKind: 'group',
          seats,
          periodMonths,
          paymentMethod: 'bank_transfer',
          couponCode: couponValid?.code ?? undefined,
        } : {
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
        status: data.order.status,
      });
      toast.success(data.order.status === 'paid' ? 'Kích hoạt gói thành công!' : 'Đơn hàng đã được tạo thành công!');
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
      <div className="min-h-dvh flex items-center justify-center bg-[#070711]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#070711] text-white font-sans">
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
          orderCreated.status === 'paid' || orderCreated.amount === 0 ? (
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-extrabold mb-2 text-emerald-400">Kích hoạt thành công!</h1>
              <p className="text-slate-300">
                Tài khoản của bạn đã được nâng cấp lên gói <span className="font-bold text-primary">{PLAN_LABELS[orderCreated.plan as Plan]}</span> miễn phí bằng mã ưu đãi.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Gói nâng cấp</span>
                  <span className="font-bold">{PLAN_LABELS[orderCreated.plan as Plan]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Trạng thái</span>
                  <span className="font-bold text-emerald-400">Đã kích hoạt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Mã đơn hàng</span>
                  <span className="font-mono text-xs text-slate-400">{orderCreated.orderId}</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/student"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 w-full justify-center group"
                >
                  Bắt đầu học ngay
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-extrabold mb-2">Đơn hàng đã tạo!</h1>
                <p className="text-slate-400">Vui lòng quét mã QR hoặc chuyển khoản thủ công để hoàn tất thanh toán</p>
              </div>

              <div className="grid md:grid-cols-5 gap-6 items-start">
                {/* Left Column: VietQR Code (2/5 width) */}
                <div className="md:col-span-2 flex flex-col items-center justify-center bg-white/3 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Outer gradient glow for QR */}
                  <div className="relative w-full max-w-[220px] aspect-square bg-gradient-to-tr from-primary/30 to-purple-500/30 p-1 rounded-2xl overflow-hidden shadow-xl shadow-black/50">
                    <div className="absolute inset-0 bg-[#070711] rounded-[14px]" />
                    <div className="relative bg-white p-2 rounded-[14px] w-full h-full flex items-center justify-center">
                      <img 
                        src={`https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact.png?amount=${orderCreated.amount}&addInfo=LINGOPRO%20${orderCreated.orderId.slice(0, 8).toUpperCase()}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`} 
                        alt="VietQR Code" 
                        className="w-full h-full object-contain rounded"
                      />
                      {/* Scanline overlay */}
                      <div className="absolute left-2 right-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-scan pointer-events-none" />
                    </div>
                  </div>

                  <div className="mt-4 text-center space-y-1.5 z-10">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Auto VietQR
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Mở app ngân hàng quét mã để thanh toán tự động
                    </p>
                  </div>
                </div>

                {/* Right Column: Order Details (3/5 width) */}
                <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Thông tin tài khoản
                  </h3>

                  <div className="grid gap-2.5">
                    {[
                      { label: 'Ngân hàng', value: BANK_INFO.bank },
                      { label: 'Số tài khoản', value: BANK_INFO.accountNumber },
                      { label: 'Chủ tài khoản', value: BANK_INFO.accountName },
                      { label: 'Số tiền', value: formatVND(orderCreated.amount) },
                      { label: 'Nội dung CK', value: `LINGOPRO ${orderCreated.orderId.slice(0, 8).toUpperCase()}` },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 hover:bg-white/8 transition-colors">
                        <span className="text-xs text-slate-400">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{item.value}</span>
                          <button
                            onClick={() => copyBankInfo(item.value)}
                            className="text-slate-500 hover:text-primary transition-colors cursor-pointer p-1 rounded hover:bg-white/10"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-400">Hệ thống đang chờ thanh toán</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Vui lòng giữ nguyên trang này. Tài khoản sẽ tự động kích hoạt ngay sau khi chuyển khoản thành công (thông thường chỉ mất 3-10 giây).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  Quay về trang chính
                </Link>
              </div>

              {/* Scanline keyframes style */}
              <style jsx global>{`
                @keyframes scan {
                  0%, 100% { transform: translateY(0); opacity: 0; }
                  10%, 90% { opacity: 0.8; }
                  50% { transform: translateY(200px); opacity: 0.8; }
                }
                .animate-scan {
                  animation: scan 2.5s ease-in-out infinite;
                }
              `}</style>
            </div>
          )
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
                Nâng cấp Pro để mở khóa toàn bộ tính năng AI, ngữ pháp và luyện viết — không giới hạn
              </p>
            </div>

            {/* Split layout: Gói cá nhân bên trái, Gói nhóm bên phải */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative mb-8">
              
              {/* Cột trái: Gói cá nhân */}
              <div 
                onClick={() => setBillingMode('individual')}
                className={`border rounded-3xl p-6 transition-all space-y-6 ${
                  !isGroupMode 
                    ? 'border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-transparent shadow-lg shadow-violet-500/5 ring-1 ring-violet-500/30' 
                    : 'border-white/10 bg-white/3 opacity-70 hover:opacity-90 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-violet-400" />
                    Gói Cá Nhân
                  </h3>
                  {!isGroupMode && (
                    <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                      Đang chọn
                    </span>
                  )}
                </div>

                {/* Sub-grid so sánh Free vs Pro */}
                <div className="space-y-4">
                  {/* Free Plan Card */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-300">Free Plan (Hiện tại)</span>
                      <span className="font-extrabold text-sm text-slate-400">0₫</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-400">
                      <li className="flex items-center gap-1.5">
                        <span className="text-red-400">✕</span> Giới hạn 5 lượt tra cứu từ bằng AI / ngày
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span> Học từ vựng & ôn tập Spaced Repetition (SRS)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span> Luyện nói phát âm cơ bản
                      </li>
                    </ul>
                  </div>

                  {/* Pro Plan Card */}
                  <div className="bg-violet-950/20 border border-violet-500/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center gap-1 bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                          Popular
                        </span>
                        <h4 className="font-bold text-lg text-white">Pro Plan (Học Cao Cấp)</h4>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-violet-400">79.000₫</p>
                        <p className="text-[10px] text-slate-400">/tháng</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Tra cứu từ AI <strong>không giới hạn</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>AI Speaking Tutor</strong> (Luyện nói tương tác thoại)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>AI Writing Practice</strong> (Sửa bài viết chi tiết)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Đầy đủ lý thuyết ngữ pháp + bài tập trắc nghiệm & điền từ</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Tải file PDF báo cáo học tập chi tiết</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Đường gạch dọc chia đôi (chỉ hiện trên màn hình md trở lên) */}
              <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-white/10 -translate-x-1/2 pointer-events-none" />

              {/* Cột phải: Gói nhóm */}
              <div 
                onClick={() => setBillingMode('group')}
                className={`border rounded-3xl p-6 transition-all space-y-6 ${
                  isGroupMode 
                    ? 'border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-transparent shadow-lg shadow-violet-500/5 ring-1 ring-violet-500/30' 
                    : 'border-white/10 bg-white/3 opacity-70 hover:opacity-90 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-400" />
                    Gói Nhóm
                  </h3>
                  {isGroupMode && (
                    <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                      Đang chọn
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Bảng giá gói nhóm */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bảng giá gói nhóm tiết kiệm</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-slate-400">Nhóm 2 người</p>
                        <p className="font-bold text-white mt-1">59k<span className="text-[10px] text-slate-400">/người</span></p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-slate-400">Nhóm 3-4 người</p>
                        <p className="font-bold text-white mt-1">45k-49k<span className="text-[10px] text-slate-400">/người</span></p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2 border border-amber-500/30 bg-amber-500/5">
                        <p className="text-amber-400 font-semibold">Nhóm ≥ 5 người</p>
                        <p className="font-extrabold text-amber-300 mt-1">39k<span className="text-[10px] text-amber-500">/người</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Seat Stepper Selector */}
                  <div className="bg-violet-950/20 border border-violet-500/20 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-white">Chọn số thành viên</span>
                        <p className="text-[10px] text-slate-400">Bao gồm bạn (1 trưởng nhóm)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeats(s => Math.max(GROUP_SEATS_MIN, s - 1));
                          }}
                          disabled={seats <= GROUP_SEATS_MIN}
                          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-extrabold text-xl w-8 text-center text-violet-400">{seats}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeats(s => Math.min(GROUP_SEATS_MAX, s + 1));
                          }}
                          disabled={seats >= GROUP_SEATS_MAX}
                          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Đơn giá mỗi thành viên:</span>
                        <span className="font-bold text-white">{formatVND(getGroupSeatPrice(seats))}/tháng</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tổng cộng (chưa giảm kỳ hạn):</span>
                        <span className="font-bold text-violet-400">{formatVND(getGroupSeatPrice(seats) * seats)}/tháng</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed pl-1">
                    💡 <strong>Cách hoạt động:</strong> Trưởng nhóm trả gộp một lần, hệ thống cấp ngay <strong>mã mời</strong> để kích hoạt Pro cho tối đa {seats} thành viên khác. Thành viên nhóm không cần đóng thêm phí.
                  </p>
                </div>
              </div>
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
                    {isGroupMode
                      ? `Gói Nhóm · ${seats} ghế × ${periodMonths} tháng`
                      : `${selectedOption.name} × ${periodMonths} tháng`}
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
