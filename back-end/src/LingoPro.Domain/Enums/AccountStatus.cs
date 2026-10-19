using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines user account lifecycle statuses in the platform.
/// </summary>
public enum AccountStatus
{
    [Display(Name = "Active")]
    Active,
    [Display(Name = "Suspended")]
    Suspended,
    [Display(Name = "Banned")]
    Banned,
}
