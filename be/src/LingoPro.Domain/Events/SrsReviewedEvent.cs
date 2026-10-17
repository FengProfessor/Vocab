using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Events;

/// <summary>
/// Domain event raised when a vocabulary or grammar card is reviewed under the FSRS v5 algorithm.
/// </summary>
public sealed record SrsReviewedEvent(
    Guid UserId,
    Guid WordId,
    SrsReviewQuality Quality,
    SrsCardState NewState,
    int XpAwarded,
    DateTime OccurredOnUtc) : IDomainEvent;
