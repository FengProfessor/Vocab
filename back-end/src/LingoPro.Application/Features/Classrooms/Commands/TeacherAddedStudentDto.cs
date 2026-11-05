namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Profile projection returned when a teacher adds a student to a classroom by email.
/// </summary>
public record TeacherAddedStudentDto(
    Guid Id,
    string Email,
    string? FullName,
    string? AvatarUrl);
