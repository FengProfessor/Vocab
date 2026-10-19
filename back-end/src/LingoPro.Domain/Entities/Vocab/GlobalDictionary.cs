using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Represents a canonical dictionary headword entry with definitions, collocations, and synonyms (public.global_dictionary).
/// </summary>
public class GlobalDictionary : BaseAuditableEntity
{
    public string Term { get; set; } = string.Empty;
    public string Ipa { get; set; } = string.Empty;
    public string PartOfSpeech { get; set; } = string.Empty;
    public string DefinitionsJson { get; set; } = "[]";
    public string CollocationsJson { get; set; } = "[]";
    public string SynonymsJson { get; set; } = "[]";
    public string AntonymsJson { get; set; } = "[]";
    public string WordFamilyJson { get; set; } = "[]";
    public string? ImageUrl { get; set; }
}
