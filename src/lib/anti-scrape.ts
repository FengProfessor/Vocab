/**
 * Anti-scrape / anti-dump quotas.
 * Học thật: vài chục request/phút là đủ.
 * Cào: hàng trăm–nghìn/phút → chặn multi-window (burst + giờ + ngày).
 * Đã nâng ngưỡng burst hợp lý để 10–30 học sinh cùng chung 1 IP Wi-Fi lớp học/trung tâm không bị đụng 429.
 */

import { NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitUnavailableResponse } from '@/lib/api-security';

export interface QuotaWindow {
  /** suffix key: m = minute, h = hour, d = day */
  suffix: string;
  limit: number;
  windowMs: number;
}

/** Profile sẵn: đủ học cho cả lớp chung Wi-Fi, chặn dump. */
export const QUOTA = {
  /** Tra từ điển 1 từ (extension/web) */
  dictLookup: [
    { suffix: 'm', limit: 120, windowMs: 60_000 },
    { suffix: 'h', limit: 1000, windowMs: 3_600_000 },
    { suffix: 'd', limit: 3500, windowMs: 86_400_000 },
  ] as QuotaWindow[],
  /** Gợi ý autocomplete */
  dictSuggest: [
    { suffix: 'm', limit: 150, windowMs: 60_000 },
    { suffix: 'h', limit: 1200, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** External dict proxy */
  dictExternal: [
    { suffix: 'm', limit: 80, windowMs: 60_000 },
    { suffix: 'h', limit: 600, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** 1 lesson / 1 topic */
  grammarTopic: [
    { suffix: 'm', limit: 100, windowMs: 60_000 },
    { suffix: 'h', limit: 600, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** Dump ALL lessons — rất siết */
  grammarBulk: [
    { suffix: 'm', limit: 10, windowMs: 60_000 },
    { suffix: 'h', limit: 30, windowMs: 3_600_000 },
    { suffix: 'd', limit: 80, windowMs: 86_400_000 },
  ] as QuotaWindow[],
  /** Image proxy (đủ cho 10–30 HS cùng Wi-Fi mở flashcard có ảnh cùng lúc) */
  imageProxy: [
    { suffix: 'm', limit: 180, windowMs: 60_000 },
    { suffix: 'h', limit: 1800, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /**
   * TTS phát âm (proxy Google/Youdao). Học: nghe lại nhiều lần/1 buổi ổn.
   * Cào audio hàng loạt / q ngẫu nhiên đốt egress → chặn burst + giờ.
   */
  tts: [
    { suffix: 'm', limit: 240, windowMs: 60_000 },
    { suffix: 'h', limit: 2400, windowMs: 3_600_000 },
    { suffix: 'd', limit: 8000, windowMs: 86_400_000 },
  ] as QuotaWindow[],
  /** List words paginated (auth) */
  wordsList: [
    { suffix: 'm', limit: 120, windowMs: 60_000 },
    { suffix: 'h', limit: 1200, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /** Vocab packs / roadmap list */
  contentList: [
    { suffix: 'm', limit: 120, windowMs: 60_000 },
    { suffix: 'h', limit: 1000, windowMs: 3_600_000 },
  ] as QuotaWindow[],
  /**
   * Xuất PDF thư viện (POST /api/library/gloss).
   * Học: 1–3 PDF/giờ ổn. Cào: bấm tải liên tục / batch script → 429.
   */
  pdfGloss: [
    { suffix: 'm', limit: 6, windowMs: 60_000 },
    { suffix: 'h', limit: 24, windowMs: 3_600_000 },
    { suffix: 'd', limit: 80, windowMs: 86_400_000 },
  ] as QuotaWindow[],
} as const;

/**
 * Chạy song song các cửa sổ quota (Promise.all giảm 2-3x độ trễ mạng).
 * Trả 429 NextResponse nếu vượt; null = OK.
 */
export async function assertScrapeQuota(
  keyBase: string,
  windows: readonly QuotaWindow[],
): Promise<NextResponse | null> {
  // If Redis is not configured in non-production environments (e.g. dev/test), allow request
  if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV !== 'production') {
    return null;
  }

  try {
    const results = await Promise.all(
      windows.map(async (w) => ({
        w,
        rl: await checkRateLimitAsync(`${keyBase}:${w.suffix}`, w.limit, w.windowMs),
      })),
    );

    for (const { w, rl } of results) {
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
  } catch (err: unknown) {
    const unavailable = rateLimitUnavailableResponse(err);
    if (unavailable) return unavailable;
    throw err;
  }
}
