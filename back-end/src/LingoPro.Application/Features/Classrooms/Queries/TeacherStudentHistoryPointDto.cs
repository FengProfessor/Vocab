namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Historical daily VMS and LCS snapshot for a student's 30-day learning trajectory chart.
/// </summary>
public record TeacherStudentHistoryPointDto(
    int Vms,
    int Lcs,
    int TotalWords,
    string RecordedAt);
