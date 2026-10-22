using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Vocab;

/// <summary>
/// P0 business tests for <see cref="SubmitWordReviewCommandHandler"/>: SrsProgress creation, idempotent replay,
/// missing word, anonymous caller, classroom-word authorization and no-side-effect on Words.
/// </summary>
[TestFixture]
[Category("Vocab")]
public sealed class SubmitWordReviewCommandHandlerP0Tests
{
    private static async Task<(LingoProDbContext Db, Guid UserId, Word Word)> SeedAsync()
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "u@lingopro.online", FullName = "U" });
        var word = new Word
        {
            Id = Guid.NewGuid(),
            Term = "resilient",
            Translation = "kiên cường",
            Level = CertLevel.B2,
            Status = WordApprovalStatus.Approved
        };
        db.Words.Add(word);
        await db.SaveChangesAsync();
        return (db, userId, word);
    }

    [Test]
    [Property("PlanId", "VOC-13")]
    public async Task Handle_FirstReview_CreatesSingleSrsProgressRow()
    {
        // Arrange
        var (db, userId, word) = await SeedAsync();
        await using var _ = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new SubmitWordReviewCommand(word.Id, 4, "rev-1"), CancellationToken.None);

        // Assert
        var rows = await db.SrsProgresses.Where(s => s.UserId == userId && s.WordId == word.Id).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.XpAwarded, Is.EqualTo(10));
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].LastReviewId, Is.EqualTo("rev-1"));
            Assert.That(rows[0].Reps, Is.EqualTo(1));
        });
    }

    [Test]
    [Property("PlanId", "VOC-14")]
    public async Task Handle_DuplicateReviewId_AwardsNoXpAndLeavesProgressUnchanged()
    {
        // Arrange
        var (db, userId, word) = await SeedAsync();
        await using var _ = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);
        await handler.Handle(new SubmitWordReviewCommand(word.Id, 5, "rev-dup"), CancellationToken.None);
        var xpAfterFirst = (await db.Profiles.AsNoTracking().FirstAsync(p => p.Id == userId)).TotalXp;

        // Act
        var second = await handler.Handle(new SubmitWordReviewCommand(word.Id, 5, "rev-dup"), CancellationToken.None);

        // Assert
        var rows = await db.SrsProgresses.AsNoTracking().Where(s => s.UserId == userId).ToListAsync();
        var profile = await db.Profiles.AsNoTracking().FirstAsync(p => p.Id == userId);
        Assert.Multiple(() =>
        {
            Assert.That(second.Data!.XpAwarded, Is.EqualTo(0));
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].Reps, Is.EqualTo(1));
            Assert.That(profile.TotalXp, Is.EqualTo(xpAfterFirst));
        });
    }

    [Test]
    [Property("PlanId", "VOC-16")]
    public async Task Handle_UnknownWord_ThrowsNotFound()
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitWordReviewCommand(Guid.NewGuid(), 4, "rev-x"), CancellationToken.None),
            Throws.TypeOf<NotFoundException>());
    }

    [Test]
    [Property("PlanId", "VOC-29")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _, word) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(null), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitWordReviewCommand(word.Id, 4, "rev-x"), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }

    [Test]
    [Property("PlanId", "VOC-17")]
    [Category("KnownDeviation")]
    public async Task Handle_WordOfClassroomUserDoesNotBelongTo_ThrowsForbidden()
    {
        // Arrange (original: 403 for a word the user may not access; C# does not check access)
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var foreignWord = new Word
        {
            Id = Guid.NewGuid(),
            Term = "secret",
            Translation = "bí mật",
            ClassroomId = Guid.NewGuid(),
            AddedBy = Guid.NewGuid()
        };
        db.Words.Add(foreignWord);
        await db.SaveChangesAsync();
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitWordReviewCommand(foreignWord.Id, 4, "rev-f"), CancellationToken.None),
            Throws.TypeOf<ForbiddenAccessException>());
    }

    [Test]
    [Property("PlanId", "VOC-28")]
    public async Task Handle_Review_DoesNotCreateOrChangeWords()
    {
        // Arrange
        var (db, userId, word) = await SeedAsync();
        await using var _ = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);
        var before = await db.Words.AsNoTracking().CountAsync();

        // Act
        await handler.Handle(new SubmitWordReviewCommand(word.Id, 3, "rev-w"), CancellationToken.None);

        // Assert
        Assert.That(await db.Words.AsNoTracking().CountAsync(), Is.EqualTo(before));
    }
}
