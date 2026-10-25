import { NextResponse } from 'next/server';
import { SessionRequestError, SessionStoreUnavailableError } from '@/lib/server-auth-session';

export const PRIVATE_SESSION_HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Origin' };

/** Preserve session denial/outage semantics for handlers without an outer catch. */
export function withSessionErrors<Args extends unknown[], Result extends Response>(
  handler: (...args: Args) => Promise<Result>,
) {
  return async (...args: Args): Promise<Result | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const response = sessionErrorResponse(error);
      if (response) return response;
      throw error;
    }
  };
}

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
