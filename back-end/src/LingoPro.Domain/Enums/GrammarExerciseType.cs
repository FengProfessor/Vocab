using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines grammar exercise question formats ('multiple_choice', 'fill_blank', 'error_correction').
/// </summary>
public enum GrammarExerciseType
{
    [Display(Name = "MultipleChoice")]
    MultipleChoice,
    [Display(Name = "FillBlank")]
    FillBlank,
    [Display(Name = "ErrorCorrection")]
    ErrorCorrection,
}
