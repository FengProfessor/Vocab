using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines generation lifecycle statuses for daily reading exercises ('generating', 'ready', 'failed', 'archived').
/// </summary>
public enum DailyReadingStatus
{
    [Display(Name = "Generating")]
    Generating,
    [Display(Name = "Ready")]
    Ready,
    [Display(Name = "Failed")]
    Failed,
    [Display(Name = "Archived")]
    Archived,
}
