using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Speaking;

/// <summary>
/// Records an observed lexical probe or teacher observation event (public.learner_lexical_evidence).
/// </summary>
public class LearnerLexicalEvidence : BaseAuditableEntity
{
    public Guid LearnerId { get; set; }
    public Guid? ActorUserId { get; set; }
    public Guid ConceptId { get; set; }
    public Guid? RepresentationId { get; set; }
    public LexicalEvidenceSource EvidenceSource { get; set; } = LexicalEvidenceSource.Learner;
    public LexicalSupportLevel SupportLevel { get; set; } = LexicalSupportLevel.Independent;
    public string ProbeType { get; set; } = "receptive_recognition";
    public bool IsSuccessful { get; set; }
    public int ResponseLatencyMs { get; set; }
    public DateTime ObservedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile Learner { get; set; } = null!;
    public virtual Profile? ActorUser { get; set; }
    public virtual FoundationLexicalConcept Concept { get; set; } = null!;
    public virtual FoundationRepresentation? Representation { get; set; }
}
