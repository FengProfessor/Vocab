using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Gamification.Commands;
using LingoPro.Domain.Enums;
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
        var rows = await dbContext.Challenges
            .AsNoTracking()
            .OrderByDescending(c => c.StartsAt)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.StartsAt,
                c.EndsAt,
                c.DailyCriteria,
                c.MaxParticipants,
                ParticipantCount = c.Participants.Count,
                c.DepositAmount,
                c.Status
            })
            .ToListAsync(ct);

        // SQL has no daily_target_words column: derive it from daily_criteria.min_srs_reviews.
        var challenges = rows.Select(c => new ChallengeDto(
            c.Id,
            c.Name,
            c.Description ?? string.Empty,
            DateOnly.FromDateTime(c.StartsAt),
            DateOnly.FromDateTime(c.EndsAt),
            ParseDailyTarget(c.DailyCriteria),
            c.MaxParticipants ?? 0,
            c.ParticipantCount,
            c.DepositAmount,
            c.Status ?? ChallengeStatus.Draft)).ToList();

        return ApiResponse<IReadOnlyList<ChallengeDto>>.Ok(challenges, "Commitment challenges retrieved successfully.");
    }

    private static int ParseDailyTarget(string? dailyCriteria)
    {
        if (string.IsNullOrWhiteSpace(dailyCriteria)) return 0;
        try
        {
            using var doc = JsonDocument.Parse(dailyCriteria);
            return doc.RootElement.TryGetProperty("min_srs_reviews", out var v) && v.TryGetInt32(out var n) ? n : 0;
        }
        catch (JsonException)
        {
            return 0;
        }
    }
}
