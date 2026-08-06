import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CAMPAIGN_KEY = 'campaign_upgrade_gift_20260806';
const TARGET_DATE = '2026-08-06'; // YYYY-MM-DD VN time

function getVietnamDateStr(): string {
  const str = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return str; // YYYY-MM-DD
}

/**
 * POST /api/campaign/claim-upgrade-gift
 * Tự động tặng 7 ngày Pro tri ân nâng cấp máy chủ cho người dùng đăng nhập trong ngày 06/08/2026.
 * - Nếu đang có Pro: cộng dồn +7 ngày vào plan_expires_at hiện tại.
 * - Nếu dùng Free/hết hạn: đổi gói Pro + 7 ngày đếm ngược từ bây giờ.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === '1';

    const todayVN = getVietnamDateStr();
    if (!force && todayVN !== TARGET_DATE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chương trình tri ân 7 ngày Pro chỉ áp dụng cho người dùng đăng nhập trong ngày 06/08/2026.',
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Kiểm tra xem người dùng đã nhận quà campaign này chưa
    const { data: existingHist } = await supabase
      .from('subscription_history')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('reason', CAMPAIGN_KEY)
      .maybeSingle();

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, plan, plan_expires_at')
      .eq('id', auth.userId)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ người dùng.' }, { status: 404 });
    }

    if (existingHist) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        plan: profile.plan || 'pro',
        planExpiresAt: profile.plan_expires_at,
        message: 'Bạn đã nhận phần quà 7 ngày Pro nâng cấp máy chủ rồi.',
      });
    }

    // 2. Tính toán hạn Pro mới (+7 ngày)
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

    // 3. Cập nhật profile & ghi nhận history
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        plan_expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', auth.userId);

    if (updateErr) {
      console.error('[Campaign] Error updating profile:', updateErr.message);
      return safeErrorResponse(updateErr, 'Không thể cập nhật gói Pro.');
    }

    await supabase.from('subscription_history').insert({
      user_id: auth.userId,
      old_plan: profile.plan || 'free',
      new_plan: 'pro',
      reason: CAMPAIGN_KEY,
    });

    console.log(`[Campaign] Successfully awarded 7-day Pro to user=${auth.userId} (${profile.full_name}) until ${newExpiresAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      plan: 'pro',
      planExpiresAt: newExpiresAt.toISOString(),
      daysAdded: 7,
      isExtended,
      message: isExtended
        ? 'Đã cộng nối tiếp +7 ngày Pro vào thời hạn hiện tại của bạn!'
        : 'Đã kích hoạt 7 ngày Pro trải nghiệm miễn phí!',
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Lỗi hệ thống khi xử lý quà tặng.');
  }
}
