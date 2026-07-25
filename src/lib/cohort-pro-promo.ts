/**
 * Flash sale Pro cá nhân sau free live (kết thúc khóa).
 * Không cần mã — UI + createOrder tự áp khi còn hạn.
 * Không import billing (tránh circular: billing → promo).
 */

/** Hết hạn: 21:13 27/7/2026 (VN) — cửa sổ 2 ngày sau B6 */
export const COHORT_PRO_PROMO_ENDS_AT = new Date('2026-07-27T21:13:00+07:00');

/** −38% ≈ giá nhóm 3 ghế (49k/tháng) */
export const COHORT_PRO_PROMO_DISCOUNT_PCT = 38;

export const COHORT_PRO_PROMO_LABEL = 'Giảm 38% · kết thúc khóa';

/** Kỳ default khi promo còn: 3 tháng */
export const COHORT_PRO_PROMO_DEFAULT_MONTHS = 3 as const;

export function isCohortProPromoActive(now: Date = new Date()): boolean {
  return now.getTime() < COHORT_PRO_PROMO_ENDS_AT.getTime();
}

export function getCohortProPromoMsLeft(now: Date = new Date()): number {
  return Math.max(0, COHORT_PRO_PROMO_ENDS_AT.getTime() - now.getTime());
}

/** Áp % promo lên giá đã có kỳ hạn (Pro cá nhân). */
export function applyCohortProPromo(basePrice: number): number {
  return Math.max(
    0,
    Math.round(basePrice * (1 - COHORT_PRO_PROMO_DISCOUNT_PCT / 100)),
  );
}

/** Bảng pitch UI (làm tròn nghìn). */
export const COHORT_PRO_PROMO_TABLE: ReadonlyArray<{
  months: 1 | 3 | 6 | 12;
  label: string;
  list: number;
  sale: number;
  hot?: boolean;
}> = [
  { months: 1, label: '1 tháng', list: 79_000, sale: 49_000 },
  { months: 3, label: '3 tháng', list: 213_000, sale: 132_000, hot: true },
  { months: 6, label: '6 tháng', list: 379_000, sale: 235_000 },
  { months: 12, label: '1 năm', list: 599_000, sale: 372_000 },
];

export function formatCountdown(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
} {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const label =
    days > 0
      ? `${days}n ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return { days, hours, minutes, seconds, label };
}
