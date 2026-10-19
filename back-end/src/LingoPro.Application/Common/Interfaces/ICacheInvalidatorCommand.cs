namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Marker interface for commands that invalidate specific cache keys upon completion.
/// </summary>
public interface ICacheInvalidatorCommand
{
    IReadOnlyCollection<string> CacheKeysToInvalidate { get; }
}
