using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Tracks an invited referee's registration and activation status (public.referral_logs).
/// </summary>
public class ReferralLog : BaseAuditableEntity
{
    public Guid ReferrerId { get; set; }
    public Guid RefereeId { get; set; }
    public Guid? CampaignId { get; set; }
    public Guid? FirstOrderId { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public ReferralLogStatus Status { get; set; } = ReferralLogStatus.Registered;
    public DateTime? ActivatedAt { get; set; }

    public virtual Profile Referrer { get; set; } = null!;
    public virtual Profile Referee { get; set; } = null!;
    public virtual ReferralCampaign? Campaign { get; set; }
    public virtual Order? FirstOrder { get; set; }
}
