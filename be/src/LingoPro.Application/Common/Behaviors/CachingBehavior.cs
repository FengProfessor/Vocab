using LingoPro.Application.Common.Interfaces;
using MediatR;

namespace LingoPro.Application.Common.Behaviors;

/// <summary>
/// Selective MediatR pipeline behavior that intercepts only queries implementing <see cref="ICacheableQuery"/>.
/// In Phase 1, NoOpCacheService executes the handler directly without storing cache entries.
/// In Phase 2, HybridMultiLevelCacheService transparently serves and populates L1 Local Memory + L2 Redis.
/// </summary>
public class CachingBehavior<TRequest, TResponse>(ICacheService cacheService)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableQuery cacheableQuery || cacheableQuery.BypassCache)
        {
            return await next();
        }

        return await cacheService.GetOrCreateAsync(
            key: cacheableQuery.CacheKey,
            factory: _ => next(),
            options: new CacheOptions(
                LocalExpiration: cacheableQuery.LocalExpiration,
                DistributedExpiration: cacheableQuery.DistributedExpiration),
            cancellationToken: cancellationToken);
    }
}
