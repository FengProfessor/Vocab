using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Gamification;

/// <summary>
/// Represents a commitment-based vocabulary challenge summary.
/// </summary>
public record ChallengeDto(
    Guid Id,
    string Title,
    string Description,
    DateOnly StartDate,
    DateOnly EndDate,
    int DailyTargetWords,
    int MaxParticipants,
    int CurrentParticipantsCount,
    decimal DepositAmount,
    ChallengeStatus Status
);
