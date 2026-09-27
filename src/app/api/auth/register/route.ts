/**
 * POST /api/auth/register
 * Public registration giữ nguyên email verification policy của Supabase.
 */
import { NextResponse } from 'next/server';
import { createPublicAuthClient, createServiceClient } from '@/lib/supabase';
import { checkRateLimitAsync, getClientIp } from '@/lib/api-security';

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

    const auth = createPublicAuthClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lingopro.online';
    const emailRedirectTo = new URL('/auth', appUrl).toString();
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
      console.error('[Register]', msg);
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

    return NextResponse.json({
      success: true,
      verificationRequired: true,
    });
  } catch (err) {
    console.error('[Register] unexpected:', err);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi đăng ký. Thử Google hoặc lại sau.', code: 'server_error' },
      { status: 500 },
    );
  }
}
