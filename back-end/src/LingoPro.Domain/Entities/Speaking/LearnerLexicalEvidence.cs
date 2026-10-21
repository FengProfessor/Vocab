using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Records an observed lexical probe or teacher observation event (public.learner_lexical_evidence).
/// <c>actor_user_id</c> and <c>learner_id</c> reference auth.users, so there are no profile navigations.
/// </summary>
public class LearnerLexicalEvidence : BaseEntity
{
    public Guid ActorUserId { get; set; }
    public Guid LearnerId { get; set; }
    public LexicalEvidenceSource EvidenceSource { get; set; } = LexicalEvidenceSource.Learner;
    public string ConceptId { get; set; } = string.Empty;
    public string? RepresentationId { get; set; }
    public string ProbeMode { get; set; } = string.Empty;
    public string TargetDimension { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public LexicalSupportLevel SupportLevel { get; set; }
    public int ResponseLatencyMs { get; set; }
    public string? DistractorSelected { get; set; }
    public string? LessonId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual FoundationLexicalConcept Concept { get; set; } = null!;
    public virtual FoundationRepresentation? Representation { get; set; }
}