import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CAMPAIGN_KEY = 'campaign_upgrade_gift_20260806';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Lấy thông tin profile hiện tại
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('id, plan, plan_expires_at')
      .eq('id', user.id)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Kiểm tra xem người dùng đã từng nhận quà campaign 7d chưa
    const { data: history } = await supabase
      .from('subscription_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('reason', CAMPAIGN_KEY)
      .maybeSingle();

    const alreadyClaimedInDb = !!history;

    if (alreadyClaimedInDb) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        plan: profile.plan || 'pro',
        planExpiresAt: profile.plan_expires_at,
        message: 'Bạn đã nhận quà 7 ngày Pro nâng cấp máy chủ.',
      });
    }

    // Tính toán hạn dùng 7 ngày
    const now = new Date();
    let startsFrom = now;
    let isExtended = false;

    if (profile.plan_expires_at) {
      const curExp = new Date(profile.plan_expires_at);
      if (curExp > now) {
        startsFrom = curExp;
        isExtended = true;
      }
    }

    const newExpiresAt = new Date(startsFrom.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 3. Cập nhật gói PRO cho user
    await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        plan_expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', user.id);

    // 4. Ghi lịch sử nâng cấp
    await supabase.from('subscription_history').insert({
      user_id: user.id,
      old_plan: profile.plan || 'free',
      new_plan: 'pro',
      reason: CAMPAIGN_KEY,
    });

    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      isExtended,
      daysAdded: 7,
      planExpiresAt: newExpiresAt.toISOString(),
      message: 'Chúc mừng! Bạn đã được kích hoạt 7 ngày Pro tri ân nâng cấp máy chủ.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing] claim-upgrade-gift error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
