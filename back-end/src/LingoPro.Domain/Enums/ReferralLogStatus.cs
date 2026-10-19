using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines conversion lifecycle statuses for referral logs.
/// </summary>
public enum ReferralLogStatus
{
    [Display(Name = "Registered")]
    Registered,
    [Display(Name = "Activated")]
    Activated,
    [Display(Name = "Converted")]
    Converted,
    [Display(Name = "FraudFlagged")]
    FraudFlagged,
    [Display(Name = "Pending")]
    Pending,
    [Display(Name = "Qualified")]
    Qualified,
    [Display(Name = "Rewarded")]
    Rewarded,
    [Display(Name = "Rejected")]
    Rejected,
}
