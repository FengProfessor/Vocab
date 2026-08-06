import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import net from 'net';
import { getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';

/**
 * Image proxy with open-proxy hardening:
 * - HTTPS only
 * - Block private/metadata IPs (hostname + DNS resolve)
 * - Reject SVG (XSS vector)
 * - Per-IP rate limit + max body size
 * - Follow redirects with re-validation
 */

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_URL_LEN = 2048;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

/** Optional host allowlist via env (comma-separated). Empty = all public HTTPS. */
const HOST_ALLOWLIST = (process.env.IMAGE_PROXY_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const BLOCKED_CONTENT_TYPES = [
  'image/svg+xml',
  'text/html',
  'application/xhtml+xml',
  'text/xml',
  'application/xml',
];

function isPrivateIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 0) return true;

  if (v === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }

  // IPv6
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
  if (lower.startsWith('fe80')) return true; // link-local
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length);
    if (net.isIPv4(mapped)) return isPrivateIp(mapped);
  }
  return false;
}

function isBlockedHostname(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
    return true;
  }
  if (host === '169.254.169.254' || host === 'metadata.google.internal') return true;
  if (host === 'metadata' || host === 'instance-data') return true;
  if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) {
    return true;
  }
  if (/^10\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  return false;
}

function isAllowlistedHost(host: string): boolean {
  if (HOST_ALLOWLIST.length === 0) return true;
  return HOST_ALLOWLIST.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

async function assertSafeImageUrl(urlStr: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (urlStr.length > MAX_URL_LEN) return { ok: false, error: 'URL too long' };
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return { ok: false, error: 'Only HTTPS allowed' };

    const host = u.hostname.toLowerCase();
    if (isBlockedHostname(host)) return { ok: false, error: 'Blocked host' };
    if (!isAllowlistedHost(host)) return { ok: false, error: 'Host not allowlisted' };

    // Reject obvious SVG paths early
    if (u.pathname.toLowerCase().endsWith('.svg')) {
      return { ok: false, error: 'SVG not allowed' };
    }

    // If host is literal IP, check directly
    if (net.isIP(host)) {
      if (isPrivateIp(host)) return { ok: false, error: 'Private IP blocked' };
      return { ok: true };
    }

    // DNS resolve + re-check (DNS rebinding mitigation)
    let records: string[] = [];
    try {
      const result = await dns.lookup(host, { all: true, verbatim: true });
      records = result.map((r) => r.address);
    } catch {
      return { ok: false, error: 'DNS resolve failed' };
    }
    if (records.length === 0) return { ok: false, error: 'DNS empty' };
    for (const addr of records) {
      if (isPrivateIp(addr)) {
        return { ok: false, error: 'Resolved private IP blocked' };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }
}

/** CDN cache lâu — cache HIT không tốn Fluid CPU (chỉ MISS mới fetch upstream). */
export const revalidate = 86400;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  const denied = await assertScrapeQuota(`image-proxy:${ip}`, QUOTA.imageProxy);
  if (denied) return denied;

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });
  }

  // Public CDN: 302 → browser tải thẳng (1 invocation nhẹ thay vì stream body)
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      const h = parsed.hostname.toLowerCase();
      const directHosts = [
        'supabase.co',
        'supabase.in',
        'pixabay.com',
        'pexels.com',
        'images.pexels.com',
        'unsplash.com',
        'images.unsplash.com',
        'cloudinary.com',
        'googleusercontent.com',
        'wikimedia.org',
        'upload.wikimedia.org',
        'r2.dev',
        'pollinations.ai',
      ];
      if (directHosts.some((s) => h === s || h.endsWith(`.${s}`))) {
        return NextResponse.redirect(url, {
          status: 302,
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=604800',
          },
        });
      }
    }
  } catch {
    /* fall through to proxy */
  }

  const safety = await assertSafeImageUrl(url);
  if (!safety.ok) {
    return NextResponse.json({ success: false, error: safety.error }, { status: 400 });
  }

  try {
    let currentUrl = url;
    let response: Response;
    let hop = 0;

    for (;;) {
      response = await fetch(currentUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: new URL(currentUrl).origin,
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'manual',
      });

      if (response.status < 300 || response.status >= 400) break;

      const location = response.headers.get('location');
      if (!location || ++hop > MAX_REDIRECTS) {
        return NextResponse.json({ success: false, error: 'Too many redirects' }, { status: 400 });
      }
      const nextUrl = new URL(location, currentUrl).toString();
      const nextSafe = await assertSafeImageUrl(nextUrl);
      if (!nextSafe.ok) {
        return NextResponse.json({ success: false, error: nextSafe.error }, { status: 400 });
      }
      currentUrl = nextUrl;
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch upstream image: ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'URL does not point to an image' }, { status: 400 });
    }
    if (BLOCKED_CONTENT_TYPES.some((t) => contentType.includes(t))) {
      return NextResponse.json({ success: false, error: 'Blocked content type' }, { status: 400 });
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: 'Image too large' }, { status: 413 });
    }

    // Stream with hard size cap (avoid buffering huge bodies if CL missing)
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ success: false, error: 'Empty body' }, { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_IMAGE_SIZE) {
          reader.cancel().catch(() => undefined);
          return NextResponse.json({ success: false, error: 'Image too large' }, { status: 413 });
        }
        chunks.push(value);
      }
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    // Magic-byte guard: reject HTML/SVG disguised as image/*
    const head = buffer.subarray(0, 256).toString('utf8').toLowerCase();
    if (head.includes('<svg') || head.includes('<!doctype html') || head.includes('<html')) {
      return NextResponse.json({ success: false, error: 'Blocked content payload' }, { status: 400 });
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType.split(';')[0] || 'application/octet-stream');
    headers.set(
      'Cache-Control',
      'public, max-age=604800, s-maxage=31536000, stale-while-revalidate=604800, immutable',
    );
    headers.set('CDN-Cache-Control', 'public, s-maxage=31536000');
    headers.set('Cloudflare-CDN-Cache-Control', 'public, s-maxage=31536000');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(buffer, { status: 200, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[ImageProxy]', msg);
    return NextResponse.json({ success: false, error: 'Error proxying image' }, { status: 500 });
  }
}
