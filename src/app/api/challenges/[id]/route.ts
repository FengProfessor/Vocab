import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, safeErrorResponse } from '@/lib/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();
    const authUser = await getAuthUser(req);
    const user = authUser ? { id: authUser.userId } : null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('challenges').select('*, challenge_participants(count)');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }
    
    const { data: challenge, error } = await query.single();
    if (error) throw error;
    if (!challenge) return NextResponse.json({ success: false, error: 'Không tìm thấy challenge' }, { status: 404 });

    let participation = null;
    if (user) {
      const { data: part } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .single();
      participation = part;
    }

    return NextResponse.json({ success: true, data: { challenge, participation } });
  } catch (error: any) {
    return safeErrorResponse(error, 'Lỗi khi tải chi tiết challenge');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) throw new Error('Unauthorized');
    const user = { id: authUser.userId };

    const adminClient = createServiceClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { data: existing } = await adminClient
      .from('challenges')
      .select('status')
      .eq('id', id)
      .single();
      
    if (!existing || (existing.status !== 'draft' && existing.status !== 'open')) {
      return NextResponse.json({ success: false, error: 'Không thể cập nhật challenge ở trạng thái hiện tại' }, { status: 400 });
    }

    const body = await req.json();
    const { data, error } = await adminClient
      .from('challenges')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return safeErrorResponse(error, 'Lỗi khi cập nhật challenge');
  }
}
