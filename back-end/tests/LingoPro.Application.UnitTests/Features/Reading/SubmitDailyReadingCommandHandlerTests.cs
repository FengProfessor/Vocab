using LingoPro.Application.Features.Reading.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Reading;

/// <summary>
/// P0 business tests for <see cref="SubmitDailyReadingCommandHandler"/> and its validator:
/// first-completion XP, replay, unknown exercise, partial submissions and score clamping.
/// Original: src/app/api/practice/daily-reading/route.ts POST :305-382 (upsert by user+exercise, clamp 0..100, keep earlier part).
/// The 30 XP award (and its once-only guard) is a pinned C# behaviour: the original awards no XP here; XP/streak live in <see cref="UserGamification"/>.
/// The original has no ownership check on submit and no score-vs-total check, so the old RDG-11/RDG-13 tests were removed.
/// </summary>
[TestFixture]
[Category("Reading")]
public sealed class SubmitDailyReadingCommandHandlerTests
{
    private static async Task<(LingoProDbContext Db, Guid UserId, DailyReadingExercise Exercise)> SeedAsync(Guid? exerciseOwner = null)
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "r@x.com", FullName = "R" });
        var exercise = new DailyReadingExercise { TargetUserId = exerciseOwner ?? userId, Title = "Ex", ExerciseDate = DateOnly.FromDateTime(DateTime.UtcNow) };
        db.DailyReadingExercises.Add(exercise);
        await db.SaveChangesAsync();
        return (db, userId, exercise);
    }

    [Test]
    [Property("PlanId", "RDG-07")]
    public async Task Handle_FirstSubmission_Awards30XpAndStoresCompletion()
    {
        // Arrange
        var (db, userId, exercise) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(userId), new ReadingRepository(db));

        // Act
        var response = await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 4, 5, 3, 5), CancellationToken.None);

        // Assert
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        var completion = await db.DailyReadingCompletions.AsNoTracking().SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Is.EqualTo(30));
            Assert.That(gamification.TotalXp, Is.EqualTo(30));
            Assert.That(completion.McqScore, Is.EqualTo(4));
            Assert.That(completion.ClozeTotal, Is.EqualTo(5));
        });
    }

    [Test]
    [Property("PlanId", "RDG-08")]
    public async Task Handle_SecondSubmission_AwardsNoMoreXp()
    {
        // Arrange
        var (db, userId, exercise) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(userId), new ReadingRepository(db));
        await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 4, 5, 3, 5), CancellationToken.None);

        // Act
        var second = await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 5, 5, 5, 5), CancellationToken.None);

        // Assert
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(second.Data, Is.EqualTo(0));
            Assert.That(gamification.TotalXp, Is.EqualTo(30));
            Assert.That(db.DailyReadingCompletions.Count(), Is.EqualTo(1));
        });
    }

    [Test]
    [Property("PlanId", "RDG-12")]
    public async Task Handle_UnknownExercise_ThrowsNotFound()
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(userId), new ReadingRepository(db));

        // Act + Assert (original silently answers success because the FK upsert only logs a warning, route.ts:372-374;
        // a NotFound error is the accepted representation in the new API)
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitDailyReadingCommand(Guid.NewGuid(), 1, 1, 1, 1), CancellationToken.None),
            Throws.TypeOf<NotFoundException>());
    }

    [Test]
    [Property("PlanId", "RDG-09")]
    [Category("KnownDeviation")]
    public async Task Handle_McqThenClozeSubmission_MergesBothPartsIntoCompletion()
    {
        // Arrange (SRS E2: partial submissions are merged, earlier part is preserved)
        var (db, userId, exercise) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(userId), new ReadingRepository(db));
        await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 3, 5, 0, 0), CancellationToken.None);

        // Act
        await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 0, 0, 2, 4), CancellationToken.None);

        // Assert
        var completion = await db.DailyReadingCompletions.AsNoTracking().SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(completion.McqScore, Is.EqualTo(3));
            Assert.That(completion.McqTotal, Is.EqualTo(5));
            Assert.That(completion.ClozeScore, Is.EqualTo(2));
            Assert.That(completion.ClozeTotal, Is.EqualTo(4));
        });
    }

    [Test]
    [Property("PlanId", "RDG-10")]
    [Category("KnownDeviation")]
    public async Task Handle_OutOfRangeScores_AreClampedToZeroHundred()
    {
        // Arrange (original clamps every score/total to 0..100)
        var (db, userId, exercise) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(userId), new ReadingRepository(db));

        // Act
        await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 150, 150, -5, 10), CancellationToken.None);

        // Assert
        var completion = await db.DailyReadingCompletions.AsNoTracking().SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(completion.McqScore, Is.EqualTo(100));
            Assert.That(completion.McqTotal, Is.EqualTo(100));
            Assert.That(completion.ClozeScore, Is.EqualTo(0));
            Assert.That(completion.ClozeTotal, Is.EqualTo(10));
        });
    }

    /// <summary>
    /// Original re-submission upserts the completion with the new scores (daily-reading/route.ts:359-370);
    /// the handler returns early and keeps the first scores.
    /// </summary>
    [Test]
    [Property("PlanId", "RDG-08")]
    [Category("KnownDeviation")]
    public async Task Handle_SecondSubmission_OverwritesScores()
    {
        // Arrange
        var (db, userId, exercise) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(userId), new ReadingRepository(db));
        await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 2, 5, 1, 5), CancellationToken.None);

        // Act
        await handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 5, 5, 5, 5), CancellationToken.None);

        // Assert
        var completion = await db.DailyReadingCompletions.AsNoTracking().SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(completion.McqScore, Is.EqualTo(5));
            Assert.That(completion.ClozeScore, Is.EqualTo(5));
        });
    }

    [Test]
    [Property("PlanId", "RDG-07")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _, exercise) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitDailyReadingCommandHandler(TestHelpers.CreateUser(null), new ReadingRepository(db));

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitDailyReadingCommand(exercise.Id, 1, 1, 1, 1), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }
}
