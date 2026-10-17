using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace LingoPro.Infrastructure.Caching;

/// <summary>
/// Phase 2 Multi-Level Cache service combining L1 in-process <see cref="IMemoryCache"/>
/// and L2 <see cref="IDistributedCache"/> (Redis) with automatic backfilling and resilient fallback.
/// </summary>
public sealed class HybridMultiLevelCacheService : ICacheService
{
    private readonly IMemoryCache _l1MemoryCache;
    private readonly IDistributedCache _l2RedisCache;
    private readonly ILogger<HybridMultiLevelCacheService> _logger;

    public HybridMultiLevelCacheService(
        IMemoryCache l1MemoryCache,
        IDistributedCache l2RedisCache,
        ILogger<HybridMultiLevelCacheService> logger)
    {
        _l1MemoryCache = l1MemoryCache;
        _l2RedisCache = l2RedisCache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_l1MemoryCache.TryGetValue(key, out T? l1Value) && l1Value is not null)
        {
            return l1Value;
        }

        try
        {
            var redisBytes = await _l2RedisCache.GetAsync(key, cancellationToken);
            if (redisBytes is { Length: > 0 })
            {
                var l2Value = JsonSerializer.Deserialize<T>(redisBytes);
                if (l2Value is not null)
                {
                    _l1MemoryCache.Set(key, l2Value, TimeSpan.FromMinutes(2));
                    return l2Value;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "L2 Redis cache read failed for key {CacheKey}.", key);
        }

        return default;
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var l1Ttl = options?.LocalExpiration ?? TimeSpan.FromMinutes(2);
        var l2Ttl = options?.DistributedExpiration ?? TimeSpan.FromMinutes(30);

        _l1MemoryCache.Set(key, value, l1Ttl);

        try
        {
            var serialized = JsonSerializer.SerializeToUtf8Bytes(value);
            await _l2RedisCache.SetAsync(
                key,
                serialized,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = l2Ttl
                },
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "L2 Redis cache write failed for key {CacheKey}.", key);
        }
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        CacheOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var l1Ttl = options?.LocalExpiration ?? TimeSpan.FromMinutes(2);
        var l2Ttl = options?.DistributedExpiration ?? TimeSpan.FromMinutes(30);

        // 1. Check L1 Local In-Memory Cache (~0.01ms)
        if (_l1MemoryCache.TryGetValue(key, out T? l1Value) && l1Value is not null)
        {
            return l1Value;
        }

        // 2. Check L2 Distributed Cache (Redis ~1-2ms) with graceful degradation if Redis is unreachable
        try
        {
            var redisBytes = await _l2RedisCache.GetAsync(key, cancellationToken);
            if (redisBytes is { Length: > 0 })
            {
                var l2Value = JsonSerializer.Deserialize<T>(redisBytes);
                if (l2Value is not null)
                {
                    _l1MemoryCache.Set(key, l2Value, l1Ttl);
                    return l2Value;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "L2 Redis cache read failed for key {CacheKey}. Falling back to database factory.", key);
        }

        // 3. Execute underlying database/service factory and populate both L2 and L1 caches
        var freshValue = await factory(cancellationToken);
        if (freshValue is not null)
        {
            await SetAsync(key, freshValue, new CacheOptions(l1Ttl, l2Ttl, options?.Tags), cancellationToken);
        }

        return freshValue;
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _l1MemoryCache.Remove(key);

        try
        {
            await _l2RedisCache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "L2 Redis cache eviction failed for key {CacheKey}.", key);
        }
    }
}
