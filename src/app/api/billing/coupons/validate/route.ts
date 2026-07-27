/**
 * POST /api/billing/coupons/validate
 * Auth required — preview mã giảm giá trước khi tạo đơn (không tăng used_count).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';
import type { Plan } from '@/lib/supabase';
import {
  applyDiscount,
  assertCouponAllowedForOrder,
  computeBasePrice,
  computeGroupPrice,
  isTrialCouponCode,
  normalizePeriodMonths,
  normalizeSeats,
  trialCouponDays,
  type Coupon,
} from '@/lib/billing';

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    code?: string;
    plan?: Exclude<Plan, 'free'>;
    periodMonths?: number;
    orderKind?: 'individual' | 'group';
    seats?: number;
  };

  const code = body.code?.trim().toUpperCase() ?? '';
  if (!code) {
    return NextResponse.json({ error: 'Mã giảm giá trống' }, { status: 400 });
  }

  let periodMonths: number;
  let seats = 1;
  try {
    periodMonths = normalizePeriodMonths(body.periodMonths ?? 1);
    if (body.orderKind === 'group') {
      seats = normalizeSeats(body.seats ?? 5);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tham số không hợp lệ' },
      { status: 400 },
    );
  }

  const plan: Exclude<Plan, 'free'> = body.orderKind === 'group' ? 'pro' : (body.plan ?? 'pro');
  const orderKind = body.orderKind === 'group' ? 'group' : 'individual';

  const { data, error: dbErr } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (dbErr) {
    return safeErrorResponse(dbErr, 'Không kiểm tra được mã giảm giá');
  }
  if (!data) {
    return NextResponse.json({ valid: false, error: 'Mã không tồn tại hoặc đã tắt' }, { status: 404 });
  }

  const now = new Date();
  const validFrom = new Date(data.valid_from);
  const validUntil = data.valid_until ? new Date(data.valid_until) : null;
  const withinDate = now >= validFrom && (!validUntil || now <= validUntil);
  const withinUsage = !data.max_uses || data.used_count < data.max_uses;
  const applicablePlan = !data.applicable_plans || data.applicable_plans.includes(plan);

  if (!withinDate) {
    return NextResponse.json({ valid: false, error: 'Mã hết hạn hoặc chưa có hiệu lực' }, { status: 400 });
  }
  if (!withinUsage) {
    return NextResponse.json({ valid: false, error: 'Mã đã hết lượt dùng' }, { status: 400 });
  }
  if (!applicablePlan) {
    return NextResponse.json({ valid: false, error: 'Mã không áp dụng cho gói này' }, { status: 400 });
  }

  const coupon = data as Coupon;

  // Trial / free 100%: chỉ 1 tháng
  try {
    assertCouponAllowedForOrder({
      couponCode: code,
      coupon,
      orderKind,
      periodMonths,
    });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err instanceof Error ? err.message : 'Mã không hợp lệ với kỳ hạn này' },
      { status: 400 },
    );
  }

  // Preview trial: luôn tính theo 1 tháng
  const effectivePeriod = isTrialCouponCode(code) ? 1 : periodMonths;
  const basePrice =
    orderKind === 'group'
      ? computeGroupPrice(seats, effectivePeriod)
      : computeBasePrice(plan, effectivePeriod);
  const finalAmount = applyDiscount(basePrice, coupon);
  const days = trialCouponDays(code);

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_pct: coupon.discount_pct,
      discount_amount: coupon.discount_amount,
      max_uses: coupon.max_uses,
      used_count: coupon.used_count,
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
      applicable_plans: coupon.applicable_plans,
      is_active: coupon.is_active,
    },
    basePrice,
    finalAmount,
    saved: Math.max(0, basePrice - finalAmount),
    /** Client phải chuyển UI về 1 tháng khi nhận forcePeriodMonths */
    forcePeriodMonths: isTrialCouponCode(code) ? 1 : null,
    trialDays: days,
    message: days
      ? `Mã quà: ${days} ngày Pro miễn phí (chỉ kỳ 1 tháng). Không áp dụng gói 3–12 tháng.`
      : undefined,
  });
}
