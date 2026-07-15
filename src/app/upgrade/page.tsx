'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  CreditCard,
  Crown,
  Loader2,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  GROUP_SEATS_DEFAULT,
  GROUP_SEATS_MAX,
  GROUP_SEATS_MIN,
  PERIOD_OPTIONS,
  PLAN_LABELS,
  PLAN_PRICES,
  applyDiscount,
  computeBasePrice,
  computeGroupPrice,
  formatExpiry,
  formatVND,
  getGroupSeatPrice,
  getRemainingDays,
  listGroupPrice,
  listPrice,
  type Coupon,
} from '@/lib/billing';
import type { Plan } from '@/lib/supabase';

const display = 'font-bold tracking-tight';

const BANK_INFO = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank',
  bankId: process.env.NEXT_PUBLIC_BANK_ID || 'MB',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0369 xxx xxx',
  accountName: process.env.NEXT_PUBLIC_BANK_OWNER || 'NGUYEN VAN A',
} as const;

interface PlanOption {
  plan: Exclude<Plan, 'free'>;
  name: string;
  price: number;
  icon: typeof Crown;
  features: readonly string[];
}

const PLAN_OPTIONS: readonly PlanOption[] = [
  {
    plan: 'pro',
    name: 'Pro',
    price: PLAN_PRICES.pro,
    icon: Zap,
    features: [
      'Tra từ AI không giới hạn',
      'Speaking tutor và writing feedback bằng AI',
      'Ngữ pháp, quiz, điền từ và thống kê đầy đủ',
      'Báo cáo tiến độ và học nhóm cho giáo viên',
    ],
  },
] as const;

const FREE_FEATURES: readonly string[] = [
  'Flashcard và SRS cơ bản',
  'Lưu 200 từ mới mỗi tháng',
  'Lộ trình có sẵn để học',
  'Tra từ AI giới hạn 5 lượt/ngày',
  'Vào lớp học bằng mã mời',
] as const;

const GROUP_BENEFITS: readonly string[] = [
  'Giảm giá theo số người, càng đông càng rẻ',
  'Một trưởng nhóm thanh toán, các thành viên kích hoạt bằng mã mời',
  'Giữ cùng bộ quyền lợi Pro cho toàn nhóm',
] as const;

function UpgradePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'group' ? 'group' : 'individual';
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan] = useState<Exclude<Plan, 'free'>>('pro');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [billingMode, setBillingMode] = useState<'individual' | 'group'>(initialMode);
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

  // Deep link: /upgrade?mode=group (landing "Xem gói nhóm")
  useEffect(() => {
    if (searchParams.get('mode') === 'group') {
      setBillingMode('group');
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

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

  useEffect(() => {
    if (!orderCreated || orderCreated.status === 'paid' || orderCreated.amount === 0) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status, plan, expires_at')
          .eq('id', orderCreated.orderId)
          .single();

        if (error) {
          throw error;
        }

        if (data?.status === 'paid') {
          import('canvas-confetti')
            .then((confetti) => {
              confetti.default({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
              });
            })
            .catch((error) => console.error(error));

          setOrderCreated((prev) => (prev ? { ...prev, status: 'paid' } : null));
          setCurrentPlan((data.plan as Plan) ?? 'free');
          setExpiresAt(data.expires_at ?? null);
          toast.success('Kích hoạt gói thành công!');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('[Billing Polling] Error checking order status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderCreated]);

  const isGroupMode = billingMode === 'group';
  const selectedOption = PLAN_OPTIONS.find((plan) => plan.plan === selectedPlan);

  if (!selectedOption) {
    return null;
  }

  const basePrice = isGroupMode ? listGroupPrice(seats, periodMonths) : listPrice(selectedPlan, periodMonths);
  const afterPeriodDiscount = isGroupMode
    ? computeGroupPrice(seats, periodMonths)
    : computeBasePrice(selectedPlan, periodMonths);
  const afterCoupon = couponValid ? applyDiscount(afterPeriodDiscount, couponValid) : afterPeriodDiscount;
  const totalSaved = basePrice - afterCoupon;
  const remaining = getRemainingDays(expiresAt);
  const periodLabel = PERIOD_OPTIONS.find((option) => option.months === periodMonths)?.label ?? `${periodMonths} tháng`;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isGroupMode
            ? {
                orderKind: 'group',
                seats,
                periodMonths,
                paymentMethod: 'bank_transfer',
                couponCode: couponValid?.code ?? undefined,
              }
            : {
                plan: selectedPlan,
                periodMonths,
                paymentMethod: 'bank_transfer',
                couponCode: couponValid?.code ?? undefined,
              },
        ),
      });

      const data = (await response.json()) as {
        error?: string;
        order: {
          id: string;
          amount: number;
          plan: string;
          status: string;
        };
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Không thể tạo đơn hàng');
      }

      setOrderCreated({
        orderId: data.order.id,
        amount: data.order.amount,
        plan: data.order.plan,
        status: data.order.status,
      });

      toast.success(data.order.status === 'paid' ? 'Kích hoạt gói thành công!' : 'Đơn hàng đã được tạo');
    } catch (error) {
      toast.error(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBankInfo = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[#f6efe6]">
        <div className="flex min-h-dvh items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-[#b5502f] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (orderCreated && (orderCreated.status === 'paid' || orderCreated.amount === 0)) {
    return (
      <div className={`min-h-dvh bg-[#f6efe6] text-[#241710]`}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-5%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[#e57b52]/20 blur-3xl" />
          <div className="absolute right-[-8%] bottom-[-10%] h-[24rem] w-[24rem] rounded-full bg-[#d2c09e]/30 blur-3xl" />
        </div>

        <header className="sticky top-0 z-30 border-b border-[#d7c7b6]/60 bg-[#f6efe6]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
                <Brain className="h-4 w-4" />
              </div>
              <div className={`${display} text-lg font-bold tracking-tight`}>LingoPro</div>
            </Link>
            <Link href="/student" className="text-sm font-bold text-[#6d574a] transition-colors hover:text-[#241710]">
              Vào dashboard
            </Link>
          </div>
        </header>

        <main className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-[2.4rem] border border-[#d7c7b6] bg-white p-8 shadow-[0_24px_80px_rgba(95,69,52,0.10)] sm:p-10">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[1.8rem] bg-[#edf7f1] text-[#2d7f5e]">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f2dfd4] px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">
                <Sparkles className="h-3.5 w-3.5" />
                Kích hoạt thành công
              </div>
              <h1 className={`${display} mt-5 text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                Tài khoản của bạn đã lên
                {' '}
                <span className="text-[#b5502f]">{PLAN_LABELS[orderCreated.plan as Plan]}</span>.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#5e4b40]">
                Từ bây giờ bạn có thể tra sâu hơn, luyện nói, luyện viết và ôn tập mà không còn bị giới hạn lượt.
              </p>
            </div>

            <div className="mt-8 grid gap-4 rounded-[1.8rem] border border-[#eadfd0] bg-[#fffaf5] p-5 sm:grid-cols-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Gói</div>
                <div className="mt-2 text-lg font-black text-[#241710]">{PLAN_LABELS[orderCreated.plan as Plan]}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Trạng thái</div>
                <div className="mt-2 text-lg font-black text-[#2d7f5e]">Đã kích hoạt</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Mã đơn</div>
                <div className="mt-2 truncate font-mono text-sm font-bold text-[#5e4b40]">{orderCreated.orderId}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/student"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#b5502f] px-6 py-4 text-base font-black text-white shadow-[0_16px_40px_rgba(181,80,47,0.26)] transition-transform hover:-translate-y-0.5"
              >
                Bắt đầu học ngay
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dictionary"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-[#d7c7b6] bg-white px-6 py-4 text-base font-black text-[#241710] transition-colors hover:bg-[#fffaf5]"
              >
                Thử tra từ
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (orderCreated) {
    const transferNote = `LINGOPRO ${orderCreated.orderId.slice(0, 8).toUpperCase()}`;

    return (
      <div className={`min-h-dvh bg-[#f6efe6] text-[#241710]`}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-5%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[#e57b52]/20 blur-3xl" />
          <div className="absolute right-[-8%] bottom-[-10%] h-[24rem] w-[24rem] rounded-full bg-[#d2c09e]/30 blur-3xl" />
        </div>

        <header className="sticky top-0 z-30 border-b border-[#d7c7b6]/60 bg-[#f6efe6]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
                <Brain className="h-4 w-4" />
              </div>
              <div className={`${display} text-lg font-bold tracking-tight`}>LingoPro</div>
            </Link>
            <Link href="/" className="text-sm font-bold text-[#6d574a] transition-colors hover:text-[#241710]">
              Về trang chính
            </Link>
          </div>
        </header>

        <main className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[2.4rem] border border-[#d7c7b6] bg-white p-6 shadow-[0_24px_80px_rgba(95,69,52,0.10)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="rounded-[2rem] bg-[#241710] p-6 text-[#f6efe6]">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-[#d7bb76]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Chờ chuyển khoản
                </div>
                <h1 className={`${display} mt-5 text-4xl font-bold tracking-[-0.05em]`}>
                  Đơn hàng đã tạo.
                  {' '}
                  <span className="text-[#f1c46d]">Bước còn lại là thanh toán.</span>
                </h1>
                <p className="mt-4 text-base leading-8 text-[#d8c9bc]">
                  Giữ trang này mở sau khi chuyển khoản. Tài khoản sẽ tự nâng cấp ngay khi hệ thống xác nhận giao dịch.
                </p>

                <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <div className="rounded-[1.4rem] bg-white p-3">
                    <img
                      src={`https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact.png?amount=${orderCreated.amount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`}
                      alt="VietQR thanh toán LingoPro"
                      className="aspect-square w-full rounded-[1rem] object-contain"
                    />
                  </div>
                  <p className="mt-4 text-center text-sm font-semibold text-[#d8c9bc]">
                    Quét QR để điền sẵn số tiền và nội dung chuyển khoản.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-[#eadfd0] bg-[#fffaf5] p-6">
                  <h2 className="flex items-center gap-2 text-lg font-black text-[#241710]">
                    <CreditCard className="h-5 w-5 text-[#b5502f]" />
                    Thông tin thanh toán
                  </h2>

                  <div className="mt-5 grid gap-3">
                    {[
                      { label: 'Ngân hàng', value: BANK_INFO.bank },
                      { label: 'Số tài khoản', value: BANK_INFO.accountNumber },
                      { label: 'Chủ tài khoản', value: BANK_INFO.accountName },
                      { label: 'Số tiền', value: formatVND(orderCreated.amount) },
                      { label: 'Nội dung CK', value: transferNote },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfd0] bg-white px-4 py-3">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7b6558]">{item.label}</div>
                          <div className="mt-1 text-sm font-bold text-[#241710]">{item.value}</div>
                        </div>
                        <button
                          onClick={() => copyBankInfo(item.value)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd0] bg-[#fffaf5] text-[#6d574a] transition-colors hover:bg-white hover:text-[#241710]"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[#d7e7dd] bg-[#f3fbf6] p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#2d7f5e] animate-pulse" />
                    <div>
                      <div className="font-black text-[#2d7f5e]">Đang chờ giao dịch</div>
                      <p className="mt-2 text-sm leading-7 text-[#456456]">
                        Thường chỉ mất khoảng 3-10 giây sau khi chuyển khoản thành công để tài khoản được nâng cấp.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-[#d7c7b6] bg-white px-5 py-3.5 text-sm font-black text-[#241710] transition-colors hover:bg-[#fffaf5]"
                  >
                    Quay về trang chính
                  </Link>
                  <Link
                    href="/student"
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#241710] px-5 py-3.5 text-sm font-black text-[#f6efe6] transition-colors hover:bg-[#3b2a20]"
                  >
                    Vào dashboard chờ kích hoạt
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh bg-[#f6efe6] text-[#241710]`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-5%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[#e57b52]/20 blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-[#d2c09e]/28 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[30%] h-[24rem] w-[24rem] rounded-full bg-[#6a8d7b]/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[#d7c7b6]/60 bg-[#f6efe6]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[#6d574a] transition-colors hover:text-[#241710]">
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Link>
            <div className="hidden h-6 w-px bg-[#d7c7b6] sm:block" />
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <div className={`${display} text-lg font-bold tracking-tight`}>LingoPro</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b6558]">Nâng cấp Pro</div>
              </div>
            </div>
          </div>

          <div className="text-sm font-bold text-[#6d574a]">
            {currentPlan !== 'free' ? 'Tài khoản đã có gói' : 'Nâng cấp khi sẵn sàng'}
          </div>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {currentPlan !== 'free' && (
            <div className="mb-8 rounded-[1.8rem] border border-[#d7c7b6] bg-white/80 p-5 shadow-[0_14px_45px_rgba(95,69,52,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2dfd4] text-[#9f4d2f]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Gói hiện tại</div>
                    <div className="mt-1 text-lg font-black text-[#241710]">
                      {PLAN_LABELS[currentPlan]}
                    </div>
                    {remaining !== null && (
                      <div className="mt-1 text-sm font-semibold text-[#5e4b40]">
                        {remaining > 0 ? `Còn ${remaining} ngày · Hết hạn ${formatExpiry(expiresAt)}` : 'Đã hết hạn, cần gia hạn'}
                      </div>
                    )}
                  </div>
                </div>

                {remaining !== null && remaining > 0 && remaining <= 7 && (
                  <div className="inline-flex rounded-full bg-[#fff3cd] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">
                    Sắp hết hạn
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-10 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f] shadow-[0_10px_30px_rgba(143,83,53,0.08)]">
                <Sparkles className="h-3.5 w-3.5" />
                Mở toàn bộ quyền lợi
              </div>
              <h1 className={`${display} mt-5 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.06em] text-[#241710] sm:text-6xl`}>
                Nâng cấp khi bạn muốn
                {' '}
                <span className="text-[#b5502f]">học sâu hơn và đều hơn mỗi ngày</span>,
                {' '}
                không còn bị chặn bởi giới hạn.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5e4b40]">
                Xem rõ khác biệt giữa Free và Pro, chọn kỳ hạn phù hợp và thanh toán ngay trong một màn hình.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Khác biệt rõ', text: 'Free đủ để bắt đầu, Pro mở trọn tra cứu và luyện tập bằng AI.' },
                { label: 'Nhóm dễ quản lý', text: 'Một người thanh toán, các thành viên vào bằng mã mời.' },
                { label: 'Thanh toán nhanh', text: 'Quét QR là có sẵn số tiền và nội dung chuyển khoản.' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-[#d7c7b6] bg-white/80 p-4 shadow-[0_14px_35px_rgba(95,69,52,0.06)]">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">{item.label}</div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5e4b40]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setBillingMode('individual')}
                  className={`rounded-[2rem] border p-6 text-left transition-all ${
                    !isGroupMode
                      ? 'border-[#b5502f]/30 bg-[#241710] text-[#f6efe6] shadow-[0_24px_70px_rgba(36,23,16,0.18)]'
                      : 'border-[#d7c7b6] bg-white/75 text-[#241710] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em]">
                        <Crown className="h-4 w-4" />
                        Cá nhân
                      </div>
                      <h2 className={`${display} mt-3 text-3xl font-bold tracking-tight`}>
                        Pro cho 1 người học
                      </h2>
                    </div>
                    {!isGroupMode && (
                      <div className="rounded-full bg-[#d7bb76] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#241710]">
                        Đang chọn
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className={`rounded-[1.5rem] p-4 ${!isGroupMode ? 'bg-white/5' : 'bg-[#fffaf5]'}`}>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Free</div>
                      <div className="mt-2 text-2xl font-black">0₫</div>
                      <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-inherit/80">
                        {FREE_FEATURES.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={`rounded-[1.5rem] p-4 ${!isGroupMode ? 'bg-[#f6efe6] text-[#241710]' : 'bg-[#f2dfd4]'}`}>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">Pro</div>
                      <div className="mt-2 text-2xl font-black">{formatVND(PLAN_PRICES.pro)}</div>
                      <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-[#4f3f35]">
                        {selectedOption.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingMode('group')}
                  className={`rounded-[2rem] border p-6 text-left transition-all ${
                    isGroupMode
                      ? 'border-[#b5502f]/30 bg-[#241710] text-[#f6efe6] shadow-[0_24px_70px_rgba(36,23,16,0.18)]'
                      : 'border-[#d7c7b6] bg-white/75 text-[#241710] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em]">
                        <Users className="h-4 w-4" />
                        Nhóm
                      </div>
                      <h2 className={`${display} mt-3 text-3xl font-bold tracking-tight`}>
                        Pro cho nhóm học
                      </h2>
                    </div>
                    {isGroupMode && (
                      <div className="rounded-full bg-[#d7bb76] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#241710]">
                        Đang chọn
                      </div>
                    )}
                  </div>

                  <div className={`mt-5 rounded-[1.5rem] p-4 ${isGroupMode ? 'bg-white/5' : 'bg-[#fffaf5]'}`}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7b6558]">2 người</div>
                        <div className="mt-2 text-lg font-black">59k/người</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7b6558]">3-4 người</div>
                        <div className="mt-2 text-lg font-black">45k-49k</div>
                      </div>
                      <div className="rounded-2xl bg-[#f2dfd4] p-3 text-[#241710]">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#9f4d2f]">5+ người</div>
                        <div className="mt-2 text-lg font-black">39k/người</div>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-inherit/80">
                      {GROUP_BENEFITS.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              </div>

              {isGroupMode && (
                <div className="rounded-[2rem] border border-[#d7c7b6] bg-white/80 p-6 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Số thành viên</div>
                      <h3 className={`${display} mt-2 text-3xl font-bold tracking-tight text-[#241710]`}>
                        Chọn số ghế cho nhóm
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-[#5e4b40]">
                        Bao gồm 1 trưởng nhóm thanh toán và các thành viên kích hoạt bằng mã mời.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSeats((current) => Math.max(GROUP_SEATS_MIN, current - 1))}
                        disabled={seats <= GROUP_SEATS_MIN}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7c7b6] bg-white text-[#241710] transition-colors hover:bg-[#fffaf5] disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="min-w-16 text-center">
                        <div className={`${display} text-4xl font-bold tracking-tight text-[#b5502f]`}>{seats}</div>
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7b6558]">ghế</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSeats((current) => Math.min(GROUP_SEATS_MAX, current + 1))}
                        disabled={seats >= GROUP_SEATS_MAX}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7c7b6] bg-white text-[#241710] transition-colors hover:bg-[#fffaf5] disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-[#fffaf5] p-4">
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Đơn giá mỗi người</div>
                      <div className="mt-2 text-2xl font-black text-[#241710]">{formatVND(getGroupSeatPrice(seats))}</div>
                    </div>
                    <div className="rounded-[1.5rem] bg-[#241710] p-4 text-[#f6efe6]">
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-[#cbb7a6]">Tổng trước ưu đãi kỳ hạn</div>
                      <div className="mt-2 text-2xl font-black">{formatVND(getGroupSeatPrice(seats) * seats)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-[2rem] border border-[#d7c7b6] bg-white/80 p-6 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                <h3 className="flex items-center gap-2 text-lg font-black text-[#241710]">
                  <Clock3 className="h-5 w-5 text-[#b5502f]" />
                  Thời hạn gói
                </h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.months}
                      type="button"
                      onClick={() => setPeriodMonths(option.months)}
                      className={`rounded-[1.4rem] border p-4 text-center transition-all ${
                        periodMonths === option.months
                          ? 'border-[#b5502f]/30 bg-[#241710] text-[#f6efe6]'
                          : 'border-[#d7c7b6] bg-[#fffaf5] text-[#241710] hover:bg-white'
                      }`}
                    >
                      <div className="text-sm font-black">{option.label}</div>
                      {option.discountPct === null ? (
                        <div className="mt-2 inline-flex rounded-full bg-[#d7bb76] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#241710]">
                          Rẻ nhất
                        </div>
                      ) : option.discountPct > 0 ? (
                        <div className="mt-2 inline-flex rounded-full bg-[#edf7f1] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#2d7f5e]">
                          -{option.discountPct}%
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#d7c7b6] bg-white/80 p-6 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                <h3 className="flex items-center gap-2 text-lg font-black text-[#241710]">
                  <Star className="h-5 w-5 text-[#d39b29]" />
                  Mã giảm giá
                </h3>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="Nhập mã ưu đãi..."
                    className="flex-1 rounded-[1.3rem] border border-[#d7c7b6] bg-[#fffaf5] px-4 py-3 text-sm font-mono font-bold uppercase text-[#241710] outline-none transition-colors focus:border-[#b5502f]/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!couponCode.trim()) {
                        return;
                      }

                      setCouponValid({
                        id: '',
                        code: couponCode.trim(),
                        discount_pct: null,
                        discount_amount: null,
                        max_uses: null,
                        used_count: 0,
                        valid_from: '',
                        valid_until: null,
                        applicable_plans: null,
                        is_active: true,
                      });
                      toast.success('Mã sẽ được xác nhận khi tạo đơn hàng');
                    }}
                    className="rounded-[1.3rem] bg-[#241710] px-5 py-3 text-sm font-black text-[#f6efe6] transition-colors hover:bg-[#3b2a20]"
                  >
                    Áp dụng
                  </button>
                </div>

                {couponValid && (
                  <div className="mt-4 rounded-[1.3rem] bg-[#edf7f1] px-4 py-3 text-sm font-semibold text-[#2d7f5e]">
                    Đã lưu mã
                    {' '}
                    <span className="font-black">{couponValid.code}</span>
                    . Hệ thống sẽ xác nhận khi đặt hàng.
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <div className="overflow-hidden rounded-[2.2rem] border border-[#b5502f]/20 bg-[#241710] p-6 text-[#f6efe6] shadow-[0_28px_80px_rgba(36,23,16,0.20)]">
                <div className="inline-flex rounded-full bg-[#d7bb76] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#241710]">
                  Tóm tắt đơn hàng
                </div>
                <h2 className={`${display} mt-4 text-3xl font-bold tracking-tight`}>
                  {isGroupMode ? 'Gói nhóm Pro' : selectedOption.name}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#d8c9bc]">
                  {isGroupMode
                    ? `Thanh toán một lần cho ${seats} thành viên trong ${periodLabel.toLowerCase()}.`
                    : `Mở toàn bộ quyền lợi Pro trong ${periodLabel.toLowerCase()}.`}
                </p>

                <div className="mt-6 space-y-3 rounded-[1.7rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#cbb7a6]">
                      {isGroupMode ? `${seats} ghế × ${periodLabel}` : `${selectedOption.name} × ${periodLabel}`}
                    </span>
                    <span className="font-black text-white">{formatVND(basePrice)}</span>
                  </div>

                  {basePrice > afterPeriodDiscount && (
                    <div className="flex items-center justify-between text-sm text-[#8fd4b5]">
                      <span>Ưu đãi kỳ hạn</span>
                      <span>-{formatVND(basePrice - afterPeriodDiscount)}</span>
                    </div>
                  )}

                  {couponValid && afterCoupon < afterPeriodDiscount && (
                    <div className="flex items-center justify-between text-sm text-[#8fd4b5]">
                      <span>Mã {couponValid.code}</span>
                      <span>-{formatVND(afterPeriodDiscount - afterCoupon)}</span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-[#cbb7a6]">Tổng thanh toán</div>
                        <div className={`${display} mt-2 text-4xl font-bold tracking-tight text-white`}>
                          {formatVND(afterCoupon)}
                        </div>
                      </div>
                      {totalSaved > 0 && (
                        <div className="rounded-full bg-[#edf7f1] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#2d7f5e]">
                          Tiết kiệm {formatVND(totalSaved)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b5502f] px-6 py-4 text-base font-black text-white shadow-[0_16px_40px_rgba(181,80,47,0.32)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tạo đơn...
                    </>
                  ) : (
                    <>
                      Tạo mã thanh toán
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#cbb7a6]">
                  <Shield className="h-3.5 w-3.5" />
                  Thanh toán an toàn · Tự nâng cấp sau xác nhận
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#d7c7b6] bg-white/80 p-6 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">Vì sao trang này dễ quyết định</div>
                <div className="mt-4 space-y-3 text-sm font-semibold leading-7 text-[#5e4b40]">
                  <p>Mọi thông tin quan trọng đều nằm trên một màn hình: gói, kỳ hạn, ưu đãi và số tiền cuối cùng.</p>
                  <p>Bạn không phải nhắn tin thủ công hay chờ xác nhận lâu. Chuyển khoản xong là tài khoản được nâng cấp.</p>
                  <p>Nếu mua theo nhóm, chỉ một người thanh toán; các thành viên còn lại vào bằng mã mời.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className={`flex min-h-dvh items-center justify-center bg-[#f6efe6] text-[#7b6558]`}>
          <Loader2 className="h-8 w-8 animate-spin text-[#b5502f]" />
        </div>
      }
    >
      <UpgradePageContent />
    </Suspense>
  );
}
