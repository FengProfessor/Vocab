/**
 * Pro trial theo mốc học — không tặng Pro ngay sau tour onboarding.
 *
 * Điều kiện nhận NEWBIE1W (7 ngày Pro):
 *   - streak ≥ 3 ngày
 *   - ≥ 50 từ trong kho học (SRS hoặc added_by)
 *
 * LIVE* (quà live) không bị gate này.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getEffectivePlan } from '@/lib/entitlement';
import type { Plan } from '@/lib/supabase';

export const PRO_MILESTONE_MIN_STREAK = 3;
/** "trên 50 từ" — dùng ≥ 50 cho mốc tròn. */
export const PRO_MILESTONE_MIN_WORDS = 50;
export const PRO_MILESTONE_COUPON = 'NEWBIE1W';
export const PRO_MILESTONE_DAYS = 7;
export const PRO_MILESTONE_LABEL = '1 tuần';

/** Mã trial chỉ redeem được khi đạt mốc học (tour onboarding). */
export const MILESTONE_GATED_COUPONS = new Set(['NEWBIE1W', 'NEWBIE2W']);

export function isMilestoneGatedCoupon(code: string): boolean {
  return MILESTONE_GATED_COUPONS.has(code.trim().toUpperCase());
}

export interface ProMilestoneSnapshot {
  streak: number;
  words: number;
  minStreak: number;
  minWords: number;
  streakMet: boolean;
  wordsMet: boolean;
  eligible: boolean;
  alreadyClaimed: boolean;
  /** Đang Pro/Premium còn hạn — vẫn có thể claim để gia hạn nếu chưa claim. */
  effectivePlan: Plan;
  claimedAt: string | null;
}

export function evaluateProMilestone(input: {
  streak: number;
  words: number;
  alreadyClaimed: boolean;
  effectivePlan: Plan;
  claimedAt?: string | null;
}): ProMilestoneSnapshot {
  const streak = Math.max(0, Math.floor(input.streak));
  const words = Math.max(0, Math.floor(input.words));
  const streakMet = streak >= PRO_MILESTONE_MIN_STREAK;
  const wordsMet = words >= PRO_MILESTONE_MIN_WORDS;
  return {
    streak,
    words,
    minStreak: PRO_MILESTONE_MIN_STREAK,
    minWords: PRO_MILESTONE_MIN_WORDS,
    streakMet,
    wordsMet,
    eligible: streakMet && wordsMet && !input.alreadyClaimed,
    alreadyClaimed: input.alreadyClaimed,
    effectivePlan: input.effectivePlan,
    claimedAt: input.claimedAt ?? null,
  };
}

/**
 * Đếm từ học của user: max(SRS rows, words.added_by).
 * SRS = đã ôn/học; added_by = đã lưu vào kho.
 */
export async function countUserLearningWords(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const [srsRes, wordsRes] = await Promise.all([
    supabase
      .from('srs_progress')
      .select('word_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', userId),
  ]);

  if (srsRes.error) {
    console.warn('[ProMilestone] srs count failed:', srsRes.error.message);
  }
  if (wordsRes.error) {
    console.warn('[ProMilestone] words count failed:', wordsRes.error.message);
  }

  return Math.max(srsRes.count ?? 0, wordsRes.count ?? 0);
}

/** Đã từng redeem mã NEWBIE* (paid order)? */
export async function hasClaimedNewbieTrial(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ claimed: boolean; claimedAt: string | null }> {
  const codes = [...MILESTONE_GATED_COUPONS];
  const { data, error } = await supabase
    .from('orders')
    .select('coupon_code, paid_at, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .in('coupon_code', codes)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('[ProMilestone] claim check failed:', error.message);
    return { claimed: false, claimedAt: null };
  }

  const row = data?.[0];
  if (!row) return { claimed: false, claimedAt: null };
  return {
    claimed: true,
    claimedAt: (row.paid_at as string | null) ?? (row.created_at as string | null) ?? null,
  };
}

/** Snapshot đầy đủ cho API / gate redeem. */
export async function getProMilestoneSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProMilestoneSnapshot> {
  const [gamRes, words, claim, profileRes] = await Promise.all([
    supabase
      .from('user_gamification')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle(),
    countUserLearningWords(supabase, userId),
    hasClaimedNewbieTrial(supabase, userId),
    supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  const streak = (gamRes.data?.current_streak as number | undefined) ?? 0;
  const effectivePlan = getEffectivePlan(
    profileRes.data?.plan as Plan | undefined,
    profileRes.data?.plan_expires_at as string | null | undefined,
  );

  return evaluateProMilestone({
    streak,
    words,
    alreadyClaimed: claim.claimed,
    effectivePlan,
    claimedAt: claim.claimedAt,
  });
}

/** Message lỗi tiếng Việt khi redeem NEWBIE mà chưa đạt mốc. */
export function milestoneGateErrorMessage(snap: ProMilestoneSnapshot): string {
  if (snap.alreadyClaimed) {
    return 'Bạn đã nhận quà Pro newbie rồi. Mỗi tài khoản chỉ nhận 1 lần.';
  }
  const missing: string[] = [];
  if (!snap.streakMet) {
    missing.push(`streak ${snap.streak}/${snap.minStreak} ngày`);
  }
  if (!snap.wordsMet) {
    missing.push(`${snap.words}/${snap.minWords} từ trong kho`);
  }
  return `Chưa đủ mốc nhận Pro free. Cần streak ≥ ${snap.minStreak} ngày và ≥ ${snap.minWords} từ. Hiện: ${missing.join(', ')}.`;
}
