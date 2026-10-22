using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Admin;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.AdminCrm.Commands;

/// <summary>
/// Handles registering or returning an existing pilot lead by email.
/// </summary>
public sealed class SubscribePilotLeadCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<SubscribePilotLeadCommand, ApiResponse<Guid>>
{
    public async Task<ApiResponse<Guid>> Handle(SubscribePilotLeadCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existing = await dbContext.PilotLeads
            .FirstOrDefaultAsync(x => x.Email == normalizedEmail, ct);

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

        dbContext.PilotLeads.Add(lead);
        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<Guid>.Created(lead.Id, "Pilot lead subscribed successfully.");
    }
}
