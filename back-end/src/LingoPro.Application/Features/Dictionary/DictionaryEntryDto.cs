namespace LingoPro.Application.Features.Dictionary;

/// <summary>
/// Represents a canonical dictionary headword entry and optional contextual sense index.
/// </summary>
public record DictionaryEntryDto(
    Guid Id,
    string Term,
    string Ipa,
    string PartOfSpeech,
    string DefinitionsJson,
    string CollocationsJson,
    string SynonymsJson,
    string AntonymsJson,
    int? BestContextualSenseIndex
);
