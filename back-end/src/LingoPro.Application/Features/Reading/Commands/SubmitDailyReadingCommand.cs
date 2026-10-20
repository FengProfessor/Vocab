using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Reading.Commands;

/// <summary>
/// Command to record completion of a daily reading exercise and award XP.
/// </summary>
[Authorize]
public record SubmitDailyReadingCommand(
    Guid ExerciseId,
    int McqScore,
    int McqTotal,
    int ClozeScore,
    int ClozeTotal) : IRequest<ApiResponse<int>>;
