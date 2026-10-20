using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Gamification.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Gamification.Queries;

/// <summary>
/// Retrieves commitment challenges and participant counts directly from the database.
/// </summary>
public sealed class GetChallengesQueryHandler(
    IApplicationDbContext dbContext) : IRequestHandler<GetChallengesQuery, ApiResponse<IReadOnlyList<ChallengeDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ChallengeDto>>> Handle(
        GetChallengesQuery request,
        CancellationToken ct)
    {
        var challenges = await dbContext.Challenges
            .AsNoTracking()
            .OrderByDescending(c => c.StartDate)
            .Select(c => new ChallengeDto(
                c.Id,
                c.Title,
                c.Description,
                c.StartDate,
                c.EndDate,
                c.DailyTargetWords,
                c.MaxParticipants,
                c.Participants.Count,
                c.DepositAmount,
                c.Status))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<ChallengeDto>>.Ok(challenges, "Commitment challenges retrieved successfully.");
    }
}
