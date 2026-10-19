namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Marker interface for read-heavy, shared catalog queries that opt in to multi-level caching in Phase 2.
/// Queries that do not implement this interface bypass CachingBehavior completely.
/// </summary>
public interface ICacheableQuery
{
    string CacheKey { get; }
    TimeSpan? LocalExpiration => TimeSpan.FromMinutes(5);
    TimeSpan? DistributedExpiration => TimeSpan.FromMinutes(30);
    bool BypassCache => false;
}
