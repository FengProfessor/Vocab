using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit business unit tests for <see cref="AssignDrillCommandHandler"/>: ownership, IDOR protection, personal workspace guard
/// and which SRS cards are rescheduled to today (plan IDs CLS-10..CLS-16, CLS-18).
/// </summary>
[TestFixture]
[Category("Classrooms")]
public sealed class AssignDrillCommandHandlerTests
{
    private sealed class Scenario
    {
        public required LingoProDbContext Db { get; init; }
        public required ClassroomEntity Classroom { get; init; }
        public required Guid TeacherId { get; init; }
        public required Guid StudentId { get; init; }
        public required DateTime FutureDate { get; init; }
        public List<Word> ClassWords { get; } = [];
    }

    /// <summary>UTC calendar day at midnight: the value the handler stores in <c>NextReviewDate</c> (src/app/api/teacher/assign-drill/route.ts:87-94 stores today's date).</summary>
    private static DateTime UtcToday() => DateTime.UtcNow.Date;

    /// <summary>Seeds a classroom owned by a teacher with one enrolled student and <paramref name="classWordCount"/> class words with SRS cards due in the future.</summary>
    private static async Task<Scenario> SeedAsync(
        int classWordCount = 3,
        string classroomName = "TOEIC 800+",
        bool enrollStudent = true,
        Func<int, double>? difficulty = null)
    {
        var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var future = UtcToday().AddDays(10);
        var classroom = new ClassroomEntity
        {
            Name = classroomName,
            InviteCode = "ABC123",
            TeacherId = teacherId
        };
        db.Classrooms.Add(classroom);
        if (enrollStudent)
        {
            db.Enrollments.Add(new Enrollment { ClassroomId = classroom.Id, StudentId = studentId });
        }

        var scenario = new Scenario
        {
            Db = db,
            Classroom = classroom,
            TeacherId = teacherId,
            StudentId = studentId,
            FutureDate = future
        };

        for (int i = 1; i <= classWordCount; i++)
        {
            var word = new Word { Term = $"word{i}", Translation = $"nghia{i}", ClassroomId = classroom.Id };
            scenario.ClassWords.Add(word);
            db.Words.Add(word);
            db.SrsProgresses.Add(NewProgress(studentId, word.Id, future, difficulty?.Invoke(i) ?? 5.0));
        }

        await db.SaveChangesAsync();
        return scenario;
    }

    private static SrsProgress NewProgress(Guid userId, Guid wordId, DateTime next, double difficulty = 5.0) => new()
    {
        UserId = userId,
        WordId = wordId,
        NextReviewDate = next,
        Difficulty = difficulty,
        Stability = 3.0
    };

    private static AssignDrillCommandHandler HandlerFor(Scenario s, Guid callerId, UserRole role = UserRole.Teacher) =>
        new(TestHelpers.CreateUser(callerId, role), new ClassroomRepository(s.Db));

    /// <summary>CLS-10: assigning explicit class words reschedules exactly those cards to today and reports the count.</summary>
    [Test]
    [Property("PlanId", "CLS-10")]
    public async Task Handle_ExplicitClassWords_SetsNextReviewDateToToday()
    {
        // Arrange
        var s = await SeedAsync(classWordCount: 3);
        await using var dbLease = s.Db;
        var targets = s.ClassWords.Take(2).Select(w => w.Id).ToList();
        var before = UtcToday();

        // Act
        var response = await HandlerFor(s, s.TeacherId).Handle(
            new AssignDrillCommand(s.Classroom.Id, s.StudentId, targets), CancellationToken.None);

        // Assert
        var after = UtcToday();
        var progresses = await s.Db.SrsProgresses.ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Is.EqualTo(2));
            foreach (var p in progresses.Where(p => targets.Contains(p.WordId)))
            {
                Assert.That(p.NextReviewDate, Is.AnyOf(before, after));
            }

