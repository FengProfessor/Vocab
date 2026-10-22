using LingoPro.Application.Features.Reading.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Reading;

/// <summary>
/// P0 business tests for <see cref="GetReadingArticlesQueryHandler"/>: only published articles and CEFR filter.
/// Original: src/app/api/reading/articles/route.ts:140-160 (status = 'published', cefr_level filter, created_at desc).
/// <see cref="ReadingArticle"/> stores CEFR level and status as text columns.
/// </summary>
[TestFixture]
[Category("Reading")]
public sealed class GetReadingArticlesQueryHandlerTests
{
    private static ReadingArticle Article(string slug, CertLevel level, string status, DateTime? createdAt = null) =>
        new() { Slug = slug, Title = slug, CefrLevel = level.ToString(), Status = status, CreatedAt = createdAt ?? DateTime.UtcNow };

    [Test]
    [Property("PlanId", "RDG-15")]
    public async Task Handle_MixedStatuses_ReturnsOnlyPublished()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.ReadingArticles.AddRange(
            Article("pub", CertLevel.B1, "published"),
            Article("draft", CertLevel.B1, "draft"),
            Article("arch", CertLevel.B1, "archived"));
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
            Article("a1", CertLevel.A1, "published"),
            Article("b2", CertLevel.B2, "published"),
            Article("b2-draft", CertLevel.B2, "draft"));
        await db.SaveChangesAsync();
        var handler = new GetReadingArticlesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetReadingArticlesQuery(CertLevel.B2), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(a => a.Slug), Is.EqualTo(new[] { "b2" }));
    }

    [Test]
    [Property("PlanId", "RDG-15")]
    public async Task Handle_MultiplePublished_AreOrderedByCreatedAtDescending()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var now = DateTime.UtcNow;
        db.ReadingArticles.AddRange(
            Article("old", CertLevel.B1, "published", now.AddDays(-5)),
            Article("newest", CertLevel.B1, "published", now),
            Article("middle", CertLevel.B1, "published", now.AddDays(-2)));
        await db.SaveChangesAsync();
        var handler = new GetReadingArticlesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetReadingArticlesQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(a => a.Slug), Is.EqualTo(new[] { "newest", "middle", "old" }));
    }

    [Test]
    [Property("PlanId", "RDG-15")]
    public async Task Handle_Article_MapsStringColumnsToDto()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.ReadingArticles.Add(new ReadingArticle
        {
            Slug = "city-life", Title = "City Life", CefrLevel = "B2", ThemeId = "city", SourceType = "voa",
            WordCount = 120, Passage = "<p>Hello</p>", Questions = "[{\"q\":\"?\"}]", Status = "published"
        });
        await db.SaveChangesAsync();
        var handler = new GetReadingArticlesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetReadingArticlesQuery(), CancellationToken.None);

        // Assert
        var dto = response.Data!.Single();
        Assert.Multiple(() =>
        {
            Assert.That(dto.CertLevel, Is.EqualTo("B2"));
            Assert.That(dto.Topic, Is.EqualTo("city"));
            Assert.That(dto.SourceType, Is.EqualTo("voa"));
            Assert.That(dto.WordCount, Is.EqualTo(120));
            Assert.That(dto.ContentText, Is.EqualTo("<p>Hello</p>"));
            Assert.That(dto.QuestionsJson, Is.EqualTo("[{\"q\":\"?\"}]"));
        });
    }
}