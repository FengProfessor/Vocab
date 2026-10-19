using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Gamification;

/// <summary>
/// Command to create a new commitment-based vocabulary challenge (restricted to Teacher and Admin roles).
/// </summary>
public record CreateChallengeCommand(
    string Title,
    string Description,
    DateOnly StartDate,
    DateOnly EndDate,
    int DailyTargetWords,
    int MaxParticipants,
    decimal DepositAmount) : IRequest<ApiResponse<ChallengeDto>>;
