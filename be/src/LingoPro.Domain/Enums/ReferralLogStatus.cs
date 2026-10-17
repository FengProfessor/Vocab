namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines conversion lifecycle statuses for referral logs ('registered', 'activated', 'converted', 'fraud_flagged').
/// </summary>
public enum ReferralLogStatus
{
    Registered = 0,
    Activated = 1,
    Converted = 2,
    FraudFlagged = 3
}
