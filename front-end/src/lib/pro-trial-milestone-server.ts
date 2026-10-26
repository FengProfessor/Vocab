import type { SupabaseClient } from '@supabase/supabase-js';
import { getEffectivePlan } from '@/lib/entitlement';
import { effectiveCurrentStreak } from '@/lib/gamification';
import type { Plan } from '@/lib/supabase';
import { cacheGetOrSet } from '@/lib/ttl-cache';
import {
  evaluateProMilestone,
  isUnderProMilestone,
  MILESTONE_GATED_COUPONS,
  milestoneGateErrorMessage,
  PRO_MILESTONE_COUPON,
  PRO_MILESTONE_DAYS,
  PRO_MILESTONE_LABEL,
  type ProMilestoneSnapshot,
} from '@/lib/pro-trial-milestone';

export {
  PRO_MILESTONE_COUPON,
  PRO_MILESTONE_DAYS,
  PRO_MILESTONE_LABEL,
  milestoneGateErrorMessage,
  type ProMilestoneSnapshot,
};

/**
 * Đếm từ học của user — lấy MAX các nguồn để tránh undercount (enroll nhầm power user):
 *  - srs_progress (đã ôn)
 *  - words.added_by
 *  - words trong personal classroom (__personal__)
 * Có TTL cache 60s để tránh dồn dập count query full-table trên Supabase.
 */
export async function countUserLearningWords(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  return cacheGetOrSet(`user-learning-words:${userId}`, 60_000, async () => {
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
      const msg = srsRes.error.message || JSON.stringify(srsRes.error);
      console.warn('[ProMilestone] srs count failed:', msg);
    }
    if (wordsRes.error) {
      const msg = wordsRes.error.message || JSON.stringify(wordsRes.error);
      console.warn('[ProMilestone] words count failed:', msg);
    }

    let personalCount = 0;
    const clsId = personalCls.data?.id as string | undefined;
    if (clsId) {
      const { count, error } = await supabase
        .from('words')
        .select('id', { count: 'exact', head: true })
        .eq('classroom_id', clsId);
      if (error) {
        const msg = error.message || JSON.stringify(error);
        console.warn('[ProMilestone] personal words count failed:', msg);
      } else {
        personalCount = count ?? 0;
      }
    }

    return Math.max(srsRes.count ?? 0, wordsRes.count ?? 0, personalCount);
  });
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
    const adminClient = supabase;
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
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

  return readEnrolledAtFromMetadata(supabase, userId);
}

async function writeEnrolledAt(
  supabase: SupabaseClient,
  userId: string,
  at: string,
): Promise<boolean> {
  let profileOk = false;
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

  try {
    const adminClient = supabase;
    const { data: existing } = await adminClient.auth.admin.getUserById(userId);
    const prev = existing?.user?.user_metadata ?? {};
    if (typeof prev.pro_milestone_enrolled_at === 'string' && prev.pro_milestone_enrolled_at) {
      return true;
    }
    const { error: metaErr } = await adminClient.auth.admin.updateUserById(userId, {
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

/** Snapshot đầy đủ cho API / gate redeem. */
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

  let profileData = profileFull.data as {
    plan?: string;
    plan_expires_at?: string | null;
    pro_milestone_enrolled_at?: string | null;
  } | null;

  if (profileFull.error) {
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

  const streak = effectiveCurrentStreak(
    gamRes.data?.current_streak as number | undefined,
    gamRes.data?.last_active_date as string | null | undefined,
  );
  const effectivePlan = getEffectivePlan(
    profileData?.plan as Plan | undefined,
    profileData?.plan_expires_at as string | null | undefined,
  );

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
