import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';

/**
 * Proxy TTS neural miễn phí cho phát âm từ vựng.
 * Cascade:
 *   1) Google Translate TTS (neural, rõ, hỗ trợ cụm từ)
 *   2) Youdao US voice (fallback)
 *
 * Client: GET /api/tts?q=earn%20money
 * Cache CDN 7 ngày — cùng 1 từ không gọi lại nguồn gốc.
 */

export const runtime = 'nodejs';
// Không force-dynamic: CDN Vercel cache GET theo Cache-Control (s-maxage) bên dưới

const MAX_LEN = 180;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchGoogleTts(text: string): Promise<ArrayBuffer | null> {
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' +
    encodeURIComponent(text);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
        Referer: 'https://translate.google.com/',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // GTTS rỗng/HTML lỗi thường < 500 bytes
    if (buf.byteLength < 500) return null;
    return buf;
  } catch {
    return null;
  }
}

async function fetchYoudaoTts(text: string): Promise<ArrayBuffer | null> {
  // type=2 = US English
  const url =
    'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(text);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 400) return null;
    return buf;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json({ error: 'missing q' }, { status: 400 });
  }
  if (q.length > MAX_LEN) {
    return NextResponse.json({ error: 'q too long' }, { status: 400 });
  }

  // Chỉ cho phép chữ/số/dấu câu học tập — chặn URL injection
  if (/https?:|<|>|javascript:/i.test(q)) {
    return NextResponse.json({ error: 'invalid q' }, { status: 400 });
  }

  // Chống cào audio hàng loạt / q ngẫu nhiên đốt egress (route không auth)
  const denied = await assertScrapeQuota(`tts:${getClientIp(req)}`, QUOTA.tts);
  if (denied) return denied;

  const buf = (await fetchGoogleTts(q)) ?? (await fetchYoudaoTts(q));
  if (!buf) {
    return NextResponse.json({ error: 'tts unavailable' }, { status: 502 });
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      // Browser + CDN cache: từ vựng lặp lại không tốn quota
      // CDN + browser: cùng từ không đốt Fluid CPU lại
      'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400, immutable',
      'CDN-Cache-Control': 'public, s-maxage=2592000',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=2592000',
      'X-TTS-Source': 'neural',
    },
  });
}
