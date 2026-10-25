import { NextResponse } from 'next/server';
import { appOrigin, cookieHeader, createVerifiedAppSession, flowCookieName,
  requestCookie, serverAuthClient } from '@/lib/server-auth-session';
import { consumeAuthFlow } from '@/lib/server-session-store';
import { safeInternalRedirect } from '@/lib/internal-redirect';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const origin = appOrigin(req);
    const url = new URL(req.url);
    const id = requestCookie(req, flowCookieName());
    const code = url.searchParams.get('code');
    const fail = () => NextResponse.redirect(new URL('/auth?error=oauth_relogin', origin), {
      status: 303, headers: { ...PRIVATE_SESSION_HEADERS, 'Set-Cookie': cookieHeader(flowCookieName(), '', 0) },
    });
    if (!id || !code || code.length > 2048 || url.searchParams.has('error') || req.headers.has('authorization')) return fail();
    const flow = await consumeAuthFlow(id);
    if (!flow) return fail();
    const { data, error } = await serverAuthClient(flow.verifier).client.auth.exchangeCodeForSession(code);
    if (error || !data.session?.user.email_confirmed_at) return fail();
    if (flow.kind === 'signup') {
      // Confirmation verifies email only; registration never creates an application login.
      await createServiceClient().auth.admin.signOut(data.session.access_token, 'local');
      return NextResponse.redirect(new URL('/auth?confirmed=1', origin), {
        status: 303, headers: { ...PRIVATE_SESSION_HEADERS, 'Set-Cookie': cookieHeader(flowCookieName(), '', 0) },
      });
    }
    const session = await createVerifiedAppSession(req, data.session);
    const response = NextResponse.redirect(new URL(safeInternalRedirect(flow.next, '/auth/complete'), origin), {
      status: 303, headers: PRIVATE_SESSION_HEADERS,
    });
    response.headers.append('Set-Cookie', session.setCookie);
    response.headers.append('Set-Cookie', cookieHeader(flowCookieName(), '', 0));
    return response;
  } catch (error) {
    return sessionErrorResponse(error) ?? NextResponse.json({ error: 'Authentication temporarily unavailable' }, {
      status: 503, headers: PRIVATE_SESSION_HEADERS,
    });
  }
}
