import { NextResponse } from 'next/server';
import { appOrigin, assertAppRequest, cookieHeader, flowCookieName, serverAuthClient } from '@/lib/server-auth-session';
import { createAuthFlow, FLOW_LIFETIME_MS, SessionStoreUnavailableError } from '@/lib/server-session-store';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';
import { checkRateLimitAsync, getClientIp, rateLimitUnavailableResponse } from '@/lib/api-security';

export async function POST(req: Request) {
  try {
    assertAppRequest(req);
    const limit = await checkRateLimitAsync(`auth-oauth:${getClientIp(req)}`, 20);
    if (!limit.allowed) return NextResponse.json({ error: 'Thử lại sau một phút.' }, { status: 429, headers: PRIVATE_SESSION_HEADERS });
    const auth = serverAuthClient();
    const { data, error } = await auth.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${appOrigin(req)}/auth/callback`, skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' } },
    });
    const verifier = auth.verifier();
    if (error || !data.url || !verifier) throw new SessionStoreUnavailableError();
    const id = await createAuthFlow({ verifier, next: '/auth/complete', kind: 'oauth' });
    return NextResponse.json({ url: data.url }, { headers: { ...PRIVATE_SESSION_HEADERS,
      'Set-Cookie': cookieHeader(flowCookieName(), id, FLOW_LIFETIME_MS / 1000) } });
  } catch (error) {
    return sessionErrorResponse(error) ?? rateLimitUnavailableResponse(error) ??
      NextResponse.json({ error: 'Không mở được Google đăng nhập.' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
  }
}
