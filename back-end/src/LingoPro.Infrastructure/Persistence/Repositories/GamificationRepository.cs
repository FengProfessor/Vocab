using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository implementation for commitment challenges, participant registrations, and deposit orders.
/// </summary>
public sealed class GamificationRepository(IApplicationDbContext dbContext) : IGamificationRepository
{
    public void AddChallenge(Challenge challenge) => dbContext.Challenges.Add(challenge);

    public Task<Challenge?> GetChallengeWithParticipantsByIdAsync(Guid challengeId, CancellationToken ct = default) =>
        dbContext.Challenges
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == challengeId && x.IsDeleted != true, ct);

    public void AddOrder(Order order) => dbContext.Orders.Add(order);

    public void AddChallengeParticipant(ChallengeParticipant participant) =>
        dbContext.ChallengeParticipants.Add(participant);

    public async Task<IReadOnlyList<(Guid Id, string Name, string? Description, DateTime StartsAt, DateTime EndsAt, string DailyCriteria, int? MaxParticipants, int ParticipantCount, int DepositAmount, ChallengeStatus? Status)>> GetChallengesWithParticipantCountsAsync(CancellationToken ct = default)
    {
        var rows = await dbContext.Challenges
            .AsNoTracking()
            .Where(x => x.IsDeleted != true)
            .OrderByDescending(x => x.StartsAt)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.StartsAt,
                x.EndsAt,
                x.DailyCriteria,
                x.MaxParticipants,
                ParticipantCount = x.Participants.Count,
                x.DepositAmount,
                x.Status
            })
            .ToListAsync(ct);

        return rows
            .Select(x => (x.Id, x.Name, x.Description, x.StartsAt, x.EndsAt, x.DailyCriteria, x.MaxParticipants, x.ParticipantCount, x.DepositAmount, x.Status))
            .ToList();
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => dbContext.SaveChangesAsync(ct);
}
