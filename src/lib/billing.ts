/**
 * Billing — pricing constants, order helpers, coupon logic.
 *
 * Centralises all monetary calculations so API routes stay lean.
 */

import type { Plan, OrderKind } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getEffectivePlan } from '@/lib/entitlement';
import {
  getProMilestoneSnapshot,
  isMilestoneGatedCoupon,
  milestoneGateErrorMessage,
} from '@/lib/pro-trial-milestone';
import {
  applyCohortProPromo,
  isCohortProPromoActive,
} from '@/lib/cohort-pro-promo';

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
  if (!code || !input.coupon) return;

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

  // B6: Pro cá nhân = giá ~nhóm 3 người (−38%). Không stack lên order group.
  if (code === 'LIVEB6' && input.orderKind === 'group') {
    throw new Error('Mã LIVEB6 chỉ dùng gói Pro cá nhân (không áp gói nhóm).');
  }

  // Mọi mã 100% free: chặn kỳ > 1 tháng (không free 1 năm)
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
  pro: 599_000,     // ~37% off so với 79k×12 = 948k
  premium: 899_000, // ~42% off so với 129k×12 = 1.548tr
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
 * - 12 tháng → giá năm cố định.
 * - Khác → giá tháng × số tháng × (1 - % giảm kỳ hạn).
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

/** Giá mặc định mỗi ghế/tháng của gói nhóm (VNĐ). */
export const GROUP_SEAT_PRICE = 39_000;
/** Tier thành viên nhóm nhận được. ĐỔI TIER tại đây (pro ↔ premium). */
export const GROUP_PLAN: Exclude<Plan, 'free'> = 'pro';
export const GROUP_SEATS_MIN = 2;
export const GROUP_SEATS_MAX = 20;
/** Default UX: nhóm nhỏ (lớp/bạn học), không ép 10 ghế. */
export const GROUP_SEATS_DEFAULT = 5;

/** Tỷ lệ giá năm / (tháng×12) — dùng đồng bộ % giảm năm cho gói nhóm. */
export function annualDiscountFactor(plan: Exclude<Plan, 'free'>): number {
  const full = PLAN_PRICES[plan] * 12;
  if (full <= 0) return 1;
  return PLAN_ANNUAL_PRICES[plan] / full;
}

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, premium: 2 };

export function normalizeSeats(value: unknown): number {
  const n = typeof value === 'number' ? Math.floor(value) : NaN;
  if (!Number.isFinite(n) || n < GROUP_SEATS_MIN || n > GROUP_SEATS_MAX) {
    throw new Error(`Invalid seats. Must be ${GROUP_SEATS_MIN}-${GROUP_SEATS_MAX}.`);
  }
  return n;
}

/**
 * Lấy giá tiền cho mỗi ghế của gói nhóm (đơn vị VNĐ/ghế/tháng) dựa trên số lượng ghế:
 * - 2 ghế: 59k/ghế
 * - 3 ghế: 49k/ghế
 * - 4 ghế: 45k/ghế
 * - 5+ ghế: 39k/ghế
 */
export function getGroupSeatPrice(seats: number): number {
  const s = normalizeSeats(seats);
  if (s === 2) return 59_000;
  if (s === 3) return 49_000;
  if (s === 4) return 45_000;
  return 39_000;
}

/**
 * Giá gói nhóm = ghế × (giá theo số ghế) × số tháng × (1 - % giảm kỳ hạn).
 * 12 tháng → cùng % giảm năm với Pro cá nhân (annualDiscountFactor).
 */
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

/** Giá niêm yết gói nhóm (ghế × giá theo số ghế × tháng, KHÔNG giảm). */
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

/** Tính giá sau coupon. Trả về giá đã giảm (>= 0). */
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

// ─────────────────────────────────────────
// Order helpers
// ─────────────────────────────────────────

export interface CreateOrderInput {
  userId: string;
  plan: Exclude<Plan, 'free'>;
  periodMonths?: number;
  paymentMethod?: string;
  couponCode?: string;
  /** 'group' → gói nhóm: bỏ qua plan, dùng GROUP_PLAN + seats. */
  orderKind?: OrderKind;
  /** Số ghế khi orderKind='group'. */
  seats?: number;
  note?: string;
}

interface OrderSummary {
  id: string;
  amount: number;
  plan: Exclude<Plan, 'free'>;
  period_months: number;
  status: string;
  coupon_code: string | null;
  created_at: string;
}

/**
 * Tạo pending order + validate coupon nếu có.
 * Trả về order ID. Không thay đổi profile — chỉ khi admin confirm.
 */
