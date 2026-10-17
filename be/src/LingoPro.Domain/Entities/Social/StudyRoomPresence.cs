using LingoPro.Domain.Common;

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
}
