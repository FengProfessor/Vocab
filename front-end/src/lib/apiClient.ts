import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '@/config/appConfig';
import { TokenStore } from '@/features/auth/tokenStore';
import { ApiResponse } from '@/types/api';

/**
 * Extended Axios request config tracking whether a 401 refresh retry has already been attempted.
 */
export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface RefreshResponseBody {
  data?: { accessToken?: string; refreshToken?: string; expiresIn?: number };
}

/** Header required by the .NET server's CSRF check on every state-changing cookie-authenticated request. */
export const CSRF_REQUEST_HEADER = 'X-LingoPro-Request';

/** Window event fired when the server rejects the refresh token, i.e. the cookie session is truly over. */
export const SESSION_EXPIRED_EVENT = 'lingopro:session-expired';

const API_BASE_URL = appConfig.apiBaseUrl;

// Capture any non-recovery OAuth fragment tokens before the first request.
TokenStore.captureFromUrlHash();

/** Single in-flight refresh shared by all concurrent 401s so the refresh token is rotated exactly once. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the session by calling POST /auth/refresh using the HttpOnly refresh cookie (`withCredentials: true`).
 * All callers share the single-flight `refreshInFlight` promise so concurrent 401 responses trigger only one
 * network call.
 *
 * Resolves `true` when renewed, `false` when the server definitively rejected the refresh token (400/401/403).
 * Network errors and 5xx responses reject without clearing `TokenStore` so the cached session is preserved (Offline-First).
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = apiClient
      .post<RefreshResponseBody>(
        '/auth/refresh',
        {},
        {
          withCredentials: true,
          headers: { [CSRF_REQUEST_HEADER]: '1' },
        },
      )
      .then((response) => {
        const tokens = response.data?.data;
        if (tokens?.accessToken) {
          TokenStore.save(tokens.accessToken, null, tokens.expiresIn ?? null);
          return true;
        }
        TokenStore.clear();
        return false;
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
 * Requests carry the in-memory access token as a Bearer header and send HttpOnly cookies with credentials.
 * An expired access token is renewed transparently via `refreshAccessToken()`.
 * Temporary network errors or 5xx responses never clear the cached session.
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
    if (accessToken && !/\/auth\/refresh/.test(config.url ?? '')) {
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
      const isPublicAuthCall =
        /\/auth\/(refresh|login|register|logout|callback\/google|password\/(forgot|reset))/.test(
          requestUrl,
        );
      if (
        error.response.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isPublicAuthCall
      ) {
        originalRequest._retry = true;

        try {
          if (await refreshAccessToken()) {
            const refreshedToken = TokenStore.getAccessToken();
            if (refreshedToken && originalRequest.headers) {
              originalRequest.headers.set('Authorization', `Bearer ${refreshedToken}`);
            }
            return client(originalRequest);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
          }
        } catch (refreshError) {
          // Propagate transient refresh failure (network / 5xx) so callers do not mistake it for a 401 sign-out.
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

/** Singleton Axios client instance for all LingoPro API requests. */
export const apiClient: AxiosInstance = createApiClient();
