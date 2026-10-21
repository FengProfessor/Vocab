using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Tracks a learner's completed foundation micro-grammar steps for A0/A1 stages (public.grammar_micro_progress).
/// The primary key is the composite (<see cref="UserId"/>, <see cref="Stage"/>).
/// </summary>
public class GrammarMicroProgress
{
    public Guid UserId { get; set; }

    /// <summary>Lowercase stage key: 'a0' or 'a1'.</summary>
    public string Stage { get; set; } = "a0";
    public int[] CompletedSteps { get; set; } = [];
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}
