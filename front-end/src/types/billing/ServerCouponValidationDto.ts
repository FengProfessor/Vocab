/**
 * Coupon validation DTO returned by GET /api/v1/billing/coupons/validate.
 */
export interface ServerCouponValidationDto {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number | null;
  isValid: boolean;
}
