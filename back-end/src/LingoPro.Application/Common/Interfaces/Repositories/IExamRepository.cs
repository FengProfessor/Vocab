using LingoPro.Domain.Entities.Exam;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for persisting standardized exam results (TOEIC, VSTEP, VNU), TOEIC per-question history, and awarding learner XP.
/// </summary>
public interface IExamRepository
{
    void AddToeicTestResult(ToeicTestResult result);

    Task<List<UserToeicQuestionHistory>> GetToeicQuestionHistoryAsNoTrackingAsync(
        Guid userId,
        int? partNumber = null,
        CancellationToken ct = default);

    Task<int> UpsertToeicQuestionHistoryAsync(
        Guid userId,
        IReadOnlyList<UserToeicQuestionHistory> entries,
        CancellationToken ct = default);

    Task<int> DeleteToeicQuestionHistoryAsync(
        Guid userId,
        int? partNumber = null,
        IReadOnlyList<string>? questionIds = null,
        CancellationToken ct = default);

    Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
