/**
 * GET  /api/billing/pro-milestone — tiến độ mốc Pro trial (streak + từ)
 * POST /api/billing/pro-milestone — claim Pro 7 ngày khi đủ mốc (NEWBIE1W)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createOrder } from '@/lib/billing';
import {
  getProMilestoneSnapshot,
  PRO_MILESTONE_COUPON,
  PRO_MILESTONE_DAYS,
  PRO_MILESTONE_LABEL,
  milestoneGateErrorMessage,
} from '@/lib/pro-trial-milestone';

async function authUser(req: NextRequest) {
  const supabase = createServiceClient();
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { supabase, user: null as null };
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return { supabase, user };
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await authUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // allowEnroll: ghi nhận funnel khi còn dưới mốc — power user không được enroll
    const snapshot = await getProMilestoneSnapshot(supabase, user.id, { allowEnroll: true });
    return NextResponse.json(
      {
        success: true,
        milestone: snapshot,
        reward: {
          plan: 'pro',
          days: PRO_MILESTONE_DAYS,
          label: PRO_MILESTONE_LABEL,
          coupon: PRO_MILESTONE_COUPON,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ProMilestone] GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await authUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Không enroll tại claim — chỉ user đã enroll khi under mốc mới eligible
    const snapshot = await getProMilestoneSnapshot(supabase, user.id, { allowEnroll: false });
    if (!snapshot.eligible) {
      return NextResponse.json(
        {
          error: milestoneGateErrorMessage(snapshot),
          milestone: snapshot,
        },
        { status: 403 },
      );
    }

    const result = await createOrder(supabase, {
      userId: user.id,
      plan: 'pro',
      periodMonths: 1,
      paymentMethod: 'manual',
      couponCode: PRO_MILESTONE_COUPON,
      orderKind: 'individual',
      note: `pro_milestone:enrolled|streak${snapshot.streak}+words${snapshot.words}`,
    });

    const order = result.order as {
      id: string;
      amount: number;
      plan: string;
      status: string;
    };

    const after = await getProMilestoneSnapshot(supabase, user.id, { allowEnroll: false });

    return NextResponse.json({
      success: true,
      gift: true,
      trialDays: PRO_MILESTONE_DAYS,
      message: `Đã nhận Pro ${PRO_MILESTONE_LABEL} (${PRO_MILESTONE_DAYS} ngày).`,
      order: {
        id: order.id,
        amount: order.amount,
        plan: order.plan,
        status: order.status,
      },
      milestone: after,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ProMilestone] POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
