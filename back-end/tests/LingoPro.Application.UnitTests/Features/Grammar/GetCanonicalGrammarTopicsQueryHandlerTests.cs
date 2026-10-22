using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Grammar;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Grammar;

/// <summary>
/// P0 business tests for <see cref="GetCanonicalGrammarTopicsQueryHandler"/>: curriculum ordering.
/// Original rule: src/app/api/grammar/topics/route.ts:32-52 (ORDER BY order_index, then sorted by level
/// beginner &lt; intermediate &lt; advanced, then order_index). <see cref="GrammarTopic"/> now carries text <c>Level</c>
/// and <c>OrderIndex</c> (no CertLevel / SortOrder columns; the original has no CEFR filter on this endpoint).
/// </summary>
[TestFixture]
[Category("Grammar")]
public sealed class GetCanonicalGrammarTopicsQueryHandlerTests
{
    private static GrammarTopic Topic(string slug, int order, string level = "beginner") =>
        new() { Slug = slug, Title = slug, OrderIndex = order, Level = level };

    [Test]
    [Property("PlanId", "GRM-07")]
    public async Task Handle_NoFilter_ReturnsAllTopicsOrderedByOrderIndex()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GrammarTopics.AddRange(Topic("c", 3), Topic("a", 1), Topic("b", 2));
        await db.SaveChangesAsync();
        var handler = new GetCanonicalGrammarTopicsQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetCanonicalGrammarTopicsQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.Select(t => t.Slug), Is.EqualTo(new[] { "a", "b", "c" }));
            Assert.That(response.Data!.Select(t => t.SortOrder), Is.EqualTo(new[] { 1, 2, 3 }));
        });
    }

    [Test]
    [Property("PlanId", "GRM-07")]
    public async Task Handle_Topic_MapsSlugTitleAndLevel()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GrammarTopics.Add(new GrammarTopic { Slug = "present-simple", Title = "Present Simple", TitleVi = "Hien tai don", Level = "A1", OrderIndex = 1 });
        await db.SaveChangesAsync();
        var handler = new GetCanonicalGrammarTopicsQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetCanonicalGrammarTopicsQuery(), CancellationToken.None);

        // Assert
        var dto = response.Data!.Single();
        Assert.Multiple(() =>
        {
            Assert.That(dto.Slug, Is.EqualTo("present-simple"));
            Assert.That(dto.Title, Is.EqualTo("Present Simple"));
            Assert.That(dto.TitleVi, Is.EqualTo("Hien tai don"));
            Assert.That(dto.Level, Is.EqualTo("A1"));
        });
    }

    /// <summary>
    /// Original sorts by level group first (beginner &lt; intermediate &lt; advanced) and only then by order_index
    /// (grammar/topics/route.ts:42-51); the handler orders by OrderIndex alone.
    /// </summary>
    [Test]
    [Property("PlanId", "GRM-07")]
    [Category("KnownDeviation")]
    public async Task Handle_TopicsOfDifferentLevels_AreGroupedByLevelBeforeOrderIndex()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GrammarTopics.AddRange(Topic("adv-first", 1, "advanced"), Topic("beg-late", 5, "beginner"), Topic("int-mid", 3, "intermediate"));
        await db.SaveChangesAsync();
        var handler = new GetCanonicalGrammarTopicsQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetCanonicalGrammarTopicsQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(t => t.Slug), Is.EqualTo(new[] { "beg-late", "int-mid", "adv-first" }));
    }
}
