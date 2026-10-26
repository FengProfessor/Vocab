import type { Plan, OrderKind } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getEffectivePlan } from '@/lib/entitlement';
import {
  isMilestoneGatedCoupon,
  milestoneGateErrorMessage,
} from '@/lib/pro-trial-milestone';
import { getProMilestoneSnapshot } from '@/lib/pro-trial-milestone-server';
import {
  applyCohortProPromo,
  isCohortProPromoActive,
} from '@/lib/cohort-pro-promo';
import {
  applyDiscount,
  assertCouponAllowedForOrder,
  computeBasePrice,
  computeGroupPrice,
  GROUP_PLAN,
  GROUP_SEATS_DEFAULT,
  isKhaiGiangCampaignCode,
  isTrialCouponCode,
  isValidPeriodMonths,
  KHAI_GIANG_CAMPAIGN_CODES,
  normalizePeriodMonths,
  normalizeSeats,
  PLAN_RANK,
  trialCouponDays,
  trialCouponExpiry,
  type Coupon,
  type CreateOrderInput,
} from '@/lib/billing';

export {
  isKhaiGiangCampaignCode,
  isTrialCouponCode,
  isValidPeriodMonths,
  KHAI_GIANG_CAMPAIGN_CODES,
  trialCouponDays,
};

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

  const orderKind: OrderKind = input.orderKind === 'group' ? 'group'
    : input.orderKind === 'challenge' ? 'challenge'
    : 'individual';
  const seats = orderKind === 'group' ? normalizeSeats(input.seats ?? GROUP_SEATS_DEFAULT) : 1;
  const plan: Exclude<Plan, 'free'> = orderKind === 'group' ? GROUP_PLAN : input.plan;

  let coupon: Coupon | null = null;
  if (couponCode) {
    if (couponCode === 'WLU') {
      const { data: existingWlu } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('coupon_code', 'WLU')
        .maybeSingle();

      if (existingWlu) {
        throw new Error('Tài khoản của bạn đã sử dụng mã WLU rồi.');
      }

      periodMonths = 12;
    }

    if (isKhaiGiangCampaignCode(couponCode)) {
      throw new Error('Chương trình ưu đãi Khai Giảng (3 tháng Pro) đã kết thúc.');
    }

    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;
      const withinDate = now >= validFrom && (!validUntil || now <= validUntil);
      const withinUsage = !data.max_uses || data.used_count < data.max_uses;
      const applicablePlan = !data.applicable_plans || data.applicable_plans.includes(plan);

      if (withinDate && withinUsage && applicablePlan) {
        coupon = data as Coupon;
      }
    } else if (couponCode === 'WLU') {
      coupon = {
        id: 'synthetic-wlu',
        code: 'WLU',
        discount_pct: 100,
        discount_amount: null,
        max_uses: null,
        used_count: 0,
        valid_from: new Date(0).toISOString(),
        valid_until: null,
        applicable_plans: ['pro', 'premium'],
        is_active: true,
      };
    }

    assertCouponAllowedForOrder({
      couponCode,
      coupon,
      orderKind,
      periodMonths,
    });

    if (coupon && isMilestoneGatedCoupon(couponCode)) {
      const snap = await getProMilestoneSnapshot(supabase, userId, { allowEnroll: false });
      if (!snap.eligible) {
        throw new Error(milestoneGateErrorMessage(snap));
      }
    }

    if (coupon && isTrialCouponCode(couponCode)) {
      periodMonths = 1;
    }
  }

  const basePrice = orderKind === 'group'
    ? computeGroupPrice(seats, periodMonths)
    : computeBasePrice(plan, periodMonths);

  let amount = applyDiscount(basePrice, coupon);
  if (
    !coupon &&
    orderKind === 'individual' &&
    plan === 'pro' &&
    isCohortProPromoActive()
  ) {
    amount = applyCohortProPromo(basePrice);
  }
  if (amount === 0 && orderKind === 'group') {
    throw new Error('Group orders cannot be zero-value.');
  }
  if (amount === 0 && coupon) {
    let order: OrderSummary | null = null;
    let rpcErrorOccurred = false;

    const { data: initialProfile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .maybeSingle();

    const now = new Date();
    let startsAt = now;
    if (initialProfile?.plan_expires_at) {
      const currentExp = new Date(initialProfile.plan_expires_at);
      if (currentExp > now) {
        startsAt = currentExp;
      }
    }

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

    let finalExpiresAt: Date;

    if (rpcErrorOccurred || !order) {
      const oldPlan = initialProfile?.plan ?? 'free';

      const trialDays = trialCouponDays(coupon.code);
      let expiresAt = new Date(startsAt);
      if (trialDays) {
        expiresAt = new Date(startsAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + periodMonths);
      }
      finalExpiresAt = expiresAt;

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

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          plan: plan,
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);

      if (profileErr) {
        throw new Error(`Failed to update fallback profile: ${profileErr.message}`);
      }

      await supabase.from('subscription_history').insert({
        user_id: userId,
        old_plan: oldPlan,
        new_plan: plan,
        reason: 'payment',
        order_id: order.id,
      });

      await supabase.rpc('increment_coupon_usage', { p_code: coupon.code });
    } else {
      const trialDays = trialCouponDays(coupon.code);
      if (trialDays) {
        const planExpiresAt = trialCouponExpiry(coupon.code, startsAt);
        finalExpiresAt = planExpiresAt ?? new Date(startsAt.getTime() + trialDays * 24 * 60 * 60 * 1000);

        await supabase
          .from('profiles')
          .update({
            plan: plan,
            plan_expires_at: finalExpiresAt.toISOString(),
          })
          .eq('id', userId);

        if (order.id) {
          await supabase
            .from('orders')
            .update({
              starts_at: startsAt.toISOString(),
              expires_at: finalExpiresAt.toISOString(),
              ...(input.note ? { note: input.note } : {}),
            })
            .eq('id', order.id);
        }
      } else {
        finalExpiresAt = new Date(startsAt);
        finalExpiresAt.setMonth(finalExpiresAt.getMonth() + periodMonths);

        if (input.note && order.id) {
          await supabase
            .from('orders')
            .update({ note: input.note })
            .eq('id', order.id);
        }
      }
    }

    return {
      order,
      discount: basePrice,
      amount: 0,
      plan,
      coupon,
      planExpiresAt: finalExpiresAt.toISOString(),
    };
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

  try {
    const { data: ord } = await supabase
      .from('orders')
      .select('user_id, amount')
      .eq('id', orderId)
      .maybeSingle();

    if (ord?.user_id && ord?.amount) {
      await supabase.rpc('fn_process_referral_reward', {
        p_order_id: orderId,
        p_referee_id: ord.user_id,
        p_order_amount: ord.amount,
      });
    } else {
      await supabase.rpc('fn_process_referral_reward', { p_order_id: orderId });
    }
  } catch (refErr) {
    console.warn('[Billing] Referral reward trigger warning:', refErr);
  }

  return { success: result.success, plan: result.plan, expiresAt: result.expiresAt };
}

interface GroupOrderRow {
  id: string;
  user_id: string;
  plan: Exclude<Plan, 'free'>;
  seats?: number | null;
}

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

export async function activateGroup(
  supabase: SupabaseClient,
  order: GroupOrderRow,
  startsAt: Date,
  expiresAt: Date,
  adminId: string | null,
): Promise<void> {
  const plan: Exclude<Plan, 'free'> = (order.plan as Exclude<Plan, 'free'>) || GROUP_PLAN;
  const seatLimit = order.seats && order.seats > 1 ? order.seats : GROUP_SEATS_DEFAULT;

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

    await supabase.from('group_members').insert({ group_id: groupId, user_id: order.user_id });
  }

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);
  const userIds = new Set<string>((members ?? []).map((m) => m.user_id as string));
  userIds.add(order.user_id);

  for (const uid of userIds) {
    await grantGroupEntitlement(supabase, uid, plan, expiresAt.toISOString());
  }

  await supabase.from('subscription_history').insert({
    user_id: order.user_id,
    old_plan: null,
    new_plan: plan,
    reason: 'payment',
    order_id: order.id,
    changed_by: adminId,
  });
}
