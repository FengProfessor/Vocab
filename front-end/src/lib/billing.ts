/**
 * Billing — client-safe pricing constants, order types, and coupon validation helpers.
 * Server-side database mutations live in `@/lib/billing-server`.
 */

import type { Plan, OrderKind } from '@/lib/supabase';

/**
 * Coupon tặng trial theo NGÀY (override period_months của RPC = 1 tháng).
 * NEWBIE* = quà mốc học (streak + từ) — KHÔNG tặng sau tour; LIVE* = quà live group.
 */
export const TRIAL_COUPON_DAYS: Record<string, number> = {
  NEWBIE1W: 7,
  NEWBIE2W: 7,
  /** Live Buổi 3 — 1 tuần Pro free (quà tham gia live) */
  LIVEB3: 7,
};

/**
 * Danh sách mã chiến dịch Khai Giảng 05/09 (3 tháng = 90 ngày Pro).
 * ĐÃ KẾT THÚC / NGỪNG HOẠT ĐỘNG.
 */
export const KHAI_GIANG_CAMPAIGN_CODES = ['KHAIGIANG3M', 'THAYPHONG3M'] as const;
export const KHAI_GIANG_CAMPAIGN_ACTIVE = false;

export function isKhaiGiangCampaignCode(code: string): boolean {
  return (KHAI_GIANG_CAMPAIGN_CODES as readonly string[]).includes(code.trim().toUpperCase());
}

export function trialCouponExpiry(code: string, from: Date = new Date()): Date | null {
  const days = TRIAL_COUPON_DAYS[code.toUpperCase()];
  if (!days) return null;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Mã trial (LIVEB3, NEWBIE…): quà theo NGÀY, chỉ gói cá nhân 1 tháng. */
export function isTrialCouponCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(TRIAL_COUPON_DAYS, code.trim().toUpperCase());
}

export function trialCouponDays(code: string): number | null {
  return TRIAL_COUPON_DAYS[code.trim().toUpperCase()] ?? null;
}

/**
 * Trial / free 100%: không cho áp lên 3–12 tháng (tránh free cả năm).
 * Ném Error message tiếng Việt cho API trả client.
 */
export function assertCouponAllowedForOrder(input: {
  couponCode: string;
  coupon: Coupon | null;
  orderKind: OrderKind;
  periodMonths: number;
}): void {
  const code = input.couponCode.trim().toUpperCase();
  if (!code) return;

  if (code === 'WLU') {
    if (input.orderKind === 'group') {
      throw new Error('Mã WLU chỉ dùng gói Pro cá nhân, không dùng gói nhóm.');
    }
    return;
  }

  if (!input.coupon) return;

  if (isTrialCouponCode(code)) {
    if (input.orderKind === 'group') {
      throw new Error('Mã quà live/trial chỉ dùng gói Pro cá nhân, không dùng gói nhóm.');
    }
    if (input.periodMonths !== 1) {
      throw new Error(
        `Mã ${code} chỉ áp dụng kỳ 1 tháng (quà ${trialCouponDays(code)} ngày Pro). Hãy chọn "1 tháng" rồi áp mã lại.`,
      );
    }
  }

  if (code === 'LIVEB6' && input.orderKind === 'group') {
    throw new Error('Mã LIVEB6 chỉ dùng gói Pro cá nhân (không áp gói nhóm).');
  }

  const isFullFree =
    (input.coupon.discount_pct != null && input.coupon.discount_pct >= 100) ||
    (input.coupon.discount_amount != null && input.coupon.discount_amount >= 1_000_000);
  if (isFullFree && input.periodMonths !== 1) {
    throw new Error(
      `Mã ${code} là quà/miễn phí — chỉ dùng với kỳ 1 tháng. Đổi sang "1 tháng" rồi áp lại.`,
    );
  }
  if (isFullFree && input.orderKind === 'group') {
    throw new Error('Mã miễn phí không áp dụng gói nhóm.');
  }
}

// ─────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────

/** Giá gốc theo tháng (VNĐ). Free không có trong map. */
export const PLAN_PRICES: Record<Exclude<Plan, 'free'>, number> = {
  pro: 79_000,
  premium: 129_000,
};

/** Giá trọn gói NĂM (12 tháng) — đã giảm sẵn so với trả từng tháng. */
export const PLAN_ANNUAL_PRICES: Record<Exclude<Plan, 'free'>, number> = {
  pro: 599_000,
  premium: 899_000,
};

/** Kỳ hạn mua + % giảm. 12 tháng = null → dùng giá năm cố định (PLAN_ANNUAL_PRICES). */
export const VALID_PERIOD_MONTHS = [1, 3, 6, 12] as const;
export type BillingPeriodMonths = (typeof VALID_PERIOD_MONTHS)[number];

