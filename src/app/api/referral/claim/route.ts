import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function getIpSubnet(ip: string): string {
  const clean = ip.trim().replace(/^::ffff:/, '');
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
  }
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({})) as {
      referralCode?: string;
      deviceFingerprint?: string;
    };

    const code = body.referralCode?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Mã giới thiệu không được để trống' }, { status: 400 });
    }

    // Check if referee already has a referral record
    const { data: existingLog } = await supabase
      .from('referral_logs')
      .select('id, referral_code, status')
      .eq('referee_id', user.id)
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        message: 'Tài khoản đã gắn mã giới thiệu trước đó',
      });
    }

    // Find referrer from referral_links
    const { data: link, error: linkErr } = await supabase
      .from('referral_links')
      .select('id, user_id, referral_code')
      .eq('referral_code', code)
      .maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json(
        { error: 'Mã quà tặng không tồn tại hoặc đã hết hiệu lực' },
        { status: 404 },
      );
    }

    // Prevent self-referral
    if (link.user_id === user.id) {
      return NextResponse.json(
        {
          isSelfReferral: true,
          error: 'Đây là mã quà tặng của chính bạn! Hãy chia sẻ liên kết này cho bạn bè để cả hai cùng nhận 7 ngày VIP nhé.',
        },
        { status: 400 },
      );
    }

    // Extract IP and calculate subnet
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const subnet = getIpSubnet(rawIp);

    // Get active campaign id
    const { data: campaign } = await supabase
      .from('referral_campaigns')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Insert attribution log
    const { data: insertedLog, error: insertErr } = await supabase
      .from('referral_logs')
      .insert({
        referrer_id: link.user_id,
        referee_id: user.id,
        campaign_id: campaign?.id || null,
        referral_code: code,
        status: 'registered',
        ip_address: rawIp,
        ip_subnet: subnet,
        device_fingerprint: body.deviceFingerprint || null,
      })
      .select()
      .single();

    if (insertErr) {
      // If table does not exist or duplicate constraint
      if (insertErr.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          message: 'Tài khoản đã được ghi nhận',
        });
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Attempt instant activation check via RPC if available
    try {
      await supabase.rpc('fn_evaluate_referral_activation', {
        p_referee_id: user.id,
      });
    } catch {
      // ignore if activation conditions not met yet
    }

    return NextResponse.json({
      success: true,
      message: 'Nhận quà thành công! Hãy học bài liên tục 3 ngày hoặc lưu 30 từ vựng để mở khóa trọn vẹn 7 ngày Pro VIP nhé.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
