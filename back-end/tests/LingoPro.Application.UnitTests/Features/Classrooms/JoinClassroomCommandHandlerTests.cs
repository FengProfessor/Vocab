using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit business unit tests for <see cref="JoinClassroomCommandHandler"/> and <see cref="JoinClassroomCommandValidator"/>:
/// invite-code normalization, enrollment, repeat join, unknown code, personal workspace and capacity rules (plan IDs CLS-01..CLS-05).
/// Original rules: src/app/api/classrooms/join/route.ts and SRS_06 UC-TEACH-06.2 (lines 124-152). Enrollment is aligned to
/// <c>public.enrollments</c> (<c>StudentId</c>, <c>ClassroomId</c>, <c>JoinedAt</c> nullable).
/// </summary>
[TestFixture]
[Category("Classrooms")]
public sealed class JoinClassroomCommandHandlerTests
{
    private const string InviteCode = "ABC123";

    private static async Task<(LingoProDbContext Db, ClassroomEntity Classroom)> SeedAsync(
        string name = "TOEIC 800+",
        string inviteCode = InviteCode,
        int existingStudents = 0,
        Guid? teacherId = null)
    {
        var db = TestHelpers.CreateDb();
        var classroom = new ClassroomEntity
        {
            Name = name,
            InviteCode = inviteCode,
            TeacherId = teacherId ?? Guid.NewGuid()
        };
        db.Classrooms.Add(classroom);
        for (int i = 0; i < existingStudents; i++)
        {
            db.Enrollments.Add(new Enrollment { ClassroomId = classroom.Id, StudentId = Guid.NewGuid() });
        }

        await db.SaveChangesAsync();
        return (db, classroom);
    }

    /// <summary>CLS-01: a lowercase code with surrounding spaces is normalized and the student is enrolled once (join/route.ts:17).</summary>
    [Test]
    [Property("PlanId", "CLS-01")]
    public async Task Handle_LowercaseCodeWithSpaces_EnrollsStudent()
    {
        // Arrange
        var (db, classroom) = await SeedAsync();
        await using var dbLease = db;
        var studentId = Guid.NewGuid();
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(studentId), new ClassroomRepository(db));

        // Act
        var response = await handler.Handle(new JoinClassroomCommand("  abc123 "), CancellationToken.None);

