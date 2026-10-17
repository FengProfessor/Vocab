namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Represents a teacher-managed classroom summary.
/// </summary>
public record ClassroomDto(
    Guid Id,
    string Name,
    string? Description,
    string InviteCode,
    Guid TeacherId,
    int StudentCount,
    DateTime CreatedAt
);
