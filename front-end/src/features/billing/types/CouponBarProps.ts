import { ServerCouponValidationDto } from '@/types/billing/ServerCouponValidationDto';

/**
 * Props for the CouponBar component.
 */
export interface CouponBarProps {
  /** Entered coupon code. */
  code: string;
  /** Latest validation result, if any. */
  validation: ServerCouponValidationDto | null;
  /** Whether a validation request is in flight. */
  isValidating: boolean;
  /** Updates the entered code. */
  onChangeCode: (code: string) => void;
  /** Validates the entered code on the server. */
  onValidate: (code: string) => void;
}
