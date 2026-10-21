using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Represents a multi-modal asset (Text, Audio, Visual, Syntactic Frame) for a foundation lexical concept (public.foundation_representations, varchar PK e.g. 'AUD-G6-001').
/// </summary>
public class FoundationRepresentation
{
    public string Id { get; set; } = string.Empty;
    public string ConceptId { get; set; } = string.Empty;
    public FoundationModalityType Modality { get; set; }
    public string SubType { get; set; } = string.Empty;
    public string ContentPayload { get; set; } = string.Empty;
    public FoundationClarityRating ClarityRating { get; set; } = FoundationClarityRating.V0;
    public bool ApprovedDiagnostic { get; set; }
    public bool ApprovedTeaching { get; set; } = true;

    /// <summary>
    /// Asset metadata JSON stored as jsonb (column <c>metadata</c>).
    /// </summary>
    public string Metadata { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual FoundationLexicalConcept Concept { get; set; } = null!;
}