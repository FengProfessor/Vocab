using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Gamification.Commands;

/// <summary>
/// Represents the result of joining a vocabulary challenge.
/// </summary>
public record JoinChallengeResponseDto(
    Guid ParticipantId,
    Guid ChallengeId,
    ChallengeParticipantStatus ParticipantStatus,
    Guid? OrderId,
    string? TransferCode
);
