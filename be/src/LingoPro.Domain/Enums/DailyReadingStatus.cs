namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines generation lifecycle statuses for daily reading exercises ('generating', 'ready', 'failed', 'archived').
/// </summary>
public enum DailyReadingStatus
{
    Generating = 0,
    Ready = 1,
    Failed = 2,
    Archived = 3
}
