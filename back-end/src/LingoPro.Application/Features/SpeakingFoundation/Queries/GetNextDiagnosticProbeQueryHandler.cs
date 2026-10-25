using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Handles retrieving speaking foundation diagnostic probes ordered by frequency band via the speaking foundation repository.
/// </summary>
public sealed class GetNextDiagnosticProbeQueryHandler(ISpeakingFoundationRepository speakingFoundationRepository)
    : IRequestHandler<GetNextDiagnosticProbeQuery, ApiResponse<IReadOnlyList<DiagnosticProbeDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<DiagnosticProbeDto>>> Handle(
        GetNextDiagnosticProbeQuery request,
        CancellationToken ct)
    {
        int limit = Math.Clamp(request.MaxProbes, 1, 50);

        var probes = await speakingFoundationRepository.GetDiagnosticProbesAsync(limit, ct);

        return ApiResponse<IReadOnlyList<DiagnosticProbeDto>>.Ok(
            probes,
            "Speaking foundation diagnostic probes retrieved successfully.");
    }
}
