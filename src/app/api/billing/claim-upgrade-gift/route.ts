import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

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
      .eq('note', 'server_upgrade_gift_7d')
      .limit(1);

    const alreadyClaimedInDb = (history && history.length > 0);

    // Tính toán hạn dùng 7 ngày
    const now = new Date();
    let newExpiresAt: Date;
    let isExtended = false;

    if (profile.plan === 'pro' && profile.plan_expires_at) {
      const currentExpiry = new Date(profile.plan_expires_at);
      if (currentExpiry > now) {
        newExpiresAt = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
        isExtended = true;
      } else {
        newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (alreadyClaimedInDb) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        isExtended,
        plan: 'pro',
        planExpiresAt: profile.plan_expires_at,
        message: 'Bạn đã nhận quà 7 ngày Pro nâng cấp máy chủ.',
      });
    }

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
      amount: 0,
      plan: 'pro',
      status: 'completed',
      period_months: 1,
      payment_method: 'gift_campaign',
      note: 'server_upgrade_gift_7d',
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
    console.error('[Campaign] claim-upgrade-gift error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
