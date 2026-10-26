/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError, AxiosRequestConfig } from 'axios';
import { appConfig } from '@/config/appConfig';
import {
  apiClient,
  CSRF_REQUEST_HEADER,
  refreshAccessToken,
  SESSION_EXPIRED_EVENT,
} from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import {
  ResponseCompat,
  unwrapApiResponse,
  withResponseCompat,
} from '@/shared/api/unwrap';

export { apiClient, CSRF_REQUEST_HEADER, refreshAccessToken, SESSION_EXPIRED_EVENT };

export interface DomainRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: HeadersInit | Record<string, string>;
  signal?: AbortSignal | null;
  timeout?: number;
}

/**
 * Normalizes any body or RequestInit-like input into a plain JSON object.
 */
export function normalizePayloadData(input: unknown): Record<string, any> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as Record<string, any>;
    } catch {
      return {};
    }
  }
  if (typeof input === 'object') {
    const record = input as Record<string, any>;
    if (
      typeof record.body === 'string' &&
      ('method' in record || 'headers' in record || Object.keys(record).length <= 4)
    ) {
      try {
        return JSON.parse(record.body) as Record<string, any>;
      } catch {
        return {};
      }
    }
    return record;
  }
  return {};
}

export function normalizeHeaders(
  headers?: HeadersInit | Record<string, string>,
): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

/**
 * Executes a typed GET request against `/api/v1/*` and unwraps `ApiResponse<T>`.
 */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return unwrapApiResponse(response.data);
}

/**
 * Executes a typed POST request against `/api/v1/*` and unwraps `ApiResponse<T>`.
 */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config);
  return unwrapApiResponse(response.data);
}

/**
 * Executes a typed PUT request against `/api/v1/*` and unwraps `ApiResponse<T>`.
 */
export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body, config);
  return unwrapApiResponse(response.data);
}

/**
 * Executes a typed PATCH request against `/api/v1/*` and unwraps `ApiResponse<T>`.
 */
export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body, config);
  return unwrapApiResponse(response.data);
}

/**
 * Executes a typed DELETE request against `/api/v1/*` and unwraps `ApiResponse<T>`.
 */
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return unwrapApiResponse(response.data);
}

/**
 * Executes a request against `/api/v1/*` via `apiClient` without throwing on non-2xx HTTP status,
 * returning `{ ok, status, body }` for domain mappers that adapt envelopes into UI shapes.
 */
export async function callDotNetRaw<T = any>(
  url: string,
  options: DomainRequestOptions = {},
): Promise<{ ok: boolean; status: number; body: ApiResponse<T> | null }> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      url,
      method: options.method ?? 'GET',
      params: options.params,
      data: options.data !== undefined ? normalizePayloadData(options.data) : undefined,
      headers: normalizeHeaders(options.headers),
      signal: options.signal ?? undefined,
      timeout: options.timeout,
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      body: response.data ?? null,
    };
  } catch (err) {
    const axiosErr = err as AxiosError<ApiResponse<T>>;
    const status = axiosErr.response?.status ?? 500;
    const body = axiosErr.response?.data ?? null;
    return {
      ok: false,
      status,
      body,
    };
  }
}

/**
 * Executes a request through `apiClient` against the .NET server root (`appConfig.serverOrigin`)
 * for non-`/api/v1` endpoints such as `/api/lead-magnet/*` or fallback routes.
 */
export async function callServerOriginApi<T extends Record<string, any> = Record<string, any>>(
  path: string,
  options: DomainRequestOptions = {},
): Promise<T & ResponseCompat<T>> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  try {
    const response = await apiClient.request<T>({
      baseURL: appConfig.serverOrigin,
      url: normalized,
      method: options.method ?? 'GET',
      params: options.params,
      data: options.data !== undefined ? normalizePayloadData(options.data) : undefined,
      headers: normalizeHeaders(options.headers),
      signal: options.signal ?? undefined,
      timeout: options.timeout,
    });
    const payload = (
      response.data && typeof response.data === 'object'
        ? response.data
        : ({ data: response.data } as unknown as T)
    ) as T;
    return withResponseCompat(payload, response.status, true);
  } catch (err) {
    const axiosErr = err as AxiosError<T>;
    const status = axiosErr.response?.status ?? 500;
    const rawData = axiosErr.response?.data;
    const payload = (
      rawData && typeof rawData === 'object'
        ? rawData
        : ({
            success: false,
            error: axiosErr.message || 'Request failed',
          } as unknown as T)
    ) as T;
    return withResponseCompat(payload, status, false);
  }
}
