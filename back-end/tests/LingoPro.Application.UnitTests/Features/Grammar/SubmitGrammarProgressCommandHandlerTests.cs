using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Grammar;

/// <summary>
/// P0 business tests for <see cref="SubmitGrammarProgressCommandHandler"/> and its validator:
/// first-time lesson progress creation, mastery score persistence, FSRS mapping.
/// Original rules: src/app/api/grammar/progress/route.ts (POST :235-420). Progress is keyed by lesson
/// (<see cref="GrammarProgress.LessonId"/>); the topic slug resolves to the topic's first lesson (order_index asc, :288-301).
/// XP for grammar (10/15/...) is a pinned C# behaviour: the original awards none on this endpoint.
/// XP / streak live in <see cref="UserGamification"/>.
/// </summary>
[TestFixture]
[Category("Grammar")]
public sealed class SubmitGrammarProgressCommandHandlerTests
{
    private static async Task<(LingoProDbContext Db, Guid UserId, Guid FirstLessonId)> SeedAsync(string slug = "articles")
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "g@lingopro.online", FullName = "G" });
        var topic = new GrammarTopic { Slug = slug, Title = slug, OrderIndex = 1 };
        var first = new GrammarLesson { TopicId = topic.Id, Title = "Lesson 1", OrderIndex = 1 };
        var second = new GrammarLesson { TopicId = topic.Id, Title = "Lesson 2", OrderIndex = 2 };
        db.GrammarTopics.Add(topic);
        db.GrammarLessons.AddRange(second, first);
        await db.SaveChangesAsync();
        return (db, userId, first.Id);
    }

    [TestCase(0.0)]
    [TestCase(1.0)]
    [TestCase(50.0)]
    [TestCase(100.0)]
    [Property("PlanId", "GRM-02")]
    public void Validate_AccuracyInsideRange_IsValid(double accuracy)
    {
        // Arrange
        var validator = new SubmitGrammarProgressCommandValidator();

        // Act
        var result = validator.Validate(new SubmitGrammarProgressCommand("present-simple", accuracy));

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    /// <summary>
    /// Original never rejects an out-of-range accuracy: it clamps to 0..1 after normalising percentages
    /// (grammar/progress/route.ts:269); only a missing/non-numeric value is a 400. The validator rejects them.
    /// </summary>
    [TestCase(-0.01)]
    [TestCase(100.01)]
    [Property("PlanId", "GRM-02")]
    [Category("KnownDeviation")]
    public void Validate_AccuracyOutsideRange_IsAcceptedAndClamped(double accuracy)
    {
        // Arrange
        var validator = new SubmitGrammarProgressCommandValidator();

        // Act
        var result = validator.Validate(new SubmitGrammarProgressCommand("present-simple", accuracy));

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    [Test]
    [Property("PlanId", "GRM-04")]
    public async Task Handle_FirstTimeTopic_CreatesLessonProgressRowAndAwardsXp()
    {
        // Arrange
        var (db, userId, lessonId) = await SeedAsync("present-simple");
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("Present-Simple ", 75), CancellationToken.None);

        // Assert (75% => Good => 10 XP, pinned)
        var rows = await db.GrammarProgresses.AsNoTracking().Where(g => g.UserId == userId).ToListAsync();
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].LessonId, Is.EqualTo(lessonId));
            Assert.That(rows[0].ReviewCount, Is.EqualTo(1));
            Assert.That(rows[0].MasteryScore, Is.EqualTo((short)75));
            Assert.That(rows[0].NextReviewDate, Is.Not.Null);
            Assert.That(response.Data!.TopicSlug, Is.EqualTo("present-simple"));
            Assert.That(response.Data.XpAwarded, Is.EqualTo(10));
            Assert.That(gamification.TotalXp, Is.EqualTo(10));
        });
    }

    [Test]
    [Property("PlanId", "GRM-04")]
    public async Task Handle_TopicWithSeveralLessons_UsesLowestOrderIndexLessonAndKeepsSingleRowOnRepeat()
    {
        // Arrange
        var (db, userId, firstLessonId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));

        // Act
        await handler.Handle(new SubmitGrammarProgressCommand("articles", 60), CancellationToken.None);
        await handler.Handle(new SubmitGrammarProgressCommand("articles", 70), CancellationToken.None);

        // Assert
        var rows = await db.GrammarProgresses.AsNoTracking().Where(g => g.UserId == userId).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].LessonId, Is.EqualTo(firstLessonId));
            Assert.That(rows[0].ReviewCount, Is.EqualTo(2));
        });
    }

    [TestCase(80.0)]
    [TestCase(85.0)]
    [TestCase(100.0)]
    [Property("PlanId", "GRM-05")]
    public async Task Handle_AccuracyAtOrAboveEighty_StoresMasteryScoreAtLeastEighty(double accuracy)
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", accuracy), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.MasteryScore, Is.EqualTo(accuracy).And.GreaterThanOrEqualTo(80.0));
    }

    /// <summary>
    /// Original marks a lesson 'mastered' once masteryScore &gt;= 80 (grammar/progress/route.ts:380); the handler persists the FSRS card state text.
    /// </summary>
    [TestCase(80.0)]
    [TestCase(100.0)]
    [Property("PlanId", "GRM-05")]
    [Category("KnownDeviation")]
    public async Task Handle_AccuracyAtOrAboveEighty_StateIsMastered(double accuracy)
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", accuracy), CancellationToken.None);

        // Assert
        var row = await db.GrammarProgresses.AsNoTracking().SingleAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.State, Is.EqualTo("mastered"));
            Assert.That(row.State, Is.EqualTo("mastered"));
        });
    }

    [Test]
    [Property("PlanId", "GRM-06")]
    public async Task Handle_HigherScoreAfterLowerScore_StoresHigherScore()
    {
        // Arrange (original: currentScore >= oldScore => currentScore, route.ts:373-376)
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));
        await handler.Handle(new SubmitGrammarProgressCommand("articles", 60), CancellationToken.None);

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", 90), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.MasteryScore, Is.EqualTo(90.0));
    }

    /// <summary>
    /// Original (route.ts:371-377): when the new score is lower than the stored one and below 80 the stored score becomes the
    /// 50/50 blend round(0.5*new + 0.5*old); a new score &gt;= 80 replaces the old one. The handler keeps the maximum.
    /// </summary>
    [TestCase(90.0, 60.0, 75.0)]
    [TestCase(90.0, 85.0, 85.0)]
    [Property("PlanId", "GRM-06")]
    [Category("KnownDeviation")]
    public async Task Handle_LowerScoreAfterHigherScore_FollowsOriginalBlendRule(double first, double second, double expected)
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));
        await handler.Handle(new SubmitGrammarProgressCommand("articles", first), CancellationToken.None);

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", second), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.MasteryScore, Is.EqualTo(expected));
    }

    /// <summary>
    /// Original accepts accuracy as a 0..1 fraction or a 0..100 percentage (values &gt; 1 are divided by 100, route.ts:269).
    /// The handler only understands percentages, so 0.9 is read as 0.9%.
    /// </summary>
    [Test]
    [Property("PlanId", "GRM-03")]
    [Category("KnownDeviation")]
    public async Task Handle_FractionalAccuracy_IsTreatedAsPercentage()
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), new GrammarRepository(db));

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", 0.9), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.MasteryScore, Is.EqualTo(90.0));
    }

    [Test]
    [Property("PlanId", "GRM-04")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(null), new GrammarRepository(db));

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitGrammarProgressCommand("articles", 50), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }
}
