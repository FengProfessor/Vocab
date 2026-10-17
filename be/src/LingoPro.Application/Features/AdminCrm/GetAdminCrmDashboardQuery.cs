using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AdminCrm;

/// <summary>
/// Query to retrieve administrative CRM dashboard metrics.
/// </summary>
public sealed record GetAdminCrmDashboardQuery : IRequest<ApiResponse<CrmDashboardSummaryDto>>;
