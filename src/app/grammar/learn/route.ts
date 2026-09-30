import { NextRequest, NextResponse } from 'next/server';

/**
 * 308 Permanent Redirect handler for legacy `/grammar/learn` route.
 * Redirects to canonical `/grammar` roadmap while preserving all search parameters
 * (e.g., `?topic=verb-to-be`, `?roadmapStep=step_123`, `?replay=1`).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = new URL('/grammar', request.url);

  // Preserve all search query parameters from legacy URL
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return NextResponse.redirect(target, 308);
}
