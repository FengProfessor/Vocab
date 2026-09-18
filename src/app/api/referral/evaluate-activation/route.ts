import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user has an unactivated referral log
    const { data: log } = await supabase
      .from('referral_logs')
      .select('id, status, referral_code, created_at')
      .eq('referee_id', user.id)
      .maybeSingle();

    if (!log) {
      return NextResponse.json({
        success: true,
        eligible: false,
        message: 'Tài khoản chưa tham gia chương trình giới thiệu',
      });
    }

    if (log.status === 'activated' || log.status === 'converted') {
      return NextResponse.json({
        success: true,
        activated: true,
        alreadyActivated: true,
        message: 'Bạn đã kích hoạt thành công quà tặng +7 ngày Pro VIP trước đó',
      });
    }

    // Call stored procedure
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('fn_evaluate_referral_activation', {
      p_referee_id: user.id,
    });

    if (rpcErr) {
      console.warn('[Referral] evaluate activation RPC error:', rpcErr);
      return NextResponse.json({
        success: false,
        error: rpcErr.message,
      }, { status: 400 });
    }

    const res = rpcRes as {
      success: boolean;
      activated?: boolean;
      reward_days?: number;
      reason?: string;
      message?: string;
    };

    return NextResponse.json({
      success: true,
      activated: Boolean(res.success),
      rewardDays: res.reward_days || 7,
      message: res.message || (res.success ? 'Kích hoạt thành công +7 ngày Pro VIP!' : 'Chưa đủ điều kiện kích hoạt'),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
