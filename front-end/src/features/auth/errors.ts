import { ApiResponse } from '@/types/api/ApiResponse';

/**
 * Translates raw identity provider or validation error strings into user-facing Vietnamese messages.
 */
export function formatRawMessage(raw: string): string {
  if (!raw) {
    return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }

  const lower = raw.toLowerCase();
  if (lower.includes('email rate limit') || (lower.includes('rate limit') && lower.includes('email'))) {
    return 'Hệ thống email đang quá tải (nhiều người đăng ký cùng lúc). Dùng «Tiếp tục với Google» hoặc thử lại sau 10–30 phút.';
  }
  if (
    lower.includes('invalid login') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Sai email hoặc mật khẩu.';
  }
  if (lower.includes('not confirmed')) {
    return 'Email chưa xác nhận. Hãy mở email xác nhận hoặc dùng Google.';
  }
  if (
    lower.includes('user already') ||
    lower.includes('already registered') ||
    lower.includes('already exists') ||
    lower.includes('unable to register')
  ) {
    return 'Email đã có tài khoản — hãy đăng nhập.';
  }
  if (lower.includes('too many requests') || lower.includes('429')) {
    return 'Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.';
  }
  if (lower.includes('rejected by the identity provider') || lower.includes('rejected by supabase')) {
    return 'Đăng nhập bị từ chối. Kiểm tra lại email/mật khẩu hoặc thử lại sau.';
  }
  if (lower.includes('email address format')) {
    return 'Email không hợp lệ.';
  }
  if (lower.includes('at least 6')) {
    return 'Mật khẩu tối thiểu 6 ký tự.';
  }
  if (lower.includes('full name')) {
    return 'Vui lòng nhập họ tên (tối đa 100 ký tự).';
  }
  if (lower.includes('recovery session may have expired') || lower.includes('password reset failed')) {
    return 'Liên kết không hợp lệ, đã dùng hoặc hết hạn. Vui lòng yêu cầu liên kết mới.';
  }

  return raw;
}

/**
 * Turns an API or network failure into a friendly Vietnamese message.
 */
export function describeError(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: ApiResponse<unknown> } })?.response;
  if (!response) {
    if (error instanceof Error && error.message) {
      return formatRawMessage(error.message);
    }
    return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  }

  const body = response.data;
  const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
  const raw = firstFieldError ?? body?.message ?? '';

  if (response.status === 429) {
    return 'Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.';
  }

  return formatRawMessage(raw);
}

/**
 * Maps OAuth callback query error codes (`?error=...&error_description=...`) to Vietnamese messages.
 */
export function describeOAuthQueryError(error: string | null, errorDescription?: string | null): string {
  if (!error) {
    return '';
  }
  const desc = (errorDescription ?? '').toLowerCase();
  if (error.toLowerCase() === 'disallowed_useragent' || desc.includes('disallowed_useragent')) {
    return 'Google chặn đăng nhập trong Zalo/Facebook/WebView. Mở Chrome hoặc Safari rồi vào lingopro.online/auth';
  }
  if (error.toLowerCase() === 'oauth_relogin') {
    return 'Phiên xác minh đã hết hạn hoặc mở trên thiết bị khác. Đăng nhập lại bằng email hoặc Google.';
  }
  if (error.toLowerCase() === 'oauth' || error.toLowerCase() === 'oauth_no_session') {
    return 'Đăng nhập Google chưa hoàn tất. Mở Chrome/Safari (không mở trong Zalo/FB) rồi thử lại.';
  }
  if (error.toLowerCase() === 'access_denied') {
    return 'Bạn đã hủy đăng nhập Google.';
  }
  return `Lỗi đăng nhập: ${error}`;
}
