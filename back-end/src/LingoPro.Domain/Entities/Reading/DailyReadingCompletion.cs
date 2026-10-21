using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Records a learner's completion score on a daily reading exercise (public.daily_reading_completions).
/// </summary>
public class DailyReadingCompletion : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
    public int? McqScore { get; set; } = 0;
    public int? McqTotal { get; set; } = 0;
    public int? ClozeScore { get; set; } = 0;
    public int? ClozeTotal { get; set; } = 0;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual DailyReadingExercise Exercise { get; set; } = null!;
}
