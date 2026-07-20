import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  getAuthUser,
  unauthorized,
  isValidString,
  sanitizeForPrompt,
} from '@/lib/api-security';
import {
  PRESENCE_ONLINE_MS,
  type RoomPresenceMember,
} from '@/lib/room-presence';
import {
  DISPLAY_NAME_MAX,
  normalizeDisplayName,
  validateDisplayName,
} from '@/lib/display-name';

export const dynamic = 'force-dynamic';

interface PresenceRow {
  user_id: string;
  room_id: string;
  display_name: string;
  activity_key: string;
  activity_label: string;
  last_seen_at: string;
}

async function assertRoomAccess(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  roomId: string
): Promise<boolean> {
  if (roomId === 'lobby') return true;

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, teacher_id')
    .eq('id', roomId)
    .maybeSingle();

  if (!classroom) return false;
  if (classroom.teacher_id === userId) return true;

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('classroom_id', roomId)
    .eq('student_id', userId)
    .maybeSingle();

  return Boolean(enrollment);
}

/**
 * GET /api/hub/presence?roomId=
 * Danh sách ai online trong phòng (last_seen < 90s).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const roomId = req.nextUrl.searchParams.get('roomId')?.trim() || 'lobby';
    if (!isValidString(roomId, 80)) {
      return NextResponse.json({ success: false, error: 'Invalid roomId' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const ok = await assertRoomAccess(supabase, auth.userId, roomId);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'No access to room' }, { status: 403 });
    }

    const cutoff = new Date(Date.now() - PRESENCE_ONLINE_MS * 2).toISOString();
    const { data, error } = await supabase
      .from('room_presence')
      .select('user_id, room_id, display_name, activity_key, activity_label, last_seen_at')
      .eq('room_id', roomId)
      .gte('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false })
      .limit(80);

    if (error) {
      // Bảng chưa migrate
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          members: [] as RoomPresenceMember[],
          onlineCount: 0,
          roomId,
          meta: { notReady: true },
        });
      }
      console.error('[HubPresence] list:', error.message);
      return NextResponse.json({ success: false, error: 'Failed to load presence' }, { status: 500 });
    }

    const now = Date.now();
    const members: RoomPresenceMember[] = ((data ?? []) as PresenceRow[]).map((row) => {
      const seen = new Date(row.last_seen_at).getTime();
      const online = now - seen <= PRESENCE_ONLINE_MS;
      return {
        userId: row.user_id,
        displayName: row.display_name || 'Học viên',
        activityKey: row.activity_key,
        activityLabel: row.activity_label,
        lastSeenAt: row.last_seen_at,
        online,
        isYou: row.user_id === auth.userId,
      };
    });

    const onlineMembers = members.filter((m) => m.online);

    return NextResponse.json({
      success: true,
      roomId,
      members: onlineMembers,
      onlineCount: onlineMembers.length,
    });
  } catch (e) {
    console.error('[HubPresence] GET', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/hub/presence
 * Heartbeat: { roomId, activityKey, activityLabel, displayName? }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const body = (await req.json()) as {
      roomId?: unknown;
      activityKey?: unknown;
      activityLabel?: unknown;
      displayName?: unknown;
    };

    const roomId =
      typeof body.roomId === 'string' && body.roomId.trim()
        ? body.roomId.trim()
        : 'lobby';
    if (!isValidString(roomId, 80)) {
      return NextResponse.json({ success: false, error: 'Invalid roomId' }, { status: 400 });
    }

    const activityKey = sanitizeForPrompt(
      typeof body.activityKey === 'string' ? body.activityKey : 'idle',
      40
    );
    const activityLabel = sanitizeForPrompt(
      typeof body.activityLabel === 'string' ? body.activityLabel : 'Đang học',
      80
    );

    const supabase = createServiceClient();
    const ok = await assertRoomAccess(supabase, auth.userId, roomId);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'No access to room' }, { status: 403 });
    }

    let displayName = '';
    if (typeof body.displayName === 'string' && body.displayName.trim()) {
      const checked = validateDisplayName(body.displayName);
      if (checked.ok) displayName = checked.name;
      // tên client bẩn → bỏ qua, lấy từ profile
    }

    if (!displayName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', auth.userId)
        .maybeSingle();
      const raw = (profile?.full_name as string)?.trim() || 'Hoc vien';
      const checked = validateDisplayName(raw);
      if (checked.ok) {
        displayName = checked.name;
      } else {
        // Tên cũ dài / ký tự lạ: cắt + validate lại
        const sliced = normalizeDisplayName(raw).slice(0, DISPLAY_NAME_MAX);
        const again = validateDisplayName(sliced);
        displayName = again.ok ? again.name : 'Hoc vien';
      }
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('room_presence').upsert(
      {
        user_id: auth.userId,
        room_id: roomId,
        display_name: displayName || 'Học viên',
        activity_key: activityKey || 'idle',
        activity_label: activityLabel || 'Đang học',
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          error: 'Chưa chạy migration room_presence',
          code: 'PRESENCE_NOT_READY',
        }, { status: 503 });
      }
      console.error('[HubPresence] upsert:', error.message);
      return NextResponse.json({ success: false, error: 'Failed to update presence' }, { status: 500 });
    }

    return NextResponse.json({ success: true, roomId, at: now });
  } catch (e) {
    console.error('[HubPresence] POST', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/** DELETE — rời phòng (optional) */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const supabase = createServiceClient();
    await supabase.from('room_presence').delete().eq('user_id', auth.userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
