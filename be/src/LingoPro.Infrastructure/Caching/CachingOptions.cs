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
    /// Caching operating mode: <c>"None"</c> (Phase 1 default) or <c>"Hybrid"</c> (Phase 2 L1 Memory + L2 Redis).
    /// </summary>
    public string Mode { get; set; } = "None";

    /// <summary>
    /// Redis connection string used when <see cref="Mode"/> is <c>"Hybrid"</c>.
    /// </summary>
    public string RedisConnectionString { get; set; } = "localhost:6379";

    /// <summary>
    /// Prefix prepended to all Redis keys.
    /// </summary>
    public string InstancePrefix { get; set; } = "lingopro:";
}
