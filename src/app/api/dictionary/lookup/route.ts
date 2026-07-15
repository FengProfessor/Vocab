import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimitAsync, getClientIp } from '@/lib/api-security';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';

/**
 * GET /api/dictionary/lookup?word=X
 *
 * Tra global_dictionary — Extension / Desktop.
 * - Rate limit IP (spam double-click)
 * - ttl-cache 60s/instance (thundering herd cùng word)
 * - CDN SWR ngắn (5 phút) — backfill có thể cập nhật synonym/family
 */

type CachedPayload = {
  status: number;
  body: Record<string, unknown>;
};

const CACHE_TTL_MS = 60_000;
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
} as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = (searchParams.get('word') || '').trim().toLowerCase();

  if (!word) {
    return NextResponse.json({ success: false, error: 'word is required' }, { status: 400 });
  }
  if (word.length > 100) {
    return NextResponse.json(
      { success: false, error: 'word must not exceed 100 characters' },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimitAsync(`dict-lookup:${ip}`, 90, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) },
      },
    );
  }

  const cacheKey = `dict-lookup:${word}`;
  const cached = cacheGet<CachedPayload>(cacheKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT' },
    });
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, data, tags, image_url, image_source')
      .eq('word', word)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.data) {
      const body = { success: false, error: 'Not found' };
      // 404 cache ngắn hơn — từ mới backfill có thể xuất hiện
      cacheSet(cacheKey, { status: 404, body }, 15_000);
      return NextResponse.json(body, {
        status: 404,
        headers: { 'X-Lookup-Cache': 'MISS' },
      });
    }

    const body: Record<string, unknown> = {
      success: true,
      source: 'global_dictionary',
      tags: data.tags || [],
      image_url: data.image_url || null,
      image_source: data.image_source || 'none',
      ...(data.data as Record<string, unknown>),
    };
    cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);

    return NextResponse.json(body, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'MISS' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Dictionary Lookup] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
