using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing vocabulary FSRS review persistence, due review queue queries,
/// and real-time L1-L6 learning analytics aggregations.
/// </summary>
public sealed class VocabRepository(IApplicationDbContext dbContext) : IVocabRepository
{
    public Task<SrsProgress?> GetSrsProgressAsync(Guid userId, Guid wordId, CancellationToken ct = default)
        => dbContext.SrsProgresses.FirstOrDefaultAsync(
            s => s.UserId == userId && s.WordId == wordId && (s.Word == null || s.Word.IsDeleted != true),
            ct);

    public Task<bool> WordExistsAsync(Guid wordId, CancellationToken ct = default)
        => dbContext.Words.AsNoTracking().AnyAsync(w => w.Id == wordId && w.IsDeleted != true, ct);

    public void AddSrsProgress(SrsProgress srs)
        => dbContext.SrsProgresses.Add(srs);

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

    public Task<List<SrsProgress>> GetDueSrsProgressesWithWordAsync(
        Guid userId,
        DateTime dueUntilUtc,
        int limit,
        CancellationToken ct = default)
        => dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == userId &&
                        s.NextReviewDate != null &&
                        s.NextReviewDate < dueUntilUtc &&
                        (s.Word == null || s.Word.IsDeleted != true))
            .OrderBy(s => s.NextReviewDate)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<VocabAnalyticsDto> GetVocabAnalyticsAsync(
        Guid userId,
        string? classroomScope,
        int limit,
        int offset,
        CancellationToken ct = default)
    {
        var nowUtc = DateTime.UtcNow;
        var todayUtcStart = nowUtc.Date;

        // 1. Resolve personal classroom and enrolled classrooms for the user
        var ownedClassrooms = await dbContext.Classrooms
            .AsNoTracking()
            .Where(c => c.TeacherId == userId && c.IsDeleted != true)
            .Select(c => new { c.Id, c.Name })
            .ToListAsync(ct);

        var enrolledClassroomIds = await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.StudentId == userId)
            .Select(e => e.ClassroomId)
            .ToListAsync(ct);

        var personalClassroomId = ownedClassrooms.FirstOrDefault(c => c.Name == "__personal__")?.Id
            ?? ownedClassrooms.FirstOrDefault()?.Id
            ?? (enrolledClassroomIds.Count > 0 ? enrolledClassroomIds[0] : (Guid?)null);

        var accessibleClassroomIds = ownedClassrooms
            .Select(c => c.Id)
            .Concat(enrolledClassroomIds)
            .Distinct()
            .ToList();

        // 2. Build word query scoped by classroom if requested
        var wordsQuery = dbContext.Words
            .AsNoTracking()
            .Where(w => w.IsDeleted != true);

        if (!string.IsNullOrWhiteSpace(classroomScope) &&
            !string.Equals(classroomScope, "all", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(classroomScope, "personal", StringComparison.OrdinalIgnoreCase))
            {
                if (personalClassroomId.HasValue)
                {
                    var pid = personalClassroomId.Value;
                    wordsQuery = wordsQuery.Where(w => w.ClassroomId == pid || w.AddedBy == userId);
                }
                else
                {
                    wordsQuery = wordsQuery.Where(w => w.AddedBy == userId);
                }
            }
            else if (Guid.TryParse(classroomScope, out var parsedClassroomId))
            {
                wordsQuery = wordsQuery.Where(w => w.ClassroomId == parsedClassroomId);
            }
            else
            {
                wordsQuery = wordsQuery.Where(w => w.AddedBy == userId || accessibleClassroomIds.Contains(w.ClassroomId));
            }
        }
        else
        {
            wordsQuery = wordsQuery.Where(w => w.AddedBy == userId || accessibleClassroomIds.Contains(w.ClassroomId));
        }

        var userWords = await wordsQuery
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new
            {
                w.Id,
                w.Term,
                w.Translation,
                w.Ipa,
                w.Pos,
                w.Example,
                w.ExampleVi,
                w.ImageUrl,
                w.ClassroomId,
                w.CreatedAt
            })
            .ToListAsync(ct);

        var srsRows = await dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == userId && (s.Word == null || s.Word.IsDeleted != true))
            .ToListAsync(ct);

        var srsByWordId = srsRows
            .GroupBy(s => s.WordId)
            .ToDictionary(g => g.Key, g => g.First());

        // If user has SrsProgress rows for words outside owned/enrolled classrooms, include those words too
        var existingWordIds = userWords.Select(w => w.Id).ToHashSet();
        var extraWordsFromSrs = srsRows
            .Where(s => s.Word != null && !existingWordIds.Contains(s.WordId))
            .Select(s => new
            {
                s.Word.Id,
                s.Word.Term,
                s.Word.Translation,
                s.Word.Ipa,
                s.Word.Pos,
                s.Word.Example,
                s.Word.ExampleVi,
                s.Word.ImageUrl,
                s.Word.ClassroomId,
                s.Word.CreatedAt
            })
            .ToList();

        if (extraWordsFromSrs.Count > 0)
        {
            userWords.AddRange(extraWordsFromSrs);
        }

        // 3. Compute L1-L6 breakdown, due counts, stability & retention
        int[] levelCounts = [0, 0, 0, 0, 0, 0];
        int newCount = 0;
        int reviewDueCount = 0;
        double stabilitySum = 0;
        int reviewedWordsCount = 0;
        double retentionSum = 0;
        int todayNewWords = 0;
        int todayReviewWords = 0;

        var enrichedWords = new List<VocabWordItemDto>(userWords.Count);

        foreach (var w in userWords)
        {
            srsByWordId.TryGetValue(w.Id, out var srs);
            int reviewCount = srs?.ReviewCount ?? 0;
            double stability = srs?.Stability ?? 0;
            double difficulty = srs?.Difficulty ?? 5.0;
            int intervalDays = srs?.IntervalDays ?? 0;
            DateTime? nextReviewDate = srs?.NextReviewDate;
            DateTime? lastReviewedAt = srs?.LastReviewedAt;

            int srsLevel = MapStabilityToLevel(stability);
            levelCounts[srsLevel - 1]++;

            if (reviewCount <= 0)
            {
                newCount++;
            }
            else
            {
                reviewedWordsCount++;
                stabilitySum += stability;

                double elapsedDays = lastReviewedAt.HasValue
                    ? Math.Max(0, (nowUtc - lastReviewedAt.Value).TotalDays)
                    : 0;
                double effectiveStability = Math.Max(0.5, stability);
                double retrievability = Math.Pow(1.0 + (19.0 / 81.0) * (elapsedDays / effectiveStability), -0.5);
                retentionSum += Math.Clamp(retrievability, 0.0, 1.0);

                if (nextReviewDate == null || nextReviewDate.Value <= nowUtc)
                {
                    reviewDueCount++;
                }
            }

            var createdAtUtc = w.CreatedAt ?? nowUtc;
            if (createdAtUtc >= todayUtcStart)
            {
                todayNewWords++;
            }

            if (lastReviewedAt.HasValue && lastReviewedAt.Value >= todayUtcStart)
            {
                todayReviewWords++;
            }

            enrichedWords.Add(new VocabWordItemDto(
                w.Id,
                w.Term,
                w.Translation ?? string.Empty,
                w.Ipa,
                w.Pos,
                w.Example,
                w.ExampleVi,
                w.ImageUrl,
                w.ClassroomId,
                srsLevel,
                Math.Round(stability, 2),
                Math.Round(difficulty, 2),
                intervalDays,
                reviewCount,
                nextReviewDate,
                lastReviewedAt,
                createdAtUtc));
        }

        int totalWords = enrichedWords.Count;
        int dueCount = newCount + reviewDueCount;
        double avgStabilityDays = reviewedWordsCount > 0
            ? Math.Round(stabilitySum / reviewedWordsCount, 1)
            : 0.0;
        int retentionRatePercent = reviewedWordsCount > 0
            ? (int)Math.Round((retentionSum / reviewedWordsCount) * 100.0)
            : 0;

        // 4. Weak words diagnostic (lowest stability among reviewed words, or lowest stability overall)
        var weakWords = enrichedWords
            .Where(w => w.ReviewCount > 0)
            .OrderBy(w => w.Stability)
            .ThenByDescending(w => w.Difficulty)
            .Take(6)
            .Select(w => new WeakWordDiagnosticDto(
                w.Word,
                w.Translation,
                w.Stability,
                w.Difficulty,
                w.ReviewCount,
                w.SrsLevel))
            .ToList();

        // 5. Gamification, Quiz history, Grammar, Reading & Exam metrics
        var gamification = await dbContext.UserGamifications
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.UserId == userId, ct);

        int grammarDueCount = await dbContext.GrammarProgresses
            .AsNoTracking()
            .CountAsync(g => g.UserId == userId && g.NextReviewDate != null && g.NextReviewDate <= nowUtc, ct);

        var grammarProgresses = await dbContext.GrammarProgresses
            .AsNoTracking()
            .Where(g => g.UserId == userId)
            .Select(g => new { g.MasteryScore, g.Stability, g.LastReviewedAt })
            .ToListAsync(ct);

        var recentGrammarResults = await dbContext.GrammarResults
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CompletedAt)
            .Take(100)
            .Select(r => new { r.IsCorrect, r.CompletedAt })
            .ToListAsync(ct);

        var recentQuizzes = await dbContext.QuizResults
            .AsNoTracking()
            .Where(q => q.UserId == userId)
            .OrderByDescending(q => q.CompletedAt)
            .Take(30)
            .Select(q => new
            {
                q.QuizType,
                q.Score,
                q.TotalQuestions,
                q.CompletedAt
            })
            .ToListAsync(ct);

        var dailyReadings = await dbContext.DailyReadingCompletions
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .Select(r => new { r.McqScore, r.McqTotal, r.ClozeScore, r.ClozeTotal, r.CompletedAt })
            .ToListAsync(ct);

        var libraryReadings = await dbContext.UserReadingLibraryProgresses
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .Select(r => new { r.Status, r.McqScore, r.McqTotal, r.ClozeScore, r.ClozeTotal, r.LastReadAt })
            .ToListAsync(ct);

        var toeicResults = await dbContext.ToeicTestResults
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new { t.ListeningScaledScore, t.ReadingScaledScore, t.ListeningCorrect, t.ReadingCorrect, t.CreatedAt })
            .ToListAsync(ct);

        // 6. Build 30-day activity timeline
        var activityMap = new Dictionary<string, int>(StringComparer.Ordinal);
        for (int i = 29; i >= 0; i--)
        {
            string dayKey = todayUtcStart.AddDays(-i).ToString("yyyy-MM-dd");
            activityMap[dayKey] = 0;
        }

        foreach (var w in enrichedWords)
        {
            string createdKey = w.CreatedAt.Date.ToString("yyyy-MM-dd");
            if (activityMap.ContainsKey(createdKey))
            {
                activityMap[createdKey]++;
            }

            if (w.LastReviewedAt.HasValue)
            {
                string reviewedKey = w.LastReviewedAt.Value.Date.ToString("yyyy-MM-dd");
                if (activityMap.ContainsKey(reviewedKey))
                {
                    activityMap[reviewedKey]++;
                }
            }
        }

        foreach (var q in recentQuizzes)
        {
            if (q.CompletedAt.HasValue)
            {
                string key = q.CompletedAt.Value.Date.ToString("yyyy-MM-dd");
                if (activityMap.ContainsKey(key))
                {
                    activityMap[key]++;
                }
            }
        }

        foreach (var gr in recentGrammarResults)
        {
            if (gr.CompletedAt.HasValue)
            {
                string key = gr.CompletedAt.Value.Date.ToString("yyyy-MM-dd");
                if (activityMap.ContainsKey(key))
                {
                    activityMap[key]++;
                }
            }
        }

        var dailyActivity = activityMap
            .OrderBy(kv => kv.Key)
            .Select(kv => new DailyActivityPointDto(kv.Key, kv.Value))
            .ToList();

        // Compute streak from activity if gamification row is empty
        int computedStreak = 0;
        for (int i = dailyActivity.Count - 1; i >= 0; i--)
        {
            if (dailyActivity[i].Count > 0)
            {
                computedStreak++;
            }
            else if (i < dailyActivity.Count - 1)
            {
                break;
            }
        }

        int studyStreak = Math.Max(gamification?.CurrentStreak ?? 0, computedStreak);
        int longestStreak = Math.Max(gamification?.LongestStreak ?? 0, studyStreak);
        int totalXp = gamification?.TotalXp ?? (reviewedWordsCount * 10 + recentQuizzes.Count * 25);
        int todayWords = todayNewWords + todayReviewWords;
        int todayXp = gamification?.TodayDate == DateOnly.FromDateTime(nowUtc)
            ? gamification.TodayXp
            : todayWords * 10;
        int dailyGoal = gamification?.DailyGoal ?? 20;

        // 7. Quiz history points (chronological order for trend charts)
        var quizHistory = recentQuizzes
            .Where(q => q.TotalQuestions > 0)
            .OrderBy(q => q.CompletedAt ?? nowUtc)
            .TakeLast(14)
            .Select(q => new QuizHistoryPointDto(
                (q.CompletedAt ?? nowUtc).ToString("yyyy-MM-dd"),
                q.QuizType ?? "vocabulary",
                (int)Math.Round((double)q.Score / Math.Max(1, q.TotalQuestions) * 100.0),
                q.Score,
                q.TotalQuestions))
            .ToList();

        // 8. Compute 5-axis skill radar scores from real DB records (0 when no activity exists)
        int vocabScore = 0;
        if (totalWords > 0)
        {
            int matureCount = levelCounts[2] + levelCounts[3] + levelCounts[4] + levelCounts[5];
            double volumeFactor = Math.Min(1.0, totalWords / 100.0) * 40.0;
            double masteryFactor = ((double)matureCount / totalWords) * 35.0;
            double retentionFactor = (retentionRatePercent / 100.0) * 25.0;
            vocabScore = (int)Math.Clamp(Math.Round(volumeFactor + masteryFactor + retentionFactor), 0, 100);
        }

        int grammarScore = 0;
        if (grammarProgresses.Count > 0 || recentGrammarResults.Count > 0)
        {
            double avgMastery = grammarProgresses.Count > 0
                ? grammarProgresses.Average(g => (double)(g.MasteryScore ?? 0))
                : 0;
            double exerciseAccuracy = recentGrammarResults.Count > 0
                ? recentGrammarResults.Count(r => r.IsCorrect == true) * 100.0 / recentGrammarResults.Count
                : avgMastery;
            grammarScore = (int)Math.Clamp(
                Math.Round(avgMastery > 0 && recentGrammarResults.Count > 0
                    ? avgMastery * 0.5 + exerciseAccuracy * 0.5
                    : Math.Max(avgMastery, exerciseAccuracy)),
                0,
                100);
        }

        int reflexScore = 0;
        if (quizHistory.Count > 0 || reviewedWordsCount > 0)
        {
            double avgQuizAcc = quizHistory.Count > 0
                ? quizHistory.Average(q => q.Accuracy)
                : retentionRatePercent;
            double reviewCadence = Math.Min(1.0, reviewedWordsCount / 50.0) * 30.0;
            reflexScore = (int)Math.Clamp(Math.Round(avgQuizAcc * 0.7 + reviewCadence), 0, 100);
        }

        int readingScore = 0;
        if (dailyReadings.Count > 0 || libraryReadings.Count > 0 || toeicResults.Count > 0)
        {
            int totalCorrect = dailyReadings.Sum(r => (r.McqScore ?? 0) + (r.ClozeScore ?? 0))
                + libraryReadings.Sum(r => (r.McqScore ?? 0) + (r.ClozeScore ?? 0));
            int totalQuestions = dailyReadings.Sum(r => (r.McqTotal ?? 0) + (r.ClozeTotal ?? 0))
                + libraryReadings.Sum(r => (r.McqTotal ?? 0) + (r.ClozeTotal ?? 0));
            double readingAccuracy = totalQuestions > 0 ? (totalCorrect * 100.0 / totalQuestions) : 0;
            double toeicReadingPct = toeicResults.Count > 0
                ? toeicResults.Max(t => t.ReadingScaledScore) * 100.0 / 495.0
                : 0;
            double articlesBonus = Math.Min(30.0, (dailyReadings.Count + libraryReadings.Count) * 6.0);
            readingScore = (int)Math.Clamp(
                Math.Round(Math.Max(readingAccuracy * 0.7 + articlesBonus, toeicReadingPct)),
                0,
                100);
        }

        int listeningScore = 0;
        if (toeicResults.Count > 0)
        {
            double toeicListeningPct = toeicResults.Max(t => t.ListeningScaledScore) * 100.0 / 495.0;
            listeningScore = (int)Math.Clamp(Math.Round(toeicListeningPct), 0, 100);
        }

        var skillScores = new SkillRadarScoresDto(
            vocabScore,
            grammarScore,
            reflexScore,
            readingScore,
            listeningScore);

        var pagedWords = limit > 0
            ? enrichedWords.Skip(offset).Take(limit).ToList()
            : [];

        return new VocabAnalyticsDto(
            personalClassroomId,
            totalWords,
            newCount,
            reviewDueCount,
            dueCount,
            grammarDueCount,
            levelCounts,
            avgStabilityDays,
            retentionRatePercent,
            studyStreak,
            longestStreak,
            totalXp,
            todayXp,
            dailyGoal,
            todayWords,
            todayNewWords,
            todayReviewWords,
            skillScores,
            dailyActivity,
            quizHistory,
            weakWords,
            pagedWords);
    }

    public Task<Word?> GetWordByIdAsNoTrackingAsync(Guid wordId, CancellationToken ct = default)
        => dbContext.Words.AsNoTracking().FirstOrDefaultAsync(w => w.Id == wordId && w.IsDeleted != true, ct);

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);

    private static int MapStabilityToLevel(double stability)
    {
        if (stability <= 0 || stability < 2.0) return 1;
        if (stability < 5.0) return 2;
        if (stability < 10.0) return 3;
        if (stability < 30.0) return 4;
        if (stability < 90.0) return 5;
        return 6;
    }
}
