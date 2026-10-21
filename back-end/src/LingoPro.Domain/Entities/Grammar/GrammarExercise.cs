using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents a grammar drill exercise linked to a classroom and optionally a lesson (public.grammar_exercises).
/// </summary>
public class GrammarExercise : BaseEntity
{
    public Guid ClassroomId { get; set; }
    public string Topic { get; set; } = string.Empty;

    /// <summary>'beginner' | 'intermediate' | 'advanced'. SQL default 'beginner'.</summary>
    public string? Level { get; set; } = "beginner";
    public string Question { get; set; } = string.Empty;
    public string[] Options { get; set; } = [];
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? Explanation { get; set; }

    /// <summary>'multiple_choice' | 'fill_blank' | 'error_correction'. SQL default 'multiple_choice'.</summary>
    public string? Type { get; set; } = "multiple_choice";

    /// <summary>Between 1 and 3. SQL default 2.</summary>
    public short? Difficulty { get; set; } = 2;
    public Guid? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid? LessonId { get; set; }

    public virtual GrammarLesson? Lesson { get; set; }
    public virtual ClassroomEntity Classroom { get; set; } = null!;
    public virtual Profile? CreatedByProfile { get; set; }
    public virtual ICollection<GrammarResult> Results { get; set; } = new List<GrammarResult>();
}
