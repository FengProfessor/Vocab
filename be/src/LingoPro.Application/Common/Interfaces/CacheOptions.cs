namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Defines expiration settings for L1 local memory cache and L2 Redis distributed cache.
/// </summary>
public record CacheOptions(
    TimeSpan? LocalExpiration = null,
    TimeSpan? DistributedExpiration = null,
    IReadOnlyCollection<string>? Tags = null
);
