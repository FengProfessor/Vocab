/**
 * GET /api/fbclass/[id] — Thông tin 1 khóa FB + trạng thái vé của user hiện tại.
 * Auth bắt buộc (cần biết user nào để trả trạng thái + lộ link group khi đã trả phí).
 * fbGroupUrl chỉ trả về khi user đã có vé paid → tránh lộ group cho người chưa đóng.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: cls, error } = await supabase
      .from('fb_classes')
      .select('id, title, price, session_count, start_date, end_date, fb_group_url, status')
      .eq('id', id)
      .maybeSingle();
    if (error || !cls) return NextResponse.json({ error: 'Khóa học không tồn tại' }, { status: 404 });

    // Vé của user cho khóa này (paid hoặc pending gần nhất)
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, amount, created_at')
      .eq('user_id', user.id)
      .eq('fb_class_id', id)
      .eq('order_kind', 'fbclass')
      .order('created_at', { ascending: false });

    const paidOrder = orders?.find((o) => o.status === 'paid') ?? null;
    const pendingOrder = orders?.find((o) => o.status === 'pending') ?? null;
    const paid = !!paidOrder;

    return NextResponse.json({
      success: true,
      class: {
        id: cls.id,
        title: cls.title,
        price: cls.price,
        session_count: cls.session_count,
        start_date: cls.start_date,
        end_date: cls.end_date,
        status: cls.status,
        // chỉ lộ link group khi đã trả phí
        fb_group_url: paid ? cls.fb_group_url : null,
      },
      paid,
      pendingOrderId: pendingOrder?.id ?? null,
      paidOrderId: paidOrder?.id ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
