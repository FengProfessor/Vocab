using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines grammar topic proficiency levels mapped from grammar_topics.level.
/// </summary>
public enum GrammarLevel
{
    [Display(Name = "A0")]
    A0,
    [Display(Name = "A1")]
    A1,
    [Display(Name = "A2")]
    A2,
    [Display(Name = "B1")]
    B1,
    [Display(Name = "B2")]
    B2,
    [Display(Name = "Beginner")]
    Beginner,
    [Display(Name = "Intermediate")]
    Intermediate,
    [Display(Name = "Advanced")]
    Advanced,
}
