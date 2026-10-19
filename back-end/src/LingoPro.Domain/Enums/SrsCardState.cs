using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines the FSRS v5 scheduling state of a vocabulary or grammar card.
/// </summary>
public enum SrsCardState
{
    [Display(Name = "New")]
    New,
    [Display(Name = "Learning")]
    Learning,
    [Display(Name = "Review")]
    Review,
    [Display(Name = "Relearning")]
    Relearning,
}
