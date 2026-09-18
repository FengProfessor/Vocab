import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({})) as { code?: string };
    const rawCode = body.code?.trim().toUpperCase();

    if (!rawCode) {
      return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
    }

    // Try calling RPC if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('fn_resolve_referral_code', {
      p_code: rawCode,
    });

    if (!rpcError && rpcData && typeof rpcData === 'object') {
      const parsed = rpcData as {
        valid: boolean;
        referrer_name?: string;
        referee_reward_days?: number;
        reason?: string;
      };

      if (!parsed.valid) {
        return NextResponse.json(
          { error: parsed.reason || 'Mã giới thiệu không hợp lệ' },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        code: rawCode,
        referrerName: parsed.referrer_name || 'Học viên LingoPro',
        rewardDays: parsed.referee_reward_days || 7,
      });
    }

    // Fallback: Query directly via service role
    const { data: link, error: linkErr } = await supabase
      .from('referral_links')
      .select('id, user_id, referral_code, clicks_count')
      .eq('referral_code', rawCode)
      .maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json(
        { error: 'Mã giới thiệu không tồn tại hoặc đã hết hạn' },
        { status: 404 },
      );
    }

    // Increment click counter non-blockingly
    void supabase
      .from('referral_links')
      .update({ clicks_count: (link.clicks_count || 0) + 1 })
      .eq('id', link.id);

    // Get referrer name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', link.user_id)
      .maybeSingle();

    const referrerName = profile?.full_name?.trim() || 'Học viên LingoPro';

    return NextResponse.json({
      success: true,
      code: rawCode,
      referrerName,
      rewardDays: 7,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
