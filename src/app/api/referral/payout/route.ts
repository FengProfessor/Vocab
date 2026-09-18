import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: payouts, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error && !error.message?.includes('schema cache')) {
      console.error('[Referral] Error fetching payouts:', error);
    }

    return NextResponse.json({
      success: true,
      payouts: payouts || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({})) as {
      amount?: number;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountHolder?: string;
    };

    const amount = Number(body.amount);
    const bankName = body.bankName?.trim();
    const bankAccountNumber = body.bankAccountNumber?.trim().replace(/\s+/g, '');
    const bankAccountHolder = body.bankAccountHolder?.trim().toUpperCase();

    if (!amount || isNaN(amount) || amount < 100000) {
      return NextResponse.json(
        { error: 'Số tiền rút tối thiểu là 100.000đ' },
        { status: 400 },
      );
    }

    if (amount > 2000000) {
      return NextResponse.json(
        { error: 'Hạn mức rút tiền tối đa mỗi lần là 2.000.000đ' },
        { status: 400 },
      );
    }

    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ tên ngân hàng, số tài khoản và tên chủ tài khoản' },
        { status: 400 },
      );
    }

    // Call stored procedure fn_request_payout
    const { data: rpcData, error: rpcErr } = await supabase.rpc('fn_request_payout', {
      p_user_id: user.id,
      p_amount: amount,
      p_bank_name: bankName,
      p_bank_account_number: bankAccountNumber,
      p_bank_account_holder: bankAccountHolder,
    });

    if (rpcErr) {
      console.warn('[Referral] fn_request_payout error:', rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    }

    const res = rpcData as {
      success: boolean;
      payout_id?: string;
      remaining_balance?: number;
      message?: string;
    };

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Không thể tạo yêu cầu rút tiền' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payoutId: res.payout_id,
      remainingBalance: res.remaining_balance,
      message: 'Yêu cầu rút tiền đã được tiếp nhận! Tiền sẽ được chuyển qua VietQR sau khi duyệt.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
