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

import type { SupabaseClient } from '@supabase/supabase-js';
import { getEffectivePlan } from '@/lib/entitlement';
import { effectiveCurrentStreak } from '@/lib/gamification';
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

/**
 * Đếm từ học của user — lấy MAX các nguồn để tránh undercount (enroll nhầm power user):
 *  - srs_progress (đã ôn)
 *  - words.added_by
 *  - words trong personal classroom (__personal__)
 */
export async function countUserLearningWords(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const [srsRes, wordsRes, personalCls] = await Promise.all([
    supabase
      .from('srs_progress')
      .select('word_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', userId),
    supabase
      .from('classrooms')
      .select('id')
      .eq('teacher_id', userId)
      .eq('name', '__personal__')
      .maybeSingle(),
  ]);

  if (srsRes.error) {
    console.warn('[ProMilestone] srs count failed:', srsRes.error.message);
  }
  if (wordsRes.error) {
    console.warn('[ProMilestone] words count failed:', wordsRes.error.message);
  }

  let personalCount = 0;
  const clsId = personalCls.data?.id as string | undefined;
  if (clsId) {
    const { count, error } = await supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('classroom_id', clsId);
    if (error) {
      console.warn('[ProMilestone] personal words count failed:', error.message);
    } else {
      personalCount = count ?? 0;
    }
  }

  return Math.max(srsRes.count ?? 0, wordsRes.count ?? 0, personalCount);
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

async function readEnrolledAtFromMetadata(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data.user) return null;
    const v = data.user.user_metadata?.pro_milestone_enrolled_at;
    return typeof v === 'string' && v.length > 0 ? v : null;
  } catch (err) {
    console.warn('[ProMilestone] metadata read failed:', err);
    return null;
  }
}

async function readEnrolledAt(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('pro_milestone_enrolled_at')
    .eq('id', userId)
    .maybeSingle();

  if (!error) {
    const v = data?.pro_milestone_enrolled_at;
    if (typeof v === 'string' && v.length > 0) return v;
  } else if (!error.message?.includes('pro_milestone_enrolled_at')) {
    console.warn('[ProMilestone] read enrolled_at failed:', error.message);
  }

  // Fallback: auth user_metadata (hoạt động trước khi migrate cột)
  return readEnrolledAtFromMetadata(supabase, userId);
}

async function writeEnrolledAt(
  supabase: SupabaseClient,
  userId: string,
  at: string,
): Promise<boolean> {
  let profileOk = false;
  // 1) profiles column (nếu đã migrate)
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ pro_milestone_enrolled_at: at })
    .eq('id', userId)
    .is('pro_milestone_enrolled_at', null);

  if (!profileErr) {
    profileOk = true;
  } else if (!profileErr.message?.includes('pro_milestone_enrolled_at')) {
    console.warn('[ProMilestone] profile enroll write:', profileErr.message);
  }

  // 2) user_metadata — bắt buộc có (nguồn claim khi chưa migrate cột)
  try {
    const { data: existing } = await supabase.auth.admin.getUserById(userId);
    const prev = existing?.user?.user_metadata ?? {};
    if (typeof prev.pro_milestone_enrolled_at === 'string' && prev.pro_milestone_enrolled_at) {
      return true;
    }
    const { error: metaErr } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...prev,
        pro_milestone_enrolled_at: at,
      },
    });
    if (metaErr) {
      console.warn('[ProMilestone] metadata enroll write:', metaErr.message);
      return profileOk;
    }
    return true;
  } catch (err) {
    console.warn('[ProMilestone] metadata enroll exception:', err);
    return profileOk;
  }
}

/**
 * Enroll CHỈ khi đang dưới cả 2 mốc + free + chưa claim.
 * Power user (đã nhiều từ) gọi API → không được enroll → không claim.
 */
export async function ensureProMilestoneEnrollment(
  supabase: SupabaseClient,
  userId: string,
  input: {
    words: number;
    streak: number;
    effectivePlan: Plan;
    alreadyClaimed: boolean;
  },
): Promise<string | null> {
  const existing = await readEnrolledAt(supabase, userId);
  if (existing) return existing;

  if (input.alreadyClaimed) return null;
  if (input.effectivePlan !== 'free') return null;
  if (!isUnderProMilestone(input.words, input.streak)) return null;

  const at = new Date().toISOString();
  const ok = await writeEnrolledAt(supabase, userId, at);
  if (!ok) {
    return readEnrolledAt(supabase, userId);
  }
  return (await readEnrolledAt(supabase, userId)) ?? at;
}

export interface GetProMilestoneOptions {
  /** true = cho phép enroll khi under (GET dashboard). POST claim = false. */
  allowEnroll?: boolean;
}

/** Snapshot đầy đủ cho API / gate redeem.
 *  allowEnroll mặc định false (claim/redeem fail-closed).
 *  GET dashboard truyền allowEnroll: true để ghi enroll khi under mốc.
 */
export async function getProMilestoneSnapshot(
  supabase: SupabaseClient,
  userId: string,
  options: GetProMilestoneOptions = {},
): Promise<ProMilestoneSnapshot> {
  const allowEnroll = options.allowEnroll === true;

  const [gamRes, words, claim, profileFull] = await Promise.all([
    supabase
      .from('user_gamification')
      .select('current_streak, last_active_date')
      .eq('user_id', userId)
      .maybeSingle(),
    countUserLearningWords(supabase, userId),
    hasClaimedNewbieTrial(supabase, userId),
    supabase
      .from('profiles')
      .select('plan, plan_expires_at, pro_milestone_enrolled_at')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  // Cột chưa migrate → fallback plan only
  let profileData = profileFull.data as {
    plan?: string;
    plan_expires_at?: string | null;
    pro_milestone_enrolled_at?: string | null;
  } | null;

  if (profileFull.error) {
    // im lặng nếu thiếu cột; chỉ warn lỗi khác
    if (!profileFull.error.message?.includes('pro_milestone_enrolled_at')) {
      console.warn('[ProMilestone] profile select failed:', profileFull.error.message);
    }
    const fb = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .maybeSingle();
    profileData = fb.data ?? null;
  }

  // Streak = ngày liên tiếp còn sống (last_active hôm nay/hôm qua). Raw DB có thể stale sau khi gãy.
  const streak = effectiveCurrentStreak(
    gamRes.data?.current_streak as number | undefined,
    gamRes.data?.last_active_date as string | null | undefined,
  );
  const effectivePlan = getEffectivePlan(
    profileData?.plan as Plan | undefined,
    profileData?.plan_expires_at as string | null | undefined,
  );

  /**
   * Enrolled: LUÔN resolve qua readEnrolledAt (profiles + user_metadata).
   * Bug cũ: chỉ đọc cột profiles → cột chưa có thì claim/redeem coi như chưa enroll
   * hoặc (ngược lại) logic lệch. GET allowEnroll mới được ghi enroll khi under.
   */
  let enrolledAt: string | null;
  if (allowEnroll) {
    enrolledAt = await ensureProMilestoneEnrollment(supabase, userId, {
      words,
      streak,
      effectivePlan,
      alreadyClaimed: claim.claimed,
    });
  } else {
    enrolledAt = await readEnrolledAt(supabase, userId);
  }

  return evaluateProMilestone({
    streak,
    words,
    alreadyClaimed: claim.claimed,
    effectivePlan,
    claimedAt: claim.claimedAt,
    enrolled: !!enrolledAt,
    enrolledAt,
  });
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
