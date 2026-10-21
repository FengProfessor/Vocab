using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Defines referral and affiliate campaign reward policies, holding periods, and monthly caps (public.referral_campaigns).
/// </summary>
public class ReferralCampaign : BaseAuditableEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int RefereeRewardDays { get; set; } = 7;
    public int ReferrerRewardDays { get; set; } = 7;
    public int CommissionPct { get; set; } = 15;
    public int AmbassadorCommPct { get; set; } = 20;
    public int HoldingPeriodDays { get; set; } = 7;
    public int MinPayoutAmount { get; set; } = 100000;
    public int MonthlyRefCap { get; set; } = 15;
    public string ActivationCriteria { get; set; } = "{\"min_streak\": 3, \"min_words\": 30}";
    public bool IsActive { get; set; } = true;

    public virtual ICollection<ReferralLog> ReferralLogs { get; set; } = new List<ReferralLog>();
}