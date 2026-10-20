using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.SpeakingFoundation.Commands;
using LingoPro.Application.Features.SpeakingFoundation.Queries;
using LingoPro.Domain.Enums;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for speaking foundation diagnostic probes, learner lexical evidence, and teacher classroom observations.
/// </summary>
[Route("api/v1/speaking-foundation")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class SpeakingFoundationController : ApiControllerBase
{
    [HttpGet("diagnostic/probes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DiagnosticProbeDto>>>> GetNextDiagnosticProbes(
        [FromQuery] CertLevel? targetLevel = null,
        [FromQuery] int maxProbes = 16,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetNextDiagnosticProbeQuery(targetLevel, maxProbes), ct);
        return OkResponse(result, "Speaking foundation diagnostic probes retrieved successfully.");
    }

    [HttpPost("evidence")]
    public async Task<ActionResult<ApiResponse<LexicalStatusBucket>>> RecordLexicalEvidence(
        [FromBody] RecordLexicalEvidenceCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Lexical speaking evidence recorded successfully.");
    }

    [HttpPost("teacher-observation")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<LexicalStatusBucket>>> RecordTeacherObservation(
        [FromBody] RecordTeacherLexicalObservationCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Teacher classroom lexical observation recorded successfully.");
    }
}
