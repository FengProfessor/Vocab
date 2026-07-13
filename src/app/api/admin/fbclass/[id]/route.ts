/**
 * GET   /api/admin/fbclass/[id] — Roster khóa (vé paid) + danh sách CẦN KICK.
 * PATCH /api/admin/fbclass/[id] — Đổi trạng thái khóa (active/ended/cancelled) hoặc sửa group url.
 *
 * Danh sách kick = thành viên khóa này TRỪ thành viên các khóa đang 'active' của owner.
 * → Khi khóa cũ 'ended', ai không mua khóa mới (active) sẽ lộ ra để kick khỏi group FB.
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

interface RosterMember {
  user_id: string;
  order_id: string;
  full_name: string | null;
  email: string | null;
  fb_profile_url: string | null;
  paid_at: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;
    const { id } = await params;

    // Khóa phải thuộc owner
    const { data: cls } = await supabase
      .from('fb_classes')
      .select('id, title, status, end_date, fb_group_url')
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!cls) return NextResponse.json({ error: 'Khóa không tồn tại' }, { status: 404 });

    // Vé paid của khóa này + thông tin người mua
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('id, user_id, fb_profile_url, paid_at, profiles!orders_user_id_fkey(email, full_name)')
      .eq('fb_class_id', id)
      .eq('order_kind', 'fbclass')
      .eq('status', 'paid')
      .order('paid_at', { ascending: true });

    const roster: RosterMember[] = (paidOrders ?? []).map((o) => {
      const prof = o.profiles as unknown as { email?: string; full_name?: string } | null;
      return {
        user_id: o.user_id as string,
        order_id: o.id as string,
        full_name: prof?.full_name ?? null,
        email: prof?.email ?? null,
        fb_profile_url: (o.fb_profile_url as string) ?? null,
        paid_at: (o.paid_at as string) ?? null,
      };
    });

    // Tập user còn hợp lệ = paid trong MỌI khóa 'active' của owner
    const { data: activeClasses } = await supabase
      .from('fb_classes')
      .select('id')
      .eq('owner_id', user.id)
      .eq('status', 'active');
    const activeIds = (activeClasses ?? []).map(c => c.id);

    const stillValid = new Set<string>();
    if (activeIds.length) {
      const { data: validOrders } = await supabase
        .from('orders')
        .select('user_id')
        .in('fb_class_id', activeIds)
        .eq('order_kind', 'fbclass')
        .eq('status', 'paid');
      for (const o of validOrders ?? []) stillValid.add(o.user_id as string);
    }

    // Kick = trong roster khóa này nhưng KHÔNG còn hợp lệ ở khóa active nào
    const kickList = roster.filter(m => !stillValid.has(m.user_id));

    return NextResponse.json({
      success: true,
      class: cls,
      roster,
      kickList,
      counts: { paid: roster.length, kick: kickList.length },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;
    const { id } = await params;

    const body = await req.json().catch(() => ({})) as {
      status?: string; fbGroupUrl?: string; title?: string;
      price?: number; sessionCount?: number; startDate?: string; endDate?: string;
    };
    const patch: Record<string, unknown> = {};
    if (body.status) {
      if (!['active', 'ended', 'cancelled'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (typeof body.fbGroupUrl === 'string') patch.fb_group_url = body.fbGroupUrl.trim() || null;
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
    if (typeof body.price === 'number' && body.price >= 0) patch.price = Math.floor(body.price);
    if (typeof body.sessionCount === 'number' && body.sessionCount > 0) patch.session_count = Math.floor(body.sessionCount);
    if (typeof body.startDate === 'string') patch.start_date = body.startDate || null;
    if (typeof body.endDate === 'string' && body.endDate) patch.end_date = body.endDate;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('fb_classes')
      .update(patch)
      .eq('id', id)
      .eq('owner_id', user.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
