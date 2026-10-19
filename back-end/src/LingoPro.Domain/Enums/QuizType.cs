using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines classroom quiz categories mapped from quiz_results.quiz_type ('vocabulary', 'grammar').
/// </summary>
public enum QuizType
{
    [Display(Name = "Vocabulary")]
    Vocabulary,
    [Display(Name = "Grammar")]
    Grammar,
}
