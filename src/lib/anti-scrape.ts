/**
 * Anti-scrape / anti-dump quotas.
 * Học thật: vài chục request/phút là đủ.
 * Cào: hàng trăm–nghìn/phút → chặn multi-window (burst + giờ + ngày).
 */

import { NextResponse } from 'next/server';
import { checkRateLimitAsync } from '@/lib/api-security';

export interface QuotaWindow {
  /** suffix key: m = minute, h = hour, d = day */
  suffix: string;
  limit: number;
  windowMs: number;
}

/** Profile sẵn: đủ học, chặn dump. */
export const QUOTA = {
  /** Tra từ điển 1 từ (extension/web) */
  dictLookup: [
    { suffix: 'm', limit: 25, windowMs: 60_000 },
    { suffix: 'h', limit: 120, windowMs: 3_600_000 },
    { suffix: 'd', limit: 400, windowMs: 86_400_000 },
  ] as QuotaWindow[],
  /** Gợi ý autocomplete */
  dictSuggest: [
    { suffix: 'm', limit: 40, windowMs: 60_000 },
    { suffix: 'h', limit: 200, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** External dict proxy */
  dictExternal: [
    { suffix: 'm', limit: 20, windowMs: 60_000 },
    { suffix: 'h', limit: 100, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** 1 lesson / 1 topic */
  grammarTopic: [
    { suffix: 'm', limit: 30, windowMs: 60_000 },
    { suffix: 'h', limit: 150, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** Dump ALL lessons — rất siết */
  grammarBulk: [
    { suffix: 'm', limit: 4, windowMs: 60_000 },
    { suffix: 'h', limit: 12, windowMs: 3_600_000 },
    { suffix: 'd', limit: 30, windowMs: 86_400_000 },
  ] as QuotaWindow[],
  /** Image proxy (có thể dùng làm CDN cào) */
  imageProxy: [
    { suffix: 'm', limit: 30, windowMs: 60_000 },
    { suffix: 'h', limit: 200, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** List words paginated (auth) */
  wordsList: [
    { suffix: 'm', limit: 40, windowMs: 60_000 },
    { suffix: 'h', limit: 300, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** Vocab packs / roadmap list */
  contentList: [
    { suffix: 'm', limit: 30, windowMs: 60_000 },
    { suffix: 'h', limit: 150, windowMs: 3_600_000 },
  ] as QuotaWindow[],
} as const;

/**
 * Chạy lần lượt các cửa sổ quota. Trả 429 NextResponse nếu vượt; null = OK.
 */
export async function assertScrapeQuota(
  keyBase: string,
  windows: readonly QuotaWindow[],
): Promise<NextResponse | null> {
  for (const w of windows) {
    const rl = await checkRateLimitAsync(`${keyBase}:${w.suffix}`, w.limit, w.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT',
          message: 'Quá nhiều yêu cầu trong thời gian ngắn. Dừng cào dữ liệu — học chậm lại.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil(rl.resetIn / 1000))),
            'X-RateLimit-Scope': w.suffix,
          },
        },
      );
    }
  }
  return null;
}
