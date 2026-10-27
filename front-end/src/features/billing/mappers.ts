/**
 * Maps `.NET 10` `CouponValidationDto` into `{ success, valid, data, ...dto }`.
 */
export function mapCouponValidationResponse(
  dto: Record<string, any> | null | undefined,
  ok = true,
  message?: string | null,
) {
  return {
    success: ok,
    valid: Boolean(dto?.isValid),
    data: dto ?? null,
    ...(dto && typeof dto === 'object' ? dto : {}),
    error: ok ? undefined : message || undefined,
  };
}

/**
 * Maps `.NET 10` `OrderDto` into `{ success, order, data, error }`.
 */
export function mapOrderCreatedResponse(
  dto: Record<string, any> | null | undefined,
  ok = true,
  message?: string | null,
) {
  return {
    success: ok,
    order: dto ?? null,
    data: dto ?? null,
    error: ok ? undefined : message || undefined,
  };
}
