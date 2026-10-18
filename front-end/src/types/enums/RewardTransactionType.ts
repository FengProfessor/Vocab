/**
 * Defines transaction types in the ambassador reward ledger.
 */
export enum RewardTransactionType {
  ProDays = 'ProDays',
  CashCommission = 'CashCommission',
  AffiliateCash = 'AffiliateCash',
  MilestoneBonus = 'MilestoneBonus',
  PayoutDebit = 'PayoutDebit',
  ClawbackDebt = 'ClawbackDebt',
  ReferralBonus = 'ReferralBonus',
  ChallengeRefund = 'ChallengeRefund',
  StreakMilestone = 'StreakMilestone',
  PayoutWithdrawal = 'PayoutWithdrawal',
}
