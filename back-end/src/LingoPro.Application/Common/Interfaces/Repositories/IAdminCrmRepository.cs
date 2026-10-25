using LingoPro.Application.Features.AdminCrm.Queries;
using LingoPro.Domain.Entities.Admin;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for administrative CRM metrics and pilot lead persistence.
/// </summary>
public interface IAdminCrmRepository
{
    Task<PilotLead?> GetPilotLeadByEmailAsync(string normalizedEmail, CancellationToken ct = default);

    void AddPilotLead(PilotLead lead);

    Task<CrmDashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
