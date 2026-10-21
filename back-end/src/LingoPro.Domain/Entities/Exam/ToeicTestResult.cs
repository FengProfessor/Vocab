using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Exam;

/// <summary>
/// Represents a completed standardized exam submission and its scaled scores (public.toeic_test_results).
/// NOTE: no SQL definition exists under supabase/; columns mirror the existing EF InitialCreate migration minus audit/soft-delete columns.
/// </summary>
public class ToeicTestResult : BaseEntity
{
    public Guid UserId { get; set; }
    public string TestId { get; set; } = string.Empty;
    public ExamType ExamType { get; set; } = ExamType.Toeic;
    public int ListeningCorrect { get; set; }
    public int ReadingCorrect { get; set; }
    public int ListeningScaledScore { get; set; }
    public int ReadingScaledScore { get; set; }
    public int TotalScore { get; set; }
    public int DurationSeconds { get; set; }
    public string AnswersJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}
