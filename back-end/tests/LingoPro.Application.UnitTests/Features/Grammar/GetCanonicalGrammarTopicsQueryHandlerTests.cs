using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Grammar;

/// <summary>
/// P0 business tests for <see cref="GetCanonicalGrammarTopicsQueryHandler"/>: curriculum ordering and CEFR filter.
/// </summary>
[TestFixture]
[Category("Grammar")]
public sealed class GetCanonicalGrammarTopicsQueryHandlerTests
{
    private static GrammarTopic Topic(string slug, int order, CertLevel level) =>
        new() { Slug = slug, Title = slug, SortOrder = order, CertLevel = level };

    [Test]
    [Property("PlanId", "GRM-07")]
    public async Task Handle_NoFilter_ReturnsAllTopicsOrderedBySortOrder()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GrammarTopics.AddRange(Topic("c", 3, CertLevel.B1), Topic("a", 1, CertLevel.A1), Topic("b", 2, CertLevel.A2));
        await db.SaveChangesAsync();
        var handler = new GetCanonicalGrammarTopicsQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetCanonicalGrammarTopicsQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(t => t.Slug), Is.EqualTo(new[] { "a", "b", "c" }));
    }

    [Test]
    [Property("PlanId", "GRM-14")]
    public async Task Handle_CertLevelFilter_ReturnsOnlyMatchingLevel()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GrammarTopics.AddRange(Topic("a", 1, CertLevel.A1), Topic("b", 2, CertLevel.A2), Topic("c", 3, CertLevel.A2));
        await db.SaveChangesAsync();
        var handler = new GetCanonicalGrammarTopicsQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetCanonicalGrammarTopicsQuery(CertLevel.A2), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(t => t.Slug), Is.EqualTo(new[] { "b", "c" }));
    }
}
