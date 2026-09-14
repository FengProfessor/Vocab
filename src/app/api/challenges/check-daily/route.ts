import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { processChallengeDayEnd, completeChallenge } from '@/lib/challenge';
import { safeErrorResponse } from '@/lib/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('CRON_SECRET');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    const { data: activeChallenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active');
      
    if (error) throw error;
    
    let processedCount = 0;
    let completedCount = 0;

    const { dateKeyInTimeZone, APP_TIMEZONE } = await import('@/lib/gamification');
    const today = dateKeyInTimeZone(new Date(), APP_TIMEZONE);

    for (const challenge of activeChallenges || []) {
      await processChallengeDayEnd(supabase, challenge.id, today);
      processedCount++;
      
      const endsAt = new Date(challenge.ends_at);
      const now = new Date();
      
      if (now > endsAt) {
        await completeChallenge(supabase, challenge.id);
        completedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      stats: { processedCount, completedCount } 
    });
  } catch (error: any) {
    return safeErrorResponse(error, 'Lỗi khi chạy cron job daily');
  }
}
