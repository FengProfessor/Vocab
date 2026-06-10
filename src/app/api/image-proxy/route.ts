import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate URL to prevent SSRF attacks.
 * Blocks: private IPs, localhost, cloud metadata, non-HTTPS, too-long URLs.
 */
function isAllowedImageUrl(urlStr: string): boolean {
    try {
        if (urlStr.length > 2048) return false;
        const u = new URL(urlStr);
        // Only allow HTTPS
        if (u.protocol !== 'https:') return false;
        const host = u.hostname.toLowerCase();
        // Block localhost variants
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return false;
        // Block private/reserved IP ranges
        if (/^10\./.test(host)) return false;
        if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
        if (/^192\.168\./.test(host)) return false;
        if (host === '169.254.169.254') return false; // AWS/GCP metadata
        if (host === 'metadata.google.internal') return false; // GCP metadata
        // Block internal/local hostnames
        if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) return false;
        // Block common cloud metadata hostnames
        if (host === 'metadata' || host === 'instance-data') return false;
        return true;
    } catch {
        return false;
    }
}

/** Maximum response body size (10 MB) to prevent memory abuse */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export async function GET(req: NextRequest): Promise<NextResponse> {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });

    // SSRF protection
    if (!isAllowedImageUrl(url)) {
        return NextResponse.json({ success: false, error: 'Invalid or blocked URL' }, { status: 400 });
    }

    try {
        // redirect: 'manual' + tự kiểm tra Location từng hop — chặn SSRF qua redirect
        // (https hợp lệ → 302 → http://169.254.169.254 sẽ bị isAllowedImageUrl chặn)
        let currentUrl = url;
        let response: Response;
        const MAX_REDIRECTS = 3;
        let hop = 0;
        for (;;) {
            response = await fetch(currentUrl, {
                // Mimic a real browser to bypass basic hotlink protections
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Referer': new URL(currentUrl).origin,
                },
                signal: AbortSignal.timeout(10000), // 10s timeout
                redirect: 'manual',
            });

            if (response.status < 300 || response.status >= 400) break;

            const location = response.headers.get('location');
            if (!location || ++hop > MAX_REDIRECTS) {
                return NextResponse.json({ success: false, error: 'Too many redirects' }, { status: 400 });
            }
            const nextUrl = new URL(location, currentUrl).toString();
            if (!isAllowedImageUrl(nextUrl)) {
                return NextResponse.json({ success: false, error: 'Invalid or blocked URL' }, { status: 400 });
            }
            currentUrl = nextUrl;
        }

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: `Failed to fetch upstream image: ${response.status}` },
                { status: response.status }
            );
        }

        // Verify content-type is actually an image
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            return NextResponse.json({ success: false, error: 'URL does not point to an image' }, { status: 400 });
        }

        // Check content-length if available
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        if (contentLength > MAX_IMAGE_SIZE) {
            return NextResponse.json({ success: false, error: 'Image too large' }, { status: 413 });
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
            return NextResponse.json({ success: false, error: 'Image too large' }, { status: 413 });
        }
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        // Cache heavily locally (1 week) since vocabulary images rarely change
        headers.set('Cache-Control', 'public, max-age=604800, immutable');

        return new NextResponse(buffer, { status: 200, headers });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error('Image proxy error:', msg);
        return NextResponse.json({ success: false, error: 'Error proxying image' }, { status: 500 });
    }
}
