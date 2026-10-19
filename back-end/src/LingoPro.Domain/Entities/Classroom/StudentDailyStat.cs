using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Classroom;

/// <summary>
/// Stores daily Vocabulary Mastery Score (VMS) and Learning Consistency Score (LCS) snapshots for a classroom student (public.student_daily_stats).
/// </summary>
public class StudentDailyStat : BaseAuditableEntity
{
    public Guid StudentId { get; set; }
    public Guid ClassroomId { get; set; }
    public int Vms { get; set; }
    public int Lcs { get; set; }
    public int TotalWords { get; set; }
    public DateOnly RecordedAt { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public virtual Profile Student { get; set; } = null!;
    public virtual ClassroomEntity Classroom { get; set; } = null!;
}
