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
        if (request.TargetLevel.HasValue)
        {
            query = query.Where(c => c.CertLevel == request.TargetLevel.Value);
        }

        var probes = await query
            .OrderBy(c => c.FrequencyBand)
            .ThenBy(c => c.ConceptCode)
            .Take(limit)
            .Select(c => new DiagnosticProbeDto(
                c.Id,
                c.ConceptCode,
                c.Headword,
                c.Ipa,
                c.MeaningVi,
                c.FrequencyBand,
                c.CertLevel))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<DiagnosticProbeDto>>.Ok(
            probes,
            "Speaking foundation diagnostic probes retrieved successfully.");
    }
}
