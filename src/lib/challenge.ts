import { SupabaseClient } from '@supabase/supabase-js';
import { dateKeyInTimeZone, APP_TIMEZONE } from '@/lib/gamification';
import { getEffectivePlan } from '@/lib/entitlement';

// Types
export interface DailyCriteria {
  min_srs_reviews: number;
  min_quizzes: number;
  min_reading_sessions: number;
  min_listening_sessions: number;
}

export interface Challenge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_days: number;
  deposit_amount: number;
  refund_pct: number;
  refund_cash_amount: number;
  bonus_pro_days: number;
  streak_freeze_price: number;
  max_streak_freezes: number;
  daily_criteria: DailyCriteria;
  registration_opens_at: string;
  registration_closes_at: string;
  starts_at: string;
  ends_at: string;
  max_participants: number | null;
  status: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
}

export type ParticipantStatus = 'pending' | 'active' | 'failed' | 'completed' | 'refunded';

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  order_id: string | null;
  status: ParticipantStatus;
  joined_at: string;
  activated_at: string | null;
  failed_at: string | null;
  failed_reason: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  bonus_expires_at: string | null;
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  streak_freezes_used: number;
  reward_choice: 'cash' | 'pro' | null;
}

export interface ChallengeDailyLog {
  id: string;
  participant_id: string;
  user_id: string;
  challenge_id: string;
  log_date: string; // YYYY-MM-DD
  srs_reviews: number;
  quizzes_done: number;
  reading_sessions: number;
  listening_sessions: number;
  xp_earned: number;
  criteria_met: boolean;
  checked_at: string | null;
}

export function parseDailyCriteria(raw: unknown): DailyCriteria {
  const defaultCriteria: DailyCriteria = {
    min_srs_reviews: 10,
    min_quizzes: 1,
    min_reading_sessions: 0,
    min_listening_sessions: 0,
  };
  
  if (!raw || typeof raw !== 'object') {
    return defaultCriteria;
  }
  
  const obj = raw as Record<string, any>;
  return {
    min_srs_reviews: typeof obj.min_srs_reviews === 'number' ? obj.min_srs_reviews : defaultCriteria.min_srs_reviews,
    min_quizzes: typeof obj.min_quizzes === 'number' ? obj.min_quizzes : defaultCriteria.min_quizzes,
    min_reading_sessions: typeof obj.min_reading_sessions === 'number' ? obj.min_reading_sessions : defaultCriteria.min_reading_sessions,
    min_listening_sessions: typeof obj.min_listening_sessions === 'number' ? obj.min_listening_sessions : defaultCriteria.min_listening_sessions,
  };
}

export function checkCriteriaMet(metrics: { srs_reviews: number; quizzes_done: number; reading_sessions: number; listening_sessions: number }, criteria: DailyCriteria): boolean {
  return (
    metrics.srs_reviews >= criteria.min_srs_reviews &&
    metrics.quizzes_done >= criteria.min_quizzes &&
    metrics.reading_sessions >= criteria.min_reading_sessions &&
    metrics.listening_sessions >= criteria.min_listening_sessions
  );
}

export async function aggregateDailyMetrics(supabase: SupabaseClient, userId: string, dateKey: string): Promise<{ srs_reviews: number; quizzes_done: number; reading_sessions: number; listening_sessions: number; xp_earned: number }> {
  // We use the specified time boundaries for Vietnam timezone
  const startIso = `${dateKey}T00:00:00+07:00`;
  const endIso = `${dateKey}T23:59:59.999+07:00`;

  const [
    { count: srsReviews },
    { count: quizzesDone },
    { count: listeningSessions },
    { count: readingSessions },
    { data: gamification }
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
      .single()
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

export async function processChallengeDayEnd(supabase: SupabaseClient, challengeId: string, dateKey: string): Promise<{ checked: number; passed: number; failed: number }> {
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
      checked_at: checkedAt
    };
    
    await supabase.from('challenge_daily_log').upsert(log, { onConflict: 'participant_id,log_date' });
    
    if (met) {
      passed++;
      const newStreak = (p.current_streak || 0) + 1;
      const longest = Math.max(p.longest_streak || 0, newStreak);
      await supabase.from('challenge_participants').update({
        current_streak: newStreak,
        longest_streak: longest,
        total_active_days: (p.total_active_days || 0) + 1
      }).eq('id', p.id);
    } else {
      // Check if participant has already used a streak freeze for this date
      const { data: existingFreeze } = await supabase
        .from('streak_freeze_purchases')
        .select('id')
        .eq('participant_id', p.id)
        .eq('used_for_date', dateKey)
        .maybeSingle();

      if (existingFreeze) {
        // Streak freeze was purchased — count as passed (streak maintained)
        passed++;
      } else if ((p.streak_freezes_used || 0) < (challenge.max_streak_freezes || 3)) {
        // Has remaining freezes — mark day as missed but DON'T fail yet
        // User has until next day's check to purchase a streak freeze
        failed++; // counted as "needs attention"
        // Reset streak but don't fail completely
        await supabase.from('challenge_participants').update({
          current_streak: 0,
        }).eq('id', p.id);
      } else {
        // No freezes remaining — hard fail
        failed++;
        await failParticipant(supabase, p.id, `Failed to meet criteria on ${dateKey} (no streak freezes remaining)`);
      }
    }
  }

  return { checked, passed, failed };
}

