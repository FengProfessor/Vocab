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
 * Free: lượt AI nâng đoạn code-mix (B2) / ngày (UTC window ~24h qua rate-limit).
 * Pro/premium: unlimited. Luôn enforce (đốt AI + monetize aha).
 */
export const FREE_CODEMIX_UPGRADE_DAILY_LIMIT = 1;

/**
 * Free: lượt Gen đoạn đọc pack / ngày (~24h).
 * Free dùng model chậm (Zhipu); Pro = Gemini nhanh + ∞.
 * Luôn enforce (đốt token + upsell).
 */
export const FREE_PACK_READING_DAILY_LIMIT = 2;

/**
 * Số từ MỚI free được lưu trong 1 tháng (tính theo chu kỳ từ ngày học sinh enroll).
 * Chỉ chặn lưu mới (POST /api/words); từ đã lưu vẫn ôn FSRS bình thường.
 * Catalog pack import không đếm vào quota này (free value = lộ trình sẵn).
 */
export const FREE_WORD_SAVE_MONTHLY_LIMIT = 200;

/** ISO start of current UTC calendar month. */
export function startOfUtcMonth(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

function createValidCycleDate(year: number, month: number, targetDay: number, hours: number, mins: number, secs: number, ms: number): Date {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const actualDay = Math.min(targetDay, daysInMonth);
  return new Date(Date.UTC(year, month, actualDay, hours, mins, secs, ms));
}

/**
 * ISO start của chu kỳ 1 tháng hiện tại cho học sinh dựa vào ngày đăng ký (userCreatedAt).
 * Nếu chưa có userCreatedAt, fallback về startOfUtcMonth.
 */
export function startOfStudentCycle(userCreatedAt: string | Date | null | undefined, now: Date = new Date()): string {
  if (!userCreatedAt) return startOfUtcMonth(now);
  const signUp = new Date(userCreatedAt);
  if (isNaN(signUp.getTime())) return startOfUtcMonth(now);

  const targetDay = signUp.getUTCDate();
  const hours = signUp.getUTCHours();
  const mins = signUp.getUTCMinutes();
  const secs = signUp.getUTCSeconds();
  const ms = signUp.getUTCMilliseconds();

  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth();

  const cCurr = createValidCycleDate(curYear, curMonth, targetDay, hours, mins, secs, ms);
  const cNext = createValidCycleDate(curYear, curMonth + 1, targetDay, hours, mins, secs, ms);

  if (now.getTime() >= cNext.getTime()) {
    return cNext.toISOString();
  }
  if (now.getTime() >= cCurr.getTime()) {
    return cCurr.toISOString();
  }

  const cPrev = createValidCycleDate(curYear, curMonth - 1, targetDay, hours, mins, secs, ms);
  return cPrev.toISOString();
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
  | 'grammar_ai'       // AI ngữ pháp: tạo bài tập, phân tích câu, ôn câu sai
  | 'codemix_upgrade'  // AI nâng đoạn VI+EN → full EN (free 1/ngày, pro unlimited)
  | 'pack_reading'     // Gen đoạn đọc pack (free 2/ngày Zhipu, pro Gemini ∞)

export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  ai_lookup: 'free',        // free dùng được nhưng bị quota/ngày
  ai_enrich: 'pro',
  ai_quiz: 'pro',
  ai_sentence: 'pro',
  writing_practice: 'pro',
  grammar_read: 'pro',
  grammar_ai: 'pro',        // gộp từ premium → Pro là gói trả phí duy nhất, có đủ
  codemix_upgrade: 'free',  // free teaser 1/ngày — gate bằng daily quota, không chặn feature flag
  pack_reading: 'free',     // free 2/ngày (chậm), pro nhanh
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

// Removed server-side functions (moved to entitlement-server.ts)
