namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Classroom leaderboard payload containing ranked student entries for the requested period.
/// </summary>
public record ClassroomLeaderboardDto(
    IReadOnlyList<ClassroomLeaderboardEntryDto> Data,
    string Period,
    string ClassroomName);
