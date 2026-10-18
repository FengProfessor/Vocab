/**
 * Defines conversion lifecycle statuses for referral logs.
 */
export enum ReferralLogStatus {
  Registered = 'Registered',
  Activated = 'Activated',
  Converted = 'Converted',
  FraudFlagged = 'FraudFlagged',
  Pending = 'Pending',
  Qualified = 'Qualified',
  Rewarded = 'Rewarded',
  Rejected = 'Rejected',
}
