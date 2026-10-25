/**
 * POST /api/auth/register
 * Public registration giữ nguyên email verification policy của Supabase.
 */
import { NextResponse } from 'next/server';
import { appOrigin, assertAppRequest, cookieHeader, flowCookieName, serverAuthClient } from '@/lib/server-auth-session';
import { createAuthFlow, FLOW_LIFETIME_MS } from '@/lib/server-session-store';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';
import { createServiceClient } from '@/lib/supabase-server';
import { checkRateLimitAsync, getClientIp, rateLimitUnavailableResponse } from '@/lib/api-security';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  email?: string;
  password?: string;
  fullName?: string;
  /** Honeypot — bot điền field ẩn */
  website?: string;
};

export async function POST(req: Request) {
  try {
    assertAppRequest(req);
    const ip = getClientIp(req);
    // 8 đăng ký / IP / phút — chống spam, đủ cho lớp học chung IP
    const rl = await checkRateLimitAsync(`auth-register:${ip}`, 8, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: 'Quá nhiều yêu cầu đăng ký từ mạng này. Chờ 1 phút hoặc dùng Google.',
          code: 'rate_limited',
        },
        { status: 429 },
      );
    }

    const body = (await req.json()) as Body;

    // Honeypot: bot → giả thành công, không tạo user
    if (body.website && String(body.website).trim()) {
      return NextResponse.json({ success: true });
    }

    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const fullName = String(body.fullName ?? '').trim().slice(0, 120);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.', code: 'invalid_email' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu tối thiểu 6 ký tự.', code: 'weak_password' },
        { status: 400 },
      );
    }

    const serverAuth = serverAuthClient();
    const auth = serverAuth.client;
    const emailRedirectTo = new URL('/auth/callback', appOrigin(req)).toString();
    const { data, error } = await auth.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName || email.split('@')[0],
          role: 'student',
        },
      },
    });

    if (error) {
      const msg = error.message || 'Không tạo được tài khoản';
      // Supabase vẫn có thể báo email rate limit nếu project cấu hình gửi mail mời
      if (/rate limit|email rate/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              'Hệ thống gửi email đang quá tải. Dùng «Tiếp tục với Google» hoặc thử lại sau vài phút.',
            code: 'email_rate_limit',
          },
          { status: 429 },
        );
      }
      console.error('[Register] provider rejected registration');
      return NextResponse.json(
        { error: 'Không tạo được tài khoản. Kiểm tra lại email/mật khẩu hoặc thử Google.', code: 'create_failed' },
        { status: 400 },
      );
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Không tạo được user.', code: 'no_user' }, { status: 500 });
    }

    // Fail closed nếu project bị cấu hình auto-confirm ngoài dự kiến.
    if (data.session || data.user.email_confirmed_at) {
      const admin = createServiceClient();
      const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
      if (cleanupError) console.error('[Register] auto-confirm cleanup failed');
      return NextResponse.json(
        { error: 'Đăng ký email tạm thời không khả dụng.', code: 'verification_misconfigured' },
        { status: 503 },
      );
    }

    const verifier = serverAuth.verifier();
    if (!verifier) return NextResponse.json({ error: 'Verification temporarily unavailable' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
    const flow = await createAuthFlow({ verifier, next: '/auth?confirmed=1', kind: 'signup' });
    return NextResponse.json({
      success: true,
      verificationRequired: true,
    }, { headers: { ...PRIVATE_SESSION_HEADERS, 'Set-Cookie': cookieHeader(flowCookieName(), flow, FLOW_LIFETIME_MS / 1000) } });
  } catch (err) {
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    const unavailable = rateLimitUnavailableResponse(err);
    if (unavailable) return unavailable;
    console.error('[Register] unexpected failure');
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi đăng ký. Thử Google hoặc lại sau.', code: 'server_error' },
      { status: 500 },
    );
  }
}
