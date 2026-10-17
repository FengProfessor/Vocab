using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Represents a daily contextual reading passage and comprehension quiz (public.daily_reading_exercises).
/// </summary>
public class DailyReadingExercise : BaseAuditableEntity
{
    public Guid? TargetUserId { get; set; }
    public Guid? ClassroomId { get; set; }
    public DateOnly ExerciseDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string Title { get; set; } = string.Empty;
    public string PassageContent { get; set; } = string.Empty;
    public CertLevel CertLevel { get; set; } = CertLevel.B1;
    public DailyReadingStatus Status { get; set; } = DailyReadingStatus.Ready;
    public string UsedWordsJson { get; set; } = "[]";
    public string McqQuestionsJson { get; set; } = "[]";
    public string ClozeItemsJson { get; set; } = "[]";
}
