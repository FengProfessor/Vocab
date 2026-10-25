using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.AdminCrm.Queries;
using LingoPro.Domain.Entities.Admin;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing administrative CRM queries and pilot lead persistence against PostgreSQL.
/// </summary>
public sealed class AdminCrmRepository(IApplicationDbContext dbContext) : IAdminCrmRepository
{
    public Task<PilotLead?> GetPilotLeadByEmailAsync(string normalizedEmail, CancellationToken ct = default)
        => dbContext.PilotLeads.FirstOrDefaultAsync(x => x.IsDeleted != true && x.Email == normalizedEmail, ct);

    public void AddPilotLead(PilotLead lead)
        => dbContext.PilotLeads.Add(lead);

    public async Task<CrmDashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default)
    {
        var totalUsers = await dbContext.Profiles
            .AsNoTracking()
            .CountAsync(x => x.IsDeleted != true, ct);
        var activePremium = await dbContext.Profiles
            .AsNoTracking()
            .CountAsync(x => x.IsDeleted != true && x.Plan != SubscriptionPlanType.Free, ct);

        var pendingOrders = await dbContext.Orders
            .AsNoTracking()
            .CountAsync(x => x.IsDeleted != true && x.Status == OrderStatus.Pending, ct);

        var paidRevenue = await dbContext.Orders
            .AsNoTracking()
            .Where(x => x.IsDeleted != true && x.Status == OrderStatus.Paid)
            .SumAsync(x => x.Amount, ct);

        var pilotLeads = await dbContext.PilotLeads
            .AsNoTracking()
            .CountAsync(x => x.IsDeleted != true, ct);
        var pendingPayouts = await dbContext.PayoutRequests
            .AsNoTracking()
            .CountAsync(x => x.Status == PayoutRequestStatus.Pending, ct);

        return new CrmDashboardSummaryDto(
            TotalUsers: totalUsers,
            ActivePremiumUsers: activePremium,
            PendingOrdersCount: pendingOrders,
            TotalPaidRevenueVnd: paidRevenue,
            TotalPilotLeads: pilotLeads,
            PendingPayoutRequests: pendingPayouts);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
