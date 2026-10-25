using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Reading.Commands;

/// <summary>
/// Records completion of a daily reading exercise and awards daily XP once per exercise.
/// </summary>
public class SubmitDailyReadingCommandHandler(
    ICurrentUserService currentUser,
    IReadingRepository readingRepository) : IRequestHandler<SubmitDailyReadingCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(SubmitDailyReadingCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var exerciseExists = await readingRepository.DailyReadingExerciseExistsAsync(request.ExerciseId, ct);
        if (!exerciseExists)
        {
            throw new NotFoundException("DailyReadingExercise", request.ExerciseId);
        }

        var existing = await readingRepository.GetDailyReadingCompletionAsync(userId, request.ExerciseId, ct);

        if (existing != null)
        {
            return ApiResponse<int>.Ok(0, "Daily reading exercise was already completed today.");
        }

        readingRepository.AddDailyReadingCompletion(new DailyReadingCompletion
        {
            UserId = userId,
            ExerciseId = request.ExerciseId,
            McqScore = request.McqScore,
            McqTotal = request.McqTotal,
            ClozeScore = request.ClozeScore,
            ClozeTotal = request.ClozeTotal,
            CompletedAt = DateTime.UtcNow
        });

        const int xpAwarded = 30;
        await readingRepository.AwardXpAsync(userId, xpAwarded, DateOnly.FromDateTime(DateTime.UtcNow), ct);

        await readingRepository.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(xpAwarded, "Daily reading completion recorded successfully.");
    }
}
