using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Represents a canonical lexical concept in the Grade 6 Foundation Curriculum (public.foundation_lexical_concepts).
/// </summary>
public class FoundationLexicalConcept : BaseAuditableEntity
{
    public string ConceptCode { get; set; } = string.Empty;
    public string Headword { get; set; } = string.Empty;
    public string Ipa { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public int FrequencyBand { get; set; } = 1;
    public CertLevel CertLevel { get; set; } = CertLevel.A1;

    public virtual ICollection<FoundationRepresentation> Representations { get; set; } = new List<FoundationRepresentation>();
    public virtual ICollection<LearnerLexicalEvidence> Evidences { get; set; } = new List<LearnerLexicalEvidence>();
    public virtual ICollection<LearnerLexicalState> LearnerStates { get; set; } = new List<LearnerLexicalState>();
}
