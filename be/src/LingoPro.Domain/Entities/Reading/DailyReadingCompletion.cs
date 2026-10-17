using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Records a learner's completion score on a daily reading exercise (public.daily_reading_completions).
/// </summary>
public class DailyReadingCompletion : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
    public int McqScore { get; set; }
    public int McqTotal { get; set; }
    public int ClozeScore { get; set; }
    public int ClozeTotal { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
