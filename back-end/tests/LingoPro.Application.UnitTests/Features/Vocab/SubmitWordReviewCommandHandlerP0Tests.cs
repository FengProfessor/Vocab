using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Vocab;

/// <summary>
/// P0 business tests for <see cref="SubmitWordReviewCommandHandler"/>: SrsProgress creation, idempotent replay,
/// missing word, anonymous caller, classroom-word authorization and no-side-effect on Words.
/// Original rules: src/app/api/words/srs/route.ts (auth/ownership :193-216, idempotency + XP :223-278).
/// XP / streak now live in <see cref="UserGamification"/> (not on Profile).
/// </summary>
[TestFixture]
[Category("Vocab")]
public sealed class SubmitWordReviewCommandHandlerP0Tests
{
    private static async Task<(LingoProDbContext Db, Guid UserId, Word Word)> SeedAsync()
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "u@lingopro.online", FullName = "U" });
        var word = new Word
        {
            Id = Guid.NewGuid(),
            Term = "resilient",
            Translation = "kiên cường",
            ClassroomId = Guid.NewGuid(),
            AddedBy = userId
        };
        db.Words.Add(word);
        await db.SaveChangesAsync();
        return (db, userId, word);
    }

    [Test]
    [Property("PlanId", "VOC-13")]
    public async Task Handle_FirstReview_CreatesSingleSrsProgressRow()
    {
        // Arrange
        var (db, userId, word) = await SeedAsync();
        await using var _ = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new SubmitWordReviewCommand(word.Id, 4, Guid.NewGuid().ToString()), CancellationToken.None);

        // Assert
        var rows = await db.SrsProgresses.Where(s => s.UserId == userId && s.WordId == word.Id).ToListAsync();
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.XpAwarded, Is.EqualTo(10));
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].ReviewCount, Is.EqualTo(1));
            Assert.That(rows[0].State, Is.EqualTo(SrsCardState.Review));
            Assert.That(rows[0].NextReviewDate, Is.Not.Null);
            Assert.That(rows[0].LastReviewedAt, Is.Not.Null);
            Assert.That(gamification.TotalXp, Is.EqualTo(10));
        });
    }

    /// <summary>
    /// Original: replaying the same reviewId returns duplicate=true, xpAwarded=0 and leaves progress untouched
    /// (apply_srs_review via srs_review_events PK (user_id, review_id)). Current handler never reads/writes
    /// <see cref="SrsReviewEvent"/>, so a replay is applied twice.
    /// </summary>
    [Test]
    [Category("KnownDeviation")]
    [Property("PlanId", "VOC-14")]
    public async Task Handle_DuplicateReviewId_AwardsNoXpAndLeavesProgressUnchanged()
    {
        // Arrange
        var (db, userId, word) = await SeedAsync();
        await using var _ = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);
        var reviewId = Guid.NewGuid().ToString();
        await handler.Handle(new SubmitWordReviewCommand(word.Id, 5, reviewId), CancellationToken.None);
        var xpAfterFirst = (await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId)).TotalXp;

        // Act
        var second = await handler.Handle(new SubmitWordReviewCommand(word.Id, 5, reviewId), CancellationToken.None);

        // Assert
        var rows = await db.SrsProgresses.AsNoTracking().Where(s => s.UserId == userId).ToListAsync();
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(second.Data!.XpAwarded, Is.EqualTo(0));
            Assert.That(rows, Has.Count.EqualTo(1));
            Assert.That(rows[0].ReviewCount, Is.EqualTo(1));
            Assert.That(gamification.TotalXp, Is.EqualTo(xpAfterFirst));
        });
    }

    [Test]
    [Property("PlanId", "VOC-16")]
    public async Task Handle_UnknownWord_ThrowsNotFound()
    {
        // Arrange
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitWordReviewCommand(Guid.NewGuid(), 4, Guid.NewGuid().ToString()), CancellationToken.None),
            Throws.TypeOf<NotFoundException>());
    }

    [Test]
    [Property("PlanId", "VOC-29")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _, word) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(null), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitWordReviewCommand(word.Id, 4, Guid.NewGuid().ToString()), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }

    [Test]
    [Category("KnownDeviation")]
    [Property("PlanId", "VOC-17")]
    public async Task Handle_WordOfClassroomUserDoesNotBelongTo_ThrowsForbidden()
    {
        // Arrange (original: 403 unless user added the word, teaches the classroom or is enrolled; C# does not check access)
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var foreignClassroom = new ClassroomEntity { Id = Guid.NewGuid(), TeacherId = Guid.NewGuid(), Name = "Other", InviteCode = "OTHER1" };
        var foreignWord = new Word
        {
            Id = Guid.NewGuid(),
            Term = "secret",
            Translation = "bí mật",
            ClassroomId = foreignClassroom.Id,
            AddedBy = foreignClassroom.TeacherId
        };
        db.Classrooms.Add(foreignClassroom);
        db.Words.Add(foreignWord);
        await db.SaveChangesAsync();
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitWordReviewCommand(foreignWord.Id, 4, Guid.NewGuid().ToString()), CancellationToken.None),
            Throws.TypeOf<ForbiddenAccessException>());
    }

    [Test]
    [Property("PlanId", "VOC-17")]
    public async Task Handle_WordOfEnrolledClassroom_IsAllowed()
    {
        // Arrange (original: enrolled student may review classroom words, srs/route.ts:206-213)
        var (db, userId, _) = await SeedAsync();
        await using var _db = db;
        var classroom = new ClassroomEntity { Id = Guid.NewGuid(), TeacherId = Guid.NewGuid(), Name = "Class", InviteCode = "CLASS1" };
        var classWord = new Word
        {
            Id = Guid.NewGuid(),
            Term = "diligent",
            Translation = "chăm chỉ",
            ClassroomId = classroom.Id,
            AddedBy = classroom.TeacherId
        };
        db.Classrooms.Add(classroom);
        db.Words.Add(classWord);
        db.Enrollments.Add(new Enrollment { StudentId = userId, ClassroomId = classroom.Id });
        await db.SaveChangesAsync();
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new SubmitWordReviewCommand(classWord.Id, 4, Guid.NewGuid().ToString()), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    [Test]
    [Property("PlanId", "VOC-28")]
    public async Task Handle_Review_DoesNotCreateOrChangeWords()
    {
        // Arrange
        var (db, userId, word) = await SeedAsync();
        await using var _ = db;
        var handler = new SubmitWordReviewCommandHandler(TestHelpers.CreateUser(userId), db);
        var before = await db.Words.AsNoTracking().CountAsync();

        // Act
        await handler.Handle(new SubmitWordReviewCommand(word.Id, 3, Guid.NewGuid().ToString()), CancellationToken.None);

        // Assert
        Assert.That(await db.Words.AsNoTracking().CountAsync(), Is.EqualTo(before));
    }
}
