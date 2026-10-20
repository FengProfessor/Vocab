using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Gamification.Commands;

/// <summary>
/// Command to enroll the authenticated user into a vocabulary challenge.
/// </summary>
[Authorize]
public record JoinChallengeCommand(Guid ChallengeId) : IRequest<ApiResponse<JoinChallengeResponseDto>>;
