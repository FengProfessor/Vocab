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
    
    let isTeacher = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'teacher') {
        isTeacher = true;
      }
    }

    const { data: participants, error } = await supabase
      .from('challenge_participants')
      .select(`
        id,
        user_id,
        status,
        streak_days,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('challenge_id', id);

    if (error) throw error;

    const sanitized = participants?.map((p: any) => {
      const profilesArray = Array.isArray(p.profiles) ? p.profiles : [p.profiles];
      const profileInfo = profilesArray[0];
      const name = isTeacher ? profileInfo?.full_name : 'Người tham gia';
      
      return {
        id: p.id,
        status: p.status,
        streak_days: p.streak_days,
        full_name: name,
        avatar_url: profileInfo?.avatar_url
      };
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    return safeErrorResponse(error, 'Lỗi khi tải danh sách người tham gia');
  }
}
