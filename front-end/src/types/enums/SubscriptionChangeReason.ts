/**
 * Represents the reason a user's subscription plan was updated.
 */
export enum SubscriptionChangeReason {
  Upgrade = 'Upgrade',
  Downgrade = 'Downgrade',
  Expired = 'Expired',
  AdminManual = 'AdminManual',
  Payment = 'Payment',
}
