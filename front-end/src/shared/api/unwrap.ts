/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from '@/types/api';

/**
 * Typed error thrown when a .NET `ApiResponse<T>` envelope reports `success: false`
 * or fails validation.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: Record<string, string[]> | null;
  public readonly errorCode: string | null;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string[]> | null = null,
    errorCode: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.errorCode = errorCode;
  }
}

/**
 * Unwraps a standardized .NET 10 `ApiResponse<T>` envelope, returning `body.data` on success
 * or throwing an `ApiError` with status, message, and field validation errors.
 */
export function unwrapApiResponse<T>(body: ApiResponse<T> | null | undefined): T {
  if (!body || !body.success || body.data === null || body.data === undefined) {
    throw new ApiError(
      body?.statusCode ?? 500,
      body?.message || 'Request failed',
      body?.errors ?? null,
      body?.errorCode ?? null,
    );
  }
  return body.data;
}

/**
 * Compatibility surface allowing callers migrating from `Response` to access either
 * direct properties on the returned DTO or legacy `.ok`, `.status`, and `.json()` helpers.
 */
export interface ResponseCompat<T = any> extends Response {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: Headers;
  json<R = any>(): Promise<R>;
  text(): Promise<string>;
  readonly _payloadType?: T;
  [key: string]: any;
}

/**
 * Attaches non-enumerable `Response`-compatible properties (`ok`, `status`, `headers`, `json()`, `text()`)
 * to a domain payload object so both direct DTO consumers and legacy `res.ok` / `await res.json()` callers
 * work seamlessly.
 */
export function withResponseCompat<T extends Record<string, any> = Record<string, any>>(
  payload: T,
  status = 200,
  ok = status >= 200 && status < 300,
): T & ResponseCompat<T> & Record<string, any> {
  const target = (payload && typeof payload === 'object' ? payload : { data: payload }) as T &
    ResponseCompat<T> &
    Record<string, any>;

  if (!('ok' in target)) {
    Object.defineProperty(target, 'ok', {
      value: ok,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (!('status' in target)) {
    Object.defineProperty(target, 'status', {
      value: status,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (!('headers' in target)) {
    Object.defineProperty(target, 'headers', {
      value: new Headers({ 'Content-Type': 'application/json' }),
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (typeof target.json !== 'function') {
    Object.defineProperty(target, 'json', {
      value: async () => payload,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (typeof target.text !== 'function') {
    Object.defineProperty(target, 'text', {
      value: async () => JSON.stringify(payload),
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }

  return target;
}
