using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines difficulty tiers for grammar exercises (1 = Easy, 2 = Medium, 3 = Hard).
/// </summary>
public enum GrammarDifficultyLevel
{
    [Display(Name = "Easy")]
    Easy,
    [Display(Name = "Medium")]
    Medium,
    [Display(Name = "Hard")]
    Hard,
}
