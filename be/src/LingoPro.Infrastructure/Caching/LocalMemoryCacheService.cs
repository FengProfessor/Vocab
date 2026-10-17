using LingoPro.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace LingoPro.Infrastructure.Caching;

/// <summary>
/// L1 In-Process Memory Cache implementation of <see cref="ICacheService"/> backed by <see cref="IMemoryCache"/>.
/// </summary>
public sealed class LocalMemoryCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;

    public LocalMemoryCacheService(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var value = _memoryCache.TryGetValue(key, out T? cached) ? cached : default;
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(
        string key,
        T value,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var ttl = options?.LocalExpiration ?? TimeSpan.FromMinutes(2);
        _memoryCache.Set(key, value, ttl);
        return Task.CompletedTask;
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        if (_memoryCache.TryGetValue(key, out T? cached) && cached is not null)
        {
            return cached;
        }

        var fresh = await factory(cancellationToken);
        if (fresh is not null)
        {
            await SetAsync(key, fresh, options, cancellationToken);
        }

        return fresh;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _memoryCache.Remove(key);
        return Task.CompletedTask;
    }
}
