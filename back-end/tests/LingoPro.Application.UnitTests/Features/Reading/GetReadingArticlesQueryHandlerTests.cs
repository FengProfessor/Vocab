using LingoPro.Application.Features.Reading.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Reading;

/// <summary>
/// P0 business tests for <see cref="GetReadingArticlesQueryHandler"/>: only published articles and CEFR filter.
/// </summary>
[TestFixture]
[Category("Reading")]
public sealed class GetReadingArticlesQueryHandlerTests
{
    private static ReadingArticle Article(string slug, CertLevel level, ReadingArticleStatus status) =>
        new() { Slug = slug, Title = slug, CertLevel = level, Status = status };

    [Test]
    [Property("PlanId", "RDG-15")]
    public async Task Handle_MixedStatuses_ReturnsOnlyPublished()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.ReadingArticles.AddRange(
            Article("pub", CertLevel.B1, ReadingArticleStatus.Published),
            Article("draft", CertLevel.B1, ReadingArticleStatus.Draft),
            Article("arch", CertLevel.B1, ReadingArticleStatus.Archived));
        await db.SaveChangesAsync();
        var handler = new GetReadingArticlesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetReadingArticlesQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(a => a.Slug), Is.EqualTo(new[] { "pub" }));
    }

    [Test]
    [Property("PlanId", "RDG-15")]
    public async Task Handle_CertLevelFilter_ReturnsOnlyThatLevel()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.ReadingArticles.AddRange(
            Article("a1", CertLevel.A1, ReadingArticleStatus.Published),
            Article("b2", CertLevel.B2, ReadingArticleStatus.Published),
            Article("b2-draft", CertLevel.B2, ReadingArticleStatus.Draft));
        await db.SaveChangesAsync();
        var handler = new GetReadingArticlesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetReadingArticlesQuery(CertLevel.B2), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(a => a.Slug), Is.EqualTo(new[] { "b2" }));
    }
}
