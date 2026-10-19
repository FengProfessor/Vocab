using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines enrollment statuses for challenge participants ('pending', 'active', 'failed', 'completed', 'refunded').
/// </summary>
public enum ChallengeParticipantStatus
{
    [Display(Name = "Pending")]
    Pending,
    [Display(Name = "Active")]
    Active,
    [Display(Name = "Failed")]
    Failed,
    [Display(Name = "Completed")]
    Completed,
    [Display(Name = "Refunded")]
    Refunded,
}
