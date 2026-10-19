namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Pluggable multi-level cache abstraction.
/// Phase 1 registers NoOpCacheService (no active caching).
/// Phase 2 registers HybridMultiLevelCacheService (L1 Local IMemoryCache + L2 Redis Distributed Cache).
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    Task SetAsync<T>(
        string key,
        T value,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default);

    Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default);

    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}
