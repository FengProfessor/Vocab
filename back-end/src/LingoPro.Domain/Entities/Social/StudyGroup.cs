using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents a multi-seat shared Pro study group (public.groups).
/// Plan values: 'pro', 'premium'. Status values: 'active', 'expired', 'cancelled'.
/// </summary>
public class StudyGroup : BaseAuditableEntity
{
    public Guid OwnerId { get; set; }
    public string Plan { get; set; } = "pro";
    public int SeatLimit { get; set; } = 10;
    public string InviteCode { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public DateTime? StartsAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public Guid? OrderId { get; set; }

    public virtual Profile Owner { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
}