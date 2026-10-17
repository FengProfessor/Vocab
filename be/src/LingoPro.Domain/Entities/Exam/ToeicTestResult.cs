using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Exam;

/// <summary>
/// Represents a completed standardized exam submission and its scaled scores (public.toeic_test_results).
/// </summary>
public class ToeicTestResult : BaseAuditableEntity
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

    public virtual Profile User { get; set; } = null!;
}
