using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines recall quality ratings for FSRS v5 scheduling ('Again', 'Hard', 'Good', 'Easy').
/// </summary>
public enum SrsReviewQuality
{
    [Display(Name = "Again")]
    Again,
    [Display(Name = "Hard")]
    Hard,
    [Display(Name = "Good")]
    Good,
    [Display(Name = "Easy")]
    Easy,
}
