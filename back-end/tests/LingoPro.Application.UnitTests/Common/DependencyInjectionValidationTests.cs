using LingoPro.Application.Common.Interfaces;
using LingoPro.Infrastructure;
using LingoPro.Infrastructure.Caching;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Common;

/// <summary>
/// NUnit tests verifying that Application and Infrastructure Dependency Injection registrations
/// pass strict .NET 10 ValidateOnBuild and ValidateScopes checks for both Phase 1 (NoOp) and Phase 2 (Hybrid) caching modes.
/// </summary>
[TestFixture]
public sealed class DependencyInjectionValidationTests
{
    [TestCase("None", typeof(NoOpCacheService))]
    [TestCase("Local", typeof(LocalMemoryCacheService))]
    [TestCase("Redis", typeof(RedisDistributedCacheService))]
    [TestCase("Hybrid", typeof(HybridMultiLevelCacheService))]
    public void BuildServiceProvider_WithStrictScopeAndBuildValidation_ResolvesAllCoreServices(
        string cachingMode,
        Type expectedCacheServiceType)
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Port=5432;Database=lingopro;Username=postgres;Password=postgres",
            ["Jwt:SigningKey"] = "unit-test-32-byte-secret-signing-key-for-lingopro",
            ["Jwt:Issuer"] = "https://lingopro.online",
            ["Jwt:Audience"] = "lingopro-web-spa",
            ["Jwt:AccessTokenExpirationMinutes"] = "15",
            ["Jwt:RefreshTokenExpirationDays"] = "30",
            ["Caching:Mode"] = cachingMode,
            ["Caching:RedisConnectionString"] = "localhost:6379",
            ["Caching:InstancePrefix"] = "lingopro:test:"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddApplicationServices();
        services.AddInfrastructureServices(configuration);

        // Act
        using var provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateScopes = true,
            ValidateOnBuild = true
        });

        using var scope = provider.CreateScope();
        var sp = scope.ServiceProvider;

        var sender = sp.GetRequiredService<ISender>();
        var dbContext = sp.GetRequiredService<IApplicationDbContext>();
        var currentUser = sp.GetRequiredService<ICurrentUserService>();
        var jwtService = sp.GetRequiredService<IJwtTokenService>();
        var cacheService = sp.GetRequiredService<ICacheService>();
        var aiRouter = sp.GetRequiredService<IAiRouterService>();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(sender, Is.Not.Null);
            Assert.That(dbContext, Is.Not.Null);
            Assert.That(currentUser, Is.Not.Null);
            Assert.That(jwtService, Is.Not.Null);
            Assert.That(aiRouter, Is.Not.Null);
            Assert.That(cacheService, Is.InstanceOf(expectedCacheServiceType));
        });
    }
}
