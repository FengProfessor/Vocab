using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Persists grammar practice progress to PostgreSQL and updates the learner's FSRS schedule.
/// </summary>
public class SubmitGrammarProgressCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<SubmitGrammarProgressCommand, ApiResponse<GrammarProgressDto>>
{
    public async Task<ApiResponse<GrammarProgressDto>> Handle(SubmitGrammarProgressCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        string slug = request.TopicSlug.Trim().ToLowerInvariant();
        var nowUtc = DateTime.UtcNow;

        var progress = await dbContext.GrammarProgresses
            .FirstOrDefaultAsync(g => g.UserId == userId && g.TopicSlug == slug, ct);

        var rating = FsrsEngine.MapAccuracyToRating(request.AccuracyPercent);
        var input = progress == null
            ? new FsrsCalculationInput(0, 5.0, 0, 0, 0, SrsCardState.New, null)
            : new FsrsCalculationInput(
                progress.Stability,
                progress.Difficulty,
                progress.IntervalDays,
                progress.Reps,
                progress.Lapses,
                progress.State,
                progress.LastReviewedAt);

        var scheduled = FsrsEngine.ScheduleNext(input, rating, nowUtc);

        if (progress == null)
        {
            progress = new GrammarProgress
            {
                UserId = userId,
                TopicSlug = slug,
                MasteryScore = request.AccuracyPercent,
                Stability = scheduled.Stability,
                Difficulty = scheduled.Difficulty,
                IntervalDays = scheduled.IntervalDays,
                NextReviewDate = scheduled.NextReviewDate,
                Reps = scheduled.Reps,
                Lapses = scheduled.Lapses,
                State = scheduled.State,
                LastReviewedAt = nowUtc
            };
            dbContext.GrammarProgresses.Add(progress);
        }
        else
        {
            progress.MasteryScore = Math.Max(progress.MasteryScore, request.AccuracyPercent);
            progress.Stability = scheduled.Stability;
            progress.Difficulty = scheduled.Difficulty;
            progress.IntervalDays = scheduled.IntervalDays;
            progress.NextReviewDate = scheduled.NextReviewDate;
            progress.Reps = scheduled.Reps;
            progress.Lapses = scheduled.Lapses;
            progress.State = scheduled.State;
            progress.LastReviewedAt = nowUtc;
        }

        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId, ct);
        profile?.AwardXpAndUpdateStreak(scheduled.XpAwarded, DateOnly.FromDateTime(nowUtc));

        await dbContext.SaveChangesAsync(ct);

        var dto = new GrammarProgressDto(
            progress.TopicSlug,
            progress.MasteryScore,
            progress.State,
            progress.Stability,
            progress.Difficulty,
            progress.IntervalDays,
            progress.NextReviewDate,
            scheduled.XpAwarded
        );

        return ApiResponse<GrammarProgressDto>.Ok(dto, "Grammar progress recorded and FSRS schedule updated successfully.");
    }
}
