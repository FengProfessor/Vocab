using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Represents a daily contextual reading passage and comprehension quiz (public.daily_reading_exercises).
/// </summary>
public class DailyReadingExercise : BaseEntity
{
    public Guid? ClassroomId { get; set; }
    public Guid? TargetUserId { get; set; }
    public DateOnly ExerciseDate { get; set; }
    public DateOnly SourceDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Passage { get; set; } = string.Empty;
    public string PassagePlain { get; set; } = string.Empty;

    /// <summary>SQL default 'A2'.</summary>
    public string? Level { get; set; } = "A2";

    /// <summary>jsonb [{q, options, answer, explain}].</summary>
    public string Questions { get; set; } = "[]";

    /// <summary>jsonb {text, blanks: [...]}.</summary>
    public string Cloze { get; set; } = "{}";

    /// <summary>jsonb [{word, translation, pos}].</summary>
    public string SourceWords { get; set; } = "[]";
    public string[]? UsedWords { get; set; } = [];
    public double? Coverage { get; set; } = 0;

    /// <summary>jsonb [{word, translation, pos, definition_en}].</summary>
    public string? BonusWords { get; set; } = "[]";

    /// <summary>'generating' | 'ready' | 'failed' | 'archived'. SQL default 'ready'.</summary>
    public string? Status { get; set; } = "ready";
    public string? ErrorMessage { get; set; }
    public DateTime? GeneratedAt { get; set; }

    /// <summary>jsonb generation metadata. SQL default '{}'.</summary>
    public string? GenerationMeta { get; set; } = "{}";

    public virtual ClassroomEntity? Classroom { get; set; }
    public virtual Profile? TargetUser { get; set; }
    public virtual ICollection<DailyReadingCompletion> Completions { get; set; } = new List<DailyReadingCompletion>();
}
