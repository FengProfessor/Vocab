using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Tracks the multi-dimensional mastery profile and gap classification for a learner's lexical concept (public.learner_lexical_state).
/// <c>learner_id</c> references auth.users, so there is no profile navigation.
/// </summary>
public class LearnerLexicalState : BaseEntity
{
    public Guid LearnerId { get; set; }
    public string ConceptId { get; set; } = string.Empty;
    public LexicalStatusBucket StatusBucket { get; set; } = LexicalStatusBucket.Uncertain;
    public string ActiveGap { get; set; } = "UNKNOWN_CONCEPT_OR_FORM";
    public bool SoundRecognition { get; set; }
    public bool TextRecognition { get; set; }
    public bool MeaningRecall { get; set; }
    public bool FormRecall { get; set; }
    public bool ChunkUse { get; set; }
    public bool GenerativeUse { get; set; }
    public bool RetentionStable { get; set; }
    public decimal UncertaintyScore { get; set; } = 1.00m;
    public LexicalSupportLevel? LastSupportLevel { get; set; } = LexicalSupportLevel.Independent;
    public int? LastLatencyMs { get; set; }
    public int ConsecutiveIndependentPasses { get; set; }
    public DateTime? LastProbedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual FoundationLexicalConcept Concept { get; set; } = null!;
}