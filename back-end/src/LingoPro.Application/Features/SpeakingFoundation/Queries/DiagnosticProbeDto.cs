using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Data transfer object representing a speaking foundation diagnostic probe concept.
/// </summary>
public sealed record DiagnosticProbeDto(
    string ConceptId,
    string ConceptCode,
    string Headword,
    string Ipa,
    string MeaningVi,
    int FrequencyBand,
    CertLevel? CertLevel);