        // Assert
        var enrollment = await db.Enrollments.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.Id, Is.EqualTo(classroom.Id));
            Assert.That(response.Data.InviteCode, Is.EqualTo(InviteCode));
            Assert.That(enrollment.ClassroomId, Is.EqualTo(classroom.Id));
            Assert.That(enrollment.StudentId, Is.EqualTo(studentId));
            Assert.That(enrollment.JoinedAt, Is.Not.Null);
        });
    }

    /// <summary>
    /// CLS-01: the returned student count equals the real number of enrollments after joining (the original returns the
    /// post-insert <c>enrollment_count</c>, join/route.ts:55-63).
    /// </summary>
    [Test]
    [Property("PlanId", "CLS-01")]
    [Category("KnownDeviation")] // Handler double counts: Include(Enrollments) is fixed-up by EF after Add, then +1 is added again.
    public async Task Handle_JoinNewStudent_ReturnsActualEnrollmentCount()
    {
        // Arrange
        var (db, _) = await SeedAsync(existingStudents: 2);
        await using var dbLease = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), new ClassroomRepository(db));

        // Act
        var response = await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(db.Enrollments.Count(), Is.EqualTo(3));
            Assert.That(response.Data!.StudentCount, Is.EqualTo(3));
        });
    }

    /// <summary>CLS-02: joining the same classroom twice is idempotent (SRS_06 line 139 upsert on <c>(classroom_id, student_id)</c>): one enrollment and a stable count.</summary>
    [Test]
    [Property("PlanId", "CLS-02")]
    public async Task Handle_JoinTwice_KeepsSingleEnrollment()
    {
        // Arrange
        var (db, _) = await SeedAsync(existingStudents: 2);
        await using var dbLease2 = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), new ClassroomRepository(db));
        await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None);

        // Act
        var second = await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(second.Success, Is.True);
            Assert.That(second.Data!.StudentCount, Is.EqualTo(3));
            Assert.That(db.Enrollments.Count(), Is.EqualTo(3));
        });
    }

    /// <summary>CLS-03: an unknown invite code is reported as not found and nothing is enrolled (join/route.ts:29-31).</summary>
    [Test]
    [Property("PlanId", "CLS-03")]
    public async Task Handle_UnknownInviteCode_ThrowsNotFound()
    {
        // Arrange
        var (db, _) = await SeedAsync();
        await using var dbLease = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(new JoinClassroomCommand("ZZZZZZ"), CancellationToken.None));
        Assert.That(db.Enrollments.Count(), Is.EqualTo(0));
    }

    /// <summary>CLS-03: anonymous callers cannot join.</summary>
    [Test]
    [Property("PlanId", "CLS-03")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _) = await SeedAsync();
        await using var dbLease = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(null), new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None));
    }

    /// <summary>CLS-04: the hidden <c>__personal__</c> classroom cannot be joined; SRS_06 lines 148-149 specify HTTP 403 "Cannot join a personal classroom".</summary>
    [Test]
    [Property("PlanId", "CLS-04")]
    [Category("KnownDeviation")] // C# answers NotFound (404) instead of Forbidden (403) for personal classrooms.
    public async Task Handle_PersonalClassroomCode_ThrowsForbidden()
    {
        // Arrange
        var (db, _) = await SeedAsync(name: "__personal__", inviteCode: "PERS01");
        await using var dbLease = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new JoinClassroomCommand("PERS01"), CancellationToken.None));
        Assert.That(db.Enrollments.Count(), Is.EqualTo(0));
    }

    /// <summary>CLS-04: a teacher cannot join their own classroom (SRS_06 line 138 "chặn giáo viên tự join lớp của chính mình").</summary>
    [Test]
    [Property("PlanId", "CLS-04")]
    [Category("KnownDeviation")] // C# lets the owning teacher enroll in their own classroom.
    public async Task Handle_TeacherJoinsOwnClassroom_IsRejected()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        var (db, _) = await SeedAsync(teacherId: teacherId);
        await using var dbLease = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(teacherId), new ClassroomRepository(db));

        // Act & Assert
        Assert.CatchAsync<DomainException>(
            async () => await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None));
        Assert.That(db.Enrollments.Count(), Is.EqualTo(0));
    }

    /// <summary>CLS-05: a classroom with 499 students still accepts the 500th student (SRS_06 line 152: limit 500).</summary>
    [Test]
    [Property("PlanId", "CLS-05")]
    public async Task Handle_ClassroomWith499Students_AcceptsFiveHundredth()
    {
        // Arrange
        var (db, _) = await SeedAsync(existingStudents: 499);
        await using var dbLease = db;
        var studentId = Guid.NewGuid();
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(studentId), new ClassroomRepository(db));

        // Act
        var response = await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(db.Enrollments.Count(), Is.EqualTo(500));
            Assert.That(db.Enrollments.Any(e => e.StudentId == studentId), Is.True);
        });
    }

    /// <summary>CLS-05: a classroom already holding 500 students rejects further students with Forbidden (SRS_06 lines 150-152).</summary>
    [Test]
    [Property("PlanId", "CLS-05")]
    [Category("KnownDeviation")] // C# has no 500-student limit.
    public async Task Handle_ClassroomWith500Students_RejectsNewStudent()
    {
        // Arrange
        var (db, _) = await SeedAsync(existingStudents: 500);
        await using var dbLease = db;
        var handler = new JoinClassroomCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new JoinClassroomCommand(InviteCode), CancellationToken.None));
        Assert.That(db.Enrollments.Count(), Is.EqualTo(500));
    }

    /// <summary>CLS-01: validator requires an invite code of 4..20 characters.</summary>
    [TestCase("", false)]
    [TestCase("ABC", false)]
    [TestCase("ABCD", true)]
    [TestCase("ABC123", true)]
    [TestCase("12345678901234567890", true)]
    [TestCase("123456789012345678901", false)]
    [Property("PlanId", "CLS-01")]
    public void Validate_InviteCodeLength_BetweenFourAndTwenty(string code, bool expectedValid)
    {
        // Arrange
        var validator = new JoinClassroomCommandValidator();

        // Act
        var result = validator.Validate(new JoinClassroomCommand(code));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }
}
