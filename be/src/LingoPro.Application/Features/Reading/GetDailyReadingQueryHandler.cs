using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Reading;

/// <summary>
/// Retrieves or provisions today's daily reading exercise and checks completion status for the active user.
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
            .FirstOrDefaultAsync(e => (e.TargetUserId == userId || e.TargetUserId == null) && e.ExerciseDate == today, ct);

        if (exercise == null)
        {
            exercise = new DailyReadingExercise
            {
                TargetUserId = userId,
                ExerciseDate = today,
                Title = "Sustainable Technology & Global Communication",
                PassageContent = "Modern technological innovation has transformed how learners acquire new vocabulary in real-world contexts.",
                CertLevel = CertLevel.B1,
                Status = DailyReadingStatus.Ready,
                UsedWordsJson = "[\"innovation\", \"transform\", \"acquire\", \"context\"]",
                McqQuestionsJson = "[]",
                ClozeItemsJson = "[]"
            };
            dbContext.DailyReadingExercises.Add(exercise);
            await dbContext.SaveChangesAsync(ct);
        }

        bool isCompleted = await dbContext.DailyReadingCompletions
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId && c.ExerciseId == exercise.Id, ct);

        var dto = new DailyReadingDto(
            exercise.Id,
            exercise.ExerciseDate,
            exercise.Title,
            exercise.PassageContent,
            exercise.CertLevel,
            exercise.UsedWordsJson,
            exercise.McqQuestionsJson,
            exercise.ClozeItemsJson,
            isCompleted
        );

        return ApiResponse<DailyReadingDto>.Ok(dto, "Daily reading exercise retrieved successfully.");
    }
}
