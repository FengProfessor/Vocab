using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Vocab;

/// <summary>
/// NUnit unit tests for <see cref="GetVocabWordByIdQueryHandler"/>.
/// </summary>
[TestFixture]
[Category("Vocab")]
public sealed class GetVocabWordByIdQueryHandlerTests
{
    [Test]
    public async Task Handle_WordWithSrsProgress_ReturnsWordDetailAndSrsFields()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        var word = new Word
        {
            ClassroomId = Guid.NewGuid(),
            Term = "resilient",
            Translation = "kien cuong",
            Ipa = "/rɪˈzɪliənt/",
            Pos = "adj",
            Example = "She is resilient.",
            Synonyms = ["tough", "strong"]
        };
        db.Words.Add(word);
        db.SrsProgresses.Add(new SrsProgress
        {
            UserId = userId,
            WordId = word.Id,
            State = SrsCardState.Review,
            Stability = 14.5,
            Difficulty = 4.2,
            IntervalDays = 14,
            ReviewCount = 5
        });
        await db.SaveChangesAsync();

        var handler = new GetVocabWordByIdQueryHandler(
            TestHelpers.CreateUser(userId),
            new VocabRepository(db));

        // Act
        var response = await handler.Handle(new GetVocabWordByIdQuery(word.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data?.Term, Is.EqualTo("resilient"));
            Assert.That(response.Data?.Translation, Is.EqualTo("kien cuong"));
            Assert.That(response.Data?.Stability, Is.EqualTo(14.5));
            Assert.That(response.Data?.ReviewCount, Is.EqualTo(5));
            Assert.That(response.Data?.Synonyms, Is.EquivalentTo(new[] { "tough", "strong" }));
        });
    }

    [Test]
    public void Handle_UnknownWord_ThrowsNotFoundException()
    {
        // Arrange
        using var db = TestHelpers.CreateDb();
        var handler = new GetVocabWordByIdQueryHandler(
            TestHelpers.CreateUser(Guid.NewGuid()),
            new VocabRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(new GetVocabWordByIdQuery(Guid.NewGuid()), CancellationToken.None));
    }
}
