namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines approval statuses for ambassador cash payout requests.
/// </summary>
public enum PayoutRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3,
    Requested = 4,
    Processing = 5,
    Paid = 6
}
