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

/**
 * Số từ MỚI free được lưu/tháng (calendar month, UTC).
 * Chỉ chặn lưu mới (POST /api/words); từ đã lưu vẫn ôn FSRS bình thường.
 * Catalog pack import không đếm vào quota này (free value = lộ trình sẵn).
 */
export const FREE_WORD_SAVE_MONTHLY_LIMIT = 200;

/** ISO start of current UTC calendar month. */
export function startOfUtcMonth(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

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
  | 'ai_sentence'      // phân tích câu EN→VI (demo / Pro)
  | 'writing_practice' // luyện viết + chấm
  | 'grammar_read'     // đọc lý thuyết ngữ pháp + TTS
  | 'grammar_ai';      // AI ngữ pháp: tạo bài tập, phân tích câu, ôn câu sai

export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  ai_lookup: 'free',        // free dùng được nhưng bị quota/ngày
  ai_enrich: 'pro',
  ai_quiz: 'pro',
  ai_sentence: 'pro',
  writing_practice: 'pro',
  grammar_read: 'pro',
  grammar_ai: 'pro',        // gộp từ premium → Pro là gói trả phí duy nhất, có đủ
};

// ── Lộ trình học (level-gate thay vì on/off) ──
// Free: trọn A0 + A1 (máy retention — tạo thói quen trước khi thu phí).
// Pro trở lên: mở hết A2→B2.
// LƯU Ý: grammar lesson đi QUA lộ trình free A0/A1 không bị chặn bởi grammar_read
// (gate lộ trình kiểm ở /api/roadmap/progress theo cấp, không theo feature grammar).
export type RoadmapLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
const ROADMAP_LEVEL_RANK: Record<RoadmapLevel, number> = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
export const ROADMAP_FREE_MAX_LEVEL: RoadmapLevel = 'A1';

/** Cấp lộ trình cao nhất gói này được học. */
export function roadmapMaxLevel(plan: Plan): RoadmapLevel {
  return plan === 'free' ? ROADMAP_FREE_MAX_LEVEL : 'B2';
}

/** User gói `plan` có được học cấp `level` trong lộ trình không (theo cờ enforce). */
export function checkRoadmapLevelAccess(plan: Plan, level: RoadmapLevel): AccessResult {
  if (!ENTITLEMENT_ENFORCED) return { allowed: true };
  if (ROADMAP_LEVEL_RANK[level] <= ROADMAP_LEVEL_RANK[roadmapMaxLevel(plan)]) return { allowed: true };
  return { allowed: false, upgradeTo: 'pro' };
}

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

export interface WordSaveQuotaResult extends AccessResult {
  /** Số từ đã lưu tháng này (free only; pro+ = 0). */
  used?: number;
  /** Trần free; null = unlimited. */
  limit?: number | null;
  remaining?: number | null;
}

export interface WordSaveUsage {
  /** Từ mới tháng UTC (quota chặn). */
  used: number;
  /** Tổng lifetime added_by (soft upsell power user). */
  lifetime: number;
  limit: number | null;
  remaining: number | null;
}

/**
 * Đếm từ Free: tháng UTC + lifetime (UI near-limit / power user).
 * Pro: used=0, lifetime=0, limit=null.
 */
export async function getWordSaveUsage(
  supabase: SupabaseClient,
  userId: string | null,
  plan: Plan,
): Promise<WordSaveUsage> {
  if (!userId || plan !== 'free') {
    return { used: 0, lifetime: 0, limit: null, remaining: null };
  }

  const monthStart = startOfUtcMonth();
  const [monthRes, lifeRes] = await Promise.all([
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', userId)
      .gte('created_at', monthStart),
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', userId),
  ]);

  if (monthRes.error) {
    console.warn('[Entitlement] word month count failed:', monthRes.error.message);
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
 * Free: chặn lưu mới khi vượt FREE_WORD_SAVE_MONTHLY_LIMIT (tháng UTC).
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

  const usage = await getWordSaveUsage(supabase, userId, plan);
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
