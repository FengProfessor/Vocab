using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Represents a canonical grammar topic in the 62-topic CEFR curriculum.
/// </summary>
public record GrammarTopicDto(
    Guid Id,
    string Slug,
    string Title,
    string? TitleVi,
    GrammarLevel Level,
    CertLevel CertLevel,
    string Category,
    int SortOrder
);
