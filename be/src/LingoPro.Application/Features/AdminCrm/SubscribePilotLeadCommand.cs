using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AdminCrm;

/// <summary>
/// Public command to capture a B2B teacher/school or speaking pilot lead from the landing page.
/// </summary>
public sealed record SubscribePilotLeadCommand(
    string FullName,
    string Email,
    string Phone = "",
    string? OrganizationName = null,
    string SourceCampaign = "landing") : IRequest<ApiResponse<Guid>>;
