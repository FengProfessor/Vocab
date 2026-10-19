using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines reward settlement choices for completed challenges.
/// </summary>
public enum ChallengeRewardChoice
{
    [Display(Name = "Cash")]
    Cash,
    [Display(Name = "Pro")]
    Pro,
    [Display(Name = "Refund")]
    Refund,
    [Display(Name = "ExtendSubscription")]
    ExtendSubscription,
    [Display(Name = "Donate")]
    Donate,
}
