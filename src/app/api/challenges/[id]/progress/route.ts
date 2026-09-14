import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, safeErrorResponse } from '@/lib/api-security';
import { aggregateDailyMetrics } from '@/lib/challenge';
import { dateKeyInTimeZone, APP_TIMEZONE } from '@/lib/gamification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = { id: authUser.userId };

    const supabase = createServiceClient();
    const { data: participant, error: partError } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .single();

    if (partError || !participant) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thông tin tham gia' }, { status: 404 });
    }

    const { data: dailyLogs } = await supabase
      .from('challenge_daily_log')
      .select('*')
      .eq('participant_id', participant.id)
      .order('log_date', { ascending: true });

    // Live metrics for today
    const today = dateKeyInTimeZone(new Date(), APP_TIMEZONE);
    const liveMetrics = await aggregateDailyMetrics(supabase, user.id, today);

    return NextResponse.json({
      success: true,
      participant,
      dailyLogs: dailyLogs || [],
      liveMetrics,
      today,
    });
  } catch (error) {
    return safeErrorResponse(error, 'Lỗi khi tải tiến độ cá nhân');
  }
}
