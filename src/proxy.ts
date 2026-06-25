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

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deployments
  if (/^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/.test(origin)) return true;
  // Chrome Extension
  if (origin.startsWith('chrome-extension://')) return true;
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
