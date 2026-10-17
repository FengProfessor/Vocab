using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Common;

/// <summary>
/// NUnit tests verifying <see cref="AuditableEntitySaveChangesInterceptor"/> and global soft-delete query filters in <see cref="LingoProDbContext"/>.
/// </summary>
[TestFixture]
public sealed class AuditableEntitySaveChangesInterceptorTests
{
    [Test]
    public async Task SaveChangesAsync_WhenEntityRemoved_ConvertsToSoftDeleteAndExcludesFromDefaultQueries()
    {
        // Arrange
        var actorId = Guid.NewGuid();
        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.UserId.Returns(actorId);

        var interceptor = new AuditableEntitySaveChangesInterceptor(currentUserService);
        var options = new DbContextOptionsBuilder<LingoProDbContext>()
            .UseInMemoryDatabase(databaseName: $"lingopro_audit_test_{Guid.NewGuid():N}")
            .AddInterceptors(interceptor)
            .Options;

        await using var dbContext = new LingoProDbContext(options);

        var word = new Word
        {
            Id = Guid.NewGuid(),
            Term = "resilience",
            Translation = "khả năng phục hồi",
            Level = CertLevel.B2
        };

        // Act 1 - Add
        dbContext.Words.Add(word);
        await dbContext.SaveChangesAsync();

        Assert.Multiple(() =>
        {
            Assert.That(word.CreatedBy, Is.EqualTo(actorId));
            Assert.That(word.UpdatedBy, Is.EqualTo(actorId));
            Assert.That(word.IsDeleted, Is.False);
            Assert.That(word.DeletedAt, Is.Null);
            Assert.That(word.DeletedBy, Is.Null);
        });

        // Act 2 - Delete (intercepted into soft-delete)
        dbContext.Words.Remove(word);
        await dbContext.SaveChangesAsync();

        var visibleWords = await dbContext.Words.ToListAsync();
        var allWordsIncludingDeleted = await dbContext.Words.IgnoreQueryFilters().ToListAsync();

        // Assert 2 - Soft-Deleted & Filtered
        Assert.Multiple(() =>
        {
            Assert.That(visibleWords, Is.Empty);
            Assert.That(allWordsIncludingDeleted, Has.Count.EqualTo(1));
            Assert.That(allWordsIncludingDeleted[0].IsDeleted, Is.True);
            Assert.That(allWordsIncludingDeleted[0].DeletedAt, Is.Not.Null);
            Assert.That(allWordsIncludingDeleted[0].DeletedBy, Is.EqualTo(actorId));
        });
    }
}
