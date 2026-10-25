using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
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
        var cacheService = sp.GetRequiredService<ICacheService>();
        var aiRouter = sp.GetRequiredService<IAiRouterService>();
        var adminCrmRepo = sp.GetRequiredService<IAdminCrmRepository>();
        var authRepo = sp.GetRequiredService<IAuthRepository>();
        var billingRepo = sp.GetRequiredService<IBillingRepository>();
        var classroomRepo = sp.GetRequiredService<IClassroomRepository>();
        var dictionaryRepo = sp.GetRequiredService<IDictionaryRepository>();
        var examRepo = sp.GetRequiredService<IExamRepository>();
        var gamificationRepo = sp.GetRequiredService<IGamificationRepository>();
        var grammarRepo = sp.GetRequiredService<IGrammarRepository>();
        var readingRepo = sp.GetRequiredService<IReadingRepository>();
        var roadmapRepo = sp.GetRequiredService<IRoadmapRepository>();
        var seoRepo = sp.GetRequiredService<ISeoRepository>();
        var socialRepo = sp.GetRequiredService<ISocialRepository>();
        var speakingRepo = sp.GetRequiredService<ISpeakingFoundationRepository>();
        var vocabRepo = sp.GetRequiredService<IVocabRepository>();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(sender, Is.Not.Null);
            Assert.That(dbContext, Is.Not.Null);
            Assert.That(currentUser, Is.Not.Null);
            Assert.That(aiRouter, Is.Not.Null);
            Assert.That(cacheService, Is.InstanceOf(expectedCacheServiceType));
            Assert.That(adminCrmRepo, Is.Not.Null);
            Assert.That(authRepo, Is.Not.Null);
            Assert.That(billingRepo, Is.Not.Null);
            Assert.That(classroomRepo, Is.Not.Null);
            Assert.That(dictionaryRepo, Is.Not.Null);
            Assert.That(examRepo, Is.Not.Null);
            Assert.That(gamificationRepo, Is.Not.Null);
            Assert.That(grammarRepo, Is.Not.Null);
            Assert.That(readingRepo, Is.Not.Null);
            Assert.That(roadmapRepo, Is.Not.Null);
            Assert.That(seoRepo, Is.Not.Null);
            Assert.That(socialRepo, Is.Not.Null);
            Assert.That(speakingRepo, Is.Not.Null);
            Assert.That(vocabRepo, Is.Not.Null);
        });
    }
}
