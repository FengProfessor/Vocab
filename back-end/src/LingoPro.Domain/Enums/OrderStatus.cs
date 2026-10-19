using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines payment lifecycle statuses for orders ('pending', 'paid', 'failed', 'refunded', 'expired').
/// </summary>
public enum OrderStatus
{
    [Display(Name = "Pending")]
    Pending,
    [Display(Name = "Paid")]
    Paid,
    [Display(Name = "Failed")]
    Failed,
    [Display(Name = "Refunded")]
    Refunded,
    [Display(Name = "Expired")]
    Expired,
}
