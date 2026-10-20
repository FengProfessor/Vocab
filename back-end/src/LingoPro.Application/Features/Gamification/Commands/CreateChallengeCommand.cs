using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Gamification.Commands;

/// <summary>
/// Command to create a new commitment-based vocabulary challenge (restricted to Teacher and Admin roles).
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record CreateChallengeCommand(
    string Title,
    string Description,
    DateOnly StartDate,
    DateOnly EndDate,
    int DailyTargetWords,
    int MaxParticipants,
    decimal DepositAmount) : IRequest<ApiResponse<ChallengeDto>>;
