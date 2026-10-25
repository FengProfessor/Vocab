using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Reading.Queries;

/// <summary>
/// Retrieves today's daily reading exercise from the database and checks completion status for the active user.
/// </summary>
public class GetDailyReadingQueryHandler(
    ICurrentUserService currentUser,
    IReadingRepository readingRepository) : IRequestHandler<GetDailyReadingQuery, ApiResponse<DailyReadingDto>>
{
    public async Task<ApiResponse<DailyReadingDto>> Handle(GetDailyReadingQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var exercise = await readingRepository.GetDailyReadingExerciseForDateAsync(userId, today, ct)
            ?? throw new NotFoundException("DailyReadingExercise", today);

        bool isCompleted = await readingRepository.IsDailyReadingCompletedAsync(userId, exercise.Id, ct);

        return ApiResponse<DailyReadingDto>.Ok(
            new DailyReadingDto(
                exercise.Id,
                exercise.ExerciseDate,
                exercise.Title,
                exercise.Passage,
                exercise.Level,
                System.Text.Json.JsonSerializer.Serialize(exercise.UsedWords ?? []),
                exercise.Questions,
                exercise.Cloze,
                isCompleted),
            "Daily reading exercise retrieved successfully.");
    }
}
