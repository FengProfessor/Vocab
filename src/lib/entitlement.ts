/**
 * Entitlement — nguồn sự thật về việc mỗi gói (plan) được dùng tính năng nào.
 *
 * THIẾT KẾ AN TOÀN: enforcement TẮT mặc định (ENTITLEMENT_ENFORCED !== 'true').
 * → Khi chưa bật, mọi user (kể cả 'free') vẫn dùng đủ tính năng như hiện tại,
 *   KHÔNG vỡ app đang chạy cho 50-100 học sinh hiện có.
 * → Khi sẵn sàng thu phí: set env ENTITLEMENT_ENFORCED=true để bật gating.
 *
 * Dùng được cả server (API routes) lẫn client (hook usePlan).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Plan } from '@/lib/supabase';

export type { Plan };

/** Thứ hạng gói — số lớn hơn = quyền cao hơn. */
const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, premium: 2 };

/** Có bật cưỡng chế gating hay không. Mặc định false để không chặn ai. */
export const ENTITLEMENT_ENFORCED = process.env.ENTITLEMENT_ENFORCED === 'true';

/** Quota lượt AI/ngày cho gói Free (chỉ áp khi ENTITLEMENT_ENFORCED). */
export const FREE_AI_DAILY_LIMIT = 5;

/** Số ngày còn lại trước khi gói hết hạn. <0 = đã hết. null = free/lifetime. */
export function getRemainingDays(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


/** Tính năng → gói tối thiểu cần có. */
export type Feature =
  | 'ai_lookup'        // tra từ AI (free có quota/ngày, pro+ không giới hạn)
  | 'ai_enrich'        // làm giàu từ bằng AI
  | 'ai_quiz'          // AI tạo quiz từ vựng
  | 'writing_practice' // luyện viết + chấm
  | 'grammar_read'     // đọc lý thuyết ngữ pháp + TTS
  | 'grammar_ai';      // AI ngữ pháp: tạo bài tập, phân tích câu, ôn câu sai

export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  ai_lookup: 'free',        // free dùng được nhưng bị quota/ngày
  ai_enrich: 'pro',
  ai_quiz: 'pro',
  writing_practice: 'pro',
  grammar_read: 'pro',
  grammar_ai: 'pro',        // gộp từ premium → Pro là gói trả phí duy nhất, có đủ
};

/**
 * Tính gói hiệu lực: nếu đã hết hạn → tụt về 'free'.
 * @param plan      gói lưu trong profiles
 * @param expiresAt ISO string hoặc null (null = không hết hạn)
 */
export function getEffectivePlan(plan: Plan | null | undefined, expiresAt: string | null | undefined): Plan {
  const p = plan ?? 'free';
  if (p === 'free') return 'free';
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return 'free';
  return p;
}

/** Gói `plan` có đạt mức `required` không. */
export function planMeets(plan: Plan, required: Plan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

export interface AccessResult {
  allowed: boolean;
  /** Gói cần nâng lên nếu bị chặn (để client hiện upsell). */
  upgradeTo?: Plan;
}

/**
 * Kiểm tra quyền truy cập 1 tính năng theo gói.
 * Khi ENTITLEMENT_ENFORCED=false → luôn allow (giữ hành vi hiện tại).
 */
export function checkAccess(plan: Plan, feature: Feature): AccessResult {
  if (!ENTITLEMENT_ENFORCED) return { allowed: true };
  const required = FEATURE_MIN_PLAN[feature];
  if (planMeets(plan, required)) return { allowed: true };
  return { allowed: false, upgradeTo: required };
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
  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle();
  const plan = getEffectivePlan(data?.plan as Plan | undefined, data?.plan_expires_at as string | null | undefined);
  return { userId: user.id, plan };
}

/**
 * Server-side: với gói Free, tăng + kiểm tra quota AI/ngày.
 * Trả allowed=false khi vượt FREE_AI_DAILY_LIMIT.
 * Gói pro/premium hoặc khi chưa enforce → luôn allow, không đếm.
 */
export async function checkAndConsumeDailyAI(
  supabase: SupabaseClient,
  userId: string | null,
  plan: Plan,
): Promise<AccessResult> {
  if (!ENTITLEMENT_ENFORCED) return { allowed: true };
  if (plan !== 'free') return { allowed: true };
  if (!userId) return { allowed: false, upgradeTo: 'pro' }; // free + ẩn danh → chặn khi enforce

  const { data, error } = await supabase.rpc('increment_ai_usage', { p_user_id: userId });
  if (error) {
    // Lỗi đếm → cho qua, không chặn user vì lỗi hạ tầng
    console.warn('[Entitlement] increment_ai_usage failed:', error.message);
    return { allowed: true };
  }
  const used = typeof data === 'number' ? data : 0;
  return used <= FREE_AI_DAILY_LIMIT ? { allowed: true } : { allowed: false, upgradeTo: 'pro' };
}
