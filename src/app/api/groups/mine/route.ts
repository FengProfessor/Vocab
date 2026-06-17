/**
 * GET /api/groups/mine — Nhóm user sở hữu (kèm danh sách member + ghế đã dùng)
 * và/hoặc nhóm user đang tham gia.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
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

    // 1. Nhóm user sở hữu (active mới nhất)
    const { data: owned } = await supabase
      .from('groups')
      .select('id, owner_id, plan, seat_limit, invite_code, status, starts_at, expires_at, created_at')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let ownedWithMembers = null;
    if (owned) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, joined_at')
        .eq('group_id', owned.id)
        .order('joined_at', { ascending: true });

      const ids = (members ?? []).map((m) => m.user_id as string);
      const profilesById: Record<string, { full_name?: string; email?: string }> = {};
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ids);
        for (const p of profiles ?? []) {
          profilesById[p.id as string] = { full_name: p.full_name, email: p.email };
        }
      }

      ownedWithMembers = {
        ...owned,
        seats_used: ids.length,
        members: (members ?? []).map((m) => ({
          user_id: m.user_id,
          joined_at: m.joined_at,
          full_name: profilesById[m.user_id as string]?.full_name ?? null,
          email: profilesById[m.user_id as string]?.email ?? null,
          is_owner: m.user_id === owned.owner_id,
        })),
      };
    }

    // 2. Nhóm user đang tham gia (không phải owner)
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const memberGroupIds = (memberships ?? [])
      .map((m) => m.group_id as string)
      .filter((gid) => !owned || gid !== owned.id);

    let joinedGroup = null;
    if (memberGroupIds.length) {
      const { data: g } = await supabase
        .from('groups')
        .select('id, owner_id, plan, seat_limit, status, expires_at')
        .in('id', memberGroupIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (g) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', g.owner_id)
          .maybeSingle();
        joinedGroup = {
          ...g,
          owner_name: ownerProfile?.full_name ?? ownerProfile?.email ?? null,
        };
      }
    }

    return NextResponse.json({ success: true, data: { owned: ownedWithMembers, joined: joinedGroup } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Groups/mine] Unexpected error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
