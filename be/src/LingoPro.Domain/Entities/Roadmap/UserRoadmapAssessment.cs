using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Roadmap;

/// <summary>
/// Stores multi-tier assessment history (Mini-Quiz, Checkpoint, Exit Exam) and diagnostic details for a learner's roadmap (public.user_roadmap_assessments).
/// </summary>
public class UserRoadmapAssessment : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? UserRoadmapId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public RoadmapAssessmentTier Tier { get; set; } = RoadmapAssessmentTier.MiniQuiz;
    public string TargetId { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool Passed { get; set; }
    public string DetailsJson { get; set; } = "{}";

    public virtual Profile User { get; set; } = null!;
    public virtual UserRoadmap? Roadmap { get; set; }
}
