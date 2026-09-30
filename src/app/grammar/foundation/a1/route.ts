import { NextRequest, NextResponse } from 'next/server';

/**
 * 308 Permanent Redirect handler for legacy `/grammar/foundation/a1` route.
 * Redirects to canonical `/grammar?level=A1` roadmap view.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = new URL('/grammar', request.url);
  target.searchParams.set('level', 'A1');

  // Preserve any additional query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'level') {
      target.searchParams.set(key, value);
    }
  });

  return NextResponse.redirect(target, 308);
}
