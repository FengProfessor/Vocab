using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.AdminCrm.Queries;

/// <summary>
/// Query to retrieve administrative CRM dashboard metrics (restricted to Administrator role).
/// </summary>
[Authorize(UserRole.Admin)]
public sealed record GetAdminCrmDashboardQuery : IRequest<ApiResponse<CrmDashboardSummaryDto>>;
