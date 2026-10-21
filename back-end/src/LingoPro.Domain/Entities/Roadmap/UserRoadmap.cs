using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Roadmap;

/// <summary>
/// Represents a user's enrolled learning roadmap for a specific track (public.user_roadmap, composite PK user_id + track).
/// <c>user_id</c> references auth.users, so there is no navigation property.
/// </summary>
public class UserRoadmap
{
    public Guid UserId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public string RoadmapVersion { get; set; } = "roadmap-v1";
    public RoadmapLevelId LevelId { get; set; }
    public string? CurrentUnitId { get; set; }

    /// <summary>
    /// Placement result JSON stored as jsonb.
    /// </summary>
    public string? Placement { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}