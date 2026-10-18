import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api/ApiResponse';

/** Header required by the .NET server's CSRF check on every state-changing cookie-authenticated request. */
export const CSRF_REQUEST_HEADER = 'X-LingoPro-Request';

/** Window event fired when the server rejects the refresh token, i.e. the cookie session is truly over. */
export const SESSION_EXPIRED_EVENT = 'lingopro:session-expired';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Extended Axios request config tracking whether a 401 refresh retry has already been attempted.
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Single in-flight refresh shared by all concurrent 401s so the refresh token is rotated exactly once. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the session by calling POST /auth/refresh. The browser sends the HttpOnly refresh cookie and the
 * server replies with fresh HttpOnly cookies, so no token is ever visible to JavaScript.
 * Resolves true when renewed, false when the server definitively rejected the refresh token.
 * Network errors and 5xx responses reject so the cached session is preserved (offline-first).
 */
function refreshSessionCookie(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, {
        withCredentials: true,
        headers: { [CSRF_REQUEST_HEADER]: '1' },
      })
      .then(() => true)
      .catch((error: AxiosError) => {
        const status = error.response?.status;
        if (status === 400 || status === 401 || status === 403) {
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
 * Authentication is cookie-only: requests carry the HttpOnly access cookie via withCredentials, the CSRF
 * header is attached to every call, and an expired 15-minute access cookie is renewed transparently with the
 * 30-day refresh cookie. Temporary network errors or 5xx responses never clear the cached session.
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

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      // Offline-First Rule: never treat a network failure or 5xx as a sign-out.
      if (!error.response || error.response.status >= 500) {
        return Promise.reject(error);
      }

      const isRefreshCall = originalRequest?.url?.includes('/auth/refresh') ?? false;
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
