namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines audit reasons for subscription plan transitions ('upgrade', 'downgrade', 'expired', 'admin_manual', 'payment').
/// </summary>
public enum SubscriptionChangeReason
{
    Upgrade = 0,
    Downgrade = 1,
    Expired = 2,
    AdminManual = 3,
    Payment = 4
}
