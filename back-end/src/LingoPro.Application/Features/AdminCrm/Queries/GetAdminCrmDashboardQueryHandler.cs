using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.AdminCrm.Queries;

/// <summary>
/// Handles aggregating real-time CRM metrics from the database for administrator dashboards.
/// </summary>
public sealed class GetAdminCrmDashboardQueryHandler(
    IApplicationDbContext dbContext) : IRequestHandler<GetAdminCrmDashboardQuery, ApiResponse<CrmDashboardSummaryDto>>
{
    public async Task<ApiResponse<CrmDashboardSummaryDto>> Handle(
        GetAdminCrmDashboardQuery request,
        CancellationToken ct)
    {
        var totalUsers = await dbContext.Profiles.AsNoTracking().CountAsync(ct);
        var activePremium = await dbContext.Profiles
            .AsNoTracking()
            .CountAsync(x => x.Plan != SubscriptionPlanType.Free, ct);

        var pendingOrders = await dbContext.Orders
            .AsNoTracking()
            .CountAsync(x => x.Status == OrderStatus.Pending, ct);

        var paidRevenue = await dbContext.Orders
            .AsNoTracking()
            .Where(x => x.Status == OrderStatus.Paid)
            .SumAsync(x => x.Amount, ct);

        var pilotLeads = await dbContext.PilotLeads.AsNoTracking().CountAsync(ct);
        var pendingPayouts = await dbContext.PayoutRequests
            .AsNoTracking()
            .CountAsync(x => x.Status == PayoutRequestStatus.Pending, ct);

        var dto = new CrmDashboardSummaryDto(
            TotalUsers: totalUsers,
            ActivePremiumUsers: activePremium,
            PendingOrdersCount: pendingOrders,
            TotalPaidRevenueVnd: paidRevenue,
            TotalPilotLeads: pilotLeads,
            PendingPayoutRequests: pendingPayouts);

        return ApiResponse<CrmDashboardSummaryDto>.Ok(
            dto,
            "Administrative CRM dashboard summary retrieved successfully.");
    }
}
