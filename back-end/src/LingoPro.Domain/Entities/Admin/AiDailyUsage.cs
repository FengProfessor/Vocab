using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Tracks daily AI invocation quota consumption per user (public.ai_daily_usage, composite PK user_id + usage_date).
/// </summary>
public class AiDailyUsage
{
    public Guid UserId { get; set; }
    public DateOnly UsageDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public int Count { get; set; }

    public virtual Profile User { get; set; } = null!;
}
