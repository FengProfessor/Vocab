using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Tracks a learner's completed foundation micro-grammar steps for A0/A1 stages (public.grammar_micro_progress).
/// </summary>
public class GrammarMicroProgress : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public GrammarMicroStage Stage { get; set; } = GrammarMicroStage.A0;
    public int[] CompletedSteps { get; set; } = [];

    public virtual Profile User { get; set; } = null!;
}
