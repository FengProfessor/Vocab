import { describe, expect, it } from 'vitest';
import { ApiError, unwrapApiResponse, withResponseCompat } from '@/shared/api/unwrap';
import type { ApiResponse } from '@/types/api';

describe('unwrapApiResponse & ApiError', () => {
  it('returns data when envelope is successful and data is defined', () => {
    const envelope: ApiResponse<{ count: number }> = {
      statusCode: 200,
      success: true,
      message: 'OK',
      data: { count: 42 },
      errors: null,
      errorCode: null,
      timestamp: '2026-10-26T00:00:00Z',
    };

    expect(unwrapApiResponse(envelope)).toEqual({ count: 42 });
  });

  it('preserves falsy non-null values like false, 0, and empty string', () => {
    const boolEnvelope: ApiResponse<boolean> = {
      statusCode: 200,
      success: true,
      message: 'OK',
      data: false,
      errors: null,
      errorCode: null,
      timestamp: '2026-10-26T00:00:00Z',
    };
    expect(unwrapApiResponse(boolEnvelope)).toBe(false);

    const zeroEnvelope: ApiResponse<number> = {
      statusCode: 200,
      success: true,
      message: 'OK',
      data: 0,
      errors: null,
      errorCode: null,
      timestamp: '2026-10-26T00:00:00Z',
    };
    expect(unwrapApiResponse(zeroEnvelope)).toBe(0);
  });

  it('throws ApiError with status, message, and field errors when success is false', () => {
    const failedEnvelope: ApiResponse<null> = {
      statusCode: 422,
      success: false,
      message: 'Validation failed',
      data: null,
      errors: { email: ['Email is invalid'] },
      errorCode: 'VALIDATION_ERROR',
      timestamp: '2026-10-26T00:00:00Z',
    };

    expect(() => unwrapApiResponse(failedEnvelope)).toThrowError(ApiError);
    try {
      unwrapApiResponse(failedEnvelope);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.message).toBe('Validation failed');
      expect(apiErr.errors).toEqual({ email: ['Email is invalid'] });
      expect(apiErr.errorCode).toBe('VALIDATION_ERROR');
    }
  });

  it('attaches non-enumerable Response compatibility helpers via withResponseCompat', async () => {
    const payload = { success: true, total: 5 };
    const wrapped = withResponseCompat(payload, 201, true);

    expect(wrapped.success).toBe(true);
    expect(wrapped.total).toBe(5);
    expect(wrapped.ok).toBe(true);
    expect(wrapped.status).toBe(201);
    expect(await wrapped.json()).toEqual({ success: true, total: 5 });
    expect(Object.keys(wrapped)).toEqual(['success', 'total']);
  });
});
