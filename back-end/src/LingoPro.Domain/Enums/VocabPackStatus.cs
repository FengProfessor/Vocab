using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines completion statuses for user vocabulary packs ('not_started', 'in_progress', 'completed').
/// </summary>
public enum VocabPackStatus
{
    [Display(Name = "NotStarted")]
    NotStarted,
    [Display(Name = "InProgress")]
    InProgress,
    [Display(Name = "Completed")]
    Completed,
}
