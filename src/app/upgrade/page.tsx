'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Copy,
  CreditCard,
  Loader2,
  Minus,
  Phone,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  GROUP_SEATS_DEFAULT,
  GROUP_SEATS_MAX,
  GROUP_SEATS_MIN,
  PERIOD_OPTIONS,
  PLAN_LABELS,
  applyDiscount,
  computeBasePrice,
  computeGroupPrice,
  formatExpiry,
  formatVND,
  getGroupSeatPrice,
  getRemainingDays,
  isTrialCouponCode,
  listGroupPrice,
  listPrice,
  trialCouponDays,
  type Coupon,
} from '@/lib/billing';
import type { Plan } from '@/lib/supabase';

const BANK_INFO = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank',
  bankId: process.env.NEXT_PUBLIC_BANK_ID || 'MB',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0369 xxx xxx',
  accountName: process.env.NEXT_PUBLIC_BANK_OWNER || 'NGUYEN VAN A',
} as const;

/** Hỗ trợ thanh toán / thắc mắc gói */
const SUPPORT_CONTACT = {
  name: 'Mr Phong',
  phone: '0949317036',
  phoneDisplay: '0949 317 036',
} as const;

type CheckoutTarget = 'pro' | 'group';
type Cell = 'check' | 'dash' | string;

interface CompareRow {
  feature: string;
  free: Cell;
  paid: Cell;
}

/** Bảng so sánh Thường (Free) vs Pro — kiểu ChatGPT ✓ / − */
const PRO_COMPARE: readonly CompareRow[] = [
  { feature: 'Flashcard & SRS', free: 'check', paid: 'check' },
  { feature: 'Lộ trình học', free: 'check', paid: 'check' },
  { feature: 'Vào lớp bằng mã mời', free: 'check', paid: 'check' },
  { feature: 'Lưu từ mới / tháng', free: '200', paid: 'Không giới hạn' },
  { feature: 'AI: tra từ + phân tích câu', free: '5/ngày', paid: 'Không giới hạn' },
  { feature: 'Ngữ pháp, quiz, điền từ', free: 'dash', paid: 'check' },
  { feature: 'Thống kê tiến độ chi tiết', free: 'dash', paid: 'check' },
];

/** Thường vs Nhóm (cùng quyền Pro + quản lý ghế) */
const GROUP_COMPARE: readonly CompareRow[] = [
  { feature: 'Mọi quyền lợi Pro', free: 'dash', paid: 'check' },
  { feature: 'AI: tra từ + phân tích câu', free: '5/ngày', paid: 'Không giới hạn' },
  { feature: 'Lưu từ mới / tháng', free: '200', paid: 'Không giới hạn' },
  { feature: '1 người trả, mã mời thành viên', free: 'dash', paid: 'check' },
  { feature: 'Giảm giá theo số người', free: 'dash', paid: 'check' },
  { feature: '2–20 người cùng đăng ký', free: 'dash', paid: 'check' },
];

function UpgradePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const initialTarget: CheckoutTarget = searchParams.get('mode') === 'group' ? 'group' : 'pro';

  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodMonths, setPeriodMonths] = useState(12);
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget>(initialTarget);
  const [seats, setSeats] = useState(GROUP_SEATS_DEFAULT);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<Coupon | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState<{
    orderId: string;
    amount: number;
    plan: string;
    status?: string;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('mode') === 'group') {
      setCheckoutTarget('group');
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // preview=1: xem UI không login (design / screenshot)
      if (isPreview) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      setCurrentPlan((data?.plan as Plan) ?? 'free');
      setExpiresAt(data?.plan_expires_at ?? null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, isPreview]);

  // Clear coupon khi đổi gói/kỳ hạn/ghế — giữ trial nếu vẫn 1 tháng (LIVEB3)
  useEffect(() => {
    setCouponValid((prev) => {
      if (!prev) return null;
      if (
        isTrialCouponCode(prev.code) &&
        periodMonths === 1 &&
        checkoutTarget === 'individual'
      ) {
        return prev;
      }
      return null;
    });
  }, [periodMonths, checkoutTarget, seats]);

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

        if (error) throw error;

        if (data?.status === 'paid') {
          import('canvas-confetti')
            .then((confetti) => {
              confetti.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            })
            .catch((err) => console.error(err));

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

  const isGroup = checkoutTarget === 'group';
  const selectedPlan: Exclude<Plan, 'free'> = 'pro';

  const basePrice = isGroup ? listGroupPrice(seats, periodMonths) : listPrice(selectedPlan, periodMonths);
  const afterPeriodDiscount = isGroup
    ? computeGroupPrice(seats, periodMonths)
    : computeBasePrice(selectedPlan, periodMonths);
  const afterCoupon = couponValid ? applyDiscount(afterPeriodDiscount, couponValid) : afterPeriodDiscount;
  const totalSaved = basePrice - afterCoupon;
  const remaining = getRemainingDays(expiresAt);
  const periodLabel = PERIOD_OPTIONS.find((o) => o.months === periodMonths)?.label ?? `${periodMonths} tháng`;

  const proMonthlyDisplay = useMemo(() => {
    const total = computeBasePrice('pro', periodMonths);
    return Math.round(total / periodMonths);
  }, [periodMonths]);

  const groupSeatMonthlyDisplay = useMemo(() => {
    const total = computeGroupPrice(seats, periodMonths);
    return Math.round(total / seats / periodMonths);
  }, [seats, periodMonths]);

  const handleValidateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    // Trial LIVEB3/NEWBIE: ép UI về 1 tháng TRƯỚC khi validate (tránh free năm)
    let periodForValidate = periodMonths;
    if (isTrialCouponCode(code)) {
      if (isGroup) {
        toast.error('Mã quà live chỉ dùng gói Pro cá nhân, không dùng gói nhóm.');
        return;
      }
      if (periodMonths !== 1) {
        setPeriodMonths(1);
        periodForValidate = 1;
        toast.message('Mã quà chỉ áp kỳ 1 tháng — đã chuyển sang 1 tháng.');
      }
    }

    setCouponChecking(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/billing/coupons/validate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isGroup
            ? { code, orderKind: 'group', seats, periodMonths: periodForValidate }
            : {
                code,
                plan: selectedPlan,
                periodMonths: periodForValidate,
                orderKind: 'individual',
              },
        ),
      });

      const data = (await res.json()) as {
        valid?: boolean;
        error?: string;
        coupon?: Coupon;
        saved?: number;
        forcePeriodMonths?: number | null;
        trialDays?: number | null;
        message?: string;
      };

      if (!res.ok || !data.valid || !data.coupon) {
        setCouponValid(null);
        toast.error(data.error ?? 'Mã không hợp lệ');
        return;
      }

      if (data.forcePeriodMonths === 1 && periodMonths !== 1) {
        setPeriodMonths(1);
      }

      setCouponValid(data.coupon);
      const days = data.trialDays ?? trialCouponDays(data.coupon.code);
      if (days) {
        toast.success(`Mã ${data.coupon.code}: ${days} ngày Pro miễn phí (kỳ 1 tháng)`);
      } else if (data.saved && data.saved > 0) {
        toast.success(`Áp dụng thành công · tiết kiệm ${formatVND(data.saved)}`);
      } else {
        toast.success(`Đã áp dụng mã ${data.coupon.code}`);
      }
    } catch (err) {
      setCouponValid(null);
      toast.error(err instanceof Error ? err.message : 'Không kiểm tra được mã');
    } finally {
      setCouponChecking(false);
    }
  };

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
          isGroup
            ? {
                orderKind: 'group',
                seats,
                periodMonths,
                paymentMethod: 'bank_transfer',
                couponCode: (couponValid?.code ?? couponCode.trim()) || undefined,
              }
            : {
                plan: selectedPlan,
                // Trial: server cũng ép 1 tháng — client gửi đúng 1 để khớp UI
                periodMonths:
                  couponValid?.code && isTrialCouponCode(couponValid.code) ? 1 : periodMonths,
                paymentMethod: 'bank_transfer',
                couponCode: (couponValid?.code ?? couponCode.trim()) || undefined,
              },
        ),
      });

      const data = (await response.json()) as {
        error?: string;
        order: { id: string; amount: number; plan: string; status: string };
      };

      if (!response.ok) throw new Error(data.error ?? 'Không thể tạo đơn hàng');

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
      <div className="flex min-h-dvh items-center justify-center bg-[#faf9f5]">
        <Loader2 className="h-7 w-7 animate-spin text-[#1a1915]/40" />
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────
  if (orderCreated && (orderCreated.status === 'paid' || orderCreated.amount === 0)) {
    return (
      <div className="min-h-dvh bg-[#faf9f5] text-[#1a1915]">
        <ShellHeader currentLabel="Đã kích hoạt" />
        <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-[#e8e6dc] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf7f1] text-[#2d7f5e]">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-[#8a8778]">
              Kích hoạt thành công
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Tài khoản đã lên {PLAN_LABELS[orderCreated.plan as Plan]}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[#5e5d59]">
              Bạn có thể tra từ, phân tích câu và ôn tập không còn bị giới hạn lượt.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/student"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1915] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#2c2b26]"
              >
                Bắt đầu học ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dictionary"
                className="inline-flex items-center justify-center rounded-xl border border-[#e8e6dc] bg-white px-5 py-3.5 text-sm font-medium text-[#1a1915] transition hover:bg-[#f5f4ef]"
              >
                Thử tra từ
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Awaiting payment ─────────────────────────────────
  if (orderCreated) {
    const transferNote = `LINGOPRO ${orderCreated.orderId.slice(0, 8).toUpperCase()}`;

    return (
      <div className="min-h-dvh bg-[#faf9f5] text-[#1a1915]">
        <ShellHeader currentLabel="Thanh toán" />
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e8e6dc] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8a8778]">
                Chờ chuyển khoản
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Đơn đã tạo. Bước còn lại là thanh toán.
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5e5d59]">
                Giữ trang này mở. Tài khoản tự nâng cấp khi hệ thống xác nhận giao dịch.
              </p>
              <div className="mt-6 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-4">
                <img
                  src={`https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact.png?amount=${orderCreated.amount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`}
                  alt="VietQR thanh toán LingoPro"
                  className="mx-auto aspect-square w-full max-w-[260px] rounded-lg object-contain"
                />
                <p className="mt-3 text-center text-sm text-[#5e5d59]">
                  Quét QR để điền sẵn số tiền và nội dung CK.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e8e6dc] bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1a1915]">
                  <CreditCard className="h-4 w-4 text-[#8a8778]" />
                  Thông tin thanh toán
                </h2>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Ngân hàng', value: BANK_INFO.bank },
                    { label: 'Số tài khoản', value: BANK_INFO.accountNumber },
                    { label: 'Chủ tài khoản', value: BANK_INFO.accountName },
                    { label: 'Số tiền', value: formatVND(orderCreated.amount) },
                    { label: 'Nội dung CK', value: transferNote },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#eeebe3] bg-[#faf9f5] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-[#8a8778]">
                          {item.label}
                        </div>
                        <div className="mt-0.5 truncate text-sm font-medium text-[#1a1915]">{item.value}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyBankInfo(item.value)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e8e6dc] bg-white text-[#5e5d59] transition hover:bg-[#f0efe8]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#d7e7dd] bg-[#f3fbf6] px-5 py-4">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2d7f5e] animate-pulse" />
                <div>
                  <div className="text-sm font-semibold text-[#2d7f5e]">Đang chờ giao dịch</div>
                  <p className="mt-1 text-sm leading-6 text-[#456456]">
                    Thường 3–10 giây sau khi chuyển khoản thành công.
                  </p>
                </div>
              </div>

              <SupportContactCard />

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#e8e6dc] bg-white px-4 py-3 text-sm font-medium text-[#1a1915] transition hover:bg-[#f5f4ef]"
                >
                  Về trang chính
                </Link>
                <Link
                  href="/student"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#1a1915] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2c2b26]"
                >
                  Vào dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Pricing — ChatGPT style (mobile stack + laptop 2 cột) ─
  const periodShort: Record<number, string> = { 1: '1 th', 3: '3 th', 6: '6 th', 12: 'Năm' };
  const compareRows = isGroup ? GROUP_COMPARE : PRO_COMPARE;
  const paidColLabel = isGroup ? 'Nhóm' : 'Pro';
  const ctaLabel = isGroup
    ? `Nâng cấp nhóm · ${formatVND(afterCoupon)}`
    : currentPlan === 'pro'
      ? `Gia hạn Pro · ${formatVND(afterCoupon)}`
      : `Nâng cấp Pro · ${formatVND(afterCoupon)}`;

  const priceSummary = (
    <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 py-3.5 text-center shadow-sm lg:px-5 lg:py-5">
      {isGroup ? (
        <>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8778] lg:text-xs">
            {seats} người · {formatVND(groupSeatMonthlyDisplay)}/người/tháng
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight lg:mt-2 lg:text-3xl">
            {formatVND(afterCoupon)}
          </div>
          <p className="mt-0.5 text-xs text-[#5e5d59] lg:mt-1 lg:text-sm">
            Tổng {periodLabel.toLowerCase()}
            {totalSaved > 0 ? ` · tiết kiệm ${formatVND(totalSaved)}` : ''}
          </p>
        </>
      ) : (
        <>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8778] lg:text-xs">
            {formatVND(proMonthlyDisplay)}/tháng
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight lg:mt-2 lg:text-3xl">
            {formatVND(afterCoupon)}
          </div>
          <p className="mt-0.5 text-xs text-[#5e5d59] lg:mt-1 lg:text-sm">
            Thanh toán {periodLabel.toLowerCase()}
            {totalSaved > 0 ? ` · tiết kiệm ${formatVND(totalSaved)}` : ''}
          </p>
        </>
      )}
    </div>
  );

  const seatsControl = isGroup ? (
    <div className="flex items-center justify-between rounded-2xl border border-[#e8e6dc] bg-white px-3 py-2.5 shadow-sm lg:px-4 lg:py-3.5">
      <div>
        <div className="text-xs font-medium text-[#5e5d59] lg:text-sm">Số người cùng đăng ký</div>
        <div className="text-[11px] text-[#8a8778] lg:mt-0.5 lg:text-xs">
          2p 59k · 3p 49k · 4p 45k · 5+ 39k
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSeats((s) => Math.max(GROUP_SEATS_MIN, s - 1))}
          disabled={seats <= GROUP_SEATS_MIN}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8e6dc] bg-[#faf9f5] disabled:opacity-40 lg:h-10 lg:w-10"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-8 text-center text-base font-semibold tabular-nums lg:text-lg">{seats}</span>
        <button
          type="button"
          onClick={() => setSeats((s) => Math.min(GROUP_SEATS_MAX, s + 1))}
          disabled={seats >= GROUP_SEATS_MAX}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8e6dc] bg-[#faf9f5] disabled:opacity-40 lg:h-10 lg:w-10"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  ) : null;

  const compareTable = (
    <div className="overflow-hidden rounded-2xl border border-[#e8e6dc] bg-white shadow-sm">
      <div className="grid grid-cols-[1fr_4.25rem_4.25rem] items-center gap-1 border-b border-[#eeebe3] px-3 py-2.5 sm:grid-cols-[1fr_5.5rem_5.5rem] sm:px-4 lg:grid-cols-[1fr_7rem_7rem] lg:px-5 lg:py-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8778] lg:text-xs">
          Tính năng
        </div>
        <div className="text-center text-[12px] font-semibold text-[#5e5d59] lg:text-sm">Thường</div>
        <div className="text-center text-[12px] font-semibold text-[#1a1915] lg:text-sm">{paidColLabel}</div>
      </div>
      <ul>
        {compareRows.map((row, idx) => (
          <li
            key={row.feature}
            className={`grid grid-cols-[1fr_4.25rem_4.25rem] items-center gap-1 px-3 py-2.5 sm:grid-cols-[1fr_5.5rem_5.5rem] sm:px-4 sm:py-3 lg:grid-cols-[1fr_7rem_7rem] lg:px-5 lg:py-3.5 ${
              idx < compareRows.length - 1 ? 'border-b border-[#f0eee6]' : ''
            }`}
          >
            <div className="pr-1 text-[13px] leading-5 text-[#3d3c38] sm:text-sm lg:text-[15px] lg:leading-6">
              {row.feature}
            </div>
            <div className="flex justify-center">
              <CompareCell value={row.free} tone="muted" />
            </div>
            <div className="flex justify-center">
              <CompareCell value={row.paid} tone="accent" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const couponBlock = (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            if (couponValid) setCouponValid(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleValidateCoupon();
            }
          }}
          placeholder="Mã giảm giá"
          className="min-w-0 flex-1 rounded-xl border border-[#e8e6dc] bg-white px-3 py-2.5 font-mono text-sm font-medium uppercase text-[#1a1915] outline-none focus:border-[#1a1915]/30 focus:ring-2 focus:ring-[#1a1915]/8 lg:py-3"
        />
        <button
          type="button"
          onClick={() => void handleValidateCoupon()}
          disabled={couponChecking || !couponCode.trim()}
          className="shrink-0 rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#1a1915] disabled:opacity-50 lg:px-4 lg:text-sm"
        >
          {couponChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
        </button>
      </div>
      {couponValid && (
        <p className="mt-1.5 text-[11px] font-medium text-[#2d7f5e] lg:text-xs">
          Đã áp dụng {couponValid.code}
          {couponValid.discount_pct
            ? ` (−${couponValid.discount_pct}%)`
            : couponValid.discount_amount
              ? ` (−${formatVND(couponValid.discount_amount)})`
              : ''}
        </p>
      )}
      {(basePrice > afterPeriodDiscount || (couponValid && afterCoupon < afterPeriodDiscount)) && (
        <p className="mt-1 text-[11px] text-[#8a8778] lg:text-xs">
          Gốc {formatVND(basePrice)}
          {basePrice > afterPeriodDiscount && ` · kỳ hạn −${formatVND(basePrice - afterPeriodDiscount)}`}
          {couponValid && afterCoupon < afterPeriodDiscount && (
            <> · mã −{formatVND(afterPeriodDiscount - afterCoupon)}</>
          )}
        </p>
      )}
    </div>
  );

  const ctaButton = (opts: { className?: string; showArrow?: boolean }) => (
    <button
      type="button"
      onClick={() => void handleSubmit()}
      disabled={isSubmitting}
      className={opts.className}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tạo đơn…
        </>
      ) : (
        <>
          {ctaLabel}
          {opts.showArrow ? <ArrowRight className="h-4 w-4" /> : null}
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-dvh bg-[#faf9f5] text-[#1a1915]">
      <ShellHeader
        currentLabel={
          currentPlan !== 'free'
            ? `${PLAN_LABELS[currentPlan]}${remaining != null && remaining > 0 ? ` · còn ${remaining} ngày` : ''}`
            : 'Nâng cấp'
        }
      />

      <main className="mx-auto max-w-lg px-4 pb-32 pt-6 sm:max-w-xl sm:px-6 sm:pb-16 sm:pt-10 lg:max-w-5xl lg:pb-16 lg:pt-12">
        {/* Hero */}
        <div className="text-center lg:mx-auto lg:max-w-2xl">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {isGroup ? 'Nâng cấp gói Nhóm' : 'Nâng cấp LingoPro Pro'}
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-[#5e5d59] sm:text-sm sm:leading-6 lg:mt-3 lg:text-base">
            {isGroup
              ? 'Một người thanh toán — cả nhóm dùng quyền Pro.'
              : 'AI tra từ + phân tích câu, không còn giới hạn lượt.'}
          </p>
          {currentPlan !== 'free' && remaining != null && (
            <p className="mt-2 text-xs text-[#8a8778] lg:text-sm">
              Đang dùng {PLAN_LABELS[currentPlan]}
              {remaining > 0 ? ` · hết hạn ${formatExpiry(expiresAt)}` : ' · đã hết hạn'}
            </p>
          )}
        </div>

        {/* Tab Pro | Nhóm */}
        <div className="mx-auto mt-5 flex max-w-xs rounded-full border border-[#e8e6dc] bg-white p-1 shadow-sm lg:mt-8 lg:max-w-sm">
          {(
            [
              { id: 'pro' as const, label: 'Pro' },
              { id: 'group' as const, label: 'Nhóm' },
            ] as const
          ).map((tab) => {
            const active = checkoutTarget === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCheckoutTarget(tab.id)}
                className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition lg:py-3 lg:text-[15px] ${
                  active ? 'bg-[#1a1915] text-white shadow-sm' : 'text-[#5e5d59] hover:text-[#1a1915]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Period */}
        <div className="mx-auto mt-4 max-w-md lg:mt-5 lg:max-w-lg">
          <div className="grid grid-cols-4 gap-1 rounded-2xl border border-[#e8e6dc] bg-white p-1">
            {PERIOD_OPTIONS.map((opt) => {
              const active = periodMonths === opt.months;
              const badge =
                opt.months === 12
                  ? '−37%'
                  : opt.discountPct != null && opt.discountPct > 0
                    ? `−${opt.discountPct}%`
                    : null;
              return (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setPeriodMonths(opt.months)}
                  className={`flex min-h-11 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 transition lg:min-h-12 ${
                    active ? 'bg-[#1a1915] text-white' : 'text-[#5e5d59] hover:bg-[#faf9f5]'
                  }`}
                >
                  <span className="text-[12px] font-semibold leading-none lg:text-sm">
                    <span className="sm:hidden">{periodShort[opt.months]}</span>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </span>
                  {badge && (
                    <span
                      className={`mt-0.5 text-[9px] font-semibold leading-none lg:mt-1 lg:text-[10px] ${
                        active
                          ? opt.months === 12
                            ? 'text-[#d7bb76]'
                            : 'text-white/65'
                          : opt.months === 12
                            ? 'text-[#b5502f]'
                            : 'text-[#2d7f5e]'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mobile / tablet: stack ── */}
        <div className="mt-4 space-y-3 lg:hidden">
          {priceSummary}
          {seatsControl}
          {compareTable}
          {couponBlock}
          <p className="-mt-1 px-1 text-[11px] leading-4 text-[#8a8778]">
            Live Buổi 3: mã <span className="font-bold text-[#1a1915]">LIVEB3</span> — chọn{' '}
            <b>1 tháng</b> rồi nhập mã (1 tuần Pro free, đến 21/07). Không dùng gói năm.
          </p>
          <SupportContactCard />
        </div>

        {/* ── Laptop+: 2 cột — bảng | checkout sticky ── */}
        <div className="mt-8 hidden gap-8 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="min-w-0 space-y-3">
            {compareTable}
            <SupportContactCard />
          </div>

          <aside className="sticky top-20 space-y-3">
            {priceSummary}
            {seatsControl}
            <div className="rounded-2xl border border-[#e8e6dc] bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-[#5e5d59]">Mã giảm giá</div>
              <div className="mt-2">{couponBlock}</div>
              <p className="mt-2 text-[11px] leading-4 text-[#8a8778]">
                Live: <span className="font-bold text-[#1a1915]">LIVEB3</span> = 1 tuần Pro free — chỉ kỳ{' '}
                <b>1 tháng</b> (không free cả năm).
              </p>
            </div>
            {ctaButton({
              showArrow: true,
              className:
                'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1915] px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#2c2b26] disabled:opacity-60',
            })}
            <p className="text-center text-xs leading-5 text-[#8a8778]">
              Chuyển khoản · Tự nâng cấp sau xác nhận
            </p>
            <SupportContactCard compact />
          </aside>
        </div>
      </main>

      {/* Sticky CTA — chỉ điện thoại / tablet */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e6dc] bg-[#faf9f5]/96 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        {ctaButton({
          className:
            'flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1915] px-4 py-3.5 text-[15px] font-semibold text-white disabled:opacity-60',
        })}
        <p className="mt-2 text-center text-[10px] leading-4 text-[#8a8778]">
          Chuyển khoản · Tự nâng cấp · Thắc mắc: {SUPPORT_CONTACT.name}{' '}
          <a href={`tel:${SUPPORT_CONTACT.phone}`} className="font-semibold text-[#1a1915] underline-offset-2 hover:underline">
            {SUPPORT_CONTACT.phoneDisplay}
          </a>
        </p>
      </div>
    </div>
  );
}

function SupportContactCard({ compact = false }: { compact?: boolean }) {
  const telHref = `tel:${SUPPORT_CONTACT.phone}`;
  const zaloHref = `https://zalo.me/${SUPPORT_CONTACT.phone}`;

  return (
    <div
      className={`rounded-2xl border border-[#e8e6dc] bg-white shadow-sm ${
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
      }`}
    >
      <div className={`flex items-start gap-3 ${compact ? 'gap-2.5' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e8e6dc] bg-[#faf9f5] text-[#1a1915]">
          <Phone className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8778]">
            Thắc mắc thanh toán?
          </div>
          <p className={`mt-0.5 text-sm font-semibold text-[#1a1915] ${compact ? 'text-[13px]' : ''}`}>
            Liên hệ {SUPPORT_CONTACT.name}
          </p>
          <a
            href={telHref}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold tabular-nums text-[#1a7f4b] hover:underline"
          >
            {SUPPORT_CONTACT.phoneDisplay}
          </a>
          {!compact && (
            <p className="mt-1.5 text-[12px] leading-5 text-[#5e5d59]">
              Gói Pro, chuyển khoản, mã giảm giá — nhắn Zalo hoặc gọi trực tiếp.
            </p>
          )}
          <div className={`mt-2.5 flex flex-wrap gap-2 ${compact ? 'mt-2' : ''}`}>
            <a
              href={telHref}
              className="inline-flex items-center justify-center rounded-full bg-[#1a1915] px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              Gọi điện
            </a>
            <a
              href={zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#e8e6dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1a1915] hover:bg-[#faf9f5]"
            >
              Zalo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareCell({ value, tone }: { value: Cell; tone: 'muted' | 'accent' }) {
  if (value === 'check') {
    return (
      <Check
        className={`h-4 w-4 lg:h-[18px] lg:w-[18px] ${tone === 'accent' ? 'text-[#1a7f4b]' : 'text-[#a8a59a]'}`}
        strokeWidth={2.5}
      />
    );
  }
  if (value === 'dash') {
    return <span className="text-base font-medium leading-none text-[#c5c2b6] lg:text-lg">−</span>;
  }
  return (
    <span
      className={`max-w-[4.5rem] text-center text-[11px] font-semibold leading-tight sm:max-w-none sm:text-xs lg:text-sm ${
        tone === 'accent' ? 'text-[#1a7f4b]' : 'text-[#8a8778]'
      }`}
    >
      {value}
    </span>
  );
}

function ShellHeader({ currentLabel }: { currentLabel: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e8e6dc]/80 bg-[#faf9f5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4 sm:h-14 sm:max-w-xl sm:px-6 lg:max-w-5xl">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[#5e5d59] transition hover:text-[#1a1915]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Quay lại</span>
          </Link>
          <div className="hidden h-4 w-px bg-[#e8e6dc] sm:block" />
          <Link href="/" className="text-sm font-semibold tracking-tight text-[#1a1915]">
            LingoPro
          </Link>
        </div>
        <div className="text-xs font-medium text-[#8a8778] sm:text-sm">{currentLabel}</div>
      </div>
    </header>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#faf9f5]">
          <Loader2 className="h-7 w-7 animate-spin text-[#1a1915]/40" />
        </div>
      }
    >
      <UpgradePageContent />
    </Suspense>
  );
}
