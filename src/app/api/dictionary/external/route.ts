import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';
import {
  buildExternalLookupPayload,
  fetchExternalDict,
  upsertExternalToGlobalDict,
} from '@/lib/external-dict';

const CACHE_TTL_MS = 24 * 3600 * 1000; // 24h
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
} as const;

/**
 * GET /api/dictionary/external?word=X
 *
 * Proxy server-side cho dict.minhqnd.com — tránh CORS khi web app gọi trực tiếp.
 * Cache ngược vào global_dictionary nếu chưa có (ignoreDuplicates — không đè bot cào).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get('word') || '').trim().toLowerCase();

  // Validate đầu vào
  if (!raw) {
    return NextResponse.json({ success: false, error: 'word is required' }, { status: 400 });
  }
  if (raw.length > 100) {
    return NextResponse.json(
      { success: false, error: 'word must not exceed 100 characters' },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const denied = await assertScrapeQuota(`ext:${ip}`, QUOTA.dictExternal);
  if (denied) return denied;

  const cacheKey = `ext-lookup:${raw}`;
  const cached = cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT' },
    });
  }

  try {
    const extData = await fetchExternalDict(raw, 2500);
    if (!extData) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    upsertExternalToGlobalDict(raw, extData);

    const payload = buildExternalLookupPayload(raw, raw, extData);
    cacheSet(cacheKey, payload, CACHE_TTL_MS);

    // Trả về spread nguyên body dict.minhqnd kèm meta source & Cache-Control
    return NextResponse.json(payload, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'MISS' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ext-proxy] Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
