namespace LingoPro.Application.Features.AdminCrm;

/// <summary>
/// Data transfer object containing administrative CRM and revenue summary metrics.
/// </summary>
public sealed record CrmDashboardSummaryDto(
    int TotalUsers,
    int ActivePremiumUsers,
    int PendingOrdersCount,
    decimal TotalPaidRevenueVnd,
    int TotalPilotLeads,
    int PendingPayoutRequests);
