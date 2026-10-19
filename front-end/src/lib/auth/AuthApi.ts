import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';

/** Token and identity fields of the server's AuthTokensDto (camelCase JSON). */
export interface AuthTokensPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  /** Empty when Supabase requires email confirmation before a session exists. */
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Thin client for the .NET auth endpoints. The server forwards credentials to Supabase Auth and
 * returns the Supabase-issued JWT pair; the SPA never talks to Supabase directly.
 */
export class AuthApi {
  public static async login(email: string, password: string): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/login', { email, password });
    return AuthApi.unwrap(response.data);
  }

  public static async register(
    email: string,
    password: string,
    fullName: string,
    role: 'Student' | 'Teacher',
  ): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/register', {
      email,
      password,
      fullName,
      role,
    });
    return AuthApi.unwrap(response.data);
  }

  public static async getGoogleAuthorizationUrl(redirectUri: string, codeChallenge: string): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ authorizationUrl: string }>>('/auth/google-url', {
      params: { redirectUri, codeChallenge },
    });
    return AuthApi.unwrap(response.data).authorizationUrl;
  }

  public static async exchangeGoogleCode(
    code: string,
    codeVerifier: string,
    role: 'Student' | 'Teacher',
  ): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/callback/google', {
      code,
      codeVerifier,
      role,
    });
    return AuthApi.unwrap(response.data);
  }

  /** Ends the Supabase session server-side and clears the fallback cookies. Best effort. */
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
   * Turns an API failure into a friendly Vietnamese message. Validation errors show the first field
   * message; known Supabase failures are translated.
   */
  public static describeError(error: unknown): string {
    const response = (error as { response?: { status?: number; data?: ApiResponse<unknown> } })?.response;
    if (!response) {
      return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
    }

    const body = response.data;
    const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    const raw = (firstFieldError ?? body?.message ?? '').toLowerCase();

    if (response.status === 429) return 'Thao tác quá nhanh. Chờ chút rồi thử lại.';
    if (raw.includes('not confirmed')) {
      return 'Email chưa được xác nhận. Hãy mở email xác nhận (kiểm tra cả mục Spam) rồi đăng nhập lại.';
    }
    if (raw.includes('invalid email or password')) return 'Sai email hoặc mật khẩu.';
    if (raw.includes('rejected by the identity provider')) {
      return 'Đăng nhập bị từ chối. Kiểm tra lại email/mật khẩu hoặc thử lại sau.';
    }
    if (raw.includes('unable to register') || raw.includes('already')) {
      return 'Không tạo được tài khoản. Email có thể đã được đăng ký — hãy thử đăng nhập.';
    }
    if (raw.includes('rate limit')) return 'Hệ thống email đang quá tải. Thử lại sau vài phút hoặc dùng Google.';
    if (raw.includes('email address format')) return 'Email không hợp lệ.';
    if (raw.includes('at least 6')) return 'Mật khẩu tối thiểu 6 ký tự.';
    if (raw.includes('full name')) return 'Vui lòng nhập họ tên (tối đa 100 ký tự).';
    return firstFieldError ?? body?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}
