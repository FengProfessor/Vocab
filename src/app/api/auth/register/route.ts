/**
 * POST /api/auth/register
 * Đăng ký không gửi email confirm (tránh Supabase built-in limit ~2 email/giờ).
 * admin.createUser + email_confirm: true → user đăng nhập password ngay.
 */
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimitAsync, getClientIp } from '@/lib/api-security';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
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
    const role = body.role === 'teacher' ? 'teacher' : 'student';

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.', code: 'invalid_email' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu tối thiểu 6 ký tự.', code: 'weak_password' },
        { status: 400 },
      );
    }

    const admin = createServiceClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // không gửi mail xác nhận → không dính email rate limit
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        role,
      },
    });

    if (error) {
      const msg = error.message || 'Không tạo được tài khoản';
      // Email đã tồn tại
      if (/already|registered|exists|duplicate/i.test(msg)) {
        return NextResponse.json(
          {
            error: 'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng Google.',
            code: 'already_registered',
          },
          { status: 409 },
        );
      }
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

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      // Client tự signInWithPassword ngay sau
    });
  } catch (err) {
    console.error('[Register] unexpected:', err);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi đăng ký. Thử Google hoặc lại sau.', code: 'server_error' },
      { status: 500 },
    );
  }
}
