using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Vocab;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Vocab;

/// <summary>
/// P0 business tests for <see cref="GetDueWordsQueryHandler"/>: due-queue filtering, ownership and ordering.
/// </summary>
[TestFixture]
[Category("Vocab")]
public sealed class GetDueWordsQueryHandlerTests
{
    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    private static Word NewWord(string term) => new() { Id = Guid.NewGuid(), Term = term, Translation = term };

    [Test]
    [Property("PlanId", "VOC-25")]
    public async Task Handle_MixedDueAndFutureCards_ReturnsOnlyOwnDueCards()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        db.Profiles.AddRange(
            new Profile { Id = userId, Email = "a@x.com", FullName = "A" },
            new Profile { Id = otherId, Email = "b@x.com", FullName = "B" });
        var due = NewWord("due");
        var future = NewWord("future");
        var others = NewWord("others");
        db.Words.AddRange(due, future, others);
        db.SrsProgresses.AddRange(
            new SrsProgress { UserId = userId, WordId = due.Id, NextReviewDate = Today.AddDays(-1) },
            new SrsProgress { UserId = userId, WordId = future.Id, NextReviewDate = Today.AddDays(2) },
            new SrsProgress { UserId = otherId, WordId = others.Id, NextReviewDate = Today.AddDays(-1) });
        await db.SaveChangesAsync();
        var handler = new GetDueWordsQueryHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new GetDueWordsQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Has.Count.EqualTo(1));
            Assert.That(response.Data![0].Id, Is.EqualTo(due.Id));
        });
    }

    [Test]
    [Property("PlanId", "VOC-27")]
    public async Task Handle_MultipleDueCards_OrdersByNextReviewDateAscending()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "a@x.com", FullName = "A" });
        var w1 = NewWord("newer");
        var w2 = NewWord("oldest");
        var w3 = NewWord("middle");
        db.Words.AddRange(w1, w2, w3);
        db.SrsProgresses.AddRange(
            new SrsProgress { UserId = userId, WordId = w1.Id, NextReviewDate = Today.AddDays(-1) },
            new SrsProgress { UserId = userId, WordId = w2.Id, NextReviewDate = Today.AddDays(-5) },
            new SrsProgress { UserId = userId, WordId = w3.Id, NextReviewDate = Today.AddDays(-3) });
        await db.SaveChangesAsync();
        var handler = new GetDueWordsQueryHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new GetDueWordsQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(d => d.Term), Is.EqualTo(new[] { "oldest", "middle", "newer" }));
    }

    [Test]
    [Property("PlanId", "VOC-29")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new GetDueWordsQueryHandler(TestHelpers.CreateUser(null), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new GetDueWordsQuery(), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }
}
