/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapCouponValidationResponse,
  mapOrderCreatedResponse,
} from '@/features/billing/mappers';

/**
 * Domain API service for Subscriptions, Coupons, VietQR Orders, Pro Trial Milestones, and Gift Redemption.
 */
export class BillingApi {
  /**
   * Validates a discount coupon code via `GET /api/v1/billing/coupons/validate`.
   */
  public static async validateCoupon(
    input: unknown,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    const parsed = typeof input === 'string' ? { code: input } : normalizePayloadData(input);
    const code = String(parsed.code ?? '').trim();
    const { ok, status, body } = await callDotNetRaw<Record<string, any>>(
      '/billing/coupons/validate',
      {
        method: 'GET',
        params: { code },
        headers: options?.headers,
      },
    );
    const payload = mapCouponValidationResponse(body?.data, ok, body?.message);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Creates a new subscription payment order via `POST /api/v1/billing/orders`.
   */
  public static async createOrder(
    rawBody: unknown,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/billing/orders',
      {
        method: 'POST',
        data: normalizePayloadData(rawBody),
        headers: options?.headers,
      },
    );
    const payload = mapOrderCreatedResponse(resBody?.data, ok, resBody?.message);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Retrieves billing dashboard statistics via `GET /api/v1/admin/crm/dashboard`.
   */
  public static async getStats(options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any }) {
    const { ok, status, body } = await callDotNetRaw<Record<string, any>>(
      '/admin/crm/dashboard',
      {
        method: 'GET',
        headers: options?.headers,
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: body?.data,
        ...(body?.data && typeof body.data === 'object' ? body.data : {}),
      },
      status,
      ok,
    );
  }

  /**
   * Lists billing orders for administrative review.
   */
  public static async getOrders(
    params?: Record<string, unknown> | string,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : params;
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params;
    }
    return callServerOriginApi('/api/billing/orders', {
      method: 'GET',
      params: queryParams,
      headers: options?.headers,
    });
  }

  /**
   * Confirms a paid order and activates the user's subscription via `POST /api/v1/billing/orders/confirm-paid`.
   */
  public static async confirmOrder(
    orderId: string,
    rawBody?: unknown,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/billing/orders/confirm-paid',
      {
        method: 'POST',
        data: { orderId, ...body },
        headers: options?.headers,
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        order: resBody?.data,
        error: ok ? undefined : resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Lists discount coupons for administrative management.
   */
  public static async getCoupons(options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any }) {
    return callServerOriginApi('/api/billing/coupons', {
      method: 'GET',
      headers: options?.headers,
    });
  }

  /**
   * Creates a discount coupon.
   */
  public static async createCoupon(
    rawBody: unknown,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    return callServerOriginApi('/api/billing/coupons', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }

  /**
   * Deletes a discount coupon by ID.
   */
  public static async deleteCoupon(
    couponIdOrUrl: string,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    const id = couponIdOrUrl.includes('?')
      ? new URLSearchParams(couponIdOrUrl.slice(couponIdOrUrl.indexOf('?') + 1)).get('id') ||
        couponIdOrUrl
      : couponIdOrUrl;
    return callServerOriginApi('/api/billing/coupons', {
      method: 'DELETE',
      params: { id },
      headers: options?.headers,
    });
  }

  /**
   * Retrieves Pro Trial milestone eligibility and progress.
   */
  public static async getProMilestone(options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any }) {
    return callServerOriginApi('/api/billing/pro-milestone', {
      method: 'GET',
      headers: options?.headers,
    });
  }

  /**
   * Claims a Pro Trial milestone reward.
   */
  public static async claimProMilestone(
    rawBody?: unknown,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    return callServerOriginApi('/api/billing/pro-milestone', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }

  /**
   * Redeems a promotional gift code.
   */
  public static async redeemGift(
    rawBody: unknown,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    return callServerOriginApi('/api/billing/redeem-gift', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }
}
