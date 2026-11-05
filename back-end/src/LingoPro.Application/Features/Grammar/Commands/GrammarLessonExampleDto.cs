namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Bilingual example sentence item within an AI-generated grammar lesson.
/// </summary>
public record GrammarLessonExampleDto(
    string En,
    string Vi,
    string? Note);
