import { NextResponse } from 'next/server';
import { verifiedAppSession } from '@/lib/server-auth-session';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const session = await verifiedAppSession(req);
    return NextResponse.json({ session: session?.publicSession ?? null }, {
      status: session ? 200 : 401, headers: PRIVATE_SESSION_HEADERS,
    });
  } catch (error) {
    return sessionErrorResponse(error) ?? NextResponse.json({ error: 'Authentication temporarily unavailable' }, {
      status: 503, headers: PRIVATE_SESSION_HEADERS,
    });
  }
}
