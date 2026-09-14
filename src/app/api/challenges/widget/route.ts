import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, safeErrorResponse } from '@/lib/api-security';
import { dateKeyInTimeZone, APP_TIMEZONE } from '@/lib/gamification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/challenges/widget — Lightweight endpoint for the student dashboard widget.
 * Returns:
 *   - activeParticipation: current challenge + progress (if participating)
 *   - promotedChallenge: first open challenge (if not participating)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = { id: authUser.userId };

    const supabase = createServiceClient();
    const today = dateKeyInTimeZone(new Date(), APP_TIMEZONE);

    // Check if user is actively participating in any challenge
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select(`
        id, status, current_streak, total_active_days,
        challenge:challenges!challenge_participants_challenge_id_fkey (
          id, name, slug, duration_days, starts_at, ends_at, daily_criteria
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (participation && participation.challenge) {
      const challenge = Array.isArray(participation.challenge)
        ? participation.challenge[0]
        : participation.challenge;

      if (challenge) {
        const startDate = new Date(challenge.starts_at);
        const endDate = new Date(challenge.ends_at);
        const now = new Date();
        const elapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000));
        const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000));
        const currentDay = Math.min(elapsed + 1, totalDays);

        // Check if today's criteria are met
        const { data: todayLog } = await supabase
          .from('challenge_daily_log')
          .select('criteria_met')
          .eq('participant_id', participation.id)
          .eq('log_date', today)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          activeParticipation: {
            challenge: {
              id: challenge.id,
              name: challenge.name,
              slug: challenge.slug,
              duration_days: challenge.duration_days,
            },
            progress: {
              currentDay,
              totalDays,
              todayCompleted: todayLog?.criteria_met ?? false,
              currentStreak: participation.current_streak,
              totalActiveDays: participation.total_active_days,
            },
          },
        });
      }
    }

    // Not participating — check for open challenges to promote
    const { data: openChallenges } = await supabase
      .from('challenges')
      .select('id, name, slug, description, duration_days, deposit_amount')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);

    if (openChallenges && openChallenges.length > 0) {
      return NextResponse.json({
        success: true,
        promotedChallenge: {
          challenge: openChallenges[0],
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeErrorResponse(err, 'Failed to load challenge widget');
  }
}
