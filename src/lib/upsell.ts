/**
 * Upsell — lý do pop-up, dismiss keys, ngưỡng (gói hết hạn + giới hạn từ).
 * Client + server đều import được (không window).
 */

import { FREE_WORD_SAVE_MONTHLY_LIMIT } from '@/lib/entitlement';

export type UpsellReason =
  | 'plan_expiring'
  | 'plan_expired'
  | 'word_limit'
  | 'word_near_limit';

export interface UpsellPayload {
  reason: UpsellReason;
  /** Còn bao nhiêu ngày (plan_expiring). */
  daysLeft?: number;
  /** Ngày hết hạn ISO (expired / expiring). */
  expiresAt?: string | null;
  /** Quota từ (word_*). */
  used?: number;
  limit?: number;
  remaining?: number;
  /** Force hiện dù đã dismiss soft (vd. 403 FREE_WORD_LIMIT). */
  force?: boolean;
}

/** Soft near-limit: từ mốc 150/200 (nhiều user đang ~150). */
export const WORD_NEAR_LIMIT_USED = 150;

/** Soft expiring: hiện khi còn ≤ N ngày. */
export const EXPIRING_DAYS_THRESHOLDS = [7, 3, 1] as const;

export const UPSELL_EVENT = 'lingopro:upsell';

export const FREE_WORD_MONTHLY_LIMIT = FREE_WORD_SAVE_MONTHLY_LIMIT;

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** localStorage keys */
export const LS = {
  dismiss: (reason: UpsellReason, suffix: string) => `lp:upsell:dismiss:${reason}:${suffix}`,
  paidUntil: 'lp:upsell:paid_until',
  paidPlan: 'lp:upsell:paid_plan',
  lastNearWordMonth: 'lp:upsell:near_word_month',
} as const;

export function isDismissed(reason: UpsellReason, suffix: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LS.dismiss(reason, suffix)) === '1';
  } catch {
    return false;
  }
}

export function dismissUpsell(reason: UpsellReason, suffix: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS.dismiss(reason, suffix), '1');
  } catch {
    /* ignore */
  }
}

/** Lưu dấu đã từng Pro (để hiện expired sau khi cron xóa expires_at). */
export function rememberPaidState(plan: string, expiresAt: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (plan === 'free' || !expiresAt) return;
  try {
    localStorage.setItem(LS.paidPlan, plan);
    localStorage.setItem(LS.paidUntil, expiresAt);
  } catch {
    /* ignore */
  }
}

export function getRememberedPaidUntil(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LS.paidUntil);
  } catch {
    return null;
  }
}

/** Suffix dismiss theo ngày (soft 1 lần/ngày). */
export function dismissSuffixDaily(): string {
  return dayKey();
}

/** Suffix dismiss theo mốc hết hạn. */
export function dismissSuffixExpiry(expiresAt: string): string {
  return expiresAt.slice(0, 10);
}

/** Suffix dismiss near-limit theo tháng UTC. */
export function dismissSuffixWordMonth(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Chọn reason ưu tiên khi boot (không gồm hard word_limit — cái đó từ API 403).
 * Priority: expired > expiring > word_limit/near
 *
 * wordUsed = tháng UTC (quota). wordLifetime = tổng đã lưu (power user như case 250 từ).
 * Soft near/limit dùng max(tháng, lifetime) để không miss lead học dày.
 */
export function pickBootUpsell(input: {
  effectivePlan: string;
  rawPlan: string | null;
  expiresAt: string | null;
  remainingDays: number | null;
  wordUsed: number | null;
  wordLifetime?: number | null;
  wordLimit: number;
}): UpsellPayload | null {
  const { effectivePlan, expiresAt, remainingDays, wordLimit } = input;
  const monthly = input.wordUsed ?? 0;
  const lifetime = input.wordLifetime ?? monthly;
  // Hiển thị / soft gate: lấy mốc cao hơn (Lan: monthly=250)
  const signal = Math.max(monthly, lifetime);

  // A) Đã hết hạn: effective free + nhớ paid_until đã qua
  if (effectivePlan === 'free') {
    const remembered = getRememberedPaidUntil();
    if (remembered) {
      const end = new Date(remembered).getTime();
      if (Number.isFinite(end) && end <= Date.now()) {
        const suffix = dismissSuffixExpiry(remembered);
        if (!isDismissed('plan_expired', suffix)) {
          return {
            reason: 'plan_expired',
            expiresAt: remembered,
          };
        }
      }
    }
    // raw còn paid nhưng getEffectivePlan đã free (chưa cron)
    if (input.rawPlan && input.rawPlan !== 'free' && expiresAt) {
      const end = new Date(expiresAt).getTime();
      if (Number.isFinite(end) && end <= Date.now()) {
        const suffix = dismissSuffixExpiry(expiresAt);
        if (!isDismissed('plan_expired', suffix)) {
          return { reason: 'plan_expired', expiresAt };
        }
      }
    }
  }

  // B) Sắp hết hạn
  if (effectivePlan !== 'free' && remainingDays != null && remainingDays > 0 && remainingDays <= 7) {
    const suffix = dismissSuffixDaily();
    if (!isDismissed('plan_expiring', suffix)) {
      return {
        reason: 'plan_expiring',
        daysLeft: remainingDays,
        expiresAt,
      };
    }
  }

  // C) Word limit / near — Free only
  if (effectivePlan === 'free' && signal >= WORD_NEAR_LIMIT_USED) {
    const suffix = dismissSuffixWordMonth();
    const monthlyRemaining = Math.max(0, wordLimit - monthly);
    // Đã ≥200 tháng hoặc lifetime (power user quá trần)
    const overCap = monthly >= wordLimit || lifetime >= wordLimit;
    if (overCap) {
      if (!isDismissed('word_limit', suffix)) {
        return {
          reason: 'word_limit',
          used: Math.max(monthly, lifetime),
          limit: wordLimit,
          remaining: monthlyRemaining,
        };
      }
    } else if (!isDismissed('word_near_limit', suffix)) {
      return {
        reason: 'word_near_limit',
        used: Math.max(monthly, lifetime),
        limit: wordLimit,
        remaining: monthlyRemaining,
      };
    }
  }

  return null;
}

/** Dispatch event mở modal (từ bất kỳ client component). */
export function requestUpsell(payload: UpsellPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(UPSELL_EVENT, { detail: payload }));
}

/** Helper: response JSON từ POST /api/words có phải FREE_WORD_LIMIT không. */
export function isFreeWordLimitError(json: unknown): json is {
  error: string;
  used?: number;
  limit?: number;
  remaining?: number;
} {
  return (
    typeof json === 'object' &&
    json !== null &&
    'error' in json &&
    (json as { error: string }).error === 'FREE_WORD_LIMIT'
  );
}

export function upsellFromWordLimitError(json: {
  used?: number;
  limit?: number;
  remaining?: number;
}): UpsellPayload {
  return {
    reason: 'word_limit',
    used: json.used ?? FREE_WORD_MONTHLY_LIMIT,
    limit: json.limit ?? FREE_WORD_MONTHLY_LIMIT,
    remaining: json.remaining ?? 0,
    force: true,
  };
}