export const PERIOD_OPTIONS: { months: BillingPeriodMonths; label: string; discountPct: number | null }[] = [
  { months: 1, label: '1 tháng', discountPct: 0 },
  { months: 3, label: '3 tháng', discountPct: 10 },
  { months: 6, label: '6 tháng', discountPct: 20 },
  { months: 12, label: '1 năm', discountPct: null },
];

export function isValidPeriodMonths(value: unknown): value is BillingPeriodMonths {
  return typeof value === 'number' && VALID_PERIOD_MONTHS.includes(value as BillingPeriodMonths);
}

export function normalizePeriodMonths(value: unknown): BillingPeriodMonths {
  if (value === undefined || value === null) return 1;
  if (isValidPeriodMonths(value)) return value;
  throw new Error('Invalid periodMonths. Must be one of 1, 3, 6, 12.');
}

/**
 * Giá gốc (trước coupon) theo gói + số tháng. NGUỒN DUY NHẤT cho cả client lẫn server.
 */
export function computeBasePrice(plan: Exclude<Plan, 'free'>, periodMonths: number): number {
  const normalizedPeriod = normalizePeriodMonths(periodMonths);
  if (normalizedPeriod === 12) return PLAN_ANNUAL_PRICES[plan];
  const opt = PERIOD_OPTIONS.find((o) => o.months === normalizedPeriod);
  const pct = opt?.discountPct ?? 0;
  return Math.round(PLAN_PRICES[plan] * normalizedPeriod * (1 - pct / 100));
}

/** Giá niêm yết (giá tháng × số tháng, KHÔNG giảm) — để hiển thị "tiết kiệm bao nhiêu". */
export function listPrice(plan: Exclude<Plan, 'free'>, periodMonths: number): number {
  return PLAN_PRICES[plan] * normalizePeriodMonths(periodMonths);
}

/** Nhãn gói cho UI. */
export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

// ─────────────────────────────────────────
// Gói Nhóm (Group Plan)
// ─────────────────────────────────────────

export const GROUP_SEAT_PRICE = 39_000;
export const GROUP_PLAN: Exclude<Plan, 'free'> = 'pro';
export const GROUP_SEATS_MIN = 2;
export const GROUP_SEATS_MAX = 20;
export const GROUP_SEATS_DEFAULT = 5;

export function annualDiscountFactor(plan: Exclude<Plan, 'free'>): number {
  const full = PLAN_PRICES[plan] * 12;
  if (full <= 0) return 1;
  return PLAN_ANNUAL_PRICES[plan] / full;
}

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, premium: 2 };

export function normalizeSeats(value: unknown): number {
  const n = typeof value === 'number' ? Math.floor(value) : NaN;
  if (!Number.isFinite(n) || n < GROUP_SEATS_MIN || n > GROUP_SEATS_MAX) {
    throw new Error(`Invalid seats. Must be ${GROUP_SEATS_MIN}-${GROUP_SEATS_MAX}.`);
  }
  return n;
}

export function getGroupSeatPrice(seats: number): number {
  const s = normalizeSeats(seats);
  if (s === 2) return 59_000;
  if (s === 3) return 49_000;
  if (s === 4) return 45_000;
  return 39_000;
}

export function computeGroupPrice(seats: number, periodMonths: number): number {
  const s = normalizeSeats(seats);
  const seatPrice = getGroupSeatPrice(s);
  const months = normalizePeriodMonths(periodMonths);
  if (months === 12) {
    return Math.round(seatPrice * s * 12 * annualDiscountFactor(GROUP_PLAN));
  }
  const opt = PERIOD_OPTIONS.find((o) => o.months === months);
  const pct = opt?.discountPct ?? 0;
  return Math.round(seatPrice * s * months * (1 - pct / 100));
}

export function listGroupPrice(seats: number, periodMonths: number): number {
  const s = normalizeSeats(seats);
  const seatPrice = getGroupSeatPrice(s);
  return seatPrice * s * normalizePeriodMonths(periodMonths);
}

// ─────────────────────────────────────────
// Coupon
// ─────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discount_pct: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  applicable_plans: string[] | null;
  is_active: boolean;
}

export function applyDiscount(basePrice: number, coupon: Coupon | null): number {
  if (!coupon) return basePrice;
  if (coupon.discount_pct) {
    return Math.max(0, Math.round(basePrice * (1 - coupon.discount_pct / 100)));
  }
  if (coupon.discount_amount) {
    return Math.max(0, basePrice - coupon.discount_amount);
  }
  return basePrice;
}

export interface CreateOrderInput {
  userId: string;
  plan: Exclude<Plan, 'free'>;
  periodMonths?: number;
  paymentMethod?: string;
  couponCode?: string;
  orderKind?: OrderKind;
  seats?: number;
  note?: string;
}

// ─────────────────────────────────────────
// Time & Currency helpers
// ─────────────────────────────────────────

export function getRemainingDays(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + '₫';
}

export function formatExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Lifetime';
  return new Date(expiresAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
