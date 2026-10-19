using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines payment gateway channels supported for order fulfillment.
/// </summary>
public enum PaymentMethodType
{
    [Display(Name = "VnPay")]
    VnPay,
    [Display(Name = "MoMo")]
    MoMo,
    [Display(Name = "BankTransfer")]
    BankTransfer,
    [Display(Name = "Manual")]
    Manual,
}
