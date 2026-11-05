namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Vocabulary word saved or studied by the student in their personal or classroom workspace.
/// </summary>
public record TeacherStudentSavedWordDto(
    Guid Id,
    string Word,
    string Translation,
    string? Pos,
    string? Ipa,
    string? Example,
    DateTime? CreatedAt);
