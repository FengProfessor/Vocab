using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines audit reasons for subscription plan transitions ('upgrade', 'downgrade', 'expired', 'admin_manual', 'payment').
/// </summary>
public enum SubscriptionChangeReason
{
    [Display(Name = "Upgrade")]
    Upgrade,
    [Display(Name = "Downgrade")]
    Downgrade,
    [Display(Name = "Expired")]
    Expired,
    [Display(Name = "AdminManual")]
    AdminManual,
    [Display(Name = "Payment")]
    Payment,
}
