import { NextResponse } from 'next/server';
import { logoutAppSession } from '@/lib/server-auth-session';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';

export async function POST(req: Request) {
  try {
    const setCookie = await logoutAppSession(req);
    return NextResponse.json({ success: true }, { headers: { ...PRIVATE_SESSION_HEADERS, 'Set-Cookie': setCookie } });
  } catch (error) {
    return sessionErrorResponse(error) ?? NextResponse.json({ error: 'Authentication temporarily unavailable' }, {
      status: 503, headers: PRIVATE_SESSION_HEADERS,
    });
  }
}
