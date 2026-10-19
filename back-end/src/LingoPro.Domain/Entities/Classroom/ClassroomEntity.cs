using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Vocab;

namespace LingoPro.Domain.Entities.Classroom;

/// <summary>
/// Represents a teacher-managed classroom or a user's personal workspace (public.classrooms).
/// </summary>
public class ClassroomEntity : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }

    /// <summary>
    /// Indicates whether this classroom is a system-created personal vocabulary workspace.
    /// </summary>
    public bool IsPersonal => Name == "__personal__";

    public virtual Profile Teacher { get; set; } = null!;
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<Word> Words { get; set; } = new List<Word>();
    public virtual ICollection<StudentDailyStat> DailyStats { get; set; } = new List<StudentDailyStat>();
}
