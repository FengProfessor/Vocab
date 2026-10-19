using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines transaction types in the ambassador reward ledger.
/// </summary>
public enum RewardTransactionType
{
    [Display(Name = "ProDays")]
    ProDays,
    [Display(Name = "CashCommission")]
    CashCommission,
    [Display(Name = "AffiliateCash")]
    AffiliateCash,
    [Display(Name = "MilestoneBonus")]
    MilestoneBonus,
    [Display(Name = "PayoutDebit")]
    PayoutDebit,
    [Display(Name = "ClawbackDebt")]
    ClawbackDebt,
    [Display(Name = "ReferralBonus")]
    ReferralBonus,
    [Display(Name = "ChallengeRefund")]
    ChallengeRefund,
    [Display(Name = "StreakMilestone")]
    StreakMilestone,
    [Display(Name = "PayoutWithdrawal")]
    PayoutWithdrawal,
}
