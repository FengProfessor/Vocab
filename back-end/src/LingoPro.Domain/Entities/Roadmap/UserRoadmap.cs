using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Roadmap;

/// <summary>
/// Represents a user's enrolled learning roadmap for a specific track (public.user_roadmap).
/// </summary>
public class UserRoadmap : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public RoadmapLevelId LevelId { get; set; } = RoadmapLevelId.A0;
    public string? CurrentUnitId { get; set; }
    public bool PlacementCompleted { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual ICollection<UserRoadmapStep> Steps { get; set; } = new List<UserRoadmapStep>();
}
