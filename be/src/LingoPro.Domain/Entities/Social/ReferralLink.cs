using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents a user's unique ambassador referral link (public.referral_links).
/// </summary>
public class ReferralLink : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string Code { get; set; } = string.Empty;
    public int ClicksCount { get; set; }

    public virtual Profile User { get; set; } = null!;
}
