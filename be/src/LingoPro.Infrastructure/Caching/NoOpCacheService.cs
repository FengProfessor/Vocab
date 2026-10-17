using LingoPro.Application.Common.Interfaces;

namespace LingoPro.Infrastructure.Caching;

/// <summary>
/// Phase 1 default <see cref="ICacheService"/> implementation that bypasses caching
/// and executes the underlying data factory directly while keeping the caching pipeline ready for Phase 2.
/// </summary>
public sealed class NoOpCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<T?>(default);
    }

    public Task SetAsync<T>(
        string key,
        T value,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return factory(cancellationToken);
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
