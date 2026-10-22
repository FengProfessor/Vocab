using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.Features.Classrooms.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit unit tests for <see cref="CreateClassroomCommandValidator"/> and the invite-code / persistence rules of
/// <see cref="CreateClassroomCommandHandler"/> not covered by the authorization tests (plan IDs CLS-06..CLS-09), plus
/// <see cref="GetClassroomsQueryHandler"/> (CLS-19). Existing authorization tests live in <c>CreateClassroomCommandHandlerTests</c>.
/// </summary>
[TestFixture]
[Category("Classrooms")]
public sealed class ClassroomQueriesAndValidationTests
{
    /// <summary>CLS-06: name is required and limited to 120 characters.</summary>
    [TestCase("TOEIC", true)]
    [TestCase("", false)]
    [TestCase("   ", false)]
    [Property("PlanId", "CLS-06")]
    public void Validate_Name_IsRequired(string name, bool expectedValid)
    {
        // Arrange
        var validator = new CreateClassroomCommandValidator();

        // Act
        var result = validator.Validate(new CreateClassroomCommand(name, null));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    /// <summary>CLS-06: 120 characters are accepted, 121 are rejected.</summary>
    [Test]
    [Property("PlanId", "CLS-06")]
    public void Validate_NameLength_MaxOneHundredTwenty()
    {
        // Arrange
        var validator = new CreateClassroomCommandValidator();

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(validator.Validate(new CreateClassroomCommand(new string('a', 120), null)).IsValid, Is.True);
            Assert.That(validator.Validate(new CreateClassroomCommand(new string('a', 121), null)).IsValid, Is.False);
        });
    }

    /// <summary>CLS-07: the reserved <c>__personal__</c> name is rejected regardless of case or surrounding spaces.</summary>
    [TestCase("__personal__")]
    [TestCase("__PERSONAL__")]
    [TestCase("  __Personal__  ")]
    [Property("PlanId", "CLS-07")]
    public void Validate_ReservedPersonalName_IsInvalid(string name)
    {
        // Arrange
        var validator = new CreateClassroomCommandValidator();

        // Act
        var result = validator.Validate(new CreateClassroomCommand(name, "x"));

        // Assert
        Assert.That(result.IsValid, Is.False);
    }

    /// <summary>CLS-08: a created classroom gets an uppercase 6-character invite code, a trimmed name and the caller as teacher.</summary>
    [Test]
    [Property("PlanId", "CLS-08")]
    public async Task Handle_TeacherCreatesClassroom_GeneratesUppercaseSixCharInviteCode()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateClassroomCommandHandler(TestHelpers.CreateUser(teacherId, UserRole.Teacher), db);

        // Act
        var response = await handler.Handle(
            new CreateClassroomCommand("  IELTS 7.0  ", "Evening"), CancellationToken.None);

        // Assert
        var saved = await db.Classrooms.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(saved.Name, Is.EqualTo("IELTS 7.0"));
            Assert.That(saved.TeacherId, Is.EqualTo(teacherId));
            Assert.That(saved.InviteCode, Has.Length.EqualTo(6));
            Assert.That(saved.InviteCode, Is.EqualTo(saved.InviteCode.ToUpperInvariant()));
            Assert.That(saved.InviteCode, Does.Match("^[A-F0-9]{6}$"));
            Assert.That(response.Data!.InviteCode, Is.EqualTo(saved.InviteCode));
        });
    }

    /// <summary>CLS-09: two classrooms created in a row get different invite codes.</summary>
    [Test]
    [Property("PlanId", "CLS-09")]
    public async Task Handle_TwoClassrooms_HaveDistinctInviteCodes()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateClassroomCommandHandler(TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Teacher), db);

        // Act
        var first = await handler.Handle(new CreateClassroomCommand("A", null), CancellationToken.None);
        var second = await handler.Handle(new CreateClassroomCommand("B", null), CancellationToken.None);

        // Assert
        Assert.That(first.Data!.InviteCode, Is.Not.EqualTo(second.Data!.InviteCode));
    }

    /// <summary>CLS-19: lists classrooms the caller teaches or is enrolled in, hides personal and unrelated ones, newest first with student counts.</summary>
    [Test]
    [Property("PlanId", "CLS-19")]
    public async Task Handle_ListsOwnedAndEnrolledClassroomsNewestFirst_ExcludesPersonalAndOthers()
    {
        // Arrange
        var me = Guid.NewGuid();
        var other = Guid.NewGuid();
        var now = DateTime.UtcNow;
        await using var db = TestHelpers.CreateDb();
        var owned = new ClassroomEntity { Name = "Owned", InviteCode = "OWN001", TeacherId = me, CreatedAt = now.AddDays(-3) };
        var enrolled = new ClassroomEntity { Name = "Enrolled", InviteCode = "ENR001", TeacherId = other, CreatedAt = now.AddDays(-1) };
        var personal = new ClassroomEntity { Name = "__personal__", InviteCode = "PER001", TeacherId = me, CreatedAt = now };
        var unrelated = new ClassroomEntity { Name = "Unrelated", InviteCode = "UNR001", TeacherId = other, CreatedAt = now };
        db.Classrooms.AddRange(owned, enrolled, personal, unrelated);
        db.Enrollments.AddRange(
            new Enrollment { ClassroomId = enrolled.Id, StudentId = me },
            new Enrollment { ClassroomId = enrolled.Id, StudentId = Guid.NewGuid() },
            new Enrollment { ClassroomId = owned.Id, StudentId = Guid.NewGuid() },
            new Enrollment { ClassroomId = unrelated.Id, StudentId = Guid.NewGuid() });
        await db.SaveChangesAsync();
        var handler = new GetClassroomsQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var response = await handler.Handle(new GetClassroomsQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.Select(c => c.Name), Is.EqualTo(new[] { "Enrolled", "Owned" }));
            Assert.That(response.Data.Select(c => c.StudentCount), Is.EqualTo(new[] { 2, 1 }));
        });
    }

    /// <summary>CLS-19: anonymous callers cannot list classrooms.</summary>
    [Test]
    [Property("PlanId", "CLS-19")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new GetClassroomsQueryHandler(TestHelpers.CreateUser(null), db);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(new GetClassroomsQuery(), CancellationToken.None));
    }
}
