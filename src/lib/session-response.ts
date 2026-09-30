import { NextResponse } from 'next/server';
import { SessionRequestError, SessionStoreUnavailableError } from '@/lib/server-auth-session';

export const PRIVATE_SESSION_HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Origin' };

export function sessionErrorResponse(error: unknown): NextResponse<{ success: false; error: string }> | null {
  if (error instanceof SessionRequestError) {
    return NextResponse.json({ success: false as const, error: error.message }, {
      status: error.status, headers: PRIVATE_SESSION_HEADERS,
    });
  }
  if (error instanceof SessionStoreUnavailableError) {
    return NextResponse.json({ success: false as const, error: 'Authentication temporarily unavailable' }, {
      status: 503, headers: PRIVATE_SESSION_HEADERS,
    });
  }
  return null;
}
