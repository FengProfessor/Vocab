using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace LingoPro.Infrastructure.Caching;

/// <summary>
/// L2 Distributed Redis Cache implementation of <see cref="ICacheService"/> backed by <see cref="IDistributedCache"/>.
/// </summary>
public sealed class RedisDistributedCacheService : ICacheService
{
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<RedisDistributedCacheService> _logger;

    public RedisDistributedCacheService(
        IDistributedCache distributedCache,
        ILogger<RedisDistributedCacheService> logger)
    {
        _distributedCache = distributedCache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var bytes = await _distributedCache.GetAsync(key, cancellationToken);
            if (bytes is { Length: > 0 })
            {
                return JsonSerializer.Deserialize<T>(bytes);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis distributed cache read failed for key {CacheKey}.", key);
        }

        return default;
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var ttl = options?.DistributedExpiration ?? TimeSpan.FromMinutes(30);
        try
        {
            var serialized = JsonSerializer.SerializeToUtf8Bytes(value);
            await _distributedCache.SetAsync(
                key,
                serialized,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl
                },
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis distributed cache write failed for key {CacheKey}.", key);
        }
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached is not null)
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

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _distributedCache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis distributed cache eviction failed for key {CacheKey}.", key);
        }
    }
}
