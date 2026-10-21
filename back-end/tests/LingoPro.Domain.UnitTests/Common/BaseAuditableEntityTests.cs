using LingoPro.Domain.Entities.Auth;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Common;

/// <summary>
/// NUnit tests verifying soft-delete and restore behavior on <see cref="LingoPro.Domain.Common.BaseAuditableEntity"/>.
/// </summary>
[TestFixture]
public sealed class BaseAuditableEntityTests
{
    [Test]
    public void NewBaseAuditableEntity_HasNullableSoftDeletePropertiesInitializedCorrectly()
    {
        // Arrange & Act
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            Email = "user@lingopro.online",
            IsDeleted = null
        };

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.DeletedAt, Is.Null);
            Assert.That(profile.DeletedBy, Is.Null);
            Assert.That(profile.IsDeleted, Is.Null);
        });
    }

    [Test]
    public void MarkAsDeleted_And_Restore_UpdatesSoftDeleteFields()
    {
        // Arrange
        var actorId = Guid.NewGuid();
        var deletedAt = new DateTime(2026, 10, 17, 12, 0, 0, DateTimeKind.Utc);

        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            Email = "delete-test@lingopro.online"
        };

        // Act - Soft Delete
        profile.MarkAsDeleted(actorId, deletedAt);

        // Assert - Soft Delete
        Assert.Multiple(() =>
        {
            Assert.That(profile.IsDeleted, Is.True);
            Assert.That(profile.DeletedAt, Is.EqualTo(deletedAt));
            Assert.That(profile.DeletedBy, Is.EqualTo(actorId));
        });

        // Act - Restore
        profile.Restore(actorId);

        // Assert - Restore
        Assert.Multiple(() =>
        {
            Assert.That(profile.IsDeleted, Is.False);
            Assert.That(profile.DeletedAt, Is.Null);
            Assert.That(profile.DeletedBy, Is.Null);
        });
    }
}
