/**
 * POST /api/groups/leave — Thành viên tự rời nhóm. Owner KHÔNG rời được (phải hủy gói).
 * Body: { groupId? } — nếu thiếu, rời nhóm (không sở hữu) đang tham gia.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { revertGroupEntitlement } from '@/lib/billing';

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

    const body = await req.json().catch(() => ({})) as { groupId?: string };

    // 1. Các nhóm user đang là thành viên
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    let groupIds = (memberships ?? []).map((m) => m.group_id as string);
    if (body.groupId) groupIds = groupIds.filter((gid) => gid === body.groupId);

    if (!groupIds.length) {
      return NextResponse.json({ success: false, error: 'Bạn không ở trong nhóm nào để rời' }, { status: 404 });
    }

    // 2. Lấy nhóm không do chính user sở hữu (owner không "rời" được)
    const { data: groups } = await supabase
      .from('groups')
      .select('id, owner_id, expires_at')
      .in('id', groupIds);
    const g = (groups ?? []).find((row) => row.owner_id !== user.id);

    if (!g) {
      return NextResponse.json({ success: false, error: 'Chủ nhóm không thể tự rời — hãy hủy gói' }, { status: 400 });
    }

    const { error: delErr } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', g.id)
      .eq('user_id', user.id);
    if (delErr) {
      console.error('[Groups/leave] Delete error:', delErr.message);
      return NextResponse.json({ success: false, error: 'Không thể rời nhóm' }, { status: 500 });
    }

    await revertGroupEntitlement(supabase, user.id, g.expires_at);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Groups/leave] Unexpected error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
