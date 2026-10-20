namespace LingoPro.Infrastructure.Caching;

/// <summary>
/// Configuration options for the multi-level caching subsystem.
/// Set <see cref="Mode"/> to <c>"None"</c> in Phase 1 (direct database execution via <see cref="NoOpCacheService"/>)
/// and switch to <c>"Hybrid"</c> in Phase 2 to activate L1 Local Memory + L2 Redis Distributed Cache.
/// </summary>
public sealed class CachingOptions
{
    public const string SectionName = "Caching";

    /// <summary>
    /// Caching operating mode: <c>"None"</c>, <c>"Local"</c>, <c>"Redis"</c>, or <c>"Hybrid"</c>.
    /// </summary>
    public string Mode { get; set; } = string.Empty;

    /// <summary>
    /// Redis connection string used when <see cref="Mode"/> is <c>"Redis"</c> or <c>"Hybrid"</c>.
    /// </summary>
    public string RedisConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Prefix prepended to all Redis keys.
    /// </summary>
    public string InstancePrefix { get; set; } = string.Empty;
}
