using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Roadmap;

/// <summary>
/// Represents completion status and score for a single roadmap step (public.user_roadmap_steps, composite PK user_id + step_id).
/// <c>user_id</c> references auth.users, so there is no navigation property.
/// </summary>
public class UserRoadmapStep
{
    public Guid UserId { get; set; }
    public string StepId { get; set; } = string.Empty;
    public RoadmapStepStatus Status { get; set; } = RoadmapStepStatus.Completed;
    public int? Score { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}