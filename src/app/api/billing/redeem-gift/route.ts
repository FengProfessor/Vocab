/**
 * POST /api/billing/redeem-gift
 * Nhận quà trial (LIVEB3, NEWBIE…) — chỉ mã trial, gói cá nhân, 7 ngày Pro.
 * NEWBIE*: server gate enroll funnel + streak/từ (50–120) trong createOrder — không enroll tại redeem.
 * LIVE*: không gate mốc (quà live).
 * Tách khỏi flow mua 1 tháng / 1 năm để không hiểu nhầm.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  createOrder,
  isTrialCouponCode,
  trialCouponDays,
  isKhaiGiangCampaignCode,
  KHAI_GIANG_CAMPAIGN_CODES,
} from '@/lib/billing';

export async function POST(req: NextRequest) {
  try {
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

    const body = (await req.json().catch(() => ({}))) as { code?: string };
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Vui lòng nhập mã quà tặng.' }, { status: 400 });
    }

    if (!isTrialCouponCode(code)) {
      return NextResponse.json(
        {
          error:
            'Mã này không phải mã quà live/trial. Mã giảm giá mua gói dùng ở phần Thanh toán bên dưới.',
        },
        { status: 400 },
      );
    }

    // Kiểm tra chống lạm dụng: mỗi tài khoản chỉ được kích hoạt 1 lần
    const codesToCheck = isKhaiGiangCampaignCode(code)
      ? [...KHAI_GIANG_CAMPAIGN_CODES]
      : [code];

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('coupon_code', codesToCheck)
      .eq('status', 'paid')
      .maybeSingle();

    if (existingOrder) {
      const errorMsg = isKhaiGiangCampaignCode(code)
        ? 'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.'
        : `Tài khoản của bạn đã kích hoạt mã ${code} rồi.`;
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const days = trialCouponDays(code) ?? 7;

    // createOrder: trial → ép 1 tháng giá, amount 0, expires = N ngày
    const result = await createOrder(supabase, {
      userId: user.id,
      plan: 'pro',
      periodMonths: 1,
      paymentMethod: 'bank_transfer',
      couponCode: code,
      orderKind: 'individual',
      note: `gift_redeem:${code}`,
    });

    const order = result.order as {
      id: string;
      amount: number;
      plan: string;
      status: string;
      period_months?: number;
    };

    let planExpiresAt = (result as { planExpiresAt?: string }).planExpiresAt;
    if (!planExpiresAt) {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();
      planExpiresAt = updatedProfile?.plan_expires_at ?? undefined;
    }

    return NextResponse.json({
      success: true,
      plan: 'pro',
      planExpiresAt,
      gift: true,
      trialDays: days,
      message: `Đã nhận ${days} ngày Pro miễn phí.`,
      order: {
        id: order.id,
        amount: order.amount,
        plan: order.plan,
        status: order.status,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing] redeem-gift error:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
