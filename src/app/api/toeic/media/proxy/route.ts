import { NextRequest } from 'next/server';
import {
  decryptMediaProxyToken,
  isAllowedUpstreamUrl,
} from '@/lib/toeic-media-proxy';

export const dynamic = 'force-dynamic';

/**
 * Guesses standard MIME type from URL file extension as fallback.
 */
function guessContentType(urlStr: string): string {
  try {
    const pathname = new URL(urlStr).pathname.toLowerCase();
    if (pathname.endsWith('.mp3')) return 'audio/mpeg';
    if (pathname.endsWith('.wav')) return 'audio/wav';
    if (pathname.endsWith('.m4a')) return 'audio/mp4';
    if (pathname.endsWith('.ogg')) return 'audio/ogg';
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
    if (pathname.endsWith('.png')) return 'image/png';
    if (pathname.endsWith('.webp')) return 'image/webp';
    if (pathname.endsWith('.gif')) return 'image/gif';
    if (pathname.endsWith('.svg')) return 'image/svg+xml';
  } catch {
    // Ignore URL parse error
  }
  return 'application/octet-stream';
}

async function handleMediaProxy(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('t');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Missing media token' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Decrypt token
  const targetUrl = decryptMediaProxyToken(token);
  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'Invalid or corrupted media token' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // SSRF Protection: validate against upstream whitelist
  if (!isAllowedUpstreamUrl(targetUrl)) {
    return new Response(
      JSON.stringify({ error: 'Target host is not permitted' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Forward Range header if requested by client (essential for audio seeking / HTTP 206)
  const clientRange = request.headers.get('range');
  const upstreamHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  };
  if (clientRange) {
    upstreamHeaders['Range'] = clientRange;
  }

  try {
    // Fetch upstream stream (follow redirects server-side so client never receives 302)
    const upstreamRes = await fetch(targetUrl, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
      redirect: 'follow',
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206 && upstreamRes.status !== 304) {
      return new Response(
        JSON.stringify({
          error: `Upstream resource unavailable (${upstreamRes.status})`,
        }),
        {
          status: upstreamRes.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const responseHeaders = new Headers();

    // Determine Content-Type
    const upstreamContentType = upstreamRes.headers.get('content-type');
    const finalContentType =
      upstreamContentType &&
      upstreamContentType !== 'application/octet-stream' &&
      upstreamContentType !== 'text/plain'
        ? upstreamContentType
        : guessContentType(targetUrl);

    responseHeaders.set('Content-Type', finalContentType);
    responseHeaders.set('Accept-Ranges', 'bytes');

    // Forward Content-Length
    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    // Forward Content-Range if upstream returned 206 Partial Content
    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    // 1-year immutable cache header
    responseHeaders.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );

    // If HEAD request or 304 Not Modified, body must be null
    if (request.method === 'HEAD' || upstreamRes.status === 304) {
      return new Response(null, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    }

    // ZERO 302 redirects: pipe binary stream directly
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to stream media from upstream',
        details: err?.message || 'Network error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleMediaProxy(request);
}

export async function HEAD(request: NextRequest) {
  return handleMediaProxy(request);
}
