using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Roadmap;

/// <summary>
/// Represents completion status and score for a single roadmap step (public.user_roadmap_steps).
/// </summary>
public class UserRoadmapStep : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid UserRoadmapId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public string StepId { get; set; } = string.Empty;
    public RoadmapStepStatus Status { get; set; } = RoadmapStepStatus.InProgress;
    public double? Score { get; set; }
    public DateTime? CompletedAt { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual UserRoadmap Roadmap { get; set; } = null!;
}
