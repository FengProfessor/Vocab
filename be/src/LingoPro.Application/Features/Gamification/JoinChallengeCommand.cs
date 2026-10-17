using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Gamification;

/// <summary>
/// Command to enroll the authenticated user into a vocabulary challenge.
/// </summary>
public record JoinChallengeCommand(Guid ChallengeId) : IRequest<ApiResponse<JoinChallengeResponseDto>>;
