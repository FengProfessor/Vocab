namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Structured bilingual grammar theory, formula, usage notes, and examples returned by AI lesson generation.
/// </summary>
public record GeneratedGrammarLessonDto(
    string TheoryVi,
    string Formula,
    string UsageNotes,
    IReadOnlyList<GrammarLessonExampleDto> Examples);
