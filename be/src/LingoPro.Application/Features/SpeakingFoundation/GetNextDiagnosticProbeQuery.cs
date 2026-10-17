using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation;

/// <summary>
/// Query to retrieve the next speaking foundation diagnostic probes for the authenticated learner.
/// </summary>
public sealed record GetNextDiagnosticProbeQuery(
    CertLevel? TargetLevel = null,
    int MaxProbes = 16) : IRequest<ApiResponse<IReadOnlyList<DiagnosticProbeDto>>>;
