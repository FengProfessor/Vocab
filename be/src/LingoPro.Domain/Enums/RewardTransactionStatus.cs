namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines clearance statuses for ambassador reward transactions.
/// </summary>
public enum RewardTransactionStatus
{
    PendingClearance = 0,
    Available = 1,
    Deducted = 2,
    Withdrawn = 3,
    Cancelled = 4,
    Clawback = 5,
    Pending = 6,
    Completed = 7
}
