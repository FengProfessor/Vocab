/**
 * GET  /api/admin/fbclass — Liệt kê khóa FB của owner (kèm số vé đã bán).
 * POST /api/admin/fbclass — Tạo khóa mới.
 * Gate: ADMIN_EMAILS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function requireAdmin(req: NextRequest) {
  const supabase = createServiceClient();
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return { error: 'Admin access required', status: 403 as const };
  }
  return { supabase, user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    const { data: classes, error } = await supabase
      .from('fb_classes')
      .select('id, title, price, session_count, start_date, end_date, fb_group_url, status, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    // Đếm vé paid mỗi khóa
    const ids = (classes ?? []).map(c => c.id);
    const counts: Record<string, number> = {};
    if (ids.length) {
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('fb_class_id')
        .in('fb_class_id', ids)
        .eq('order_kind', 'fbclass')
        .eq('status', 'paid');
      for (const o of paidOrders ?? []) {
        const k = o.fb_class_id as string;
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      classes: (classes ?? []).map(c => ({ ...c, paid_count: counts[c.id] ?? 0 })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    const body = await req.json() as {
      title?: string;
      price?: number;
      sessionCount?: number;
      startDate?: string;
      endDate?: string;
      fbGroupUrl?: string;
    };

    const title = body.title?.trim();
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!body.endDate) return NextResponse.json({ error: 'endDate is required' }, { status: 400 });
    const price = typeof body.price === 'number' && body.price >= 0 ? Math.floor(body.price) : 50000;
    const sessionCount = typeof body.sessionCount === 'number' && body.sessionCount > 0 ? Math.floor(body.sessionCount) : 10;

    const { data: created, error } = await supabase
      .from('fb_classes')
      .insert({
        owner_id: user.id,
        title,
        price,
        session_count: sessionCount,
        start_date: body.startDate || null,
        end_date: body.endDate,
        fb_group_url: body.fbGroupUrl?.trim() || null,
        status: 'active',
      })
      .select('id')
      .single();
    if (error || !created) throw new Error(error?.message ?? 'insert failed');

    return NextResponse.json({ success: true, id: created.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
