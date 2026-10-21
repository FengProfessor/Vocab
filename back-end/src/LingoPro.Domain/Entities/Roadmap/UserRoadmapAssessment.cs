using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Roadmap;

/// <summary>
/// Stores multi-tier assessment history (Mini-Quiz, Checkpoint, Exit Exam) and diagnostic details for a learner's roadmap (public.user_roadmap_assessments).
/// <c>user_id</c> references auth.users, so there is no navigation property.
/// </summary>
public class UserRoadmapAssessment : BaseEntity
{
    public Guid UserId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public RoadmapAssessmentTier Tier { get; set; }
    public string TargetId { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool Passed { get; set; }

    /// <summary>
    /// Diagnostic details JSON stored as jsonb.
    /// </summary>
    public string Details { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}