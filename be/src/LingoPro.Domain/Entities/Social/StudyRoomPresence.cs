using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Tracks live study room presence and heartbeat activity (public.room_presence).
/// </summary>
public class StudyRoomPresence : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string CurrentActivity { get; set; } = "Studying Vocabulary";
    public Guid? ClassroomId { get; set; }
    public DateTime LastHeartbeatAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual ClassroomEntity? Classroom { get; set; }
}
