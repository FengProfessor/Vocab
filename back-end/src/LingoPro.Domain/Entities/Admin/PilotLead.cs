using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Represents a B2B teacher/school pilot or lead magnet inquiry (public.pilot_leads).
/// </summary>
public class PilotLead : BaseAuditableEntity
{
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public int TeacherCount { get; set; }
    public int StudentCount { get; set; }
    public string? Message { get; set; }
    public string Source { get; set; } = "teacher_landing";
    public PilotLeadStatus Status { get; set; } = PilotLeadStatus.New;
    public string? AdminNote { get; set; }
    public DateTime? ContactedAt { get; set; }
    public DateTime? ConvertedAt { get; set; }
}
