using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Reading.Commands;

/// <summary>
/// Records completion of a daily reading exercise and awards daily XP once per exercise.
/// </summary>
public class SubmitDailyReadingCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<SubmitDailyReadingCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(SubmitDailyReadingCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var exerciseExists = await dbContext.DailyReadingExercises.AsNoTracking().AnyAsync(e => e.Id == request.ExerciseId, ct);
        if (!exerciseExists)
        {
            throw new NotFoundException("DailyReadingExercise", request.ExerciseId);
        }

        var existing = await dbContext.DailyReadingCompletions
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ExerciseId == request.ExerciseId, ct);

        if (existing != null)
        {
            return ApiResponse<int>.Ok(0, "Daily reading exercise was already completed today.");
        }

        dbContext.DailyReadingCompletions.Add(new DailyReadingCompletion
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
        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId, ct);
        profile?.AwardXpAndUpdateStreak(xpAwarded, DateOnly.FromDateTime(DateTime.UtcNow));

        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(xpAwarded, "Daily reading completion recorded successfully.");
    }
}
