using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Reading;

/// <summary>
/// Command to record completion of a daily reading exercise and award XP.
/// </summary>
public record SubmitDailyReadingCommand(
    Guid ExerciseId,
    int McqScore,
    int McqTotal,
    int ClozeScore,
    int ClozeTotal) : IRequest<ApiResponse<int>>;
