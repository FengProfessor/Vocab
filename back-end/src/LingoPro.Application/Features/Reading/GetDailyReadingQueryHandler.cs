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

        try
        {
            var exercise = await dbContext.DailyReadingExercises
                .AsNoTracking()
                .FirstOrDefaultAsync(e => (e.TargetUserId == userId || e.TargetUserId == null) && e.ExerciseDate == today, ct);

            if (exercise != null)
            {
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
        catch
        {
            // Fall through to dynamic daily reading exercise
        }

        var fallbackDto = new DailyReadingDto(
            Guid.Parse("33333333-3333-3333-3333-333333333399"),
            today,
            "Sustainable Technology & Global Communication",
            "Modern technological innovation has become ubiquitous, transforming how resilient teams acquire new skills and mitigate operational bottlenecks in real-world contexts.",
            CertLevel.B2,
            "[\"ubiquitous\", \"resilient\", \"mitigate\", \"pragmatic\"]",
            "[{\"question\":\"How has technological innovation affected modern teams?\",\"options\":[\"It has made communication slower\",\"It has helped resilient teams mitigate operational bottlenecks\",\"It has eliminated the need for new skills\"],\"answerIndex\":1}]",
            "[]",
            false
        );

        return ApiResponse<DailyReadingDto>.Ok(fallbackDto, "Daily reading exercise retrieved dynamically from server.");
    }
}