export async function createOrder(
  supabase: SupabaseClient,
  input: CreateOrderInput,
) {
  const { userId, paymentMethod = 'bank_transfer' } = input;
  let periodMonths = normalizePeriodMonths(input.periodMonths);
  const couponCode = input.couponCode?.trim().toUpperCase() || '';

  // Gói nhóm: ép plan = GROUP_PLAN, tính giá theo ghế.
  const orderKind: OrderKind = input.orderKind === 'group' ? 'group' : 'individual';
  const seats = orderKind === 'group' ? normalizeSeats(input.seats ?? GROUP_SEATS_DEFAULT) : 1;
  const plan: Exclude<Plan, 'free'> = orderKind === 'group' ? GROUP_PLAN : input.plan;

  // Validate + apply coupon
  let coupon: Coupon | null = null;
  if (couponCode) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      // Check validity
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;
      const withinDate = now >= validFrom && (!validUntil || now <= validUntil);
      const withinUsage = !data.max_uses || data.used_count < data.max_uses;
      const applicablePlan = !data.applicable_plans || data.applicable_plans.includes(plan);

      if (withinDate && withinUsage && applicablePlan) {
        coupon = data as Coupon;
      }
    }

    // Trial / free 100%: chỉ 1 tháng — chặn free cả năm
    assertCouponAllowedForOrder({
      couponCode,
      coupon,
      orderKind,
      periodMonths,
    });

    // NEWBIE*: enrolled funnel + streak/từ — không enroll tại claim (chặn power user)
    if (coupon && isMilestoneGatedCoupon(couponCode)) {
      const snap = await getProMilestoneSnapshot(supabase, userId, { allowEnroll: false });
      if (!snap.eligible) {
        throw new Error(milestoneGateErrorMessage(snap));
      }
    }

    // Ép kỳ 1 tháng cho trial (phòng client gửi nhầm 12)
    if (coupon && isTrialCouponCode(couponCode)) {
      periodMonths = 1;
    }
  }

  // Áp giảm giá kỳ hạn ngay tại server → số tiền order luôn khớp giá hiển thị ở /upgrade
  const basePrice = orderKind === 'group'
    ? computeGroupPrice(seats, periodMonths)
    : computeBasePrice(plan, periodMonths);

  // Coupon (nếu có) ưu tiên; không coupon + Pro cá nhân + còn flash sale khóa → tự −38%
  let amount = applyDiscount(basePrice, coupon);
  if (
    !coupon &&
    orderKind === 'individual' &&
    plan === 'pro' &&
    isCohortProPromoActive()
  ) {
    amount = applyCohortProPromo(basePrice);
  }
  // Gói nhóm không cho redeem free qua coupon (RPC chỉ tạo entitlement cá nhân, không dựng group).
  if (amount === 0 && orderKind === 'group') {
    throw new Error('Group orders cannot be zero-value.');
  }
  if (amount === 0 && coupon) {
    let order: OrderSummary | null = null;
    let rpcErrorOccurred = false;

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('redeem_free_coupon_order', {
        p_user_id: userId,
        p_plan: plan,
        p_period_months: periodMonths,
        p_payment_method: paymentMethod,
        p_coupon_code: coupon.code,
        p_base_amount: basePrice,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const rows = rpcData as unknown as OrderSummary[] | null;
      order = rows?.[0] || null;
      if (!order) throw new Error('Empty response from RPC');
    } catch (err) {
      console.warn('[Billing] RPC redeem_free_coupon_order failed, falling back to TypeScript implementation:', err instanceof Error ? err.message : String(err));
      rpcErrorOccurred = true;
    }

    // Fallback: Direct database updates in TypeScript
    if (rpcErrorOccurred || !order) {
      const now = new Date();

      // Get current plan for history and stacking logic
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .single();
      const oldPlan = profile?.plan ?? 'free';

      let startsAt = now;
      if (profile?.plan_expires_at) {
        const currentExp = new Date(profile.plan_expires_at);
        if (currentExp > now) {
          startsAt = currentExp;
        }
      }

      const trialDays = trialCouponDays(coupon.code);
      let expiresAt = new Date(startsAt);
      if (trialDays) {
        expiresAt = new Date(startsAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + periodMonths);
      }

      // Create paid order
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          plan: plan,
          amount: 0,
          payment_method: paymentMethod,
          period_months: periodMonths,
          coupon_code: coupon.code,
          status: 'paid',
          order_kind: 'individual',
          seats: 1,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          paid_at: now.toISOString(),
          note: input.note ?? null,
        })
        .select('id, amount, plan, period_months, status, coupon_code, created_at, order_kind, seats')
        .single();

      if (orderErr || !newOrder) {
        throw new Error(`Failed to create fallback order: ${orderErr?.message || 'unknown error'}`);
      }

      order = newOrder as unknown as OrderSummary;

      let planExpiresAt = expiresAt;
      if (profile?.plan_expires_at) {
        const currentExp = new Date(profile.plan_expires_at);
        if (currentExp > planExpiresAt) planExpiresAt = currentExp;
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          plan: plan,
          plan_expires_at: planExpiresAt.toISOString(),
        })
        .eq('id', userId);

      if (profileErr) {
        throw new Error(`Failed to update fallback profile: ${profileErr.message}`);
      }

      // Write subscription history
      await supabase.from('subscription_history').insert({
        user_id: userId,
        old_plan: oldPlan,
        new_plan: plan,
        reason: 'payment',
        order_id: order.id,
      });

      // Increment coupon usage
      await supabase.rpc('increment_coupon_usage', { p_code: coupon.code });
    } else {
      // RPC mặc định = period_months (1 tháng) → override trial theo NGÀY
      const trialExp = trialCouponExpiry(coupon.code);
      if (trialExp) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_expires_at')
          .eq('id', userId)
          .single();
        let planExpiresAt = trialExp;
        if (profile?.plan_expires_at) {
          const currentExp = new Date(profile.plan_expires_at);
          if (currentExp > planExpiresAt) planExpiresAt = currentExp;
        }
        await supabase
          .from('profiles')
          .update({
            plan: plan,
            plan_expires_at: planExpiresAt.toISOString(),
          })
          .eq('id', userId);
      }

      if (input.note && order.id) {
        await supabase
          .from('orders')
          .update({ note: input.note })
          .eq('id', order.id);
      }
    }

    return { order, discount: basePrice };
  }

  if (amount === 0) {
    throw new Error('Zero-value orders require a valid coupon redemption.');
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      plan,
      amount,
      payment_method: paymentMethod,
      period_months: periodMonths,
      coupon_code: coupon?.code ?? null,
      status: 'pending',
      order_kind: orderKind,
      seats,
      note: input.note ?? null,
    })
    .select('id, amount, plan, period_months, status, coupon_code, created_at, order_kind, seats')
    .single();

  if (error) throw new Error(`Failed to create order: ${error.message}`);

  return { order, discount: coupon ? basePrice - amount : 0 };
}

