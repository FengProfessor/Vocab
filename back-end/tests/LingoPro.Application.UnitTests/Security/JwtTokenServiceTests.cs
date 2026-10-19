using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Security;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Security;

/// <summary>
/// NUnit unit tests verifying <see cref="JwtTokenService"/> issues a 15-minute Access Token and 30-day Refresh Token.
/// </summary>
[TestFixture]
public sealed class JwtTokenServiceTests
{
    [Test]
    public void GenerateTokenPair_WithDefaultJwtOptions_Issues15MinAccessTokenAnd30DayRefreshToken()
    {
        // Arrange
        var options = Options.Create(new JwtOptions
        {
            SigningKey = "super-secret-signing-key-with-at-least-32-bytes",
            Issuer = "https://lingopro.online",
            Audience = "lingopro-web-spa",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 30
        });
        var service = new JwtTokenService(options);
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            Email = "teacher@lingopro.online",
            FullName = "Teacher",
            Role = UserRole.Teacher,
            Plan = SubscriptionPlanType.Pro
        };

        // Act
        var beforeUtc = DateTime.UtcNow;
        var tokenPair = service.GenerateTokenPair(profile);
        var afterUtc = DateTime.UtcNow;

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(tokenPair.AccessToken, Is.Not.Null.And.Not.Empty);
            Assert.That(tokenPair.RefreshToken, Is.Not.Null.And.Not.Empty);
            Assert.That(
                tokenPair.AccessTokenExpiresAtUtc,
                Is.InRange(beforeUtc.AddMinutes(15).AddSeconds(-2), afterUtc.AddMinutes(15).AddSeconds(2)));
            Assert.That(
                tokenPair.RefreshTokenExpiresAtUtc,
                Is.InRange(beforeUtc.AddDays(30).AddSeconds(-2), afterUtc.AddDays(30).AddSeconds(2)));
        });
    }
}
