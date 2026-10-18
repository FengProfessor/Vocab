/**
 * Defines clearance statuses for ambassador reward transactions.
 */
export enum RewardTransactionStatus {
  PendingClearance = 'PendingClearance',
  Available = 'Available',
  Deducted = 'Deducted',
  Withdrawn = 'Withdrawn',
  Cancelled = 'Cancelled',
  Clawback = 'Clawback',
  Pending = 'Pending',
  Completed = 'Completed',
}
