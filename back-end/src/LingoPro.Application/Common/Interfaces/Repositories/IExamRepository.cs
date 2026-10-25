using LingoPro.Domain.Entities.Exam;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for persisting standardized exam results (TOEIC, VSTEP, VNU) and awarding learner XP.
/// </summary>
public interface IExamRepository
{
    void AddToeicTestResult(ToeicTestResult result);

    Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