            Assert.That(
                progresses.Single(p => p.WordId == s.ClassWords[2].Id).NextReviewDate,
                Is.EqualTo(s.FutureDate),
                "Cards that were not targeted keep their schedule.");
        });
    }

    /// <summary>CLS-11: a student that is not enrolled in the classroom cannot be targeted (IDOR protection) and nothing changes.</summary>
    [Test]
    [Property("PlanId", "CLS-11")]
    public async Task Handle_StudentNotEnrolled_ThrowsForbiddenAndKeepsSchedule()
    {
        // Arrange
        var s = await SeedAsync(enrollStudent: false);
        await using var dbLease = s.Db;
        var command = new AssignDrillCommand(s.Classroom.Id, s.StudentId, s.ClassWords.Select(w => w.Id).ToList());

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await HandlerFor(s, s.TeacherId).Handle(command, CancellationToken.None));
        Assert.That(
            s.Db.SrsProgresses.Select(p => p.NextReviewDate).Distinct().ToList(),
            Is.EqualTo(new[] { s.FutureDate }));
    }

    /// <summary>CLS-12: a teacher who does not own the classroom is forbidden.</summary>
    [Test]
    [Property("PlanId", "CLS-12")]
    public async Task Handle_TeacherDoesNotOwnClassroom_ThrowsForbidden()
    {
        // Arrange
        var s = await SeedAsync();
        await using var dbLease = s.Db;
        var command = new AssignDrillCommand(s.Classroom.Id, s.StudentId, null);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await HandlerFor(s, Guid.NewGuid()).Handle(command, CancellationToken.None));
    }

    /// <summary>CLS-12: the original route lets only the classroom's own teacher assign drills (<c>cls.teacher_id !== auth.userId</c> is rejected, assign-drill/route.ts:36); an admin who does not own the class is refused.</summary>
    [Test]
    [Property("PlanId", "CLS-12")]
    [Category("KnownDeviation")] // C# lets any admin assign drills in any classroom.
    public async Task Handle_AdminDoesNotOwnClassroom_ThrowsForbidden()
    {
        // Arrange
        var s = await SeedAsync(classWordCount: 2);
        await using var dbLease = s.Db;
        var command = new AssignDrillCommand(s.Classroom.Id, s.StudentId, s.ClassWords.Select(w => w.Id).ToList());

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await HandlerFor(s, Guid.NewGuid(), UserRole.Admin).Handle(command, CancellationToken.None));
    }

    /// <summary>CLS-13: the hidden <c>__personal__</c> classroom can never be used to assign drills, even by its owner.</summary>
    [Test]
    [Property("PlanId", "CLS-13")]
    public async Task Handle_PersonalClassroom_ThrowsForbiddenEvenForOwner()
    {
        // Arrange
        var s = await SeedAsync(classroomName: "__personal__");
        await using var dbLease = s.Db;
        var command = new AssignDrillCommand(s.Classroom.Id, s.StudentId, null);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await HandlerFor(s, s.TeacherId).Handle(command, CancellationToken.None));
    }

    /// <summary>CLS-14: an unknown classroom is reported as not found; anonymous callers are unauthorized.</summary>
    [Test]
    [Property("PlanId", "CLS-14")]
    public async Task Handle_UnknownClassroomOrAnonymousCaller_Throws()
    {
        // Arrange
        var s = await SeedAsync();
        await using var dbLease = s.Db;
        var unknown = new AssignDrillCommand(Guid.NewGuid(), s.StudentId, null);
        var known = new AssignDrillCommand(s.Classroom.Id, s.StudentId, null);
        var anonymous = new AssignDrillCommandHandler(TestHelpers.CreateUser(null), new ClassroomRepository(s.Db));

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.ThrowsAsync<NotFoundException>(
                async () => await HandlerFor(s, s.TeacherId).Handle(unknown, CancellationToken.None));
            Assert.ThrowsAsync<UnauthorizedAccessException>(
                async () => await anonymous.Handle(known, CancellationToken.None));
        });
    }

    /// <summary>CLS-15: without explicit word ids only the 5 hardest cards of the classroom (highest difficulty) are assigned.</summary>
    [Test]
    [Property("PlanId", "CLS-15")]
    [Category("KnownDeviation")] // C# reschedules every SRS card of the student when no word ids are given.
    public async Task Handle_NoWordIds_AssignsOnlyFiveHardestClassroomCards()
    {
        // Arrange
        var s = await SeedAsync(classWordCount: 7, difficulty: i => i);
        await using var dbLease = s.Db;
        var outsideWord = new Word { Term = "global", Translation = "toan cuc", ClassroomId = Guid.NewGuid() };
        s.Db.Words.Add(outsideWord);
        s.Db.SrsProgresses.Add(NewProgress(s.StudentId, outsideWord.Id, s.FutureDate, difficulty: 10.0));
        await s.Db.SaveChangesAsync();
        var before = UtcToday();

        // Act
        var response = await HandlerFor(s, s.TeacherId).Handle(
            new AssignDrillCommand(s.Classroom.Id, s.StudentId, null), CancellationToken.None);

        // Assert
        var after = UtcToday();
        var progresses = await s.Db.SrsProgresses.ToListAsync();
        var hardestFive = s.ClassWords.Skip(2).Select(w => w.Id).ToList();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Is.EqualTo(5));
            Assert.That(
                progresses.Where(p => p.NextReviewDate != s.FutureDate).Select(p => p.WordId),
                Is.EquivalentTo(hardestFive));
            Assert.That(progresses.Single(p => p.WordId == outsideWord.Id).NextReviewDate, Is.EqualTo(s.FutureDate));
            Assert.That(
                progresses.Where(p => hardestFive.Contains(p.WordId)).All(p => p.NextReviewDate == before || p.NextReviewDate == after),
                Is.True);
        });
    }

    /// <summary>CLS-16: explicit word ids are filtered to words that belong to the classroom; outside cards are untouched.</summary>
    [Test]
    [Property("PlanId", "CLS-16")]
    [Category("KnownDeviation")] // C# does not scope explicit word ids to the classroom's words.
    public async Task Handle_ExplicitWordIdsIncludingOutsideWord_OnlyClassroomWordsAreAssigned()
    {
        // Arrange
        var s = await SeedAsync(classWordCount: 2);
        await using var dbLease = s.Db;
        var outsideWord = new Word { Term = "global", Translation = "toan cuc", ClassroomId = Guid.NewGuid() };
        s.Db.Words.Add(outsideWord);
        s.Db.SrsProgresses.Add(NewProgress(s.StudentId, outsideWord.Id, s.FutureDate));
        await s.Db.SaveChangesAsync();
        var command = new AssignDrillCommand(
            s.Classroom.Id, s.StudentId, [s.ClassWords[0].Id, outsideWord.Id]);

        // Act
        var response = await HandlerFor(s, s.TeacherId).Handle(command, CancellationToken.None);

        // Assert
        var outside = await s.Db.SrsProgresses.SingleAsync(p => p.WordId == outsideWord.Id);
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Is.EqualTo(1));
            Assert.That(outside.NextReviewDate, Is.EqualTo(s.FutureDate));
        });
    }

    /// <summary>CLS-18: a student is rejected by the authorization pipeline before the handler runs.</summary>
    [Test]
    [Property("PlanId", "CLS-18")]
    public async Task Handle_CallerIsStudent_ThrowsForbiddenViaAuthorizationBehavior()
    {
        // Arrange
        var s = await SeedAsync();
        await using var dbLease = s.Db;
        var user = TestHelpers.CreateUser(s.TeacherId, UserRole.Student);
        var behavior = new AuthorizationBehavior<AssignDrillCommand, ApiResponse<int>>(user);
        var handler = new AssignDrillCommandHandler(user, new ClassroomRepository(s.Db));
        var command = new AssignDrillCommand(s.Classroom.Id, s.StudentId, null);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(async () => await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None));
    }

    /// <summary>Validator requires non-empty classroom and student ids.</summary>
    [Test]
    [Property("PlanId", "CLS-10")]
    public void Validate_EmptyIds_AreInvalid()
    {
        // Arrange
        var validator = new AssignDrillCommandValidator();

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(validator.Validate(new AssignDrillCommand(Guid.Empty, Guid.NewGuid(), null)).IsValid, Is.False);
            Assert.That(validator.Validate(new AssignDrillCommand(Guid.NewGuid(), Guid.Empty, null)).IsValid, Is.False);
            Assert.That(validator.Validate(new AssignDrillCommand(Guid.NewGuid(), Guid.NewGuid(), null)).IsValid, Is.True);
        });
    }
}
