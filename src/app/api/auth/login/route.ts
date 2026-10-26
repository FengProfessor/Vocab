import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { assertAppRequest, createVerifiedAppSession, serverAuthClient } from '@/lib/server-auth-session';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';
import { checkRateLimitAsync, getClientIp, rateLimitUnavailableResponse } from '@/lib/api-security';

export async function POST(req: Request) {
  try {
    assertAppRequest(req);
    const ipDigest = createHash('sha256').update(getClientIp(req)).digest('base64url');
    const limit = await checkRateLimitAsync(`auth-login:${ipDigest}`, 360, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Thử lại sau một phút.' }, {
      status: 429, headers: PRIVATE_SESSION_HEADERS,
    });
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body) ||
        typeof body.email !== 'string' || typeof body.password !== 'string' ||
        body.email.length > 254 || body.password.length > 1024) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không hợp lệ.' }, { status: 400, headers: PRIVATE_SESSION_HEADERS });
    }
    const normalizedEmail = body.email.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không hợp lệ.' }, { status: 400, headers: PRIVATE_SESSION_HEADERS });
    }
    const emailDigest = createHash('sha256').update(normalizedEmail).digest('base64url');
    const accountLimit = await checkRateLimitAsync(`auth-login-acct:${emailDigest}`, 10, 60_000);
    if (!accountLimit.allowed) return NextResponse.json({ error: 'Thử lại sau một phút.' }, {
      status: 429, headers: PRIVATE_SESSION_HEADERS,
    });
    const { data, error } = await serverAuthClient().client.auth.signInWithPassword({
      email: body.email.trim(), password: body.password,
    });
    if (error || !data.session) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng, hoặc email chưa xác minh.' }, {
        status: error?.status && error.status >= 500 ? 503 : 401, headers: PRIVATE_SESSION_HEADERS,
      });
    }
    const session = await createVerifiedAppSession(req, data.session);
    return NextResponse.json({ session: session.publicSession }, {
      headers: { ...PRIVATE_SESSION_HEADERS, 'Set-Cookie': session.setCookie },
    });
  } catch (error) {
    return sessionErrorResponse(error) ?? rateLimitUnavailableResponse(error) ??
      NextResponse.json({ error: 'Authentication temporarily unavailable' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
  }
}
