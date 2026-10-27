namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Represents a single vocabulary word input item to be imported as part of a curated micro-pack.
/// </summary>
public sealed record ImportVocabPackWordInputDto(
    string Word,
    string? Translation = null,
    string? Ipa = null,
    string? Pos = null,
    string? Example = null,
    string? ExampleVi = null
);
