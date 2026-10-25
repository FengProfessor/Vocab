using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for commitment challenges, participant registrations, and deposit orders.
/// </summary>
public interface IGamificationRepository
{
    void AddChallenge(Challenge challenge);

    Task<Challenge?> GetChallengeWithParticipantsByIdAsync(Guid challengeId, CancellationToken ct = default);

    void AddOrder(Order order);

    void AddChallengeParticipant(ChallengeParticipant participant);

    Task<IReadOnlyList<(Guid Id, string Name, string? Description, DateTime StartsAt, DateTime EndsAt, string DailyCriteria, int? MaxParticipants, int ParticipantCount, int DepositAmount, ChallengeStatus? Status)>> GetChallengesWithParticipantCountsAsync(CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
