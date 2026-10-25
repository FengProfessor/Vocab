using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Handles a vocabulary flashcard review using the FSRS v5 engine via the vocabulary repository.
/// </summary>
public class SubmitWordReviewCommandHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository) : IRequestHandler<SubmitWordReviewCommand, ApiResponse<SrsReviewResponseDto>>
{
    public async Task<ApiResponse<SrsReviewResponseDto>> Handle(SubmitWordReviewCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var nowUtc = DateTime.UtcNow;
        var rating = FsrsEngine.MapQualityToRating(request.Quality);

        var srs = await vocabRepository.GetSrsProgressAsync(userId, request.WordId, ct);

        // NOTE: public.srs_progress has no last_review_id column, so the per-card idempotency token check
        // is no longer persisted; request.ReviewId is accepted but cannot be de-duplicated server-side.

        var wordExists = await vocabRepository.WordExistsAsync(request.WordId, ct);
        if (!wordExists)
        {
            throw new NotFoundException("Word", request.WordId);
        }

        var input = srs == null
            ? new FsrsCalculationInput(0, 5.0, 0, 0, 0, SrsCardState.New, null)
            : new FsrsCalculationInput(
                srs.Stability ?? 0,
                srs.Difficulty ?? 5.0,
                srs.IntervalDays ?? 0,
                srs.ReviewCount ?? 0,
                srs.Lapses ?? 0,
                srs.State ?? SrsCardState.New,
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
                NextReviewDate = DateTime.SpecifyKind(scheduled.NextReviewDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc),
                ReviewCount = scheduled.Reps,
                Lapses = scheduled.Lapses,
                State = scheduled.State,
                LastReviewedAt = nowUtc
            };
            vocabRepository.AddSrsProgress(srs);
        }
        else
        {
            srs.Stability = scheduled.Stability;
            srs.Difficulty = scheduled.Difficulty;
            srs.IntervalDays = scheduled.IntervalDays;
            srs.NextReviewDate = DateTime.SpecifyKind(scheduled.NextReviewDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            srs.ReviewCount = scheduled.Reps;
            srs.Lapses = scheduled.Lapses;
            srs.State = scheduled.State;
            srs.LastReviewedAt = nowUtc;
        }

        await vocabRepository.AwardXpAsync(userId, scheduled.XpAwarded, DateOnly.FromDateTime(nowUtc), ct);
        await vocabRepository.SaveChangesAsync(ct);

        return ApiResponse<SrsReviewResponseDto>.Ok(
            new SrsReviewResponseDto(
                srs.WordId,
                scheduled.State,
                scheduled.Stability,
                scheduled.Difficulty,
                scheduled.IntervalDays,
                scheduled.NextReviewDate,
                scheduled.Reps,
                scheduled.Lapses,
                scheduled.XpAwarded),
            "Word review recorded and FSRS schedule updated successfully.");
    }
}
