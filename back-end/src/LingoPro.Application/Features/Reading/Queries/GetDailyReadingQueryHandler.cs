using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Reading.Queries;

/// <summary>
/// Retrieves today's daily reading exercise from the database and checks completion status for the active user.
/// </summary>
public class GetDailyReadingQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetDailyReadingQuery, ApiResponse<DailyReadingDto>>
{
    public async Task<ApiResponse<DailyReadingDto>> Handle(GetDailyReadingQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var exercise = await dbContext.DailyReadingExercises
            .AsNoTracking()
            .FirstOrDefaultAsync(e => (e.TargetUserId == userId || e.TargetUserId == null) && e.ExerciseDate == today, ct)
            ?? throw new NotFoundException("DailyReadingExercise", today);

        bool isCompleted = await dbContext.DailyReadingCompletions
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId && c.ExerciseId == exercise.Id, ct);

        return ApiResponse<DailyReadingDto>.Ok(
            new DailyReadingDto(
                exercise.Id,
                exercise.ExerciseDate,
                exercise.Title,
                exercise.PassageContent,
                exercise.CertLevel,
                exercise.UsedWordsJson,
                exercise.McqQuestionsJson,
                exercise.ClozeItemsJson,
                isCompleted),
            "Daily reading exercise retrieved successfully.");
    }
}
