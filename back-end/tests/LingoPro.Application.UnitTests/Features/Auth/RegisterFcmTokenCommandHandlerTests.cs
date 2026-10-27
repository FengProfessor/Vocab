using LingoPro.Application.Features.Auth.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Auth;

/// <summary>
/// NUnit unit tests for <see cref="RegisterFcmTokenCommandHandler"/>.
/// </summary>
[TestFixture]
[Category("Auth")]
public sealed class RegisterFcmTokenCommandHandlerTests
{
    [Test]
    public async Task Handle_RegistersTokenAndDeduplicatesAcrossProfiles()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        var previousOwnerId = Guid.NewGuid();
        const string sharedToken = "fcm_device_token_123";

        db.Profiles.AddRange(
            new Profile { Id = userId, Email = "current@example.com", FullName = "Current User" },
            new Profile { Id = previousOwnerId, Email = "prev@example.com", FullName = "Previous User", FcmToken = sharedToken });
        await db.SaveChangesAsync();

        var handler = new RegisterFcmTokenCommandHandler(
            TestHelpers.CreateUser(userId),
            new AuthRepository(db));

        // Act
        var response = await handler.Handle(new RegisterFcmTokenCommand(sharedToken), CancellationToken.None);

        // Assert
        var currentProfile = await db.Profiles.SingleAsync(p => p.Id == userId);
        var previousProfile = await db.Profiles.SingleAsync(p => p.Id == previousOwnerId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(currentProfile.FcmToken, Is.EqualTo(sharedToken));
            Assert.That(previousProfile.FcmToken, Is.Null);
        });
    }
}
