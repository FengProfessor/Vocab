import type { SupabaseClient } from '@supabase/supabase-js';
import { getEffectivePlan } from '@/lib/entitlement';
import {
  checkCriteriaMet,
  parseDailyCriteria,
  type ChallengeDailyLog,
} from '@/lib/challenge';

export async function aggregateDailyMetrics(
  supabase: SupabaseClient,
  userId: string,
  dateKey: string,
): Promise<{
  srs_reviews: number;
  quizzes_done: number;
  reading_sessions: number;
  listening_sessions: number;
  xp_earned: number;
}> {
  const startIso = `${dateKey}T00:00:00+07:00`;
  const endIso = `${dateKey}T23:59:59.999+07:00`;

  const [
    { count: srsReviews },
    { count: quizzesDone },
    { count: listeningSessions },
    { count: readingSessions },
    { data: gamification },
  ] = await Promise.all([
    supabase
      .from('srs_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('last_reviewed_at', startIso)
      .lte('last_reviewed_at', endIso),

    supabase
      .from('quiz_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', startIso)
      .lte('completed_at', endIso),

    supabase
      .from('user_toeic_question_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('part_num', [1, 2, 3, 4])
      .gte('attempted_at', startIso)
      .lte('attempted_at', endIso),

    supabase
      .from('user_toeic_question_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('part_num', [5, 6, 7])
      .gte('attempted_at', startIso)
      .lte('attempted_at', endIso),

    supabase
      .from('user_gamification')
      .select('today_xp, today_date')
      .eq('user_id', userId)
      .single(),
  ]);

  let xpEarned = 0;
  if (gamification && gamification.today_date === dateKey) {
    xpEarned = gamification.today_xp || 0;
  }

  return {
    srs_reviews: srsReviews || 0,
    quizzes_done: quizzesDone || 0,
    reading_sessions: readingSessions || 0,
    listening_sessions: listeningSessions || 0,
    xp_earned: xpEarned,
  };
}

export async function processChallengeDayEnd(
  supabase: SupabaseClient,
  challengeId: string,
  dateKey: string,
): Promise<{ checked: number; passed: number; failed: number }> {
  const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
  if (!challenge) throw new Error('Challenge not found');

  const criteria = parseDailyCriteria(challenge.daily_criteria);

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('status', 'active');

  if (!participants || participants.length === 0) {
    return { checked: 0, passed: 0, failed: 0 };
  }

  let checked = 0;
  let passed = 0;
  let failed = 0;

  const checkedAt = new Date().toISOString();

  for (const p of participants) {
    checked++;
    const metrics = await aggregateDailyMetrics(supabase, p.user_id, dateKey);
    const met = checkCriteriaMet(metrics, criteria);

    const log: Partial<ChallengeDailyLog> = {
      participant_id: p.id,
      user_id: p.user_id,
      challenge_id: challengeId,
      log_date: dateKey,
      srs_reviews: metrics.srs_reviews,
      quizzes_done: metrics.quizzes_done,
      reading_sessions: metrics.reading_sessions,
      listening_sessions: metrics.listening_sessions,
      xp_earned: metrics.xp_earned,
      criteria_met: met,
      checked_at: checkedAt,
    };

    await supabase.from('challenge_daily_log').upsert(log, { onConflict: 'participant_id,log_date' });

    if (met) {
      passed++;
      const newStreak = (p.current_streak || 0) + 1;
      const longest = Math.max(p.longest_streak || 0, newStreak);
      await supabase
        .from('challenge_participants')
        .update({
          current_streak: newStreak,
          longest_streak: longest,
          total_active_days: (p.total_active_days || 0) + 1,
        })
        .eq('id', p.id);
    } else {
      const { data: existingFreeze } = await supabase
        .from('streak_freeze_purchases')
        .select('id')
        .eq('participant_id', p.id)
        .eq('used_for_date', dateKey)
        .maybeSingle();

      if (existingFreeze) {
        passed++;
      } else if ((p.streak_freezes_used || 0) < (challenge.max_streak_freezes || 3)) {
        failed++;
        await supabase
          .from('challenge_participants')
          .update({
            current_streak: 0,
          })
          .eq('id', p.id);
      } else {
        failed++;
        await failParticipant(supabase, p.id, `Failed to meet criteria on ${dateKey} (no streak freezes remaining)`);
      }
    }
  }

  return { checked, passed, failed };
}

export async function activateChallengeParticipant(supabase: SupabaseClient, participantId: string): Promise<void> {
  const { data: participant } = await supabase
    .from('challenge_participants')
    .select('*, challenge:challenges(*)')
    .eq('id', participantId)
    .single();
  if (!participant || !participant.challenge) throw new Error('Participant not found');

  const now = new Date().toISOString();

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', participant.user_id)
    .single();
  const currentPlan = profile?.plan;
  const currentExpires = profile?.plan_expires_at;

  const challengeEndsAt = new Date(participant.challenge.ends_at);
  const effectiveExpiry =
    getEffectivePlan(currentPlan as any, currentExpires) === 'pro' && currentExpires
      ? new Date(currentExpires) > challengeEndsAt
        ? currentExpires
        : challengeEndsAt.toISOString()
      : challengeEndsAt.toISOString();

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      plan_expires_at: effectiveExpiry,
    })
    .eq('id', participant.user_id);

  await supabase
    .from('challenge_participants')
    .update({
      status: 'active',
      activated_at: now,
    })
    .eq('id', participantId);
}

export async function completeChallenge(
  supabase: SupabaseClient,
  challengeId: string,
): Promise<{ completed: number; refundTotal: number }> {
  const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
  if (!challenge) throw new Error('Challenge not found');

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('status', 'active');

  if (!participants || participants.length === 0) {
    await supabase.from('challenges').update({ status: 'completed' }).eq('id', challengeId);
    return { completed: 0, refundTotal: 0 };
  }

  const now = new Date().toISOString();
  const refundAmount = challenge.deposit_amount * (challenge.refund_pct / 100);

  let completedCount = 0;
  let totalRefund = 0;

  for (const p of participants) {
    completedCount++;
    totalRefund += refundAmount;

    if (challenge.bonus_pro_days > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', p.user_id)
        .single();
      const currentPlan = profile?.plan;
      const currentExpires = profile?.plan_expires_at;

      const baseDate =
        getEffectivePlan(currentPlan as any, currentExpires) === 'pro' && currentExpires
          ? new Date(currentExpires)
          : new Date();

      baseDate.setDate(baseDate.getDate() + challenge.bonus_pro_days);
      const newExpiry = baseDate.toISOString();

      await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          plan_expires_at: newExpiry,
        })
        .eq('id', p.user_id);

      await supabase
        .from('challenge_participants')
        .update({
          bonus_expires_at: newExpiry,
        })
        .eq('id', p.id);
    }

    await supabase
      .from('challenge_participants')
      .update({
        status: 'completed',
        completed_at: now,
        refund_amount: refundAmount,
      })
      .eq('id', p.id);
  }

  await supabase.from('challenges').update({ status: 'completed' }).eq('id', challengeId);

  return { completed: completedCount, refundTotal: totalRefund };
}

export async function failParticipant(
  supabase: SupabaseClient,
  participantId: string,
  reason: string,
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('challenge_participants')
    .update({
      status: 'failed',
      failed_at: now,
      failed_reason: reason,
      current_streak: 0,
    })
    .eq('id', participantId);
}
