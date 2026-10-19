using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines clearance statuses for ambassador reward transactions.
/// </summary>
public enum RewardTransactionStatus
{
    [Display(Name = "PendingClearance")]
    PendingClearance,
    [Display(Name = "Available")]
    Available,
    [Display(Name = "Deducted")]
    Deducted,
    [Display(Name = "Withdrawn")]
    Withdrawn,
    [Display(Name = "Cancelled")]
    Cancelled,
    [Display(Name = "Clawback")]
    Clawback,
    [Display(Name = "Pending")]
    Pending,
    [Display(Name = "Completed")]
    Completed,
}
