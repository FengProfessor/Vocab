using Microsoft.Extensions.DependencyInjection;

namespace LingoPro.WebApi.Extensions;

/// <summary>
/// Configures HTTP response caching middleware for SSR SEO pages and static catalog endpoints.
/// </summary>
public static class CachingExtensions
{
    public static IServiceCollection AddSsrResponseCaching(this IServiceCollection services)
    {
        services.AddResponseCaching(options =>
        {
            options.MaximumBodySize = 1024 * 1024;
            options.UseCaseSensitivePaths = false;
        });

        return services;
    }
}
