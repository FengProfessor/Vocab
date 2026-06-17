/**
 * Gửi email qua Resend (HTTP API thuần — không cần SDK).
 * Key sống ở env `RESEND_API_KEY` (NEVER hardcode). Thiếu key → trả lỗi rõ, KHÔNG throw.
 *
 * ⚠️ Resend chưa verify domain: `from` = onboarding@resend.dev CHỈ gửi được tới email
 * chủ tài khoản. Muốn gửi mọi học sinh phải verify domain rồi đổi FROM + set env.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Đổi sang 'LingoPro <noreply@your-domain>' sau khi verify domain trên Resend.
const FROM = process.env.RESEND_FROM || 'LingoPro <onboarding@resend.dev>';

export type SendEmailResult = { id?: string; error?: string };

export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: 'RESEND_API_KEY missing' };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { id?: string; message?: string; name?: string };
    if (!res.ok) return { error: data.message || data.name || `HTTP ${res.status}` };
    return { id: data.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'unknown' };
  }
}

/** Template nhắc ôn tập — logo PNG tuyệt đối (email client không load webp/relative). */
export function dueReminderHtml(name: string, dueCount: number, appUrl = 'https://vocab-taupe.vercel.app'): string {
  const firstName = (name || 'bạn').split(' ').pop();
  return `<!DOCTYPE html><html lang="vi"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px;text-align:center">
          <img src="${appUrl}/icons/logo-mail.png" width="56" height="56" alt="LingoPro" style="border-radius:12px;display:inline-block">
          <div style="color:#fff;font-size:20px;font-weight:800;margin-top:10px">LingoPro</div>
        </td></tr>
        <tr><td style="padding:28px">
          <div style="font-size:18px;font-weight:800;color:#0f172a">${firstName} ơi, ${dueCount} từ đang chờ ôn tập 🧠</div>
          <div style="font-size:14px;color:#475569;margin-top:8px;line-height:1.6">
            Bạn có <b>${dueCount} từ</b> đến hạn ôn hôm nay. Ôn ngay để khỏi quên và giữ streak nhé!
          </div>
          <a href="${appUrl}/flashcard" style="display:inline-block;margin-top:20px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 28px;border-radius:12px">Ôn tập ngay →</a>
          <div style="font-size:12px;color:#94a3b8;margin-top:24px;line-height:1.6">
            Không nhận được thông báo đẩy? Mở app → bấm <b>“Bật nhắc ôn tập”</b> để kết nối lại thiết bị.
          </div>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;font-size:11px;color:#cbd5e1;text-align:center">
          LingoPro — học từ vựng tiếng Anh bằng AI + Spaced Repetition
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
