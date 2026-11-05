namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Ranked student entry in a classroom XP and vocabulary leaderboard.
/// </summary>
public record ClassroomLeaderboardEntryDto(
    int Rank,
    Guid StudentId,
    string Name,
    string? AvatarUrl,
    int Xp,
    int WordsLearned,
    int Streak,
    bool IsCurrentUser);
