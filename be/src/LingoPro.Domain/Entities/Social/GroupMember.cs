using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents a user's membership seat in a shared Pro study group (public.group_members).
/// </summary>
public class GroupMember : BaseAuditableEntity
{
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public virtual StudyGroup Group { get; set; } = null!;
}
