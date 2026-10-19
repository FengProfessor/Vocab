using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines roadmap assessment tiers mapped from user_roadmap_assessments.tier.
/// </summary>
public enum RoadmapAssessmentTier
{
    [Display(Name = "MiniQuiz")]
    MiniQuiz,
    [Display(Name = "Checkpoint")]
    Checkpoint,
    [Display(Name = "ExitExam")]
    ExitExam,
}
