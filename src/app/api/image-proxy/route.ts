import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });

    // Validate URL to prevent abuse (only allow http/https)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            // Mimic a real browser to bypass basic hotlink protections
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': new URL(url).origin,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: `Failed to fetch upstream image: ${response.status}` },
                { status: response.status }
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        // Forward the content type
        headers.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        // Cache heavily locally (1 week) since vocabulary images rarely change
        headers.set('Cache-Control', 'public, max-age=604800, immutable');

        return new NextResponse(buffer, { status: 200, headers });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error('Image proxy error:', msg);
        return NextResponse.json({ success: false, error: 'Error proxying image' }, { status: 500 });
    }
}
