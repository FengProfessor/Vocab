using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines approval statuses for ambassador cash payout requests.
/// </summary>
public enum PayoutRequestStatus
{
    [Display(Name = "Pending")]
    Pending,
    [Display(Name = "Approved")]
    Approved,
    [Display(Name = "Rejected")]
    Rejected,
    [Display(Name = "Completed")]
    Completed,
    [Display(Name = "Requested")]
    Requested,
    [Display(Name = "Processing")]
    Processing,
    [Display(Name = "Paid")]
    Paid,
}
