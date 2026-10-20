import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { AuthTokensPayload } from '@/types/auth/AuthTokensPayload';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Thin client for the .NET auth endpoints. The server forwards credentials to Supabase Auth and
 * returns the Supabase-issued JWT pair; the SPA never talks to Supabase directly.
 */
export class AuthApi {
  /**
   * Authenticates a user with email and password via POST /api/v1/auth/login.
   */
  public static async login(email: string, password: string): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/login', { email, password });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Registers a new user account via POST /api/v1/auth/register.
   */
  public static async register(
    email: string,
    password: string,
    fullName: string,
    role: UserRole.Student | UserRole.Teacher,
  ): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/register', {
      email,
      password,
      fullName,
      role,
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Generates a PKCE-protected Google OAuth authorization URL via GET /api/v1/auth/google-url.
   */
  public static async getGoogleAuthorizationUrl(redirectUri: string, codeChallenge: string): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ authorizationUrl: string }>>('/auth/google-url', {
      params: { redirectUri, codeChallenge },
    });
    return AuthApi.unwrap(response.data).authorizationUrl;
  }

  /**
   * Exchanges a one-time Google authorization code and PKCE verifier for a Supabase JWT pair.
   */
  public static async exchangeGoogleCode(
    code: string,
    codeVerifier: string,
    role: UserRole.Student | UserRole.Teacher,
  ): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/callback/google', {
      code,
      codeVerifier,
      role,
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Ends the Supabase session server-side and clears the fallback cookies. Best effort.
   */
  public static async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  private static unwrap<T>(body: ApiResponse<T>): T {
    if (!body.success || body.data === null) {
      throw new Error(body.message || 'Request failed');
    }
    return body.data;
  }

  /**
   * Turns an API failure into a friendly Vietnamese message matching the original FormatAuthError.
   */
  public static describeError(error: unknown): string {
    const response = (error as { response?: { status?: number; data?: ApiResponse<unknown> } })?.response;
    if (!response) {
      if (error instanceof Error && error.message) {
        return AuthApi.formatRawMessage(error.message);
      }
      return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
    }

    const body = response.data;
    const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    const raw = firstFieldError ?? body?.message ?? '';

    if (response.status === 429) {
      return 'Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.';
    }

    return AuthApi.formatRawMessage(raw);
  }

  /**
   * Translates raw identity provider or validation error strings into user-facing Vietnamese messages.
   */
  public static formatRawMessage(raw: string): string {
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
    if (lower.includes('user already') || lower.includes('already') || lower.includes('unable to register')) {
      return 'Email đã có tài khoản — hãy đăng nhập.';
    }
    if (lower.includes('too many requests') || lower.includes('429')) {
      return 'Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.';
    }
    if (lower.includes('rejected by the identity provider')) {
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

    return raw;
  }

  /**
   * Maps OAuth callback query error codes (?error=...&error_description=...) to Vietnamese messages.
   */
  public static describeOAuthQueryError(error: string | null, errorDescription?: string | null): string {
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
}
