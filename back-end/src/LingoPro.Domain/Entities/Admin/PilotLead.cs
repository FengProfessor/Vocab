using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Represents a B2B teacher/school pilot or lead magnet inquiry (public.pilot_leads).
/// </summary>
public class PilotLead : BaseAuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string SourceCampaign { get; set; } = "b2b_pilot";
    public PilotLeadStatus Status { get; set; } = PilotLeadStatus.New;
    public string? Notes { get; set; }
}
