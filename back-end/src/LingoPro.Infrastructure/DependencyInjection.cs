using LingoPro.Application.Common.Interfaces;
using LingoPro.Infrastructure.BackgroundJobs;
using LingoPro.Infrastructure.Caching;
using LingoPro.Infrastructure.Options;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Interceptors;
using LingoPro.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace LingoPro.Infrastructure;

/// <summary>
/// Registers Infrastructure layer services including PostgreSQL DbContext, Phased Caching (Phase 1 NoOp / Phase 2 Hybrid L1+Redis),
/// Supabase BFF Gateways (Auth issues the tokens), and Background Workers.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ISaveChangesInterceptor, AuditableEntitySaveChangesInterceptor>();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString("SupabasePostgres")
            ?? "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres;Password=your-password";

        services.AddDbContext<LingoProDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(LingoProDbContext).Assembly.FullName);
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "public");
                npgsqlOptions.CommandTimeout(30);
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
            })
            .UseSnakeCaseNamingConvention();
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<LingoProDbContext>());
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // Authentication tokens are issued and validated by Supabase Auth; no local token service is registered.
        services.Configure<SupabaseOptions>(options =>
        {
            configuration.GetSection(SupabaseOptions.SectionName).Bind(options);
            var frontendBaseUrl = configuration["Frontend:BaseUrl"];
            if (!string.IsNullOrWhiteSpace(frontendBaseUrl) && string.IsNullOrWhiteSpace(configuration[$"{SupabaseOptions.SectionName}:FrontendBaseUrl"]))
            {
                options.FrontendBaseUrl = frontendBaseUrl;
            }
        });

        // Configure Phased Multi-Level Caching:
        // - Phase 1 Default ("None"): Registers NoOpCacheService (executes factory directly, zero infrastructure overhead).
        // - "Local": Registers LocalMemoryCacheService (L1 IMemoryCache only).
        // - "Redis": Registers RedisDistributedCacheService (L2 StackExchangeRedisCache only).
        // - Phase 2 Ready ("Hybrid"): Registers L1 IMemoryCache + L2 StackExchangeRedisCache via HybridMultiLevelCacheService.
        services.Configure<CachingOptions>(configuration.GetSection(CachingOptions.SectionName));
        var cachingMode = configuration[$"{CachingOptions.SectionName}:Mode"] ?? "None";

        if (string.Equals(cachingMode, "Hybrid", StringComparison.OrdinalIgnoreCase))
        {
            services.AddMemoryCache();
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration[$"{CachingOptions.SectionName}:RedisConnectionString"] ?? "localhost:6379";
                options.InstanceName = configuration[$"{CachingOptions.SectionName}:InstancePrefix"] ?? "lingopro:";
            });
            services.AddSingleton<ICacheService, HybridMultiLevelCacheService>();
        }
        else if (string.Equals(cachingMode, "Local", StringComparison.OrdinalIgnoreCase))
        {
            services.AddMemoryCache();
            services.AddSingleton<ICacheService, LocalMemoryCacheService>();
        }
        else if (string.Equals(cachingMode, "Redis", StringComparison.OrdinalIgnoreCase))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration[$"{CachingOptions.SectionName}:RedisConnectionString"] ?? "localhost:6379";
                options.InstanceName = configuration[$"{CachingOptions.SectionName}:InstancePrefix"] ?? "lingopro:";
            });
            services.AddSingleton<ICacheService, RedisDistributedCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, NoOpCacheService>();
        }

        services.AddHttpClient<ISupabaseAuthService, SupabaseAuthService>((sp, client) =>
        {
            var supabase = sp.GetRequiredService<IOptions<SupabaseOptions>>().Value;
            if (!string.IsNullOrWhiteSpace(supabase.NormalizedUrl))
            {
                client.BaseAddress = new Uri($"{supabase.NormalizedUrl}/");
            }

            if (!string.IsNullOrWhiteSpace(supabase.AnonKey))
            {
                client.DefaultRequestHeaders.Remove("apikey");
                client.DefaultRequestHeaders.Add("apikey", supabase.AnonKey.Trim());
            }
        });

        services.AddHttpClient<ISupabaseStorageService, SupabaseStorageService>((sp, client) =>
        {
            var supabase = sp.GetRequiredService<IOptions<SupabaseOptions>>().Value;
            if (!string.IsNullOrWhiteSpace(supabase.NormalizedUrl))
            {
                client.BaseAddress = new Uri($"{supabase.NormalizedUrl}/");
            }
        });

        services.AddSingleton<IAiRouterService, AiRouterService>();

        services.AddHostedService<SubscriptionAndReminderWorker>();

        return services;
    }
}
