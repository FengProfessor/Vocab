using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Infrastructure.BackgroundJobs;
using LingoPro.Infrastructure.Caching;
using LingoPro.Infrastructure.Options;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Interceptors;
using LingoPro.Infrastructure.Persistence.Repositories;
using LingoPro.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace LingoPro.Infrastructure;

/// <summary>
/// Registers Infrastructure layer services including PostgreSQL DbContext, Repositories, Phased Caching (Phase 1 NoOp / Phase 2 Hybrid L1+Redis),
/// Supabase BFF Gateways (validated on startup), and Background Workers.
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
            ?? configuration.GetConnectionString("SupabasePostgres");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Database connection string 'DefaultConnection' (or 'SupabasePostgres') is required.");
        }

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

        // Register Domain/Feature Repositories (Persistence Layer)
        services.AddScoped<IAdminCrmRepository, AdminCrmRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IBillingRepository, BillingRepository>();
        services.AddScoped<IClassroomRepository, ClassroomRepository>();
        services.AddScoped<IDictionaryRepository, DictionaryRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IGamificationRepository, GamificationRepository>();
        services.AddScoped<IGrammarRepository, GrammarRepository>();
        services.AddScoped<IReadingRepository, ReadingRepository>();
        services.AddScoped<IRoadmapRepository, RoadmapRepository>();
        services.AddScoped<ISeoRepository, SeoRepository>();
        services.AddScoped<ISocialRepository, SocialRepository>();
        services.AddScoped<ISpeakingFoundationRepository, SpeakingFoundationRepository>();
        services.AddScoped<IVocabRepository, VocabRepository>();

        // Validate Supabase configuration eagerly on startup instead of scattering runtime checks.
        services
            .AddOptions<SupabaseOptions>()
            .BindConfiguration(SupabaseOptions.SectionName)
            .Validate(
                options => Uri.TryCreate(
                    options.Url,
                    UriKind.Absolute,
                    out var uri)
                    && (uri.Scheme == Uri.UriSchemeHttps
                        || (uri.IsLoopback && uri.Scheme == Uri.UriSchemeHttp)),
                "Supabase URL must be a valid HTTPS URL.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.AnonKey),
                "Supabase AnonKey is required.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.StorageBucket),
                "Supabase StorageBucket is required.")
            .Validate(
                options => Uri.TryCreate(
                    options.FrontendBaseUrl,
                    UriKind.Absolute,
                    out var uri)
                    && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp),
                "Supabase FrontendBaseUrl must be a valid HTTP or HTTPS URL.")
            .ValidateOnStart();

        // Configure Phased Multi-Level Caching:
        // - Phase 1 Default ("None"): Registers NoOpCacheService (executes factory directly, zero infrastructure overhead).
        // - "Local": Registers LocalMemoryCacheService (L1 IMemoryCache only).
        // - "Redis": Registers RedisDistributedCacheService (L2 StackExchangeRedisCache only).
        // - Phase 2 Ready ("Hybrid"): Registers L1 IMemoryCache + L2 StackExchangeRedisCache via HybridMultiLevelCacheService.
        services
            .AddOptions<CachingOptions>()
            .BindConfiguration(CachingOptions.SectionName)
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.Mode),
                "Caching Mode is required.")
            .Validate(
                options => (!string.Equals(options.Mode, "Hybrid", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(options.Mode, "Redis", StringComparison.OrdinalIgnoreCase))
                    || !string.IsNullOrWhiteSpace(options.RedisConnectionString),
                "Caching RedisConnectionString is required when Mode is 'Redis' or 'Hybrid'.")
            .ValidateOnStart();

        var cachingOptions = configuration.GetSection(CachingOptions.SectionName).Get<CachingOptions>()
            ?? new CachingOptions();

        if (string.Equals(cachingOptions.Mode, "Hybrid", StringComparison.OrdinalIgnoreCase))
        {
            services.AddMemoryCache();
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = cachingOptions.RedisConnectionString;
                options.InstanceName = cachingOptions.InstancePrefix;
            });
            services.AddSingleton<ICacheService, HybridMultiLevelCacheService>();
        }
        else if (string.Equals(cachingOptions.Mode, "Local", StringComparison.OrdinalIgnoreCase))
        {
            services.AddMemoryCache();
            services.AddSingleton<ICacheService, LocalMemoryCacheService>();
        }
        else if (string.Equals(cachingOptions.Mode, "Redis", StringComparison.OrdinalIgnoreCase))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = cachingOptions.RedisConnectionString;
                options.InstanceName = cachingOptions.InstancePrefix;
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
            client.BaseAddress = new Uri($"{supabase.NormalizedUrl}/");
            client.DefaultRequestHeaders.Remove("apikey");
            client.DefaultRequestHeaders.Add("apikey", supabase.AnonKey.Trim());
        });

        services.AddHttpClient<ISupabaseStorageService, SupabaseStorageService>((sp, client) =>
        {
            var supabase = sp.GetRequiredService<IOptions<SupabaseOptions>>().Value;
            client.BaseAddress = new Uri($"{supabase.NormalizedUrl}/");
        });

        services.AddSingleton<IAiRouterService, AiRouterService>();

        services.AddHostedService<SubscriptionAndReminderWorker>();

        return services;
    }
}
