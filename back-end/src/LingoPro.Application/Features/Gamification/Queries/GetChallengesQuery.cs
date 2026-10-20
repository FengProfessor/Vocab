using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Gamification.Commands;
using MediatR;

namespace LingoPro.Application.Features.Gamification.Queries;

/// <summary>
/// Query to retrieve active commitment challenges from the database.
/// </summary>
[Authorize]
public sealed record GetChallengesQuery : IRequest<ApiResponse<IReadOnlyList<ChallengeDto>>>;
