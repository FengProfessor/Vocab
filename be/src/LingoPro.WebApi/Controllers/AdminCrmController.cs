using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.AdminCrm;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for administrative CRM analytics and public pilot lead capture.
/// </summary>
[Route("api/v1/admin")]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class AdminCrmController : ApiControllerBase
{
    [HttpGet("crm/dashboard")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<ApiResponse<CrmDashboardSummaryDto>>> GetCrmDashboard(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminCrmDashboardQuery(), ct);
        return OkResponse(result, "Administrative CRM dashboard summary retrieved successfully.");
    }

    [HttpPost("leads/subscribe")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<Guid>>> SubscribePilotLead(
        [FromBody] SubscribePilotLeadCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result, "Speaking pilot lead subscribed successfully.");
    }
}
