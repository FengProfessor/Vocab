/**
 * POST /api/billing/orders  — User tạo order mới (pending)
 * GET  /api/billing/orders  — Admin: tất cả orders | User: orders của mình
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createOrder } from '@/lib/billing';
import type { Plan } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());

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
    };

    const plan = body.plan as Exclude<Plan, 'free'>;
    if (!plan || !['pro', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be pro or premium.' }, { status: 400 });
    }

    const result = await createOrder(supabase, {
      userId: user.id,
      plan,
      periodMonths: body.periodMonths || 1,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      couponCode: body.couponCode,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing] Create order error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '');

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
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
