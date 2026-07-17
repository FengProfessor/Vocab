import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getClientIp } from '@/lib/api-security';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';

/**
 * GET /api/dictionary/lookup?word=X
 *
 * Tra global_dictionary — Extension / Desktop.
 * - Multi-window RL (phút/giờ/ngày) chống cào dump
 * - ttl-cache 60s/instance (thundering herd cùng word)
 * - CDN SWR ngắn
 */

type CachedPayload = {
  status: number;
  body: Record<string, unknown>;
};

const CACHE_TTL_MS = 60_000;
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
} as const;

/** Cặp vai trò hay bị gán nhầm "trái nghĩa" (teach↔learn ≠ hot↔cold). */
const ROLE_CONVERSE: Record<string, string[]> = {
  teach: ['learn', 'study', 'learning'],
  teaches: ['learn', 'study', 'learning'],
  teaching: ['learn', 'study', 'learning'],
  learn: ['teach', 'teaching'],
  learning: ['teach', 'teaching'],
  study: ['teach', 'teaching'],
  buy: ['sell'],
  sell: ['buy'],
  lend: ['borrow'],
  borrow: ['lend'],
  give: ['take', 'receive'],
  take: ['give'],
  win: ['lose'],
  lose: ['win'],
};

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

/** Bỏ ant trùng syn + cặp converse + biến thể lemma. */
function sanitizeSynAntPayload(
  lemma: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const w = lemma.toLowerCase();
  const variants = new Set<string>([w]);
  if (w.endsWith('s') && w.length > 3) variants.add(w.slice(0, -1));
  else variants.add(`${w}s`);
  if (w.endsWith('ing') && w.length > 4) variants.add(w.slice(0, -3));
  if (w.endsWith('ed') && w.length > 3) variants.add(w.slice(0, -2));

  const blockAnt = new Set((ROLE_CONVERSE[w] || []).map((x) => x.toLowerCase()));
  for (const v of variants) {
    for (const x of ROLE_CONVERSE[v] || []) blockAnt.add(x.toLowerCase());
  }

  const clean = (list: string[], kind: 'syn' | 'ant'): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of list) {
      const item = raw.trim().toLowerCase();
      if (!item || !/^[a-z][a-z'-]{1,24}$/.test(item)) continue;
      if (variants.has(item) || seen.has(item)) continue;
      if (kind === 'ant' && blockAnt.has(item)) continue;
      seen.add(item);
      out.push(item);
      if (out.length >= 8) break;
    }
    return out;
  };

  let synonyms = clean(asStringList(payload.synonyms), 'syn');
  let antonyms = clean(asStringList(payload.antonyms), 'ant');
  const synSet = new Set(synonyms);
  antonyms = antonyms.filter((a) => !synSet.has(a));

  return {
    ...payload,
    ...(synonyms.length ? { synonyms } : { synonyms: [] }),
    ...(antonyms.length ? { antonyms } : { antonyms: [] }),
  };
}

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
  const denied = await assertScrapeQuota(`dict-lookup:${ip}`, QUOTA.dictLookup);
  if (denied) return denied;

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

    const raw = (data.data || {}) as Record<string, unknown>;
    const cleaned = sanitizeSynAntPayload(word, raw);
    const body: Record<string, unknown> = {
      success: true,
      source: 'global_dictionary',
      tags: data.tags || [],
      image_url: data.image_url || null,
      image_source: data.image_source || 'none',
      ...cleaned,
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
