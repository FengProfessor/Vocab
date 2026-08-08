import type { SupabaseClient } from '@supabase/supabase-js';
import type { Plan } from '@/lib/supabase';
import { 
  getEffectivePlan, 
  startOfStudentCycle, 
  FREE_AI_DAILY_LIMIT, 
  FREE_CODEMIX_UPGRADE_DAILY_LIMIT, 
  FREE_PACK_READING_DAILY_LIMIT, 
  FREE_WORD_SAVE_MONTHLY_LIMIT,
  type AccessResult
} from '@/lib/entitlement';

export interface CodemixQuotaResult extends AccessResult {
  used?: number;
  limit?: number | null;
  remaining?: number | null;
  plan?: Plan;
}

export interface PackReadingQuotaResult extends AccessResult {
  used?: number;
  limit?: number | null;
  remaining?: number | null;
  plan?: Plan;
  providerHint?: 'zhipu' | 'gemini';
}

export interface WordSaveQuotaResult extends AccessResult {
  used?: number;
  limit?: number | null;
  remaining?: number | null;
}

export interface WordSaveUsage {
  used: number;
  lifetime: number;
  limit: number | null;
  remaining: number | null;
}

/**
 * Server-side: resolve gói hiệu lực từ userId đã auth (Bearer JWT hoặc extension token).
 */
export async function resolvePlanByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<Plan> {
  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle();
  return getEffectivePlan(
    data?.plan as Plan | undefined,
    data?.plan_expires_at as string | null | undefined,
  );
}

/**
 * Server-side: resolve gói hiệu lực của user từ Bearer token.
 * Không có token / token sai → coi như 'free' (userId = null).
 */
export async function resolveUserPlan(
  supabase: SupabaseClient,
  token: string | undefined,
): Promise<{ userId: string | null; plan: Plan }> {
  if (!token) return { userId: null, plan: 'free' };
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { userId: null, plan: 'free' };
  const plan = await resolvePlanByUserId(supabase, user.id);
  return { userId: user.id, plan };
}

/**
 * Server-side: quota AI/ngày cho Free — LUÔN bật (chống đốt Gemini),
 * kể cả khi ENTITLEMENT_ENFORCED=false (feature gate khác vẫn soft).
 * Pro/premium: unlimited. Ẩn danh: chặn.
 */
export async function checkAndConsumeDailyAI(
  supabase: SupabaseClient,
  userId: string | null,
  plan: Plan,
): Promise<AccessResult> {
  if (plan !== 'free') return { allowed: true };
  if (!userId) return { allowed: false, upgradeTo: 'pro' };

  const { data, error } = await supabase.rpc('increment_ai_usage', { p_user_id: userId });
  if (error) {
    // Lỗi đếm → cho qua, không chặn user vì lỗi hạ tầng
    console.warn('[Entitlement] increment_ai_usage failed:', error.message);
    return { allowed: true };
  }
  const used = typeof data === 'number' ? data : 0;
  return used <= FREE_AI_DAILY_LIMIT ? { allowed: true } : { allowed: false, upgradeTo: 'pro' };
}

/**
 * Free / ẩn danh: tối đa FREE_CODEMIX_UPGRADE_DAILY_LIMIT lượt AI B2 / ~24h.
 * Pro/premium: unlimited (không đếm).
 * Luôn enforce — độc lập ENTITLEMENT_ENFORCED (đốt token + paywall aha).
 *
 * @param ip fallback key khi chưa login (demo public)
 */
export async function checkAndConsumeCodemixUpgrade(
  userId: string | null,
  plan: Plan,
  ip: string,
): Promise<CodemixQuotaResult> {
  if (plan !== 'free') {
    return {
      allowed: true,
      used: 0,
      limit: null,
      remaining: null,
      plan,
    };
  }

  const limit = FREE_CODEMIX_UPGRADE_DAILY_LIMIT;
  const dayMs = 86_400_000;
  // Dynamic import tránh circular nếu api-security import entitlement sau này
  const { checkRateLimitAsync } = await import('@/lib/api-security');
  const key = userId
    ? `codemix-upg:u:${userId}`
    : `codemix-upg:ip:${ip || 'unknown'}`;
  const rl = await checkRateLimitAsync(key, limit, dayMs);

  if (!rl.allowed) {
    return {
      allowed: false,
      upgradeTo: 'pro',
      used: limit,
      limit,
      remaining: 0,
      plan: 'free',
    };
  }

  const remaining = rl.remaining;
  const used = limit - remaining;
  return {
    allowed: true,
    used,
    limit,
    remaining,
    plan: 'free',
  };
}

