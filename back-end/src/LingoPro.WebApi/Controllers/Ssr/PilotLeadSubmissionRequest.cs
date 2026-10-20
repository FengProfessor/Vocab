namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Request payload for pilot lead form submissions from the B2B Teacher landing page.
/// </summary>
public sealed record PilotLeadSubmissionRequest(
    string? ContactName,
    string? Name,
    string? Email,
    string? Phone,
    string? Organization,
    int? TeacherCount,
    int? StudentCount,
    string? Message,
    string? Source,
    string? Website);
