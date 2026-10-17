using LingoPro.Domain.Common;

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

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
