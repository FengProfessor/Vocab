namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines payment gateway channels supported for order fulfillment.
/// </summary>
public enum PaymentMethodType
{
    VnPay = 0,
    MoMo = 1,
    BankTransfer = 2,
    Manual = 3
}
