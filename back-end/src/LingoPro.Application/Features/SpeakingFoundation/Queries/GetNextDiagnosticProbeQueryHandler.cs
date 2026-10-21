using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Handles retrieving speaking foundation diagnostic probes ordered by frequency band from the database.
/// </summary>
public sealed class GetNextDiagnosticProbeQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetNextDiagnosticProbeQuery, ApiResponse<IReadOnlyList<DiagnosticProbeDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<DiagnosticProbeDto>>> Handle(
        GetNextDiagnosticProbeQuery request,
        CancellationToken ct)
    {
        int limit = Math.Clamp(request.MaxProbes, 1, 50);

        var query = dbContext.FoundationLexicalConcepts.AsNoTracking();
        // SQL foundation_lexical_concepts has no cert_level column: TargetLevel cannot be filtered and CertLevel is returned as null.
        // frequency_band maps to the curriculum stage, concept_code to the varchar id, headword to lemma.

        var probes = await query
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

        return ApiResponse<IReadOnlyList<DiagnosticProbeDto>>.Ok(
            probes,
            "Speaking foundation diagnostic probes retrieved successfully.");
    }
}
