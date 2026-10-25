using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Admin;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.AdminCrm.Commands;

/// <summary>
/// Handles registering or returning an existing pilot lead by email.
/// </summary>
public sealed class SubscribePilotLeadCommandHandler(IAdminCrmRepository adminCrmRepository)
    : IRequestHandler<SubscribePilotLeadCommand, ApiResponse<Guid>>
{
    public async Task<ApiResponse<Guid>> Handle(SubscribePilotLeadCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existing = await adminCrmRepository.GetPilotLeadByEmailAsync(normalizedEmail, ct);

        if (existing is not null)
        {
            return ApiResponse<Guid>.Created(existing.Id, "Pilot lead already registered.");
        }

        var lead = new PilotLead
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone.Trim(),
            Organization = request.OrganizationName?.Trim() ?? string.Empty,
            Source = request.SourceCampaign.Trim(),
            Status = PilotLeadStatus.New
        };

        adminCrmRepository.AddPilotLead(lead);
        await adminCrmRepository.SaveChangesAsync(ct);

        return ApiResponse<Guid>.Created(lead.Id, "Pilot lead subscribed successfully.");
    }
}
