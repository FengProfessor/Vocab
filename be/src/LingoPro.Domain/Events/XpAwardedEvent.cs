namespace LingoPro.Domain.Events;

/// <summary>
/// Domain event raised when a learner earns experience points and updates their daily study streak.
/// </summary>
public sealed record XpAwardedEvent(
    Guid UserId,
    int XpAwarded,
    int CurrentStreak,
    DateTime OccurredOnUtc) : IDomainEvent;
