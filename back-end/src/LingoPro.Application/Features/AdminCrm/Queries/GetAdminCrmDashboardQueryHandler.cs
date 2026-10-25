using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AdminCrm.Queries;

/// <summary>
/// Handles aggregating real-time CRM metrics from the database for administrator dashboards.
/// </summary>
public sealed class GetAdminCrmDashboardQueryHandler(
    IAdminCrmRepository adminCrmRepository) : IRequestHandler<GetAdminCrmDashboardQuery, ApiResponse<CrmDashboardSummaryDto>>
{
    public async Task<ApiResponse<CrmDashboardSummaryDto>> Handle(
        GetAdminCrmDashboardQuery request,
        CancellationToken ct)
    {
        var dto = await adminCrmRepository.GetDashboardSummaryAsync(ct);

        return ApiResponse<CrmDashboardSummaryDto>.Ok(
            dto,
            "Administrative CRM dashboard summary retrieved successfully.");
    }
}
