using LingoPro.Application.Features.SpeakingFoundation.Queries;
using LingoPro.Domain.Entities.Speaking;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for speaking foundation diagnostic probes, lexical evidence, and learner lexical state.
/// </summary>
public interface ISpeakingFoundationRepository
{
    void AddLexicalEvidence(LearnerLexicalEvidence evidence);

    Task<LearnerLexicalState?> GetLexicalStateAsync(Guid learnerId, string conceptId, CancellationToken ct = default);

    void AddLexicalState(LearnerLexicalState state);

    Task<IReadOnlyList<DiagnosticProbeDto>> GetDiagnosticProbesAsync(int limit, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
