namespace LingoPro.Domain.Events;

/// <summary>
/// Marker interface for domain events raised by aggregate roots.
/// </summary>
public interface IDomainEvent
{
    DateTime OccurredOnUtc { get; }
}
