import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy — Dynamic CORS for API routes in Next.js 16.
 * 
 * Allowed origins:
 *   - Production domain (lingopro.online)
 *   - Vercel preview deployments (*.vercel.app)
 *   - localhost dev (http://localhost:3000)
 *   - Chrome Extension (chrome-extension://*)
 */

const ALLOWED_ORIGINS = [
  'https://lingopro.online',
  'https://www.lingopro.online',
  'http://localhost:3000',
  'http://localhost:3001',
];

/** Extension IDs cho phép (CWS). Env: CHROME_EXTENSION_IDS=id1,id2 — trống = mọi chrome-extension (dev). */
const EXT_ALLOWLIST = (process.env.CHROME_EXTENSION_IDS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deployments
  if (/^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/.test(origin)) return true;
  // Chrome Extension — production nên set CHROME_EXTENSION_IDS
  if (origin.startsWith('chrome-extension://')) {
    if (EXT_ALLOWLIST.length === 0) return true; // dev / chưa cấu hình
    const id = origin.slice('chrome-extension://'.length).split('/')[0]?.toLowerCase() ?? '';
    return EXT_ALLOWLIST.includes(id);
  }
  return false;
}

export function proxy(request: NextRequest) {
  // Only apply CORS logic to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin');
  
  // Preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin!);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }

  // Actual request — set CORS header on response
  const response = NextResponse.next();
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
