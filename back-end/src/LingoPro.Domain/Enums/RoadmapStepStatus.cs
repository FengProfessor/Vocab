using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines progress statuses for individual roadmap station steps ('locked', 'in_progress', 'completed').
/// </summary>
public enum RoadmapStepStatus
{
    [Display(Name = "Locked")]
    Locked,
    [Display(Name = "InProgress")]
    InProgress,
    [Display(Name = "Completed")]
    Completed,
}
