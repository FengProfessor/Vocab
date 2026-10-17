using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents a multi-seat shared Pro study group (public.groups).
/// </summary>
public class StudyGroup : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public int SeatLimit { get; set; } = 5;
    public StudyGroupStatus Status { get; set; } = StudyGroupStatus.Active;
    public DateTime ExpiresAt { get; set; }

    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
}