/**
 * Free / ẩn danh: FREE_PACK_READING_DAILY_LIMIT (2) gen đoạn đọc / ~24h.
 * Pro/premium: unlimited. Luôn enforce.
 */
export async function checkAndConsumePackReading(
  userId: string | null,
  plan: Plan,
  ip: string,
): Promise<PackReadingQuotaResult> {
  if (plan !== 'free') {
    return {
      allowed: true,
      used: 0,
      limit: null,
      remaining: null,
      plan,
      providerHint: 'gemini',
    };
  }

  const limit = FREE_PACK_READING_DAILY_LIMIT;
  const dayMs = 86_400_000;
  const { checkRateLimitAsync } = await import('@/lib/api-security');
  const key = userId
    ? `pack-read:u:${userId}`
    : `pack-read:ip:${ip || 'unknown'}`;
  const rl = await checkRateLimitAsync(key, limit, dayMs);

  if (!rl.allowed) {
    return {
      allowed: false,
      upgradeTo: 'pro',
      used: limit,
      limit,
      remaining: 0,
      plan: 'free',
      providerHint: 'zhipu',
    };
  }

  const remaining = rl.remaining;
  const used = limit - remaining;
  return {
    allowed: true,
    used,
    limit,
    remaining,
    plan: 'free',
    providerHint: 'zhipu',
  };
}

/**
 * Đếm từ Free: trong 1 tháng chu kỳ của học sinh + lifetime.
 * Pro: used=0, lifetime=0, limit=null.
 */
export async function getWordSaveUsage(
  supabase: SupabaseClient,
  userId: string | null,
  plan: Plan,
  userCreatedAt?: string | Date | null,
): Promise<WordSaveUsage> {
  if (!userId || plan !== 'free') {
    return { used: 0, lifetime: 0, limit: null, remaining: null };
  }

  let createdAt = userCreatedAt;
  if (!createdAt) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .maybeSingle();
    createdAt = profile?.created_at as string | null | undefined;
  }

  const cycleStart = startOfStudentCycle(createdAt);
  const [monthRes, lifeRes] = await Promise.all([
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', userId)
      .gte('created_at', cycleStart),
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', userId),
  ]);

  if (monthRes.error) {
    console.warn('[Entitlement] word cycle count failed:', monthRes.error.message);
  }
  if (lifeRes.error) {
    console.warn('[Entitlement] word lifetime count failed:', lifeRes.error.message);
  }

  const used = monthRes.count ?? 0;
  const lifetime = lifeRes.count ?? 0;
  const remaining = Math.max(0, FREE_WORD_SAVE_MONTHLY_LIMIT - used);
  return {
    used,
    lifetime,
    limit: FREE_WORD_SAVE_MONTHLY_LIMIT,
    remaining,
  };
}

/**
 * Free: chặn lưu mới khi vượt FREE_WORD_SAVE_MONTHLY_LIMIT trong 1 tháng chu kỳ cá nhân.
 *
 * **Luôn enforce quota từ** (tách khỏi ENTITLEMENT_ENFORCED feature gate)
 * — tránh Free 250+ từ như case power user vẫn lưu vô hạn.
 * Feature gate khác (grammar, AI enrich…) vẫn soft khi ENTITLEMENT_ENFORCED=false.
 *
 * @param extraToAdd số từ sắp lưu (1 = POST 1 từ).
 */
export async function checkWordSaveQuota(
  supabase: SupabaseClient,
  userId: string | null,
  plan: Plan,
  extraToAdd = 1,
  userCreatedAt?: string | Date | null,
): Promise<WordSaveQuotaResult> {
  if (plan !== 'free') {
    return { allowed: true, used: 0, limit: null, remaining: null };
  }
  if (!userId) {
    return {
      allowed: false,
      upgradeTo: 'pro',
      used: 0,
      limit: FREE_WORD_SAVE_MONTHLY_LIMIT,
      remaining: 0,
    };
  }

  const usage = await getWordSaveUsage(supabase, userId, plan, userCreatedAt);
  const used = usage.used;
  const remaining = usage.remaining ?? 0;

  if (used + extraToAdd > FREE_WORD_SAVE_MONTHLY_LIMIT) {
    return {
      allowed: false,
      upgradeTo: 'pro',
      used,
      limit: FREE_WORD_SAVE_MONTHLY_LIMIT,
      remaining,
    };
  }
  return {
    allowed: true,
    used,
    limit: FREE_WORD_SAVE_MONTHLY_LIMIT,
    remaining: remaining - extraToAdd,
  };
}
