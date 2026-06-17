/**
 * POST /api/groups/[id]/remove — Owner xóa 1 thành viên khỏi nhóm.
 * Body: { userId }. Revert entitlement nếu nó đến từ chính nhóm này.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { revertGroupEntitlement } from '@/lib/billing';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: groupId } = await params;

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

    const body = await req.json() as { userId?: string };
    const targetUserId = body.userId;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // 1. Lấy nhóm + kiểm quyền owner
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('id, owner_id, expires_at')
      .eq('id', groupId)
      .maybeSingle();
    if (gErr || !group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }
    if (group.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Chỉ chủ nhóm mới được xóa thành viên' }, { status: 403 });
    }
    if (targetUserId === group.owner_id) {
      return NextResponse.json({ success: false, error: 'Không thể xóa chủ nhóm' }, { status: 400 });
    }

    // 2. Xóa member
    const { error: delErr } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', targetUserId);
    if (delErr) {
      console.error('[Groups/remove] Delete error:', delErr.message);
      return NextResponse.json({ success: false, error: 'Không thể xóa thành viên' }, { status: 500 });
    }

    // 3. Revert entitlement (chỉ nếu đến từ nhóm này)
    await revertGroupEntitlement(supabase, targetUserId, group.expires_at);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Groups/remove] Unexpected error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
