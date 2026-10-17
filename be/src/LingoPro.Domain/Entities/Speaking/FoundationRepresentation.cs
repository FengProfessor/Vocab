using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Represents a multi-modal asset (Text, Audio, Visual, Syntactic Frame) for a foundation lexical concept (public.foundation_representations).
/// </summary>
public class FoundationRepresentation : BaseAuditableEntity
{
    public string RepresentationCode { get; set; } = string.Empty;
    public Guid ConceptId { get; set; }
    public FoundationModalityType Modality { get; set; } = FoundationModalityType.Text;
    public string SubType { get; set; } = "lemma";
    public string ContentPayload { get; set; } = string.Empty;
    public FoundationClarityRating ClarityRating { get; set; } = FoundationClarityRating.V0;
    public bool ApprovedDiagnostic { get; set; }
    public bool ApprovedTeaching { get; set; } = true;
    public string MetadataJson { get; set; } = "{}";

    public virtual FoundationLexicalConcept Concept { get; set; } = null!;
}
