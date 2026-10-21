using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Tracks an invited referee's registration and activation status (public.referral_logs).
/// Status values: 'registered', 'activated', 'converted', 'fraud_flagged'.
/// </summary>
public class ReferralLog : BaseAuditableEntity
{
    public Guid? ReferrerId { get; set; }
    public Guid RefereeId { get; set; }
    public Guid? CampaignId { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public string Status { get; set; } = "registered";
    public string? IpAddress { get; set; }
    public string? IpSubnet { get; set; }
    public string? DeviceFingerprint { get; set; }
    public int RiskScore { get; set; }
    public string? FlaggedReason { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public DateTime? ConvertedAt { get; set; }
    public Guid? FirstOrderId { get; set; }

    public virtual Profile? Referrer { get; set; }
    public virtual Profile Referee { get; set; } = null!;
    public virtual ReferralCampaign? Campaign { get; set; }
    public virtual Order? FirstOrder { get; set; }
}