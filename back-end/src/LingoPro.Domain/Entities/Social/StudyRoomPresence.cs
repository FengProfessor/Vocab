using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Tracks live study room presence and heartbeat activity (public.room_presence, PK user_id).
/// <see cref="RoomId"/> is free text ('lobby' or a classroom id as text), not a foreign key.
/// </summary>
public class StudyRoomPresence
{
    public Guid UserId { get; set; }
    public string RoomId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "Học viên";
    public string ActivityKey { get; set; } = "idle";
    public string ActivityLabel { get; set; } = "Đang ở hub";
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}