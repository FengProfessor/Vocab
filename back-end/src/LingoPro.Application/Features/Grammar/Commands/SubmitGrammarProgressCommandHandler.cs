using LingoPro.Application.Common.Helpers;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
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

        // grammar_progress is keyed by lesson_id: resolve the topic slug to its first lesson.
        var lessonId = await dbContext.GrammarLessons
            .AsNoTracking()
            .Where(l => l.Topic.Slug == slug)
            .OrderBy(l => l.OrderIndex)
            .Select(l => (Guid?)l.Id)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("GrammarTopic", slug);

        var progress = await dbContext.GrammarProgresses
            .FirstOrDefaultAsync(g => g.UserId == userId && g.LessonId == lessonId, ct);

        var rating = FsrsEngine.MapAccuracyToRating(request.AccuracyPercent);
        var input = progress == null
            ? new FsrsCalculationInput(0, 5.0, 0, 0, 0, SrsCardState.New, null)
            : new FsrsCalculationInput(
                progress.Stability ?? 0,
                progress.Difficulty ?? 5.0,
                progress.IntervalDays ?? 0,
                progress.ReviewCount ?? 0,
                progress.Lapses ?? 0,
                ParseState(progress.State),
                progress.LastReviewedAt);

        var scheduled = FsrsEngine.ScheduleNext(input, rating, nowUtc);
        var nextReviewUtc = DateTime.SpecifyKind(scheduled.NextReviewDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        string stateText = scheduled.State.ToString().ToLowerInvariant();

        if (progress == null)
        {
            progress = new GrammarProgress
            {
                UserId = userId,
                LessonId = lessonId,
                MasteryScore = (short)Math.Clamp(Math.Round(request.AccuracyPercent), 0, 100),
                Stability = scheduled.Stability,
                Difficulty = scheduled.Difficulty,
                IntervalDays = scheduled.IntervalDays,
                NextReviewDate = nextReviewUtc,
                ReviewCount = scheduled.Reps,
                Lapses = scheduled.Lapses,
                State = stateText,
                LastReviewedAt = nowUtc
            };
            dbContext.GrammarProgresses.Add(progress);
        }
        else
        {
            progress.MasteryScore = (short)Math.Clamp(Math.Round(Math.Max(progress.MasteryScore ?? 0, request.AccuracyPercent)), 0, 100);
            progress.Stability = scheduled.Stability;
            progress.Difficulty = scheduled.Difficulty;
            progress.IntervalDays = scheduled.IntervalDays;
            progress.NextReviewDate = nextReviewUtc;
            progress.ReviewCount = scheduled.Reps;
            progress.Lapses = scheduled.Lapses;
            progress.State = stateText;
            progress.LastReviewedAt = nowUtc;
        }

        await GamificationXp.AwardAsync(dbContext, userId, scheduled.XpAwarded, DateOnly.FromDateTime(nowUtc), ct);

        await dbContext.SaveChangesAsync(ct);

        var dto = new GrammarProgressDto(
            slug,
            progress.MasteryScore ?? 0,
            stateText,
            scheduled.Stability,
            scheduled.Difficulty,
            scheduled.IntervalDays,
            scheduled.NextReviewDate,
            scheduled.XpAwarded
        );
        return ApiResponse<GrammarProgressDto>.Ok(dto, "Grammar progress recorded and FSRS schedule updated successfully.");
    }

    private static SrsCardState ParseState(string? state) =>
        Enum.TryParse<SrsCardState>(state, ignoreCase: true, out var parsed) ? parsed : SrsCardState.New;
}