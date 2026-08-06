/**
 * POST /api/billing/orders  — User tạo order mới (pending)
 * GET  /api/billing/orders  — Admin: tất cả orders | User: orders của mình
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createOrder, isValidPeriodMonths } from '@/lib/billing';
import { safeErrorResponse, getAdminEmails } from '@/lib/api-security';
import type { Plan } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Auth
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      plan?: string;
      periodMonths?: number;
      paymentMethod?: string;
      couponCode?: string;
      orderKind?: string;
      seats?: number;
      note?: string;
    };

    const isGroup = body.orderKind === 'group';

    // Gói nhóm: plan do server ép = GROUP_PLAN; chỉ validate seats.
    let plan = body.plan as Exclude<Plan, 'free'>;
    if (isGroup) {
      plan = 'pro'; // placeholder — createOrder sẽ ép GROUP_PLAN
      const seats = body.seats;
      if (typeof seats !== 'number' || seats < 2 || seats > 20) {
        return NextResponse.json({ error: 'Invalid seats. Must be 2-20.' }, { status: 400 });
      }
    } else if (!plan || !['pro', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be pro or premium.' }, { status: 400 });
    }

    const periodMonths = body.periodMonths ?? 1;
    if (!isValidPeriodMonths(periodMonths)) {
      return NextResponse.json({ error: 'Invalid periodMonths. Must be one of 1, 3, 6, 12.' }, { status: 400 });
    }
    const paymentMethod = body.paymentMethod || 'bank_transfer';
    if (!['vnpay', 'momo', 'bank_transfer', 'manual'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid paymentMethod.' }, { status: 400 });
    }

    const result = await createOrder(supabase, {
      userId: user.id,
      plan,
      periodMonths,
      paymentMethod,
      couponCode: body.couponCode,
      orderKind: isGroup ? 'group' : 'individual',
      seats: isGroup ? body.seats : undefined,
      note: body.note,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return safeErrorResponse(err, 'Không tạo được đơn hàng');
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerProfile } = await supabase.from('profiles').select('email, role').eq('id', user.id).maybeSingle();
    const callerEmail = (callerProfile?.email || user.email || '').toLowerCase().trim();
    const adminEmails = getAdminEmails();
    const isAdmin = callerProfile?.role === 'admin' || Boolean(callerEmail && adminEmails.includes(callerEmail));

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select('*, profiles!orders_user_id_fkey(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, count, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      orders: orders ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    return safeErrorResponse(err, 'Không tải được đơn hàng');
  }
}
