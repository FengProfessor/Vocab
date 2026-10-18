namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines conversion lifecycle statuses for referral logs.
/// </summary>
public enum ReferralLogStatus
{
    Registered = 0,
    Activated = 1,
    Converted = 2,
    FraudFlagged = 3,
    Pending = 4,
    Qualified = 5,
    Rewarded = 6,
    Rejected = 7
}
