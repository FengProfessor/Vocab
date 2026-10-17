using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.AdminCrm;

/// <summary>
/// Handles retrieving administrative CRM dashboard metrics using bounded single-page queries.
/// </summary>
public sealed class GetAdminCrmDashboardQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetAdminCrmDashboardQuery, ApiResponse<CrmDashboardSummaryDto>>
{
    public async Task<ApiResponse<CrmDashboardSummaryDto>> Handle(
        GetAdminCrmDashboardQuery request,
        CancellationToken ct)
    {
        if (!currentUser.IsAdmin)
        {
            throw new ForbiddenAccessException("Administrator access is required.");
        }

        var profiles = await dbContext.Profiles
            .AsNoTracking()
            .Take(1000)
            .Select(x => new { x.Plan })
            .ToListAsync(ct);

        var orders = await dbContext.Orders
            .AsNoTracking()
            .Take(1000)
            .Select(x => new { x.Status, x.Amount })
            .ToListAsync(ct);

        var leadsCount = await dbContext.PilotLeads
            .AsNoTracking()
            .Take(1000)
            .CountAsync(ct);

        var payoutsCount = await dbContext.PayoutRequests
            .AsNoTracking()
            .Where(x => x.Status == PayoutRequestStatus.Pending)
            .CountAsync(ct);

        var dto = new CrmDashboardSummaryDto(
            TotalUsers: profiles.Count,
            ActivePremiumUsers: profiles.Count(x => x.Plan != SubscriptionPlanType.Free),
            PendingOrdersCount: orders.Count(x => x.Status == OrderStatus.Pending),
            TotalPaidRevenueVnd: orders.Where(x => x.Status == OrderStatus.Paid).Sum(x => x.Amount),
            TotalPilotLeads: leadsCount,
            PendingPayoutRequests: payoutsCount);

        return ApiResponse<CrmDashboardSummaryDto>.Ok(
            dto,
            "Administrative CRM dashboard summary retrieved successfully.");
    }
}
