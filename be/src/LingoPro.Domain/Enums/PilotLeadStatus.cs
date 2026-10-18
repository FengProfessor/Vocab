namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines CRM pipeline statuses for B2B teacher and school pilot leads.
/// </summary>
public enum PilotLeadStatus
{
    New = 0,
    Contacted = 1,
    Qualified = 2,
    Won = 3,
    Lost = 4,
    ActivePilot = 5,
    Converted = 6,
    Closed = 7
}