/**
 * Admin xác nhận thanh toán → activate subscription.
 * 1. Update order status = 'paid'
 * 2. Update profiles.plan + plan_expires_at
 * 3. Ghi subscription_history
 * 4. Tăng coupon used_count nếu có
 */
export async function confirmOrder(
  supabase: SupabaseClient,
  orderId: string,
  adminId: string | null,
  paymentRef?: string,
  note?: string,
) {
  const { data, error } = await supabase.rpc('confirm_paid_order', {
    p_order_id: orderId,
    p_admin_id: adminId,
    p_payment_ref: paymentRef?.trim() || null,
    p_note: note || null,
  });

  if (error) {
    const message = error.message || 'Unknown database error';
    if (message.includes('Order not found')) throw new Error('Order not found');
    if (message.includes('Payment reference already used') || error.code === '23505') {
      throw new Error('Payment reference already used');
    }
    if (message.includes('Order already')) throw new Error(message);
    throw new Error(`Failed to confirm order: ${message}`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Failed to confirm order: invalid RPC response');
  }

  const result = data as {
    success: boolean;
    plan: Exclude<Plan, 'free'>;
    expiresAt: string;
  };
  return { success: result.success, plan: result.plan, expiresAt: result.expiresAt };
}

// ─────────────────────────────────────────
// Time helpers
// ─────────────────────────────────────────

/** Số ngày còn lại trước khi gói hết hạn. <0 = đã hết. null = free/lifetime. */
export function getRemainingDays(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Format giá VNĐ: 99000 → "99,000₫" */
export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + '₫';
}

/** Format ngày hết hạn cho UI. */
export function formatExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Lifetime';
  return new Date(expiresAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─────────────────────────────────────────
// Gói Nhóm — kích hoạt & entitlement
// ─────────────────────────────────────────

interface GroupOrderRow {
  id: string;
  user_id: string;
  plan: Exclude<Plan, 'free'>;
  seats?: number | null;
}

/** Mã mời 6 ký tự (bỏ ký tự dễ nhầm 0/O/1/I). */
function randomInviteCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function genUniqueInviteCode(supabase: SupabaseClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = randomInviteCode(6);
    const { data } = await supabase.from('groups').select('id').eq('invite_code', code).maybeSingle();
    if (!data) return code;
  }
  throw new Error('Failed to generate unique invite code');
}

/**
 * Cấp entitlement nhóm cho 1 user — KHÔNG hạ cấp gói/hết hạn đang tốt hơn.
 * Chọn gói = rank cao hơn giữa (gói hiệu lực hiện tại, plan nhóm); expiry = max(hiện tại, nhóm).
 */
export async function grantGroupEntitlement(
  supabase: SupabaseClient,
  userId: string,
  plan: Exclude<Plan, 'free'>,
  expiresAtISO: string,
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const curEffective = getEffectivePlan(
    profile?.plan as Plan | undefined,
    profile?.plan_expires_at as string | null | undefined,
  );
  const curExpMs = profile?.plan_expires_at ? new Date(profile.plan_expires_at as string).getTime() : 0;
  const newExpMs = new Date(expiresAtISO).getTime();

  const chosenPlan: Plan = PLAN_RANK[curEffective] >= PLAN_RANK[plan] ? curEffective : plan;
  const chosenExpMs = Math.max(curExpMs, newExpMs);

  await supabase
    .from('profiles')
    .update({ plan: chosenPlan, plan_expires_at: new Date(chosenExpMs).toISOString() })
    .eq('id', userId);
}

/**
 * Gỡ entitlement nhóm khi member rời/bị xóa — chỉ reset nếu entitlement đến TỪ nhóm này
 * (heuristic: plan_expires_at khớp expiry nhóm). Member tự mua gói riêng không bị đụng.
 */
export async function revertGroupEntitlement(
  supabase: SupabaseClient,
  userId: string,
  groupExpiresAt: string | null | undefined,
): Promise<void> {
  if (!groupExpiresAt) return;
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_expires_at')
    .eq('id', userId)
    .maybeSingle();
  const exp = profile?.plan_expires_at as string | null | undefined;
  if (exp && Math.abs(new Date(exp).getTime() - new Date(groupExpiresAt).getTime()) < 60_000) {
    await supabase.from('profiles').update({ plan: 'free', plan_expires_at: null }).eq('id', userId);
  }
}

/**
 * Dựng (hoặc gia hạn) group sau khi order nhóm được thanh toán, rồi cấp Pro cho owner + mọi member.
 * Gia hạn: owner đã có group active → extend expiry + (có thể) tăng ghế, re-propagate entitlement.
 */
export async function activateGroup(
  supabase: SupabaseClient,
  order: GroupOrderRow,
  startsAt: Date,
  expiresAt: Date,
  adminId: string | null,
): Promise<void> {
  const plan: Exclude<Plan, 'free'> = (order.plan as Exclude<Plan, 'free'>) || GROUP_PLAN;
  const seatLimit = order.seats && order.seats > 1 ? order.seats : GROUP_SEATS_DEFAULT;

  // Owner đã có group active? → gia hạn thay vì tạo mới.
  const { data: existing } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', order.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let groupId: string;
  if (existing) {
    const newSeatLimit = Math.max(existing.seat_limit, seatLimit);
    await supabase
      .from('groups')
      .update({
        expires_at: expiresAt.toISOString(),
        seat_limit: newSeatLimit,
        order_id: order.id,
        status: 'active',
      })
      .eq('id', existing.id);
    groupId = existing.id;
  } else {
    const inviteCode = await genUniqueInviteCode(supabase);
    const { data: created, error } = await supabase
      .from('groups')
      .insert({
        owner_id: order.user_id,
        plan,
        seat_limit: seatLimit,
        invite_code: inviteCode,
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        order_id: order.id,
      })
      .select('id')
      .single();
    if (error || !created) throw new Error(`Failed to create group: ${error?.message}`);
    groupId = created.id;

    // Owner = member đầu tiên.
    await supabase.from('group_members').insert({ group_id: groupId, user_id: order.user_id });
  }

  // Cấp/đồng bộ entitlement cho mọi member (gồm owner) tới expiry mới.
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);
  const userIds = new Set<string>((members ?? []).map((m) => m.user_id as string));
  userIds.add(order.user_id);

  for (const uid of userIds) {
    await grantGroupEntitlement(supabase, uid, plan, expiresAt.toISOString());
  }

  // Log history cho owner.
  await supabase.from('subscription_history').insert({
    user_id: order.user_id,
    old_plan: null,
    new_plan: plan,
    reason: 'payment',
    order_id: order.id,
    changed_by: adminId,
  });
}
