namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Represents a canonical lexical concept in the Grade 6 Foundation Curriculum (public.foundation_lexical_concepts, varchar PK e.g. 'CON-G6-001').
/// </summary>
public class FoundationLexicalConcept
{
    public string Id { get; set; } = string.Empty;
    public string Lemma { get; set; } = string.Empty;
    public string Pos { get; set; } = string.Empty;
    public string Ipa { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string Cluster { get; set; } = string.Empty;
    public int GenerativePower { get; set; } = 50;
    public int Stage { get; set; }

    /// <summary>
    /// Target chunk patterns JSON array stored as jsonb.
    /// </summary>
    public string TargetChunks { get; set; } = "[]";

    /// <summary>
    /// Contrast concepts JSON array stored as jsonb.
    /// </summary>
    public string ContrastConcepts { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<FoundationRepresentation> Representations { get; set; } = new List<FoundationRepresentation>();
    public virtual ICollection<LearnerLexicalEvidence> Evidences { get; set; } = new List<LearnerLexicalEvidence>();
    public virtual ICollection<LearnerLexicalState> LearnerStates { get; set; } = new List<LearnerLexicalState>();
}