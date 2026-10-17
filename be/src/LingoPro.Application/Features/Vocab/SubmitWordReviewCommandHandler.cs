using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Vocab;

/// <summary>
/// Handles a vocabulary flashcard review using the FSRS v5 engine with idempotency token protection.
/// </summary>
public class SubmitWordReviewCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<SubmitWordReviewCommand, ApiResponse<SrsReviewResponseDto>>
{
    public async Task<ApiResponse<SrsReviewResponseDto>> Handle(SubmitWordReviewCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var wordExists = await dbContext.Words.AsNoTracking().AnyAsync(w => w.Id == request.WordId, ct);
        if (!wordExists)
        {
            throw new NotFoundException("Word", request.WordId);
        }

        var srs = await dbContext.SrsProgresses
            .FirstOrDefaultAsync(s => s.UserId == userId && s.WordId == request.WordId, ct);

        // Idempotent replay check: if the same ReviewId was already applied, return existing state with 0 XP
        if (srs != null && srs.LastReviewId == request.ReviewId)
        {
            return ApiResponse<SrsReviewResponseDto>.Ok(
                new SrsReviewResponseDto(
                    srs.WordId,
                    srs.State,
                    srs.Stability,
                    srs.Difficulty,
                    srs.IntervalDays,
                    srs.NextReviewDate,
                    srs.Reps,
                    srs.Lapses,
                    0),
                "Duplicate review ignored via idempotency token."
            );
        }

        var nowUtc = DateTime.UtcNow;
        var rating = FsrsEngine.MapQualityToRating(request.Quality);

        var input = srs == null
            ? new FsrsCalculationInput(0, 5.0, 0, 0, 0, SrsCardState.New, null)
            : new FsrsCalculationInput(
                srs.Stability,
                srs.Difficulty,
                srs.IntervalDays,
                srs.Reps,
                srs.Lapses,
                srs.State,
                srs.LastReviewedAt);

        var scheduled = FsrsEngine.ScheduleNext(input, rating, nowUtc);

        if (srs == null)
        {
            srs = new SrsProgress
            {
                UserId = userId,
                WordId = request.WordId,
                Stability = scheduled.Stability,
                Difficulty = scheduled.Difficulty,
                IntervalDays = scheduled.IntervalDays,
                NextReviewDate = scheduled.NextReviewDate,
                Reps = scheduled.Reps,
                Lapses = scheduled.Lapses,
                State = scheduled.State,
                LastReviewedAt = nowUtc,
                LastReviewId = request.ReviewId
            };
            dbContext.SrsProgresses.Add(srs);
        }
        else
        {
            srs.Stability = scheduled.Stability;
            srs.Difficulty = scheduled.Difficulty;
            srs.IntervalDays = scheduled.IntervalDays;
            srs.NextReviewDate = scheduled.NextReviewDate;
            srs.Reps = scheduled.Reps;
            srs.Lapses = scheduled.Lapses;
            srs.State = scheduled.State;
            srs.LastReviewedAt = nowUtc;
            srs.LastReviewId = request.ReviewId;
        }

        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId, ct);
        profile?.AwardXpAndUpdateStreak(scheduled.XpAwarded, DateOnly.FromDateTime(nowUtc));

        await dbContext.SaveChangesAsync(ct);

        var dto = new SrsReviewResponseDto(
            srs.WordId,
            srs.State,
            srs.Stability,
            srs.Difficulty,
            srs.IntervalDays,
            srs.NextReviewDate,
            srs.Reps,
            srs.Lapses,
            scheduled.XpAwarded
        );

        return ApiResponse<SrsReviewResponseDto>.Ok(dto, "Word review recorded and FSRS schedule updated successfully.");
    }
}
