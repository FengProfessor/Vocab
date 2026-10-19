using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines lifecycle statuses for shared Pro study groups ('active', 'expired', 'cancelled').
/// </summary>
public enum StudyGroupStatus
{
    [Display(Name = "Active")]
    Active,
    [Display(Name = "Expired")]
    Expired,
    [Display(Name = "Cancelled")]
    Cancelled,
}
