using LingoPro.Application.Features.Reading.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Exceptions;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Reading;

/// <summary>
/// P0 business tests for <see cref="GetDailyReadingQueryHandler"/>: today's exercise lookup, isolation between users
/// and between personal and classroom exercises.
/// </summary>
[TestFixture]
[Category("Reading")]
public sealed class GetDailyReadingQueryHandlerTests
{
    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    [Test]
    [Property("PlanId", "RDG-01")]
    public async Task Handle_PersonalExerciseForToday_ReturnsItWithCompletionFlag()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "r@x.com", FullName = "R" });
        var exercise = new DailyReadingExercise { TargetUserId = userId, ExerciseDate = Today, Title = "Today" };
        db.DailyReadingExercises.Add(exercise);
        await db.SaveChangesAsync();
        var handler = new GetDailyReadingQueryHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var before = await handler.Handle(new GetDailyReadingQuery(), CancellationToken.None);
        db.DailyReadingCompletions.Add(new DailyReadingCompletion { UserId = userId, ExerciseId = exercise.Id });
        await db.SaveChangesAsync();
        var after = await handler.Handle(new GetDailyReadingQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(before.Data!.Id, Is.EqualTo(exercise.Id));
            Assert.That(before.Data.IsCompletedToday, Is.False);
            Assert.That(after.Data!.IsCompletedToday, Is.True);
        });
    }

    [Test]
    [Property("PlanId", "RDG-02")]
    public async Task Handle_OnlyOtherUsersExerciseToday_ThrowsNotFound()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.DailyReadingExercises.Add(new DailyReadingExercise { TargetUserId = Guid.NewGuid(), ExerciseDate = Today });
        await db.SaveChangesAsync();
        var handler = new GetDailyReadingQueryHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new GetDailyReadingQuery(), CancellationToken.None),
            Throws.TypeOf<NotFoundException>());
    }

    [Test]
    [Property("PlanId", "RDG-03")]
    [Category("KnownDeviation")]
    public async Task Handle_OnlyClassroomExerciseToday_IsNotReturnedInPersonalMode()
    {
        // Arrange (original: personal mode never shows classroom exercises; C# matches TargetUserId == null)
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.DailyReadingExercises.Add(new DailyReadingExercise
        {
            TargetUserId = null,
            ClassroomId = Guid.NewGuid(),
            ExerciseDate = Today,
            Title = "Class reading"
        });
        await db.SaveChangesAsync();
        var handler = new GetDailyReadingQueryHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new GetDailyReadingQuery(), CancellationToken.None),
            Throws.TypeOf<NotFoundException>());
    }
}