export async function activateChallengeParticipant(supabase: SupabaseClient, participantId: string): Promise<void> {
  const { data: participant } = await supabase.from('challenge_participants').select('*, challenge:challenges(*)').eq('id', participantId).single();
  if (!participant || !participant.challenge) throw new Error('Participant not found');
  
  const now = new Date().toISOString();
  
  const { data: profile } = await supabase.from('profiles').select('plan, plan_expires_at').eq('id', participant.user_id).single();
  const currentPlan = profile?.plan;
  const currentExpires = profile?.plan_expires_at;
  
  const challengeEndsAt = new Date(participant.challenge.ends_at);
  const effectiveExpiry = getEffectivePlan(currentPlan as any, currentExpires) === 'pro' && currentExpires
    ? (new Date(currentExpires) > challengeEndsAt ? currentExpires : challengeEndsAt.toISOString())
    : challengeEndsAt.toISOString();

  await supabase.from('profiles').update({
    plan: 'pro',
    plan_expires_at: effectiveExpiry
  }).eq('id', participant.user_id);
  
  await supabase.from('challenge_participants').update({
    status: 'active',
    activated_at: now
  }).eq('id', participantId);
}

export async function completeChallenge(supabase: SupabaseClient, challengeId: string): Promise<{ completed: number; refundTotal: number }> {
  const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
  if (!challenge) throw new Error('Challenge not found');

  const { data: participants } = await supabase.from('challenge_participants')
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
      const { data: profile } = await supabase.from('profiles').select('plan, plan_expires_at').eq('id', p.user_id).single();
      const currentPlan = profile?.plan;
      const currentExpires = profile?.plan_expires_at;
      
      const baseDate = getEffectivePlan(currentPlan as any, currentExpires) === 'pro' && currentExpires 
        ? new Date(currentExpires) 
        : new Date();
        
      baseDate.setDate(baseDate.getDate() + challenge.bonus_pro_days);
      const newExpiry = baseDate.toISOString();
      
      await supabase.from('profiles').update({
        plan: 'pro',
        plan_expires_at: newExpiry
      }).eq('id', p.user_id);
      
      await supabase.from('challenge_participants').update({
        bonus_expires_at: newExpiry
      }).eq('id', p.id);
    }
    
    await supabase.from('challenge_participants').update({
      status: 'completed',
      completed_at: now,
      refund_amount: refundAmount
    }).eq('id', p.id);
  }
  
  await supabase.from('challenges').update({ status: 'completed' }).eq('id', challengeId);
  
  return { completed: completedCount, refundTotal: totalRefund };
}

export async function failParticipant(supabase: SupabaseClient, participantId: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from('challenge_participants').update({
    status: 'failed',
    failed_at: now,
    failed_reason: reason,
    current_streak: 0
  }).eq('id', participantId);
}

export function challengeProgress(participant: ChallengeParticipant, challenge: Challenge): { totalDays: number; elapsedDays: number; remainingDays: number; pctComplete: number; isActive: boolean } {
  const totalDays = challenge.duration_days;
  
  const now = new Date();
  const startDate = new Date(challenge.starts_at);
  const endDate = new Date(challenge.ends_at);
  
  let elapsedDays = 0;
  if (now > endDate) {
    elapsedDays = totalDays;
  } else if (now > startDate) {
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const pctComplete = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
  const isActive = participant.status === 'active' && now >= startDate && now <= endDate;
  
  return { totalDays, elapsedDays, remainingDays, pctComplete, isActive };
}

export function formatDepositVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function slugify(text: string): string {
  let str = text.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9 -]/g, '');
  str = str.replace(/\s+/g, '-');
  str = str.replace(/-+/g, '-');
  return str.replace(/^-+|-+$/g, '');
}
