using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Grammar;

/// <summary>
/// P0 business tests for <see cref="SubmitGrammarProgressCommandHandler"/> and its validator:
/// accuracy range, first-time topic progress creation, mastery score persistence.
/// </summary>
[TestFixture]
[Category("Grammar")]
public sealed class SubmitGrammarProgressCommandHandlerTests
{
    private static async Task<(LingoProDbContext Db, Guid UserId)> SeedAsync()
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "g@lingopro.online", FullName = "G" });
        await db.SaveChangesAsync();
        return (db, userId);
    }

    [TestCase(0.0, true)]
    [TestCase(100.0, true)]
    [TestCase(-0.01, false)]
    [TestCase(100.01, false)]
    [Property("PlanId", "GRM-02")]
    public void Validate_AccuracyBoundaries_MatchesZeroToHundredRange(double accuracy, bool expectedValid)
    {
        // Arrange
        var validator = new SubmitGrammarProgressCommandValidator();

        // Act
        var result = validator.Validate(new SubmitGrammarProgressCommand("present-simple", accuracy));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    [Test]
    [Property("PlanId", "GRM-04")]
    public async Task Handle_FirstTimeTopic_CreatesProgressRowAndAwardsXp()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("Present-Simple ", 75), CancellationToken.None);

        // Assert
        var rows = await db.GrammarProgresses.AsNoTracking().Where(g => g.UserId == userId).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].TopicSlug, Is.EqualTo("present-simple"));
            Assert.That(rows[0].Reps, Is.EqualTo(1));
            Assert.That(response.Data!.XpAwarded, Is.EqualTo(10));
        });
    }

    [TestCase(80.0)]
    [TestCase(85.0)]
    [TestCase(100.0)]
    [Property("PlanId", "GRM-05")]
    public async Task Handle_AccuracyAtOrAboveEighty_StoresMasteryScoreAtLeastEighty(double accuracy)
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", accuracy), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.MasteryScore, Is.EqualTo(accuracy).And.GreaterThanOrEqualTo(80.0));
    }

    [Test]
    [Property("PlanId", "GRM-06")]
    [Category("KnownDeviation")]
    public async Task Handle_LowerScoreAfterHigherScore_StoresLatestScore()
    {
        // Arrange (original stores the most recent score; C# keeps the max)
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(userId), db);
        await handler.Handle(new SubmitGrammarProgressCommand("articles", 90), CancellationToken.None);

        // Act
        var response = await handler.Handle(new SubmitGrammarProgressCommand("articles", 60), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.MasteryScore, Is.EqualTo(60.0));
    }

    [Test]
    [Property("PlanId", "GRM-04")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitGrammarProgressCommandHandler(TestHelpers.CreateUser(null), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitGrammarProgressCommand("articles", 50), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }
}
