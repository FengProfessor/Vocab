using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines lifecycle statuses for gamified study challenges ('draft', 'open', 'active', 'completed', 'cancelled').
/// </summary>
public enum ChallengeStatus
{
    [Display(Name = "Draft")]
    Draft,
    [Display(Name = "Open")]
    Open,
    [Display(Name = "Active")]
    Active,
    [Display(Name = "Completed")]
    Completed,
    [Display(Name = "Cancelled")]
    Cancelled,
}
