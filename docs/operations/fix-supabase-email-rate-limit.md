# Fix: `email rate limit exceeded` (Supabase Auth)

## Nguyên nhân

Supabase **email built-in** (không custom SMTP) chỉ cho khoảng **2 email Auth / giờ / cả project** (signup confirm, recover, đổi email…).

Nhiều học sinh đăng ký email cùng lúc → lỗi `email rate limit exceeded`.

`signInWithPassword` **không** gửi mail — lỗi thường dính lúc **đăng ký** hoặc reset mật khẩu.

## Fix trong app (đã làm)

- `POST /api/auth/register` dùng `auth.admin.createUser` + `email_confirm: true` → **không gửi mail confirm**, user đăng nhập ngay.
- Form `/auth` đăng ký gọi API này thay vì `supabase.auth.signUp`.
- Message lỗi tiếng Việt + gợi ý dùng Google khi vẫn dính limit.

## Fix hạ tầng (nên làm — password reset / mail sau này)

Bật **Custom SMTP** (Resend) trong Supabase:

1. Dashboard → **Project Settings → Authentication → SMTP Settings**
2. Bật custom SMTP, ví dụ Resend:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) hoặc `587`
   - User: `resend`
   - Pass: `RESEND_API_KEY`
   - Sender: domain đã verify (vd `LingoPro <noreply@lingopro.online>`)
3. Sau khi custom SMTP: tăng **Auth → Rate Limits → rate_limit_email_sent** (chỉ chỉnh được khi đã SMTP).

## Checklist vận hành peak

- [ ] Custom SMTP Resend (domain verify)
- [ ] Tăng `rate_limit_email_sent` (vd 100–300/h tùy gói)
- [ ] Khuyến khích Google login trên form (đã có nút)
- [ ] Upstash Redis rate limit cho `/api/auth/register` (multi-instance)
