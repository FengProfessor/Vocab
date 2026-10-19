using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines AI model providers supported by the multi-tier AI router.
/// </summary>
public enum AiProviderType
{
    [Display(Name = "Gemini")]
    Gemini,
    [Display(Name = "Groq")]
    Groq,
    [Display(Name = "Zhipu")]
    Zhipu,
    [Display(Name = "LocalHeuristic")]
    LocalHeuristic,
}
