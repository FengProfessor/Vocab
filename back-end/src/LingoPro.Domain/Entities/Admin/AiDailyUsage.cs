using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Tracks daily AI invocation quota consumption per user (public.ai_daily_usage).
/// </summary>
public class AiDailyUsage : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly UsageDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public int Count { get; set; }

    public virtual Profile User { get; set; } = null!;
}
