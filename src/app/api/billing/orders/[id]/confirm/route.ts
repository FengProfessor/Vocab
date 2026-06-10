/**
 * POST /api/billing/orders/[id]/confirm — Admin xác nhận thanh toán
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { confirmOrder } from '@/lib/billing';

// Fail-closed: env rỗng → mảng rỗng → mọi request đều 403 (tránh [''].includes('') = true)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { id: orderId } = await params;

    // Auth — admin only
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({})) as {
      paymentRef?: string;
      note?: string;
    };

    const result = await confirmOrder(
      supabase,
      orderId,
      user.id,
      body.paymentRef,
      body.note,
    );

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing] Confirm order error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
