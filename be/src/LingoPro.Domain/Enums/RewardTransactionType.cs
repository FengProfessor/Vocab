namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines transaction types in the ambassador reward ledger.
/// </summary>
public enum RewardTransactionType
{
    ProDays = 0,
    CashCommission = 1,
    AffiliateCash = 2,
    MilestoneBonus = 3,
    PayoutDebit = 4,
    ClawbackDebt = 5,
    ReferralBonus = 6,
    ChallengeRefund = 7,
    StreakMilestone = 8,
    PayoutWithdrawal = 9
}
