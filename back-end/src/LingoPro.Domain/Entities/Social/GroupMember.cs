using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents a user's membership seat in a shared Pro study group (public.group_members).
/// </summary>
public class GroupMember : BaseEntity
{
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public DateTime? JoinedAt { get; set; } = DateTime.UtcNow;

    public virtual StudyGroup Group { get; set; } = null!;
    public virtual Profile User { get; set; } = null!;
}