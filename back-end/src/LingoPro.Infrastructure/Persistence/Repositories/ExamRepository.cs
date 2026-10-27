using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Exam;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository persisting standardized exam attempts, TOEIC per-question history, and awarding learner gamification XP.
/// </summary>
public sealed class ExamRepository(IApplicationDbContext dbContext) : IExamRepository
{
    public void AddToeicTestResult(ToeicTestResult result)
        => dbContext.ToeicTestResults.Add(result);

    public Task<List<UserToeicQuestionHistory>> GetToeicQuestionHistoryAsNoTrackingAsync(
        Guid userId,
        int? partNumber = null,
        CancellationToken ct = default)
    {
        var query = dbContext.UserToeicQuestionHistories
            .AsNoTracking()
            .Where(h => h.UserId == userId);

        if (partNumber.HasValue)
        {
            query = query.Where(h => h.Part == partNumber.Value);
        }

        return query
            .OrderByDescending(h => h.LastAnsweredAt)
            .ToListAsync(ct);
    }

    public async Task<int> UpsertToeicQuestionHistoryAsync(
        Guid userId,
        IReadOnlyList<UserToeicQuestionHistory> entries,
        CancellationToken ct = default)
    {
        if (entries.Count == 0)
        {
            return 0;
        }

        var questionIds = entries
            .Where(e => !string.IsNullOrWhiteSpace(e.QuestionId))
            .Select(e => e.QuestionId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var existingRows = await dbContext.UserToeicQuestionHistories
            .Where(h => h.UserId == userId && questionIds.Contains(h.QuestionId))
            .ToDictionaryAsync(h => h.QuestionId, StringComparer.Ordinal, ct);

        int processed = 0;
        var nowUtc = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (string.IsNullOrWhiteSpace(entry.QuestionId))
            {
                continue;
            }

            if (existingRows.TryGetValue(entry.QuestionId, out var existing))
            {
                if (entry.LastAnsweredAt >= existing.LastAnsweredAt)
                {
                    existing.Part = entry.Part;
                    existing.LastAnsweredAt = entry.LastAnsweredAt;
                    existing.IsCorrect = entry.IsCorrect;
                    existing.SelectedOption = entry.SelectedOption;
                }

                existing.AttemptCount = Math.Max(existing.AttemptCount, entry.AttemptCount);
                existing.UpdatedAt = nowUtc;
            }
            else
            {
                var created = new UserToeicQuestionHistory
                {
                    UserId = userId,
                    QuestionId = entry.QuestionId,
                    Part = entry.Part,
                    LastAnsweredAt = entry.LastAnsweredAt,
                    IsCorrect = entry.IsCorrect,
                    AttemptCount = Math.Max(1, entry.AttemptCount),
                    SelectedOption = entry.SelectedOption,
                    CreatedAt = nowUtc,
                    UpdatedAt = nowUtc
                };
                dbContext.UserToeicQuestionHistories.Add(created);
                existingRows[entry.QuestionId] = created;
            }

            processed++;
        }

        return processed;
    }

    public async Task<int> DeleteToeicQuestionHistoryAsync(
        Guid userId,
        int? partNumber = null,
        IReadOnlyList<string>? questionIds = null,
        CancellationToken ct = default)
    {
        var query = dbContext.UserToeicQuestionHistories.Where(h => h.UserId == userId);

        if (partNumber.HasValue)
        {
            query = query.Where(h => h.Part == partNumber.Value);
        }

        if (questionIds is { Count: > 0 })
        {
            query = query.Where(h => questionIds.Contains(h.QuestionId));
        }

        var rows = await query.ToListAsync(ct);
        if (rows.Count == 0)
        {
            return 0;
        }

        dbContext.UserToeicQuestionHistories.RemoveRange(rows);
        return rows.Count;
    }

    public async Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default)
    {
        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }

        gamification.AwardXpAndUpdateStreak(xp, todayLocal);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
