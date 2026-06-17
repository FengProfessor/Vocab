import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/api-security';

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

  // Rate limit theo IP: 30 req / 60s
  const ip = getClientIp(req);
  const rl = checkRateLimit(`ext:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) },
      }
    );
  }

  try {
    const word = encodeURIComponent(raw);

    // Gọi dict.minhqnd.com với timeout 6s (AbortController pattern)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let extData: Record<string, unknown>;
    try {
      const res = await fetch(
        `https://dict.minhqnd.com/api/v1/lookup?word=${word}&lang=en&def_lang=vi`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }

      extData = (await res.json()) as Record<string, unknown>;
    } catch {
      clearTimeout(timeoutId);
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Kiểm tra kết quả hợp lệ: exists=true và có ít nhất 1 meaning
    const results = extData?.results as Array<{ meanings?: unknown[] }> | undefined;
    if (!extData?.exists || !results?.[0]?.meanings?.length) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Cache ngược: fire-and-forget — chỉ ghi khi chưa có (ignoreDuplicates: không đè bot cào)
    void (async () => {
      try {
        const supabase = createServiceClient();
        const { error } = await supabase
          .from('global_dictionary')
          .upsert(
            { word: raw, data: extData, tags: ['minhqnd'] },
            { onConflict: 'word', ignoreDuplicates: true }
          );
        if (error) console.error('[ext-proxy] Cache upsert error:', error.message);
      } catch (e) {
        console.error('[ext-proxy] Cache upsert exception:', e);
      }
    })();

    // Trả về spread nguyên body dict.minhqnd kèm meta source
    return NextResponse.json({
      success: true,
      source: 'external',
      ...extData,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ext-proxy] Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
