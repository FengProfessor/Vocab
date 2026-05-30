/**
 * Billing — pricing constants, order helpers, coupon logic.
 *
 * Centralises all monetary calculations so API routes stay lean.
 */

import type { Plan } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

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

/** Giá gói School (dùng cho landing, riêng vì ngoài Plan type hiện tại). */
export const SCHOOL_PRICE = 499_000;

/** Kỳ hạn mua + % giảm. 12 tháng = null → dùng giá năm cố định (PLAN_ANNUAL_PRICES). */
export const PERIOD_OPTIONS: { months: number; label: string; discountPct: number | null }[] = [
  { months: 1, label: '1 tháng', discountPct: 0 },
  { months: 3, label: '3 tháng', discountPct: 10 },
  { months: 6, label: '6 tháng', discountPct: 20 },
  { months: 12, label: '1 năm', discountPct: null },
];

/**
 * Giá gốc (trước coupon) theo gói + số tháng. NGUỒN DUY NHẤT cho cả client lẫn server.
 * - 12 tháng → giá năm cố định.
 * - Khác → giá tháng × số tháng × (1 - % giảm kỳ hạn).
 */
export function computeBasePrice(plan: Exclude<Plan, 'free'>, periodMonths: number): number {
  if (periodMonths === 12) return PLAN_ANNUAL_PRICES[plan];
  const opt = PERIOD_OPTIONS.find((o) => o.months === periodMonths);
  const pct = opt?.discountPct ?? 0;
  return Math.round(PLAN_PRICES[plan] * periodMonths * (1 - pct / 100));
}

/** Giá niêm yết (giá tháng × số tháng, KHÔNG giảm) — để hiển thị "tiết kiệm bao nhiêu". */
export function listPrice(plan: Exclude<Plan, 'free'>, periodMonths: number): number {
  return PLAN_PRICES[plan] * periodMonths;
}

/** Nhãn gói cho UI. */
export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

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
}

/**
 * Tạo pending order + validate coupon nếu có.
 * Trả về order ID. Không thay đổi profile — chỉ khi admin confirm.
 */
export async function createOrder(
  supabase: SupabaseClient,
  input: CreateOrderInput,
) {
  const { userId, plan, periodMonths = 1, paymentMethod = 'bank_transfer', couponCode } = input;

  // Áp giảm giá kỳ hạn ngay tại server → số tiền order luôn khớp giá hiển thị ở /upgrade
  const basePrice = computeBasePrice(plan, periodMonths);

  // Validate + apply coupon
  let coupon: Coupon | null = null;
  if (couponCode) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
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
  }

  const amount = applyDiscount(basePrice, coupon);

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
    })
    .select('id, amount, plan, period_months, status, coupon_code, created_at')
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
  adminId: string,
  paymentRef?: string,
  note?: string,
) {
  // 1. Fetch order
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) throw new Error('Order not found');
  if (order.status !== 'pending') throw new Error(`Order already ${order.status}`);

  const now = new Date();
  const startsAt = now;
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + (order.period_months || 1));

  // 2. Fetch old plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', order.user_id)
    .single();

  const oldPlan = profile?.plan ?? 'free';

  // 3. Update order
  const { error: updateOrderErr } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paid_at: now.toISOString(),
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      processed_by: adminId,
      payment_ref: paymentRef || order.payment_ref,
      note: note || order.note,
    })
    .eq('id', orderId);

  if (updateOrderErr) throw new Error(`Failed to update order: ${updateOrderErr.message}`);

  // 4. Update user profile
  const { error: updateProfileErr } = await supabase
    .from('profiles')
    .update({
      plan: order.plan,
      plan_expires_at: expiresAt.toISOString(),
    })
    .eq('id', order.user_id);

  if (updateProfileErr) throw new Error(`Failed to update profile: ${updateProfileErr.message}`);

  // 5. Log subscription history
  await supabase.from('subscription_history').insert({
    user_id: order.user_id,
    old_plan: oldPlan,
    new_plan: order.plan,
    reason: 'payment',
    order_id: orderId,
    changed_by: adminId,
  });

  // 6. Increment coupon used_count (non-fatal nếu lỗi)
  if (order.coupon_code) {
    const { error: couponErr } = await supabase.rpc('increment_coupon_usage', { p_code: order.coupon_code });
    if (couponErr) {
      console.warn('[Billing] Failed to increment coupon usage for', order.coupon_code, couponErr.message);
    }
  }

  return { success: true, plan: order.plan, expiresAt: expiresAt.toISOString() };
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
