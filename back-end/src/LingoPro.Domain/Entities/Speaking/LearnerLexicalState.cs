using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Tracks the derived mastery state and uncertainty bucket for a learner's lexical concept (public.learner_lexical_state).
/// </summary>
public class LearnerLexicalState : BaseAuditableEntity
{
    public Guid LearnerId { get; set; }
    public Guid ConceptId { get; set; }
    public LexicalStatusBucket StatusBucket { get; set; } = LexicalStatusBucket.Unknown;
    public string MasteryState { get; set; } = "unseen";
    public int EvidenceCount { get; set; }
    public double ConfidenceScore { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile Learner { get; set; } = null!;
    public virtual FoundationLexicalConcept Concept { get; set; } = null!;
}
