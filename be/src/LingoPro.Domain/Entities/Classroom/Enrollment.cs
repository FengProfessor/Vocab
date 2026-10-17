using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Classroom;

/// <summary>
/// Represents a student's enrollment in a classroom (public.enrollments).
/// </summary>
public class Enrollment : BaseAuditableEntity
{
    public Guid ClassroomId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public virtual ClassroomEntity Classroom { get; set; } = null!;
}
