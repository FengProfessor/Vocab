using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Tracks an invited referee's registration and activation status (public.referral_logs).
/// </summary>
public class ReferralLog : BaseAuditableEntity
{
    public Guid ReferrerId { get; set; }
    public Guid RefereeId { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public ReferralLogStatus Status { get; set; } = ReferralLogStatus.Registered;
    public DateTime? ActivatedAt { get; set; }
}
