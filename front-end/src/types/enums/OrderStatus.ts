/**
 * Represents the transaction settlement status of a billing order.
 */
export enum OrderStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded',
  Expired = 'Expired',
}
