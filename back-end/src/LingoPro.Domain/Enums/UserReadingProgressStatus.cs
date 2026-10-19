using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines learner progress statuses for reading library articles ('in_progress', 'completed', 'bookmarked').
/// </summary>
public enum UserReadingProgressStatus
{
    [Display(Name = "InProgress")]
    InProgress,
    [Display(Name = "Completed")]
    Completed,
    [Display(Name = "Bookmarked")]
    Bookmarked,
}
