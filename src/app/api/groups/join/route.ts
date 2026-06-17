/**
 * POST /api/groups/join — Thành viên vào nhóm bằng mã mời → được cấp Pro tới khi nhóm hết hạn.
 * Bám pattern api/classrooms/join.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { grantGroupEntitlement } from '@/lib/billing';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { inviteCode?: string };
    const inviteCode = body.inviteCode?.trim().toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ success: false, error: 'inviteCode is required' }, { status: 400 });
    }

    // 1. Tìm nhóm theo mã
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('id, owner_id, plan, seat_limit, status, expires_at')
      .eq('invite_code', inviteCode)
      .maybeSingle();

    if (gErr || !group) {
      return NextResponse.json({ success: false, error: 'Mã nhóm không tồn tại' }, { status: 404 });
    }
    if (group.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Nhóm không còn hoạt động' }, { status: 403 });
    }
    if (group.expires_at && new Date(group.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: 'Nhóm đã hết hạn' }, { status: 403 });
    }

    // 2. Đã là thành viên?
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: false, error: 'Bạn đã ở trong nhóm này' }, { status: 409 });
    }

    // 3. Còn ghế?
    const { count } = await supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id);
    if ((count ?? 0) >= group.seat_limit) {
      return NextResponse.json({ success: false, error: 'Nhóm đã đầy ghế' }, { status: 403 });
    }

    // 4. Thêm thành viên
    const { error: insErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });
    if (insErr) {
      console.error('[Groups/join] Insert member error:', insErr.message);
      return NextResponse.json({ success: false, error: 'Không thể vào nhóm' }, { status: 500 });
    }

    // 5. Cấp entitlement Pro (guard không hạ cấp)
    if (group.expires_at) {
      await grantGroupEntitlement(supabase, user.id, group.plan, group.expires_at);
    }

    return NextResponse.json({
      success: true,
      data: { groupId: group.id, plan: group.plan, expiresAt: group.expires_at },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Groups/join] Unexpected error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
