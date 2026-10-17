namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines AI model providers supported by the multi-tier AI router.
/// </summary>
public enum AiProviderType
{
    Gemini = 1,
    Groq = 2,
    Zhipu = 3,
    LocalHeuristic = 4
}
