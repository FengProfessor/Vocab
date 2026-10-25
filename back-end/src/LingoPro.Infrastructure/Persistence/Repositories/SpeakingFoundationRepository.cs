using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.SpeakingFoundation.Queries;
using LingoPro.Domain.Entities.Speaking;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing speaking foundation diagnostic probe queries and learner lexical evidence persistence.
/// </summary>
public sealed class SpeakingFoundationRepository(IApplicationDbContext dbContext) : ISpeakingFoundationRepository
{
    public void AddLexicalEvidence(LearnerLexicalEvidence evidence)
        => dbContext.LearnerLexicalEvidences.Add(evidence);

    public Task<LearnerLexicalState?> GetLexicalStateAsync(Guid learnerId, string conceptId, CancellationToken ct = default)
        => dbContext.LearnerLexicalStates.FirstOrDefaultAsync(
            s => s.LearnerId == learnerId && s.ConceptId == conceptId,
            ct);

    public void AddLexicalState(LearnerLexicalState state)
        => dbContext.LearnerLexicalStates.Add(state);

    public async Task<IReadOnlyList<DiagnosticProbeDto>> GetDiagnosticProbesAsync(int limit, CancellationToken ct = default)
    {
        return await dbContext.FoundationLexicalConcepts
            .AsNoTracking()
            .OrderBy(c => c.Stage)
            .ThenBy(c => c.Id)
            .Take(limit)
            .Select(c => new DiagnosticProbeDto(
                c.Id,
                c.Id,
                c.Lemma,
                c.Ipa,
                c.MeaningVi,
                c.Stage,
                null))
            .ToListAsync(ct);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
