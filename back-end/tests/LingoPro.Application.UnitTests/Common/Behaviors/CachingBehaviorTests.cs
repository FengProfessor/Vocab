using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Seo;
using LingoPro.Infrastructure.Caching;
using MediatR;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Common.Behaviors;

/// <summary>
/// NUnit unit tests verifying <see cref="CachingBehavior{TRequest,TResponse}"/> and <see cref="NoOpCacheService"/>.
/// </summary>
[TestFixture]
public sealed class CachingBehaviorTests
{
    [Test]
    public async Task Handle_WithPhase1NoOpCacheService_ExecutesNextDelegateDirectly()
    {
        // Arrange
        var cacheService = new NoOpCacheService();
        var behavior = new CachingBehavior<GetLandingPageSeoDataQuery, ApiResponse<LandingPageSeoDto>>(cacheService);
        var query = new GetLandingPageSeoDataQuery();

        var expectedDto = new LandingPageSeoDto(
            "LingoPro",
            "SEO Description",
            "https://lingopro.online/",
            12500,
            24,
            48,
            120,
            ["TOEIC"]);
        var expectedResponse = ApiResponse<LandingPageSeoDto>.Ok(expectedDto);

        RequestHandlerDelegate<ApiResponse<LandingPageSeoDto>> next = () => Task.FromResult(expectedResponse);

        // Act
        var result = await behavior.Handle(query, next, CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.StatusCode, Is.EqualTo(200));
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.EqualTo(expectedDto));
        });
    }

    [Test]
    public async Task Handle_WithMockCacheService_PassesConfiguredCacheKeyAndExpirations()
    {
        // Arrange
        var cacheService = Substitute.For<ICacheService>();
        var query = new GetLandingPageSeoDataQuery();
        var expectedDto = new LandingPageSeoDto(
            "LingoPro",
            "SEO Description",
            "https://lingopro.online/",
            12500,
            24,
            48,
            120,
            ["TOEIC"]);
        var expectedResponse = ApiResponse<LandingPageSeoDto>.Ok(expectedDto);

        cacheService.GetOrCreateAsync(
                Arg.Is<string>(k => k == query.CacheKey),
                Arg.Any<Func<CancellationToken, Task<ApiResponse<LandingPageSeoDto>>>>(),
                Arg.Is<CacheOptions?>(o => o != null && o.LocalExpiration == query.LocalExpiration && o.DistributedExpiration == query.DistributedExpiration),
                Arg.Any<CancellationToken>())
            .Returns(expectedResponse);

        var behavior = new CachingBehavior<GetLandingPageSeoDataQuery, ApiResponse<LandingPageSeoDto>>(cacheService);

        // Act
        var result = await behavior.Handle(query, () => Task.FromResult(expectedResponse), CancellationToken.None);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResponse));
        await cacheService.Received(1).GetOrCreateAsync(
            query.CacheKey,
            Arg.Any<Func<CancellationToken, Task<ApiResponse<LandingPageSeoDto>>>>(),
            Arg.Any<CacheOptions?>(),
            Arg.Any<CancellationToken>());
    }
}
