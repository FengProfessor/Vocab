namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines approval statuses for ambassador cash payout requests ('pending', 'approved', 'rejected', 'completed').
/// </summary>
public enum PayoutRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3
}
