/**
 * Pro trial theo mốc học — không tặng Pro ngay sau tour onboarding.
 *
 * Điều kiện claim NEWBIE1W (7 ngày Pro):
 *   1. Đã enroll funnel khi còn dưới mốc (<50 từ VÀ streak <3) — server ghi profiles.pro_milestone_enrolled_at
 *   2. streak ≥ 3 ngày
 *   3. ≥ 50 từ trong kho
 *   4. Free, chưa claim NEWBIE*
 *
 * Power user (đã 200+ từ, chưa từng dưới mốc) → KHÔNG enroll → KHÔNG claim.
 * LIVE* (quà live) không bị gate này.
 */

import type { Plan } from '@/lib/supabase';

export const PRO_MILESTONE_MIN_STREAK = 3;
/** "trên 50 từ" — dùng ≥ 50 cho mốc tròn. */
export const PRO_MILESTONE_MIN_WORDS = 50;
/**
 * Trần cứng lúc claim: chặn power user / import cả kho.
 * Enroll vẫn bắt buộc; trần này chống edge-case enroll xong dump 500 từ.
 */
export const PRO_MILESTONE_MAX_WORDS_AT_CLAIM = 120;
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
  maxWordsAtClaim: number;
  streakMet: boolean;
  wordsMet: boolean;
  /** Đã ghi nhận vào funnel khi còn dưới mốc (server). */
  enrolled: boolean;
  enrolledAt: string | null;
  /** Đủ điều kiện claim: enrolled + streak + words trong [min, max] + free + chưa claim. */
  eligible: boolean;
  alreadyClaimed: boolean;
  effectivePlan: Plan;
  claimedAt: string | null;
}

export function evaluateProMilestone(input: {
  streak: number;
  words: number;
  alreadyClaimed: boolean;
  effectivePlan: Plan;
  claimedAt?: string | null;
  enrolled: boolean;
  enrolledAt?: string | null;
}): ProMilestoneSnapshot {
  const streak = Math.max(0, Math.floor(input.streak));
  const words = Math.max(0, Math.floor(input.words));
  const streakMet = streak >= PRO_MILESTONE_MIN_STREAK;
  const wordsMet =
    words >= PRO_MILESTONE_MIN_WORDS && words <= PRO_MILESTONE_MAX_WORDS_AT_CLAIM;
  const enrolled = input.enrolled === true;
  const free = input.effectivePlan === 'free';

  return {
    streak,
    words,
    minStreak: PRO_MILESTONE_MIN_STREAK,
    minWords: PRO_MILESTONE_MIN_WORDS,
    maxWordsAtClaim: PRO_MILESTONE_MAX_WORDS_AT_CLAIM,
    streakMet,
    wordsMet,
    enrolled,
    enrolledAt: input.enrolledAt ?? null,
    eligible:
      free &&
      enrolled &&
      streakMet &&
      wordsMet &&
      !input.alreadyClaimed,
    alreadyClaimed: input.alreadyClaimed,
    effectivePlan: input.effectivePlan,
    claimedAt: input.claimedAt ?? null,
  };
}

/** localStorage: UI funnel (chỉ UX; server enroll mới cho claim). */
export const PRO_MILESTONE_FUNNEL_LS_KEY = 'lp:pro_milestone_funnel';

/** Còn dưới cả 2 mốc (nick mới: <50 từ và streak <3). */
export function isUnderProMilestone(words: number, streak: number): boolean {
  return words < PRO_MILESTONE_MIN_WORDS && streak < PRO_MILESTONE_MIN_STREAK;
}

/**
 * Card chỉ hiện cho nick free chưa claim và:
 *  - đang dưới cả 2 mốc, hoặc
 *  - đã enroll server (funnel) và đang tiến tới claim.
 */
export function shouldShowProMilestoneCard(input: {
  words: number;
  streak: number;
  alreadyClaimed: boolean;
  effectivePlan: Plan;
  funnelActive?: boolean;
  enrolled?: boolean;
}): boolean {
  if (input.alreadyClaimed) return false;
  if (input.effectivePlan !== 'free') return false;
  if (isUnderProMilestone(input.words, input.streak)) return true;
  if (input.enrolled || input.funnelActive) return true;
  return false;
}

/** Message lỗi tiếng Việt khi redeem NEWBIE mà chưa đạt mốc. */
export function milestoneGateErrorMessage(snap: ProMilestoneSnapshot): string {
  if (snap.alreadyClaimed) {
    return 'Bạn đã nhận quà Pro newbie rồi. Mỗi tài khoản chỉ nhận 1 lần.';
  }
  if (snap.effectivePlan !== 'free') {
    return 'Tài khoản đang Pro/Premium — không áp dụng quà newbie.';
  }
  if (!snap.enrolled) {
    return 'Quà Pro chỉ dành cho nick mới (vào nhiệm vụ khi còn dưới 50 từ và streak < 3). Tài khoản đã học sẵn không nhận được quà này.';
  }
  if (snap.words > snap.maxWordsAtClaim) {
    return `Kho từ đã vượt trần quà newbie (tối đa ${snap.maxWordsAtClaim} từ lúc nhận). Liên hệ hỗ trợ nếu bạn đang làm nhiệm vụ hợp lệ.`;
  }
  const missing: string[] = [];
  if (!snap.streakMet) {
    missing.push(`streak ${snap.streak}/${snap.minStreak} ngày`);
  }
  if (snap.words < snap.minWords) {
    missing.push(`${snap.words}/${snap.minWords} từ trong kho`);
  }
  return `Chưa đủ mốc nhận Pro free. Cần streak ≥ ${snap.minStreak} ngày và ${snap.minWords}–${snap.maxWordsAtClaim} từ. Hiện: ${missing.join(', ') || `${snap.words} từ, streak ${snap.streak}`}.`;
}
