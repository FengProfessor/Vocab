namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines payment lifecycle statuses for orders ('pending', 'paid', 'failed', 'refunded', 'expired').
/// </summary>
public enum OrderStatus
{
    Pending = 0,
    Paid = 1,
    Failed = 2,
    Refunded = 3,
    Expired = 4
}
