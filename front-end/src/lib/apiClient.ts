import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '@/config/appConfig';
import { TokenStore } from '@/lib/auth/TokenStore';
import { ApiResponse } from '@/types/api/ApiResponse';

/** Header required by the .NET server's CSRF check on every state-changing cookie-authenticated request. */
export const CSRF_REQUEST_HEADER = 'X-LingoPro-Request';

/** Window event fired when the server rejects the refresh token, i.e. the cookie session is truly over. */
export const SESSION_EXPIRED_EVENT = 'lingopro:session-expired';

const API_BASE_URL = appConfig.apiBaseUrl;

// The server hands tokens over in the URL fragment after login; capture them before the first request.
TokenStore.captureFromUrlHash();

/**
 * Extended Axios request config tracking whether a 401 refresh retry has already been attempted.
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Single in-flight refresh shared by all concurrent 401s so the refresh token is rotated exactly once. */
let refreshInFlight: Promise<boolean> | null = null;

/** Shape of the token fields in the server's refresh response (ApiResponse<AuthTokensDto>). */
interface RefreshResponseBody {
  data?: { accessToken?: string; refreshToken?: string; expiresIn?: number };
}

/**
 * Rotates the session by calling POST /auth/refresh with the stored Supabase refresh token (the server
 * also accepts the HttpOnly refresh cookie when nothing is stored). Supabase rotates refresh tokens, so
 * the returned pair replaces the stored one.
 * Resolves true when renewed, false when the server definitively rejected the refresh token.
 * Network errors and 5xx responses reject so the cached session is preserved (offline-first).
 */
function refreshSessionCookie(): Promise<boolean> {
  if (!refreshInFlight) {
    const storedRefreshToken = TokenStore.getRefreshToken();
    refreshInFlight = axios
      .post<RefreshResponseBody>(
        `${API_BASE_URL}/auth/refresh`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        {
          withCredentials: true,
          headers: { [CSRF_REQUEST_HEADER]: '1' },
        },
      )
      .then((response) => {
        const tokens = response.data?.data;
        if (tokens?.accessToken && tokens.refreshToken) {
          TokenStore.save(tokens.accessToken, tokens.refreshToken, tokens.expiresIn ?? null);
        }
        return true;
      })
      .catch((error: AxiosError) => {
        const status = error.response?.status;
        if (status === 400 || status === 401 || status === 403) {
          TokenStore.clear();
          return false;
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Creates and configures the singleton Axios HTTP client communicating with the .NET 10 Web API.
 * Requests carry the Supabase access token as a Bearer header (captured after login) and also send the
 * HttpOnly cookies as a fallback. An expired access token is renewed transparently through the Supabase
 * refresh token. Temporary network errors or 5xx responses never clear the cached session.
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      [CSRF_REQUEST_HEADER]: '1',
    },
  });

  client.interceptors.request.use((config) => {
    const accessToken = TokenStore.getAccessToken();
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      // Offline-First Rule: never treat a network failure or 5xx as a sign-out.
      if (!error.response || error.response.status >= 500) {
        return Promise.reject(error);
      }

      const requestUrl = originalRequest?.url ?? '';
      const isRefreshCall = /\/auth\/(refresh|login|register|logout|callback\/google)/.test(requestUrl);
      if (error.response.status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
        originalRequest._retry = true;

        try {
          if (await refreshSessionCookie()) {
            return client(originalRequest);
          }
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        } catch {
          // Temporary refresh failure: surface the original 401 without ending the session.
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/** Singleton Axios client instance for all LingoPro API requests. */
export const apiClient: AxiosInstance = createApiClient();
