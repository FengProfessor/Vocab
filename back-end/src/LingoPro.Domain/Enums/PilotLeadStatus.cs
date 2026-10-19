using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines CRM pipeline statuses for B2B teacher and school pilot leads.
/// </summary>
public enum PilotLeadStatus
{
    [Display(Name = "New")]
    New,
    [Display(Name = "Contacted")]
    Contacted,
    [Display(Name = "Qualified")]
    Qualified,
    [Display(Name = "Won")]
    Won,
    [Display(Name = "Lost")]
    Lost,
    [Display(Name = "ActivePilot")]
    ActivePilot,
    [Display(Name = "Converted")]
    Converted,
    [Display(Name = "Closed")]
    Closed,
}
